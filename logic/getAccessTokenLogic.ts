'use server';
import getAccessToken from '@/utils/bank-connect/getAccessToken';
import { SupabaseClient } from '@supabase/supabase-js';

async function getAccessTokenAndPersist({ supabase }: { supabase: SupabaseClient<any, "public", any> }) {
  let accessTokenRes: { accessToken: null | string, refreshToken: null | string, id: null | string } = {
    accessToken: null,
    refreshToken: null,
    id: null,
  }
  const accessTokenData = await getAccessToken();
  if (accessTokenData.status) {
    accessTokenRes.accessToken = accessTokenData.data.access;
    accessTokenRes.refreshToken = accessTokenData.data.refresh;
    const { data, error } = await supabase
      .from('access_tokens')
      .insert([
        { access_token: accessTokenData.data.access, refresh_token: accessTokenData.data.refresh },
      ])
      .select();
    if (data && !error) {
      accessTokenRes.id = data[0].id;
    } else {
      // to do: add logs

    }
  } else {
    // to do: add logs

  }
  return accessTokenRes;
}

export default async function retrieveAccessToken({ supabase }: { supabase: SupabaseClient<any, "public", any> }) {
  const { data: accessTokens } = await supabase.from('access_tokens').select();
  return accessTokens?.length ? { accessToken: accessTokens[0].access_token, refreshToken: accessTokens[0].refresh_token, id: accessTokens[0].id } : await getAccessTokenAndPersist({ supabase });
}
