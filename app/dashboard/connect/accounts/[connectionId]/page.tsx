import updateAccountsLogic from '@/logic/updateAccountsLogic';
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from "next/navigation";
export default async function UpdateAccounts({ params }: { params: { connectionId: string } }) {
  const connectionId = params.connectionId;
  const cookieStore = cookies()
  const supabase = createClient(cookieStore);
  const isAccountUpdateReady = await updateAccountsLogic({ connectionId, supabase });
  if (isAccountUpdateReady) {
    redirect('/dashboard');
  }

  return (
    <section className="w-full min-h-screen h-full">
      <div className="px-3">Working on it. Redirecting soon...</div>
    </section>
  )
}