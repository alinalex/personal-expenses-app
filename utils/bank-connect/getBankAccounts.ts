'use server'
import { gocardlessApiUrl, postRequisitionUrl } from "@/constants/urls";

export default async function getBankAccounts({ accessToken, reqId }: { accessToken: string, reqId: string }) {
  let accountsData: { status: boolean, data: any } = {
    status: true,
    data: null
  }
  try {
    const res = await fetch(`${gocardlessApiUrl}${postRequisitionUrl}${reqId}/`, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
    });
    const data = await res.json();
    if (data.status_code && data.status_code !== 200) {
      accountsData.status = false;
    }
    accountsData.data = data;
  } catch (error) {
    accountsData.status = false;
    accountsData.data = error;
  }

  return accountsData;
}