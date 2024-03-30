/** @type {import('next').NextConfig} */
import { withAxiom } from 'next-axiom';
const nextConfig = withAxiom({
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn-logos.gocardless.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
      },
    ]
  }
});

export default nextConfig;
