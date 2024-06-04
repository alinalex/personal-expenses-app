import postRequisition from '@/utils/bank-connect/postRequisition';
import retrieveAccessToken from './getAccessTokenLogic';
import { SupabaseClient } from '@supabase/supabase-js';
import refreshTokenLogic from './refreshTokenLogic';

export default async function reconnectAccountLogic({ supabase, countryCode, bankId, bank_connection_id }: {
  supabase: SupabaseClient<any, "public", any>, countryCode: string
  bankId: string, bank_connection_id: number
}) {
  let reqLink = { reqLink: '' };

  let { accessToken, refreshToken, id } = await retrieveAccessToken({ supabase });
  if (!accessToken) {
    console.error('An error occured');
    return reqLink;
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

  // console.log('reqData', reqData);

  // data is fine so we finally have our reqLink
  reqLink.reqLink = reqData.data.link;
  const reqId = reqData.data.id;

  // insert data in db
  const { data: connectionData, error } = await supabase
    .from('bank_connections')
    .update([
      { 'requisition_id': reqId, 'oauth_link': reqData.data.link, 'isDone': false, 'isExpired': false },
    ])
    .eq('id', bank_connection_id)
    .select();
  return reqLink;

}