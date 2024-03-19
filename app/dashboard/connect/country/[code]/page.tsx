import BankItem from '@/components/connectAccount/BankItem';
import getBanksDataLogic from '@/logic/getBanksLogic';
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link';

export default async function SelectBank({ params }: { params: { code: string } }) {
  const countryCode = params.code;
  const cookieStore = cookies()
  const supabase = createClient(cookieStore);
  const bankData = await getBanksDataLogic({ supabase, countryCode });

  return (
    <section className="px-6">
      <div className="mb-3">Select your bank</div>
      {bankData && bankData.length > 0 ?
        bankData.map(bank => (
          <Link href={`/dashboard/connect/bank/${countryCode}/${bank.id}`} key={bank.id}><BankItem bankItemData={bank} /></Link>
        )) :
        <div>An error occured, please try again.</div>}
    </section>
  )
}