'use server'

export default async function getAccessToken() {
  let accessTokenData: { status: boolean, data: unknown } = {
    status: true,
    data: null
  }
  try {
    const res = await fetch('https://bankaccountdata.gocardless.com/api/v2/token/new/', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "accept": "application/json",
      },
      body: JSON.stringify({ secret_id: process.env.CARDLESS_SECRET_ID, secret_key: process.env.CARDLESS_SECRET_KEY })
    });
    const data = await res.json();
    accessTokenData.data = data;
  } catch (error) {
    accessTokenData.status = false;
    accessTokenData.data = error;
  }

  return accessTokenData;
}