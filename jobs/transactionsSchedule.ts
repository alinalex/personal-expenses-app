import { cronTrigger } from "@trigger.dev/sdk";
import { client } from "@/trigger";
import { Supabase } from "@trigger.dev/supabase";
import { formatDateForApi } from "@/logic/retrieveTransactionsLogic";
import retrieveAccessToken from "@/logic/getAccessTokenLogic";
import getAccountTransactions from "@/utils/bank-connect/getAccountTransactions";
import refreshTokenLogic from "@/logic/refreshTokenLogic";

const supabase = new Supabase({
  id: "supabase",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
});

const errorResponse = {
  success: false,
  data: null,
};

client.defineJob({
  // This is the unique identifier for your Job, it must be unique across all Jobs in your project.
  id: "transactions-schedule",
  name: "Transactions Cron job",
  version: "0.0.1",
  integrations: { supabase },
  // This is triggered by an event using eventTrigger. You can also trigger Jobs with webhooks, on schedules, and more: https://trigger.dev/docs/documentation/concepts/triggers/introduction
  trigger: cronTrigger({
    cron: "0 2 * * *",
  }),
  run: async (payload, io, ctx) => {

    // get bank accounts that are eligible for cron
    const { data: bankAccounts, error: bankAccountsError } = await io.supabase.runTask("get-bank-accounts", async (db) => {
      return db.from('bank_accounts').select(`*`).eq('isCron', true);
    });

    if (bankAccountsError || (bankAccounts && bankAccounts.length === 0)) {
      await io.logger.error('no bank accounts', { code: '400', message: bankAccountsError });
      return errorResponse;
    }

    // get last day of bank transactions
    const accountId = bankAccounts[0].id;
    const accountUuId = bankAccounts[0].account_id;

    const { data: accountTransactions, error: accountTransactionsError } = await io.supabase.runTask("get-account-transactions", async (db) => {
      return db.from
        ('account_transactions').select(`*`).eq('account_id', accountId).order('booking_date', { ascending: false })
        .limit(1);
    });

    if (accountTransactionsError || (accountTransactions && accountTransactions.length === 0)) {
      await io.logger.error('no account transactions', { code: '400', message: accountTransactionsError });
      return errorResponse;
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
      await io.logger.error(`date from (${dateFrom}) is bigger than date to (${dateTo})`, { code: '400', message: 'date error' });
      return errorResponse;
    }

    let { accessToken, refreshToken, id } = await io.supabase.runTask("get-access-token", async (db) => {
      return await retrieveAccessToken({ supabase: db });
    });
    await io.logger.info('accessToken db', accessToken);
    if (!accessToken) {
      await io.logger.error('no accessToken', { code: '400', message: 'an error with access token occured line 52' });
      return errorResponse;
    }

    let transactionsData = await io.runTask("get-bank-transactions", async () => {
      return await getAccountTransactions({ accountId: accountUuId, accessToken, dateFrom: dateFrom as string, dateTo: dateTo as string });
    });
    await io.logger.info('transactionsData initial', transactionsData);
    if (!transactionsData.status && !transactionsData.data.hasOwnProperty('status_code')) {
      await io.logger.error('an error with banking api occured', { code: '400', message: 'banking api error' });
      return errorResponse;
    }

    if (!transactionsData.status && transactionsData.data.status_code === 401) {
      // update isExpired flag
      if (transactionsData.data.type && transactionsData.data.type === 'AccessExpiredError') {
        const bank_connection_id = bankAccounts[0].bank_connection_id;
        const { data: expiredData, error: expiredError } = await io.supabase.runTask("update-isExpired-flag", async (db) => {
          return db.from('bank_connections').update({ isExpired: true })
            .eq('id', bank_connection_id)
            .select();
        });
        expiredData && await io.logger.info('bank_connections update', expiredData);
        await io.logger.error('access to banking data expired', { code: '400', message: 'access to banking data expired' });
        return errorResponse;
      }
      accessToken = await io.supabase.runTask("get-refresh-token", async (db) => {
        return await refreshTokenLogic({ refreshToken, id, supabase: db });
      });
      await io.logger.info('accessToken refreshed', accessToken);
      if (!accessToken) {
        await io.logger.error('no accessToken', { code: '400', message: 'an error with access token occured line 65' });
        return errorResponse;
      } else {
        transactionsData = await getAccountTransactions({ accountId: accountUuId, accessToken, dateFrom, dateTo });
        if (!transactionsData.status) {
          await io.logger.error('an error with banking api occured on second try', { code: '400', message: 'banking api error' });
          return errorResponse;
        }
      }
    }

    const bookedTransactions = transactionsData.data.transactions.booked;

    // get Other category in case we don't have a rule for a transaction
    const { data: categories, error: categoriesError } = await io.supabase.runTask("get-categories", async (db) => {
      return db.from('transaction_categories').select(`*`).eq('category_name', 'Other');
    });
    let categoryId = categories && categories.length > 0 && categories[0].id;

    // get through transactions and the rules for categories
    const { data: transactionRules, error: transactionError } = await io.supabase.runTask("get-transaction-rules", async (db) => {
      return db.from('category_rules')
        .select('*');
    });
    let rulesData: any = {};

    if (!transactionError && transactionRules && transactionRules.length > 0) {
      for (let i = 0; i < bookedTransactions.length; i++) {
        const transaction = bookedTransactions[i];
        for (let j = 0; j < transactionRules.length; j++) {
          const rule = transactionRules[j];
          // transaction type do not match then continue to next rule
          if (rule.transaction_type !== transaction.proprietaryBankTransactionCode) continue;

          // transaction sign do not match then continue to next rule
          const isPositive = Number(transaction.transactionAmount.amount) > 0;
          if (rule.is_positive !== isPositive) continue;

          // transaction type matches and other rules are null so stop looking
          if (rule.includes === null && rule.not_includes === null && rule.bigger_than === null && rule.smaller_than === null) {
            rulesData[transaction.internalTransactionId] = rule.category_id;
          } else {
            // check if rules that are not null match with transaction
            if (rule.includes !== null && !transaction.remittanceInformationUnstructured.includes(rule.includes)) {
              continue;
            }

            if (rule.not_includes !== null && transaction.remittanceInformationUnstructured.includes(rule.not_includes)) {
              continue;
            }

            const amount = Number(transaction.transactionAmount.amount);
            if (rule.bigger_than !== null && amount < rule.bigger_than) {
              continue;
            }

            if (rule.smaller_than !== null && amount > rule.smaller_than) {
              continue;
            }

            // if we got here then we got our match
            rulesData[transaction.internalTransactionId] = rule.category_id;
          }
        }
        if (!Object.hasOwn(rulesData, transaction.internalTransactionId)) {
          rulesData[transaction.internalTransactionId] = categoryId;
        }
      }
    }

    if (bookedTransactions && bookedTransactions.length > 0) {
      await io.logger.info('we got the transactions');

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
          category_id: rulesData[elem.internalTransactionId] || categoryId,
        }
      ));

      // insert data in db
      const { data, error: insertTransactionsError } = await io.supabase.runTask("insert-transactions", async (db) => {
        return db.from('account_transactions')
          .insert(dataToInsert)
          .select();
      });

      if (insertTransactionsError) {
        await io.logger.error('insert transactions in db errored', { code: '400', message: 'db error' });
        return errorResponse;
      }
    }

    // refresh or create the totals
    const year_month_array = dateFrom.split('-');
    year_month_array.splice(-1);
    const year_month = year_month_array.join('-');
    const { data: totalsData, error: totalsDataError } = await io.supabase.runTask("get-totals", async (db) => {
      return db.from('expenses_totals').select(`*`).like('year_month', year_month);
    });

    const date = new Date(year_month);
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = await formatDateForApi({ date: new Date(year, month, 1).toString() });
    const lastDay = await formatDateForApi({ date: new Date(year, month + 1, 0).toString() });

    const { data: transactions, error: transactionsError } = await io.supabase.runTask("get-transactions-for-totals", async (db) => {
      return db.from('account_transactions').select(`*, transaction_categories(category_name)`).eq('account_id', accountId).gte('booking_date', firstDay).lte('booking_date', lastDay);
    });
    let outer: any, inner: any, totalExpenses: any;

    if (transactions && transactions.length > 0) {
      await io.logger.info('prepare totals');

      outer = transactions?.filter((elem: any) => Number(elem.amount) < 0 && !(
          elem.transaction_type === "Transfer Home'Bank" &&
          elem.transaction_info.includes('Beneficiary: Rauta Alexandru Alin') ||
          elem.transaction_info.includes('Beneficiary, Rauta Alexandru Alin')
      ) && elem.transaction_type !== 'Deposit creation').map((elem: any) => Number(elem.amount)).reduce((a: number, b: number) => a + b, 0);

      inner = transactions?.filter((elem: any) => Number(elem.amount) > 0 && !(
        elem.transaction_type === "Incoming funds" &&
        elem.transaction_info.includes('Ordering party: FLIP TECHNOLOGIES') ||
        elem.transaction_info.includes('Ordering party, FLIP TECHNOLOGIES') ||
        elem.transaction_info.includes('Ordering party: Rauta Alexandru Alin') ||
        elem.transaction_info.includes('Ordering party, Rauta Alexandru Alin') ||
        elem.transaction_info.includes('Beneficiary, Rauta Alexandru Alin') ||
        elem.transaction_info.includes('Beneficiary: Rauta Alexandru Alin') ||
        elem.transaction_info.includes('Ordering party: Rauta Raluca Ioana') ||
        elem.transaction_info.includes('Ordering party, Rauta Raluca Ioana')
      ) && elem.transaction_type !== 'Deposit closing').map((elem: any) => Number(elem.amount)).reduce((a: number, b: number) => a + b, 0);

      totalExpenses = outer + inner;

      await io.logger.info(`outer: ${outer}`);
      await io.logger.info(`inner: ${inner}`);
      await io.logger.info(`totalExpenses: ${totalExpenses}`);

      if (totalsData && totalsData.length > 0) {
        const expensesTotalsId = totalsData[0].id;
        const { data, error } = await io.supabase.runTask("update-totals", async (db) => {
          return db.from('expenses_totals')
            .update({ inner: inner.toFixed(2), outer: outer.toFixed(2), total: totalExpenses.toFixed(2) })
            .eq('id', expensesTotalsId)
            .eq('year_month', year_month)
            .select()
        });
      } else {
        const { data, error } = await io.supabase.runTask("insert-totals", async (db) => {
          return db.from('expenses_totals')
            .insert([
              { account_id: accountId, year_month, inner: inner.toFixed(2), outer: outer.toFixed(2), total: totalExpenses.toFixed(2) },
            ])
            .select()
        });
      }
    }

    await io.logger.info('success cron');
    return { success: true, status: 200 };
  },
}); 