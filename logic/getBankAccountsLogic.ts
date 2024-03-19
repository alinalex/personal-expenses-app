'use server'
import { SupabaseClient } from "@supabase/supabase-js";
import retrieveAccessToken from "./getAccessTokenLogic";

export default async function getBankAccountsLogic({ supabase, requisitionId }: { supabase: SupabaseClient<any, "public", any>, requisitionId: string }) {
  let { accessToken, refreshToken, id } = await retrieveAccessToken({ supabase });
  if (!accessToken) return false;


}