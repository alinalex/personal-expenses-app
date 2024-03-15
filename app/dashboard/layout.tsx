import DashboardHeader from "@/components/general/DashboardHeader"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <section className="w-full h-full">
      <DashboardHeader />
      {children}
    </section>
  )
}
