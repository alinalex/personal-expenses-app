'use server'
import { gocardlessApiUrl, getNewToken } from "@/constants/urls";

export default async function getAccessToken() {
  let accessTokenData: { status: boolean, data: any } = {
    status: true,
    data: null
  }
  try {
    const res = await fetch(`${gocardlessApiUrl}${getNewToken}`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "accept": "application/json",
      },
      body: JSON.stringify({ secret_id: process.env.CARDLESS_SECRET_ID, secret_key: process.env.CARDLESS_SECRET_KEY })
    });
    const data = await res.json();
    if (data.status_code !== 200) {
      accessTokenData.status = false;
    }
    accessTokenData.data = data;
  } catch (error) {
    accessTokenData.status = false;
    accessTokenData.data = error;
  }

  return accessTokenData;
}