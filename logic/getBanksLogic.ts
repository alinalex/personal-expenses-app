'use server'
import getAccessToken from '@/utils/bank-connect/getAccessToken';
import getBanks from '@/utils/bank-connect/getBanks';
import getTokenRefreshed from '@/utils/bank-connect/getTokenRefreshed';
import { SupabaseClient } from '@supabase/supabase-js';

async function getAccessTokenAndPersist({ supabase }: { supabase: SupabaseClient<any, "public", any> }) {
  let accessToken: null | string = '';
  const accessTokenData = await getAccessToken();
  if (accessTokenData.status) {
    accessToken = accessTokenData.data.access;
    const { data, error } = await supabase
      .from('access_tokens')
      .insert([
        { access_token: accessTokenData.data.access, refresh_token: accessTokenData.data.refresh },
      ]);
    if (error) {
      // to do: add logs
    }
  } else {
    // to do: add logs
    // console.error(accessTokenData.data);
    accessToken = null;
  }
  return accessToken;
}

export default async function getBanksDataLogic({ countryCode, supabase }: { countryCode: string, supabase: SupabaseClient<any, "public", any> }) {
  const { data: accessTokens } = await supabase.from('access_tokens').select();

  let accessToken: null | string = '';
  let bankData: { id: string, name: string, logo: string }[] = [];
  accessToken = accessTokens?.length ? accessTokens[0].access_token : await getAccessTokenAndPersist({ supabase });

  if (!accessToken) return bankData;

  let bankRes = await getBanks({ accessToken, countryCode });
  if (bankRes.status) {
    bankData = bankRes.data;
  } else {
    if (bankRes.data.status_code === 401 && accessTokens) {
      // refresh token
      const refreshData = await getTokenRefreshed({ refreshToken: accessTokens[0].refresh_token });
      if (!refreshData.status && refreshData.data.status_code === 401) {
        // get new token data
        accessToken = await getAccessTokenAndPersist({ supabase });
      } else {
        accessToken = refreshData.data.access;
        const { data, error } = await supabase
          .from('access_tokens')
          .update({ access_token: accessToken })
          .eq('id', accessTokens[0].id)
        if (error) {
          // to do: add logs
        }
      }

      if (!accessToken) return bankData;
      bankRes = await getBanks({ accessToken, countryCode });
      if (bankRes.status) {
        bankData = bankRes.data;
      }
    }
  }

  return bankData;
}