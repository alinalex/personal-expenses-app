'use server'
import { gocardlessApiUrl, accountsUrl, transactionsUrl } from "@/constants/urls";

export default async function getAccountTransactions({ accessToken, accountId, dateFrom, dateTo }: { accessToken: string, accountId: string, dateFrom: string, dateTo: string }) {
  let accountsInfo: { status: boolean, data: any } = {
    status: true,
    data: null
  }
  try {
    const res = await fetch(`${gocardlessApiUrl}${accountsUrl}${accountId}${transactionsUrl}?date_from=${dateFrom}&date_to=${dateTo}`, {
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