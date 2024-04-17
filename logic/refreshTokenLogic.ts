'use server';
import getTokenRefreshed from '@/utils/bank-connect/getTokenRefreshed';
import { SupabaseClient } from '@supabase/supabase-js';
import getAccessToken from '@/utils/bank-connect/getAccessToken';

export default async function refreshTokenLogic({ refreshToken, id, supabase }: { refreshToken: string, id: string, supabase: SupabaseClient<any, "public", any> }) {
  let accessToken: null | string = null;
  // refresh token
  const refreshData = await getTokenRefreshed({ refreshToken });
  if ((!refreshData.status && refreshData.data.status_code === 401) || refreshToken === refreshData.data?.access) {
    // get new token data
    const newAccessData = await getAccessToken();
    if (newAccessData.status) {
      accessToken = newAccessData.data.access;
      const { data, error } = await supabase
        .from('access_tokens')
        .update({ access_token: accessToken, refresh_token: newAccessData.data.refresh })
        .eq('id', id);
    }
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