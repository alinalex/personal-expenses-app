'use server'
import { gocardlessApiUrl, getSingleBankUrl } from "@/constants/urls";

export default async function getSingleBank({ accessToken, bankId }: { accessToken: string, bankId: string }) {
  let bankData: { status: boolean, data: any[] | null | any } = {
    status: true,
    data: null
  }
  try {
    const res = await fetch(`${gocardlessApiUrl}${getSingleBankUrl}${bankId}`, {
      method: 'GET',
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
    });
    const data = await res.json();
    if (data.status_code && data.status_code !== 200) {
      bankData.status = false;
    }
    bankData.data = data;
  } catch (error) {
    bankData.status = false;
    bankData.data = error;
  }

  return bankData;
}