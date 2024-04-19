import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from '@vercel/analytics/react';
import { AxiomWebVitals } from 'next-axiom';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Personal Expenses App",
  description: "Manage your credit card expenses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{
      elements: {
        footer: "hidden",
      },
    }}>
      <html lang="en" suppressHydrationWarning={true}>
        <body className={inter.className} suppressHydrationWarning={true}>
          {children}
          <Analytics />
          <AxiomWebVitals />
        </body>
      </html>
    </ClerkProvider>
  );
}
