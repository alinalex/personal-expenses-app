// 'use client';
import { Button } from "@/components/ui/button";
import getAccessToken from "@/utils/bank-connect/getAccessToken";
export default function ConnectAccount() {

  async function addBankAccount() {
    const accessTokenData = await getAccessToken();
    console.log('accessTokenData', accessTokenData);
  }
  return (
    <div>
      <p>So empty here. Start by connecting a bank account</p>
      {/* <Button onClick={() => addBankAccount()}>Connect bank account</Button> */}
    </div>
  )
}