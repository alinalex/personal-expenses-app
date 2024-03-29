import retrieveTransactionsLogic from '@/logic/retrieveTransactionsLogic';
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from "next/navigation";

export default async function RetrieveTransactions({ params }: { params: { accountId: string, connectionId: string } }) {
  const accountId = params.accountId;
  const connectionId = params.connectionId;
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: transactions, error: transactionsError } = await supabase.from('account_transactions').select(`*`).eq('account_id', accountId);

  if (transactions && transactions.length > 0) {
    redirect(`/dashboard/accounts/${connectionId}/${accountId}`);
  }

  const areTransactionsDone = await retrieveTransactionsLogic({ accountId, connectionId, supabase });
  if (areTransactionsDone) {
    redirect(`/dashboard/accounts/${connectionId}/${accountId}`);
  }

  return (
    <section className="w-full min-h-screen h-full">
      <div className="px-3">
        Retrieving transactios, please wait...
      </div>
    </section>
  )
}