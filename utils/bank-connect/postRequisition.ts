'use server'
import { gocardlessApiUrl, postRequisitionUrl } from "@/constants/urls";

export default async function postRequisition({ accessToken, countryCode, bankId }: { accessToken: string, countryCode: string, bankId: string }) {
  let reqData: { status: boolean, data: any } = {
    status: true,
    data: null
  }
  try {
    const res = await fetch(`${gocardlessApiUrl}${postRequisitionUrl}`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "accept": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({ redirect: process.env.NEXT_PUBLIC_BANK_OAUTH_REDIRECT, institution_id: bankId, user_language: countryCode })
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