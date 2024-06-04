import reconnectAccountLogic from '@/logic/reconnectAccountLogic';
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation';
import ClientRedirectComponent from './ClientRedirectComponent';

export default async function Reconnect({ params }: { params: { connectionId: string } }) {
  const connectionId = params.connectionId;
  const cookieStore = cookies()
  const supabase = createClient(cookieStore);

  const { data: bankConnections, error: bankConnectionsError } = await supabase.from('bank_connections').select(`id, bank_logo, bank_name, bank_id, country_code, isDone, oauth_link, isExpired, bank_accounts(*)`).eq('id', connectionId);

  let redirectLink = '';
  if (bankConnections && bankConnections.length > 0) {
    const countryCode = bankConnections[0].country_code;
    const bankId = bankConnections[0].bank_id;

    const reconnectRes = await reconnectAccountLogic({
      supabase, countryCode, bankId,
      bank_connection_id: parseInt(connectionId)
    });

    if (reconnectRes.reqLink && reconnectRes.reqLink.length > 0) {
      redirectLink = reconnectRes.reqLink;
    } else {
      redirect('/dashboard');
    }
  } else {
    redirect('/dashboard');
  }

  return (
    <section className="w-full min-h-screen h-full">
      <div className="px-3">Please wait, you will be redirected shortly...</div>
      <ClientRedirectComponent url={redirectLink} />
    </section>
  )
}