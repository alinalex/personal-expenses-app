'use client'
import { Button } from "@/components/ui/button";
import { useClerk } from "@clerk/clerk-react";
import { useRouter } from 'next/navigation'

export default function DashboardHeader() {
  const { signOut } = useClerk();
  const router = useRouter()
  return (
    <nav className="px-3 py-4 flex justify-between items-center">
      <div>Dashboard</div>
      <Button variant={'link'} className="px-3 sm:px-4" onClick={() => signOut(() => router.push("/"))}>Sign Out</Button>
    </nav>
  )
}