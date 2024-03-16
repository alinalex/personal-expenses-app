'use client'
import { Button } from "@/components/ui/button";
import { useClerk } from "@clerk/clerk-react";
import Link from "next/link";
import { useRouter } from 'next/navigation'

export default function DashboardHeader() {
  const { signOut } = useClerk();
  const router = useRouter()
  return (
    <nav className="px-3 py-4 flex justify-between items-center">
      <div><Link href='/dashboard' className="p-4 mr-4">Dashboard</Link></div>
      <Button variant={'link'} className="px-3 sm:px-4" onClick={() => signOut(() => router.push("/"))}>Sign Out</Button>
    </nav>
  )
}