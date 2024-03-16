import countriesData from "@/constants/countries";
import Image from "next/image";
import Link from "next/link";

export default function AddCountry() {
  return (
    <section className="px-6">
      <div className="mb-3">Select your country</div>
      {
        countriesData.map(country =>
        (
          <Link href={country.link} key={country.name}>
            <div className="flex items-center py-4 border-b border-gray-300">
              <Image src={country.flag} alt={country.name} width={32} />
              <div className="ml-2">{country.name}</div>
            </div>
          </Link>
        ))
      }
    </section>
  )
}