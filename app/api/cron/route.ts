import retrieveAccessToken from '@/logic/getAccessTokenLogic';
import refreshTokenLogic from '@/logic/refreshTokenLogic';
import { formatDateForApi } from '@/logic/retrieveTransactionsLogic';
import getAccountTransactions from '@/utils/bank-connect/getAccountTransactions';
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { withAxiom, AxiomRequest } from 'next-axiom';

export const GET = withAxiom(async (req: AxiomRequest) => {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  req.log.info('cron started');

  // get bank accounts that are eligible for cron
  const { data: bankAccounts, error: bankAccountsError } = await supabase.from('bank_accounts').select(`*`).eq('isCron', true);

  if (bankAccountsError || (bankAccounts && bankAccounts.length === 0)) {
    req.log.error('no bank accounts', { code: '400', message: bankAccountsError });
    return Response.json({ data: null, status: 400 });
  }

  // get last day of bank transactions
  const accountId = bankAccounts[0].id;
  const accountUuId = bankAccounts[0].account_id;
  const { data: accountTransactions, error: accountTransactionsError } = await supabase.from
    ('account_transactions').select(`*`).eq('account_id', accountId).order('booking_date', { ascending: false })
    .limit(1);

  if (accountTransactionsError || (accountTransactions && accountTransactions.length === 0)) {
    req.log.error('no account transactions', { code: '400', message: accountTransactionsError });
    return Response.json({ data: null, status: 400 });
  }

  // get transactions
  const bookingDate = accountTransactions[0].booking_date;
  let dateFrom: Date | string = new Date(bookingDate);
  dateFrom.setDate(dateFrom.getDate() + 1);
  dateFrom = await formatDateForApi({ date: dateFrom.toString() });

  let dateTo: Date | string = new Date();
  dateTo.setDate(dateTo.getDate() - 1);
  dateTo = await formatDateForApi({ date: dateTo.toString() });

  if (new Date(dateFrom) > new Date(dateTo)) {
    req.log.error(`date from (${dateFrom}) is bigger than date to (${dateTo})`, { code: '400', message: 'date error' });
    return Response.json({ data: 'already have the data', status: 400 });
  }

  let { accessToken, refreshToken, id } = await retrieveAccessToken({ supabase });
  if (!accessToken) {
    req.log.error('no accessToken', { code: '400', message: 'an error with access token occured line 52' });
    return Response.json({ data: 'an error with access token occured', status: 400 });
  }

  let transactionsData = await getAccountTransactions({ accountId: accountUuId, accessToken, dateFrom, dateTo });
  if (!transactionsData.status && !transactionsData.data.hasOwnProperty('status_code')) {
    req.log.error('an error with banking api occured', { code: '400', message: 'banking api error' });
    return Response.json({ data: 'an error with banking api occured', status: 400 });
  }

  if (!transactionsData.status && transactionsData.data.status_code === 401) {
    accessToken = await refreshTokenLogic({ refreshToken, id, supabase });
    if (!accessToken) {
      req.log.error('no accessToken', { code: '400', message: 'an error with access token occured line 65' });
      return Response.json({ data: 'an error with access token occured', status: 400 });
    } else {
      transactionsData = await getAccountTransactions({ accountId: accountUuId, accessToken, dateFrom, dateTo });
      if (!transactionsData.status) {
        req.log.error('an error with banking api occured on second try', { code: '400', message: 'banking api error' });
        return Response.json({ data: 'an error with banking api occured on second try', status: 400 });
      }
    }
  }

  const bookedTransactions = transactionsData.data.transactions.booked;

  // get through transactions and the rules for categories
  // to do

  // get Other category in case we don't have a rule for a transaction
  const { data: categories, error: categoriesError } = await supabase.from('transaction_categories').select(`*`).eq('category_name', 'Other');
  let categoryId = categories && categories.length > 0 && categories[0].id;

  if (bookedTransactions && bookedTransactions.length > 0) {
    req.log.info('we got the transactions');

    // prepare data for insertion
    const dataToInsert = bookedTransactions.map((elem: any) => (
      {
        account_id: accountId,
        booking_date: elem.bookingDate,
        amount: Number(elem.transactionAmount.amount),
        currency: elem.transactionAmount.currency,
        internal_transaction_id: elem.internalTransactionId,
        transaction_info: elem.remittanceInformationUnstructured,
        transaction_type: elem.proprietaryBankTransactionCode,
        category_id: categoryId,
      }
    ));

    // insert data in db
    const { data, error: insertTransactionsError } = await supabase
      .from('account_transactions')
      .insert(dataToInsert)
      .select();

    if (insertTransactionsError) {
      req.log.error('insert transactions in db errored', { code: '400', message: 'db error' });
      Response.json({ data: 'insert transaction in db errored', status: 400 });
    }
  }

  // refresh or create the totals
  const year_month_array = dateFrom.split('-');
  year_month_array.splice(-1);
  const year_month = year_month_array.join('-');
  const { data: totalsData, error: totalsDataError } = await supabase.from('expenses_totals').select(`*`).like('year_month', year_month);

  const date = new Date(year_month);
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = await formatDateForApi({ date: new Date(year, month, 1).toString() });
  const lastDay = await formatDateForApi({ date: new Date(year, month + 1, 0).toString() });

  const { data: transactions, error: transactionsError } = await supabase.from('account_transactions').select(`*, transaction_categories(category_name)`).eq('account_id', accountId).gte('booking_date', firstDay).lte('booking_date', lastDay);

  let outer, inner, totalExpenses;
  if (transactions && transactions.length > 0) {

    outer = transactions?.filter((elem: any) => Number(elem.amount) < 0 && !(elem.transaction_type === "Transfer Home'Bank" && elem.transaction_info.includes('Beneficiary: Rauta Alexandru Alin'))).map((elem: any) => Number(elem.amount)).reduce((a: number, b: number) => a + b, 0);

    inner = transactions?.filter((elem: any) => Number(elem.amount) > 0 && !(elem.transaction_type === "Incoming funds" && elem.transaction_info.includes('Ordering party: FLIP TECHNOLOGIES') || elem.transaction_info.includes('Ordering party: Rauta Alexandru Alin'))).map((elem: any) => Number(elem.amount)).reduce((a: number, b: number) => a + b, 0);

    totalExpenses = outer + inner;

    if (totalsData && totalsData.length > 0) {
      const expensesTotalsId = totalsData[0].id;
      const { data, error } = await supabase
        .from('expenses_totals')
        .update({ inner: inner.toFixed(2), outer: outer.toFixed(2), total: totalExpenses.toFixed(2) })
        .eq('id', expensesTotalsId)
        .eq('year_month', year_month)
        .select()
    } else {
      const { data, error } = await supabase
        .from('expenses_totals')
        .insert([
          { account_id: accountId, year_month, inner: inner.toFixed(2), outer: outer.toFixed(2), total: totalExpenses.toFixed(2) },
        ])
        .select()
    }

  }

  req.log.info('success cron');
  return Response.json({ data: 'success', status: 200 });
})