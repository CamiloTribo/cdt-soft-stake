interface CountryFlagProps {
  countryCode: string
  className?: string
}

// Función para convertir código de país a emoji de bandera
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode) return ""

  // Asegurarse de que el código de país esté en mayúsculas
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0))

  return String.fromCodePoint(...codePoints)
}

export function CountryFlag({ countryCode, className = "" }: CountryFlagProps) {
  if (!countryCode) return null

  console.log("Rendering flag for country:", countryCode)

  return (
    <span className={`text-lg ${className}`} title={countryCode}>
      {getFlagEmoji(countryCode)}
    </span>
  )
}
