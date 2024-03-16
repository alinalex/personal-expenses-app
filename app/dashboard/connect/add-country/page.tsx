import countriesData from "@/constants/countries";
import Image from "next/image";

export default function AddCountry() {
  return (
    <section>
      <div>Pick a country</div>
      {
        countriesData.map(country => <div key={country.name} className="flex items-center mb-4">
          <Image src={country.flag} alt={country.name} width={32} />
          <div className="ml-2">{country.name}</div>
        </div>)
      }
    </section>
  )
}