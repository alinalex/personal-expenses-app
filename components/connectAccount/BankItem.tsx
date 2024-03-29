import Image from "next/image";

export default function BankItem({ bankItemData }: {
  bankItemData: {
    id: string;
    name: string;
    logo: string;
  }
}) {
  return (
    <div className="cursor-pointer flex items-center py-4 border-b border-gray-300">
      <Image src={bankItemData.logo} alt={bankItemData.name} width={32} height={32} className="w-8 h-8 object-cover object-center rounded-md" />
      <p className="ml-2">
        {bankItemData.name}
      </p>
    </div>
  )
}