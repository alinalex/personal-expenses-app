import EditTransactionForm from '@/components/transactions/EditTransactionForm';
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from "next/link";

export default async function EditTransaction({ params }: { params: { accountId: string, connectionId: string, transactionId: string } }) {
  const accountId = params.accountId;
  const connectionId = params.connectionId;
  const transactionId = params.transactionId;
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: transactionData, error: transactionError } = await supabase.from('account_transactions').select(`*, transaction_categories(category_name, id)`).eq('id', transactionId);
  let transaction: any = {};
  let selectedCategory = '';
  if (transactionData && transactionData.length > 0) {
    transaction = { ...transactionData[0] };
    selectedCategory = transaction.transaction_categories.category_name;
  }

  const { data: categoriesData, error: categoriesError } = await supabase.from('transaction_categories').select(`*`);
  let categories: any[] = [];
  if (categoriesData && categoriesData.length > 0) {
    categories = [...categoriesData];
  }

  return (
    <section className="w-full min-h-screen h-full">
      <div className="px-6 pb-6">
        <h2 className="mb-4 font-semibold">Update the category for transaction with id {transactionId}</h2>
        {
          transactionData && transactionData.length > 0 ?
            <EditTransactionForm connectionId={connectionId} transaction={transaction} categories={categories} selectedCategory={selectedCategory} /> :
            <div>
              <p>Oops, thre is no transaction data here. Click below to go back to dashboard.</p>
              <div>
                <Link href={`/dashboard/accounts/${connectionId}/${accountId}`}>Go back</Link>
              </div>
            </div>
        }
      </div>
    </section>
  )
}