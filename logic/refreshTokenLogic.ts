'use server';
import getTokenRefreshed from '@/utils/bank-connect/getTokenRefreshed';
import retrieveAccessToken from './getAccessTokenLogic';
import { SupabaseClient } from '@supabase/supabase-js';

export default async function refreshTokenLogic({ refreshToken, id, supabase }: { refreshToken: string, id: string, supabase: SupabaseClient<any, "public", any> }) {
  let accessToken: null | string = null;
  // refresh token
  const refreshData = await getTokenRefreshed({ refreshToken });
  if (!refreshData.status && refreshData.data.status_code === 401) {
    // get new token data
    accessToken = (await retrieveAccessToken({ supabase })).accessToken;
  } else {
    accessToken = refreshData.data.access;
    const { data, error } = await supabase
      .from('access_tokens')
      .update({ access_token: accessToken })
      .eq('id', id)
    if (error) {
      // to do: add logs
    }
  }
  return accessToken;
}