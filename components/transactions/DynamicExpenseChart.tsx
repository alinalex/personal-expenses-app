import dynamic from 'next/dynamic'

const ExpensesChart = dynamic(
    () => import('@/components/transactions/ExpensesChart'),
    { ssr: false }
)

export default function DynamicExpenseChart({ chartData, domain }: { chartData: any[], domain: number[] }) {
    return <ExpensesChart chartData={chartData} domain={domain} />;
}