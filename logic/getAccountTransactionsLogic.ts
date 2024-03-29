'use server'
import getAccountTransactions from "@/utils/bank-connect/getAccountTransactions";
import retrieveAccessToken from "./getAccessTokenLogic";
import { SupabaseClient } from "@supabase/supabase-js";
import refreshTokenLogic from "./refreshTokenLogic";

export default async function getAccountTransactionsLogic({ accountId, supabase }: { accountId: string, supabase: SupabaseClient<any, "public", any> }) {
  // get bank accounts from api
  let { accessToken, refreshToken, id } = await retrieveAccessToken({ supabase });
  if (!accessToken) return null;

  let transactionsData = await getAccountTransactions({ accountId, accessToken });
  if (!transactionsData.status && !transactionsData.data.hasOwnProperty('status_code')) return null;

  if (!transactionsData.status && transactionsData.data.status_code === 401) {
    accessToken = await refreshTokenLogic({ refreshToken, id, supabase });
    if (!accessToken) {
      return null;
    } else {
      transactionsData = await getAccountTransactions({ accountId, accessToken });
      if (!transactionsData.status) {
        return null;
      }
    }
  }
  return transactionsData;
}