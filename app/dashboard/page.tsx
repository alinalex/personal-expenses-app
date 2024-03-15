'use client';
import { currentUser } from "@clerk/nextjs";
import { createClient } from '@/utils/supabase/client'
import { cookies } from 'next/headers'
import { Button } from "@/components/ui/button";
import getAccessToken from "@/utils/bank-connect/getAccessToken";

export default async function Dashboard() {
  // const user = await currentUser();
  // console.log('user', user);

  // const cookieStore = cookies()
  // const supabase = createClient(cookieStore)
  const supabase = createClient()

  const { data: accessTokens } = await supabase.from('access_tokens').select();
  const { data: bankAccounts } = await supabase.from('bank_accounts').select();
  // console.log('accessTokens', accessTokens);

  async function addBankAccount() {
    const accessTokenData = await getAccessToken();
    console.log('accessTokenData', accessTokenData);
  }

  return (
    <section className="w-full min-h-screen h-full">
      <div className="px-3">
        {bankAccounts && bankAccounts.length > 0 ? <div>show data</div> : <Button onClick={() => addBankAccount()}>Connect bank account</Button>}
      </div>
    </section>
  )
}