import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <section className="flex justify-center items-center w-full h-[calc(100vh_-_32px)]">
      <SignIn />
    </section>
  );
}