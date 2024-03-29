'use server'
import getBankAccounts from '@/utils/bank-connect/getBankAccounts';
import { SupabaseClient } from '@supabase/supabase-js';
import retrieveAccessToken from './getAccessTokenLogic';
import refreshTokenLogic from './refreshTokenLogic';
import getBankAccountInfo from '@/utils/bank-connect/getBankAccountInfo';

export default async function updateAccountsLogic({ connectionId, supabase }: { connectionId: string, supabase: SupabaseClient<any, "public", any> }) {
  const { data: bankConnections, error: bankConnectionsError } = await supabase.from('bank_connections').select(`requisition_id, bank_accounts(account_id)`).eq('id', connectionId);

  if (bankConnectionsError || (bankConnections && bankConnections.length > 0 && !bankConnections[0].requisition_id)) {
    return false;
  }

  const reqId = bankConnections[0].requisition_id;
  const dbAccounts = bankConnections[0].bank_accounts.map(elem => elem.account_id);

  // get bank accounts from api
  let { accessToken, refreshToken, id } = await retrieveAccessToken({ supabase });
  if (!accessToken) return false;

  let accountsData = await getBankAccounts({ reqId, accessToken });

  if (!accountsData.status && !accountsData.data.hasOwnProperty('status_code')) return false;
  // check if token expired
  if (!accountsData.status && accountsData.data.status_code === 401) {
    accessToken = await refreshTokenLogic({ refreshToken, id, supabase });
    if (!accessToken) {
      return false;
    } else {
      accountsData = await getBankAccounts({ reqId, accessToken });
      if (!accountsData.status) {
        return false;
      }
    }
  }

  const apiAccounts = accountsData.data.accounts;
  // check if we have any bank accounts to insert in db
  if (dbAccounts.length > 0) {
    const missingAccounts = [];
    for (let index = 0; index < apiAccounts.length; index++) {
      if (!dbAccounts.includes(apiAccounts[index])) {
        missingAccounts.push(apiAccounts[index]);
      }
    }
    // insert in db if we have accounts that are missing from db
    if (missingAccounts.length > 0) {
      // get data for every account to get the iban
      let accountsInfo = await getAllAccountsInfo({ apiAccounts: missingAccounts, accessToken });

      // check if token expired
      if (accountsInfo.filter((elem: any) => elem.status_code === 401).length > 0) {
        accessToken = await refreshTokenLogic({ refreshToken, id, supabase });
        if (!accessToken) {
          return false;
        } else {
          accountsInfo = await getAllAccountsInfo({ apiAccounts: missingAccounts, accessToken });
        }
      }

      const dataToInsert = missingAccounts.map((elem: string) => ({ account_id: elem, iban: accountsInfo.filter((item: any) => item.id === elem)[0].iban }));

      const { newAccounts, newAccountsError } = await insertBankAccounts({ supabase, connectionId, accounts: dataToInsert });
      // console.log('newAccounts', newAccounts);
    }
  } else {
    // get data for every account to get the iban
    let accountsInfo = await getAllAccountsInfo({ apiAccounts, accessToken });

    // check if token expired
    if (accountsInfo.filter((elem: any) => elem.status_code === 401).length > 0) {
      accessToken = await refreshTokenLogic({ refreshToken, id, supabase });
      if (!accessToken) {
        return false;
      } else {
        accountsInfo = await getAllAccountsInfo({ apiAccounts, accessToken });
      }
    }

    // console.log('accountsInfo', accountsInfo);
    const dataToInsert = apiAccounts.map((elem: string) => ({ account_id: elem, iban: accountsInfo.filter((item: any) => item.id === elem)[0].iban }));
    // console.log('dataToInsert', dataToInsert);

    // insert in db if we have accounts that are missing from db
    const { newAccounts, newAccountsError } = await insertBankAccounts({ supabase, connectionId, accounts: dataToInsert });
    // console.log('newAccounts', newAccounts);
  }

  return true;
}

async function insertBankAccounts({ supabase, accounts, connectionId }: { supabase: SupabaseClient<any, "public", any>, accounts: { account_id: string, iban: string }[], connectionId: string }) {
  const dataToInsert = accounts.map(elem => ({ 'bank_connection_id': connectionId, 'account_id': elem.account_id, 'iban': elem.iban }));
  const { data: newAccounts, error: newAccountsError } = await supabase
    .from('bank_accounts')
    .insert(dataToInsert)
    .select();

  return {
    newAccounts,
    newAccountsError
  }
}

async function getAllAccountsInfo({ apiAccounts, accessToken }: { apiAccounts: string[], accessToken: string }) {
  const promises = apiAccounts.map((account: string) => getBankAccountInfo({ accessToken, accountId: account }));
  const results = await Promise.allSettled(promises);
  let dataResult: any = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      if (!result.value.status && !result.value.data.hasOwnProperty('status_code')) break;
      dataResult.push(result.value.data);
    } else {
      break;
    }
  }

  return dataResult;
}