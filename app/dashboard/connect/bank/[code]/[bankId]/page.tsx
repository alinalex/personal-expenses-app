import { currentUser } from "@clerk/nextjs";
import createRequisitionLogic from '@/logic/createRequisitionLogic';
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation';

export default async function OuathDone({ params }: { params: { bankId: string, code: string } }) {
  const bankId = params.bankId;
  const countryCode = params.code;
  const cookieStore = cookies()
  const supabase = createClient(cookieStore);
  const user = await currentUser();
  const userId = user?.id as string;

  const requisitionUrl = await createRequisitionLogic({ countryCode, bankId, supabase, userId });
  if (requisitionUrl && requisitionUrl.length > 0) {
    redirect(requisitionUrl);
  }

  return (
    <section className="w-full min-h-screen h-full">
      <div className="px-3">Redirecting...</div>
    </section>
  )
}