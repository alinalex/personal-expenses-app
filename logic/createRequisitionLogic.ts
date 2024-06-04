'use server'
import retrieveAccessToken from './getAccessTokenLogic';
import postRequisition from '@/utils/bank-connect/postRequisition';
import refreshTokenLogic from './refreshTokenLogic';
import { SupabaseClient } from '@supabase/supabase-js';
import getSingleBank from '@/utils/bank-connect/getSingleBank';
import deleteBankConnection from '@/utils/bank-connect/deleteBankConnection';

export default async function createRequisitionLogic({ countryCode, bankId, supabase, userId }: { countryCode: string, bankId: string, supabase: SupabaseClient<any, "public", any>, userId: string }) {
  let reqLink = '';

  // check if we have a req link in db
  const { data: bankConnections } = await supabase.from('bank_connections').select('oauth_link').eq('user_id', userId);
  if (bankConnections && bankConnections.length > 0) {
    reqLink = bankConnections[0].oauth_link;
    return reqLink;
  }

  let { accessToken, refreshToken, id } = await retrieveAccessToken({ supabase });
  if (!accessToken) {
    console.error('An error occured');
    return reqLink;
  }

  // get data about the bank
  let bankData = await getSingleBank({ accessToken, bankId });

  if (!bankData.status && !bankData.data.hasOwnProperty('status_code')) return reqLink;
  // check if token expired
  if (!bankData.status && bankData.data.status_code === 401) {
    accessToken = await refreshTokenLogic({ refreshToken, id, supabase });
    if (!accessToken) {
      return reqLink;
    } else {
      bankData = await getSingleBank({ accessToken, bankId });
      if (!bankData.status) {
        return reqLink;
      }
    }
  }

  // post requisition
  let reqData = await postRequisition({ accessToken, countryCode, bankId });

  if (!reqData.status && !reqData.data.hasOwnProperty('status_code')) return reqLink;
  // check if token expired
  if (!reqData.status && reqData.data.status_code === 401) {
    accessToken = await refreshTokenLogic({ refreshToken, id, supabase });
    if (!accessToken) {
      return reqLink;
    } else {
      reqData = await postRequisition({ accessToken, countryCode, bankId });
      if (!reqData.status) {
        return reqLink;
      }
    }
  }

  // data is fine so we finally have our reqLink
  reqLink = reqData.data.link;
  const reqId = reqData.data.id;
  const bankName = bankData.data.name;
  const bankLogo = bankData.data.logo;

  // insert data in db
  const { data: connectionData, error } = await supabase
    .from('bank_connections')
    .insert([
      { 'user_id': userId, 'bank_id': bankId, 'country_code': countryCode, 'requisition_id': reqId, 'bank_name': bankName, 'oauth_link': reqLink, 'bank_logo': bankLogo, 'isDone': false, 'isExpired': false },
    ])
    .select();

  if (error) {
    // delete requisition and return empty string
    await deleteBankConnection({ accessToken, reqId });
    return '';
  }

  return reqLink;
}
