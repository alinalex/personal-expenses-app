import { Button } from "@/components/ui/button";
import {
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="flex justify-between items-center px-3 py-4">
        <h1>Personal Expenses App</h1>
        <div>
          <SignedIn>
            <Button asChild variant={'ghost'}>
              <Link href='/dashboard' className="p-4 mr-4">Go to Dashboard</Link>
            </Button>
          </SignedIn>
          <SignedOut>
            <Button asChild><Link href='/sign-in' className="p-4 mr-4">Sign In</Link></Button>
          </SignedOut>
        </div>
      </nav>
    </main>
  );
}
