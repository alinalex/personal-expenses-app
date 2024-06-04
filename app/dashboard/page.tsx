import { currentUser } from "@clerk/nextjs";
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function Dashboard({ searchParams }: { searchParams: { ref: string } }) {
  const user = await currentUser();
  const userId = user?.id as string;
  const ref = searchParams.ref;
  const cookieStore = cookies()
  const supabase = createClient(cookieStore);

  // update status to true and redirect to /dashboard
  if (ref) {
    const { data, error } = await supabase
      .from('bank_connections')
      .update({ isDone: true })
      .eq('requisition_id', ref)
      .select()
    if (!error) {
      redirect('/dashboard');
    }
  }

  const { data: bankConnections, error: bankConnectionsError } = await supabase.from('bank_connections').select(`id, bank_logo, bank_name, country_code, isDone, oauth_link, isExpired, bank_accounts(*)`).eq('user_id', userId);

  return (
    <section className="w-full min-h-screen h-full">
      <div className="px-3">
        {
          bankConnections && bankConnections.length > 0 ?
            (
              <>
                <div className="mb-4"><Button asChild><Link href='/dashboard/connect/add-country' className="p-4 mr-4">Connect a new account</Link></Button></div>
                <div>
                  {bankConnections.map(bank => (
                    <div key={bank.id} className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Image src={bank.bank_logo} alt="logo" width={32} height={32} />
                        <p className="ml-2">{`${bank.bank_name} ${bank.country_code}`}</p>
                      </div>
                      <div>
                        {
                          bank.isExpired && <Button asChild><Link href={`/dashboard/reconnect/${bank.id}`}>Reconnect account</Link></Button>
                        }
                        {
                          !bank.isDone ?
                            <Button asChild className="ml-3"><Link href={bank.oauth_link}>Continue connection</Link></Button> : (
                              bank.bank_accounts.length > 0 ?
                                <Button asChild className="ml-3"><Link href={`/dashboard/accounts/${bank.id}`}>View accounts</Link></Button> : <Button asChild className="ml-3"><Link href={`/dashboard/connect/accounts/${bank.id}`}>Retrieve accounts for this connections</Link></Button>
                            )
                        }
                        <Button variant={'destructive'} className="ml-3">Delete connection</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) :
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