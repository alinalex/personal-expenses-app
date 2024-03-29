'use server'
import getAccountTransactions from "@/utils/bank-connect/getAccountTransactions";
import retrieveAccessToken from "./getAccessTokenLogic";
import { SupabaseClient } from "@supabase/supabase-js";
import refreshTokenLogic from "./refreshTokenLogic";

export default async function retrieveTransactionsLogic({ accountId, connectionId, supabase }: { accountId: string, connectionId: string, supabase: SupabaseClient<any, "public", any> }) {

  // get account uuid
  const { data: bankAccounts, error: bankAccountsError } = await supabase.from('bank_accounts').select(`*`).eq('bank_connection_id', connectionId);
  const accountUuId = bankAccounts && bankAccounts[0].account_id;

  // get bank accounts from api
  let { accessToken, refreshToken, id } = await retrieveAccessToken({ supabase });
  if (!accessToken) return false;

  let dateTo: Date | string = new Date();
  dateTo.setDate(dateTo.getDate() - 1);
  dateTo = await formatDateForApi({ date: dateTo.toString() });
  let dateFrom: Date | string = new Date();
  dateFrom.setMonth(dateFrom.getMonth() - 2);
  dateFrom.setDate(1);
  dateFrom = await formatDateForApi({ date: dateFrom.toString() });

  let transactionsData = await getAccountTransactions({ accountId: accountUuId, accessToken, dateFrom, dateTo });
  if (!transactionsData.status && !transactionsData.data.hasOwnProperty('status_code')) return false;

  if (!transactionsData.status && transactionsData.data.status_code === 401) {
    accessToken = await refreshTokenLogic({ refreshToken, id, supabase });
    if (!accessToken) {
      return false;
    } else {
      transactionsData = await getAccountTransactions({ accountId: accountUuId, accessToken, dateFrom, dateTo });
      if (!transactionsData.status) {
        return false;
      }
    }
  }

  const { data: categories, error: categoriesError } = await supabase.from('transaction_categories').select(`*`).eq('category_name', 'Other');
  const categoryId = categories && categories.length > 0 && categories[0].id;

  // prepare data for insert in db
  const bookedTransactions = transactionsData.data.transactions.booked;
  const dataToInsert = bookedTransactions.map((elem: any) => (
    {
      account_id: accountId,
      booking_date: elem.bookingDate,
      amount: Number(elem.transactionAmount.amount),
      currency: elem.transactionAmount.currency,
      internal_transaction_id: elem.internalTransactionId,
      transaction_info: elem.remittanceInformationUnstructured,
      transaction_type: elem.proprietaryBankTransactionCode,
      category_id: categoryId, // we'll add Other since we don't have rules at start
    }
  ));

  // console.log('dataToInsert', dataToInsert);

  const { data, error } = await supabase
    .from('account_transactions')
    .insert(dataToInsert)
    .select()

  return true;
}

export async function formatDateForApi({ date }: { date: string }) {
  const resDate = new Date(date);
  const year = resDate.getFullYear();
  const month = resDate.getMonth() + 1;
  const day = resDate.getDate();
  return `${year}-${month < 10 ? '0' + month : month}-${day}`;
}