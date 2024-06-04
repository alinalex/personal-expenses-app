'use client';

import { useEffect } from "react";

export default function ClientRedirectComponent({ url }: { url: string }) {

  useEffect(() => {
    if (url.length > 0) {
      if (window) {
        window.location.href = url;
      }
    }
  }, [])

  return (
    <></>
  )
}