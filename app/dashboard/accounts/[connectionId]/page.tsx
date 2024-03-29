import { currentUser } from "@clerk/nextjs";
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default async function Accounts({ params }: { params: { connectionId: string } }) {
  const connectionid = params.connectionId;
  const user = await currentUser();
  const userId = user?.id as string;
  const cookieStore = cookies()
  const supabase = createClient(cookieStore);

  const { data: bankAccounts, error: bankAccountsError } = await supabase.from('bank_connections').select(`id, bank_logo, bank_name, country_code, bank_accounts(*)`).eq('user_id', userId);

  if (bankAccountsError || (bankAccounts && (bankAccounts.length === 0 || bankAccounts[0].bank_accounts.length === 0))) {
    redirect('/dashboard');
  }

  const accountsData = bankAccounts[0].bank_accounts;
  const bankName = `${bankAccounts[0].bank_name} ${bankAccounts[0].country_code}`;
  const bankLogo = bankAccounts[0].bank_logo;
  // console.log('bankAccounts', bankAccounts);
  // console.log('accountsData', accountsData);

  return (
    <section className="w-full min-h-screen h-full">
      <div className="px-3">
        {
          accountsData.map((account, index) => (
            <div key={index} className="flex items-center justify-between py-4 border-b border-gray-300 last:border-b-0">
              <div className="flex items-center">
                <Image src={bankLogo} alt="logo" width={32} height={32} />
                <div className="ml-2">
                  <p>{account.iban}</p>
                  <p>{bankName}</p>
                </div>
              </div>
              <div><Button asChild><Link href={`/dashboard/accounts/${connectionid}/${account.id}`}>View Transactions</Link></Button></div>
            </div>
          ))
        }
      </div>
    </section>
  )
}