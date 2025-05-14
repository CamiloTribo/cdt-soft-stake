import { getFlagEmoji } from "./CountrySelector"

interface CountryFlagProps {
  countryCode: string
  className?: string
}

export function CountryFlag({ countryCode, className = "" }: CountryFlagProps) {
  if (!countryCode) return null

  return <span className={`text-xl ${className}`}>{getFlagEmoji(countryCode)}</span>
}
