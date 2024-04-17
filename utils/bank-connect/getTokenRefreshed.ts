import { gocardlessApiUrl, getRefreshToken } from "@/constants/urls";

export default async function getTokenRefreshed({ refreshToken }: { refreshToken: string }) {
  let refreshTokenData: { status: boolean, data: any } = {
    status: true,
    data: null
  }
  try {
    const res = await fetch(`${gocardlessApiUrl}${getRefreshToken}`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "accept": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken })
    });
    const data = await res.json();
    if (data.status_code && data.status_code !== 200) {
      refreshTokenData.status = false;
    }
    refreshTokenData.data = data;
  } catch (error) {
    refreshTokenData.status = false;
    refreshTokenData.data = error;
  }

  return refreshTokenData;
}