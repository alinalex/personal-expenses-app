import { currentUser } from "@clerk/nextjs";
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDateForApi } from "@/logic/retrieveTransactionsLogic";
import { currency } from "@/constants/general";

export default async function AccountPage({ params, searchParams }: { params: { accountId: string, connectionId: string }, searchParams: { year_month: string, section: 'expenses' | 'transactions' } }) {

  const accountId = params.accountId;
  const connectionId = params.connectionId;
  const user = await currentUser();
  const userId = user?.id as string;
  const cookieStore = cookies()
  const supabase = createClient(cookieStore);

  // check for search params that drives the UI logic
  let year_month = searchParams.year_month;
  let section = searchParams.section;

  const { data: yearMonthDdata, error: yearMonthError } = await supabase.from('expenses_totals').select('*').eq('account_id', accountId).order('year_month', { ascending: false });

  if (typeof year_month === 'undefined') {
    if (!yearMonthError && yearMonthDdata && yearMonthDdata.length > 0) {
      // redirect to url with year_month in url and add the section to be expenses by default in case it does not have it
      year_month = yearMonthDdata[0].year_month;
      if (typeof section === 'undefined') section = 'expenses';
      redirect(`/dashboard/accounts/${connectionId}/${accountId}?year_month=${year_month}&section=${section}`);
    }
  }

  if (typeof section === 'undefined') {
    redirect(`/dashboard/accounts/${connectionId}/${accountId}?year_month=${year_month}&section=expenses`);
  }

  let transactions: any[] = [], outer, inner, totalExpenses;
  if (section === 'expenses') {
    const { data: expensesData, error: expensesError } = await supabase.from('expenses_totals').select('*').eq('year_month', year_month);
    if (expensesData && expensesData.length > 0) {
      outer = expensesData[0].outer;
      inner = expensesData[0].inner;
      totalExpenses = expensesData[0].total;
    }
  } else {
    const date = new Date(year_month);
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = await formatDateForApi({ date: new Date(year, month, 1).toString() });
    const lastDay = await formatDateForApi({ date: new Date(year, month + 1, 0).toString() });
    const { data: transactionsDB, error: transactionsDBError } = await supabase.from('account_transactions').select(`*, transaction_categories(category_name)`).eq('account_id', accountId).gte('booking_date', firstDay).lte('booking_date', lastDay).order('booking_date', { ascending: false });
    if (transactionsDB && transactionsDB.length > 0) {
      transactions = [...transactionsDB];
    }
  }

  return (
    <section className="w-full min-h-screen h-full">
      <div className="px-3">
        {
          typeof year_month !== 'undefined' ?
            <div className="flex">
              <div className="w-fit border-r pr-3 mr-3 border-gray-300">
                <div className="border-b border-gray-300 pb-1 mb-3">Timeframe</div>
                <div>
                  {
                    yearMonthDdata && yearMonthDdata.map((elem, index) =>
                      <div key={index} className="mb-1">
                        <Link href={`/dashboard/accounts/${connectionId}/${accountId}?year_month=${elem.year_month}&section=${section}`} className={`cursor-pointer ${year_month === elem.year_month && 'text-green-400'}`}>{elem.year_month}</Link>
                      </div>
                    )
                  }
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-center border-b border-gray-300 pb-1 mb-3">
                  <Link href={`/dashboard/accounts/${connectionId}/${accountId}?year_month=${year_month}&section=expenses`} className={`mr-3 ${section === 'expenses' && 'text-green-400'}`}>Expenses</Link>
                  <Link href={`/dashboard/accounts/${connectionId}/${accountId}?year_month=${year_month}&section=transactions`} className={`${section === 'transactions' && 'text-green-400'}`}>Transactions</Link>
                </div>
                <div>
                  {
                    section === 'expenses' ?
                      <>
                        <p>Outer transactions amount: {outer}{' '}{currency}</p>
                        <p>Inner transactions amount: {inner}{' '}{currency}</p>
                        <p>Total expenses amount: {totalExpenses}{' '}{currency}</p>
                      </>
                      : transactions && transactions.map(transaction => (
                        <div key={transaction.id} className="flex items-center gap-x-3 mb-3 border-b border-gray-300 pb-3">
                          <div className="w-[100px]">{transaction.booking_date}</div>
                          <div className="w-[120px]">{transaction.amount}{' '}{transaction.currency}</div>
                          <div className="w-[190px]">{transaction.transaction_type}</div>
                          <div className="w-[110px]">{transaction.transaction_categories.category_name}</div>
                          <div className="w-[600px] break-words">{transaction.transaction_info}</div>
                          <Button variant="default" asChild className="flex-1"><Link href={`/dashboard/accounts/${connectionId}/${accountId}/${transaction.id}/edit`}>Edit</Link></Button>
                        </div>
                      ))
                  }
                </div>
              </div>
            </div>
            : (
              <div>
                <p className="mb-2">It looks you don&apos;t have any transactions. Click the button below to retrieve them.</p>
                <div><Button asChild><Link href={`/dashboard/accounts/${connectionId}/${accountId}/retrieve`} className="p-4 mr-4">Retrive transactions</Link></Button></div>
              </div>
            )
        }
      </div>
    </section>
  )
}