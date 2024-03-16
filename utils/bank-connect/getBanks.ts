'use server'
import { gocardlessApiUrl, getBanksUrl } from "@/constants/urls";

export default async function getBanks({ accessToken, countryCode }: { accessToken: string, countryCode: string }) {
  let bankData: { status: boolean, data: any[] | null | any } = {
    status: true,
    data: null
  }
  try {
    const res = await fetch(`${gocardlessApiUrl}${getBanksUrl}${countryCode}`, {
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