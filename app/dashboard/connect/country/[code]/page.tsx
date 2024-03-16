import getBanksDataLogic from '@/logic/getBanksLogic';
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function SelectBank({ params }: { params: { code: string } }) {
  const countryCode = params.code;
  const cookieStore = cookies()
  const supabase = createClient(cookieStore);
  const bankData = await getBanksDataLogic({ supabase, countryCode });

  return (
    <section className="px-6">
      <div className="mb-3">Select your bank</div>
      {bankData && bankData.length > 0 ? bankData.map(bank =>
        <div key={bank.id} className="cursor-pointer flex items-center py-4 border-b border-gray-300">
          <img src={bank.logo} alt={bank.name} className="w-8 h-8 object-cover object-center rounded-md" />
          <p className="ml-2">
            {bank.name}
          </p>
        </div>) : <div>An error occured, please try again.</div>}
    </section>
  )
}