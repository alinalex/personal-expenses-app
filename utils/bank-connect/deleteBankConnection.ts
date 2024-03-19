'use server'
import { gocardlessApiUrl, getSingleBankUrl } from "@/constants/urls";

export default async function deleteBankConnection({ accessToken, reqId }: { accessToken: string, reqId: string }) {
  let reqData: { status: boolean, data: any } = {
    status: true,
    data: null
  }
  try {
    const res = await fetch(`${gocardlessApiUrl}${getSingleBankUrl}${reqId}/`, {
      method: 'DELETE',
      headers: {
        "Content-Type": "application/json",
        "accept": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
    });
    const data = await res.json();
    if (data.status_code && data.status_code !== 200) {
      reqData.status = false;
    }
    reqData.data = data;
  } catch (error) {
    reqData.status = false;
    reqData.data = error;
  }

  return reqData;
}