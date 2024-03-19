'use server'
import getBanks from '@/utils/bank-connect/getBanks';
import { SupabaseClient } from '@supabase/supabase-js';
import retrieveAccessToken from './getAccessTokenLogic';
import refreshTokenLogic from './refreshTokenLogic';

export default async function getBanksDataLogic({ countryCode, supabase }: { countryCode: string, supabase: SupabaseClient<any, "public", any> }) {
  let { accessToken, refreshToken, id } = await retrieveAccessToken({ supabase });
  let bankData: { id: string, name: string, logo: string }[] = [];

  if (!accessToken) return bankData;

  let bankRes = await getBanks({ accessToken, countryCode });
  if (bankRes.status) {
    bankData = bankRes.data;
  } else {
    if (bankRes.data.status_code === 401 && accessToken && refreshToken && id) {
      // refresh token
      accessToken = await refreshTokenLogic({ refreshToken, id, supabase })

      if (!accessToken) return bankData;
      bankRes = await getBanks({ accessToken, countryCode });
      if (bankRes.status) {
        bankData = bankRes.data;
      }
    }
  }

  return bankData;
}