'use server'
import { gocardlessApiUrl, accountsUrl } from "@/constants/urls";

export default async function getBankAccountInfo({ accessToken, accountId }: { accessToken: string, accountId: string }) {
  let accountsInfo: { status: boolean, data: any } = {
    status: true,
    data: null
  }
  try {
    const res = await fetch(`${gocardlessApiUrl}${accountsUrl}${accountId}/`, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
    });
    const data = await res.json();
    if (data.status_code && data.status_code !== 200) {
      accountsInfo.status = false;
    }
    accountsInfo.data = data;
  } catch (error) {
    accountsInfo.status = false;
    accountsInfo.data = error;
  }

  return accountsInfo;
}