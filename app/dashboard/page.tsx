import { currentUser } from "@clerk/nextjs";
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from "next/link";
import { Button } from "@/components/ui/button";


export default async function Dashboard() {
  const user = await currentUser();
  // console.log('user', user);

  const cookieStore = cookies()
  const supabase = createClient(cookieStore);

  // const { data: accessTokens } = await supabase.from('access_tokens').select();
  const { data: bankAccounts } = await supabase.from('bank_accounts').select();
  // console.log('accessTokens', accessTokens);

  return (
    <section className="w-full min-h-screen h-full">
      <div className="px-3">
        {
          bankAccounts && bankAccounts.length > 0 ?
            (<div>show data</div>) :
            (<div>
              <p>So empty here. Start by connecting a bank account</p>
              <div><Button asChild><Link href='/dashboard/connect/add-country' className="p-4 mr-4">Start connecting an account</Link></Button></div>
            </div>
            )
        }
      </div>
    </section>
  )
}