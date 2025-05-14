"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "./TranslationProvider"

// Lista de países con sus códigos ISO y nombres en español e inglés
const countries = [
  { code: "AF", en: "Afghanistan", es: "Afganistán" },
  { code: "AL", en: "Albania", es: "Albania" },
  { code: "DZ", en: "Algeria", es: "Argelia" },
  { code: "AD", en: "Andorra", es: "Andorra" },
  { code: "AO", en: "Angola", es: "Angola" },
  { code: "AG", en: "Antigua and Barbuda", es: "Antigua y Barbuda" },
  { code: "AR", en: "Argentina", es: "Argentina" },
  { code: "AM", en: "Armenia", es: "Armenia" },
  { code: "AU", en: "Australia", es: "Australia" },
  { code: "AT", en: "Austria", es: "Austria" },
  { code: "AZ", en: "Azerbaijan", es: "Azerbaiyán" },
  { code: "BS", en: "Bahamas", es: "Bahamas" },
  { code: "BH", en: "Bahrain", es: "Baréin" },
  { code: "BD", en: "Bangladesh", es: "Bangladesh" },
  { code: "BB", en: "Barbados", es: "Barbados" },
  { code: "BY", en: "Belarus", es: "Bielorrusia" },
  { code: "BE", en: "Belgium", es: "Bélgica" },
  { code: "BZ", en: "Belize", es: "Belice" },
  { code: "BJ", en: "Benin", es: "Benín" },
  { code: "BT", en: "Bhutan", es: "Bután" },
  { code: "BO", en: "Bolivia", es: "Bolivia" },
  { code: "BA", en: "Bosnia and Herzegovina", es: "Bosnia y Herzegovina" },
  { code: "BW", en: "Botswana", es: "Botsuana" },
  { code: "BR", en: "Brazil", es: "Brasil" },
  { code: "BN", en: "Brunei", es: "Brunéi" },
  { code: "BG", en: "Bulgaria", es: "Bulgaria" },
  { code: "BF", en: "Burkina Faso", es: "Burkina Faso" },
  { code: "BI", en: "Burundi", es: "Burundi" },
  { code: "CV", en: "Cabo Verde", es: "Cabo Verde" },
  { code: "KH", en: "Cambodia", es: "Camboya" },
  { code: "CM", en: "Cameroon", es: "Camerún" },
  { code: "CA", en: "Canada", es: "Canadá" },
  { code: "CF", en: "Central African Republic", es: "República Centroafricana" },
  { code: "TD", en: "Chad", es: "Chad" },
  { code: "CL", en: "Chile", es: "Chile" },
  { code: "CN", en: "China", es: "China" },
  { code: "CO", en: "Colombia", es: "Colombia" },
  { code: "KM", en: "Comoros", es: "Comoras" },
  { code: "CG", en: "Congo", es: "Congo" },
  { code: "CD", en: "Congo (Democratic Republic)", es: "Congo (República Democrática)" },
  { code: "CR", en: "Costa Rica", es: "Costa Rica" },
  { code: "CI", en: "Côte d'Ivoire", es: "Costa de Marfil" },
  { code: "HR", en: "Croatia", es: "Croacia" },
  { code: "CU", en: "Cuba", es: "Cuba" },
  { code: "CY", en: "Cyprus", es: "Chipre" },
  { code: "CZ", en: "Czech Republic", es: "República Checa" },
  { code: "DK", en: "Denmark", es: "Dinamarca" },
  { code: "DJ", en: "Djibouti", es: "Yibuti" },
  { code: "DM", en: "Dominica", es: "Dominica" },
  { code: "DO", en: "Dominican Republic", es: "República Dominicana" },
  { code: "EC", en: "Ecuador", es: "Ecuador" },
  { code: "EG", en: "Egypt", es: "Egipto" },
  { code: "SV", en: "El Salvador", es: "El Salvador" },
  { code: "GQ", en: "Equatorial Guinea", es: "Guinea Ecuatorial" },
  { code: "ER", en: "Eritrea", es: "Eritrea" },
  { code: "EE", en: "Estonia", es: "Estonia" },
  { code: "SZ", en: "Eswatini", es: "Esuatini" },
  { code: "ET", en: "Ethiopia", es: "Etiopía" },
  { code: "FJ", en: "Fiji", es: "Fiyi" },
  { code: "FI", en: "Finland", es: "Finlandia" },
  { code: "FR", en: "France", es: "Francia" },
  { code: "GA", en: "Gabon", es: "Gabón" },
  { code: "GM", en: "Gambia", es: "Gambia" },
  { code: "GE", en: "Georgia", es: "Georgia" },
  { code: "DE", en: "Germany", es: "Alemania" },
  { code: "GH", en: "Ghana", es: "Ghana" },
  { code: "GR", en: "Greece", es: "Grecia" },
  { code: "GD", en: "Grenada", es: "Granada" },
  { code: "GT", en: "Guatemala", es: "Guatemala" },
  { code: "GN", en: "Guinea", es: "Guinea" },
  { code: "GW", en: "Guinea-Bissau", es: "Guinea-Bisáu" },
  { code: "GY", en: "Guyana", es: "Guyana" },
  { code: "HT", en: "Haiti", es: "Haití" },
  { code: "HN", en: "Honduras", es: "Honduras" },
  { code: "HU", en: "Hungary", es: "Hungría" },
  { code: "IS", en: "Iceland", es: "Islandia" },
  { code: "IN", en: "India", es: "India" },
  { code: "ID", en: "Indonesia", es: "Indonesia" },
  { code: "IR", en: "Iran", es: "Irán" },
  { code: "IQ", en: "Iraq", es: "Irak" },
  { code: "IE", en: "Ireland", es: "Irlanda" },
  { code: "IL", en: "Israel", es: "Israel" },
  { code: "IT", en: "Italy", es: "Italia" },
  { code: "JM", en: "Jamaica", es: "Jamaica" },
  { code: "JP", en: "Japan", es: "Japón" },
  { code: "JO", en: "Jordan", es: "Jordania" },
  { code: "KZ", en: "Kazakhstan", es: "Kazajistán" },
  { code: "KE", en: "Kenya", es: "Kenia" },
  { code: "KI", en: "Kiribati", es: "Kiribati" },
  { code: "KP", en: "North Korea", es: "Corea del Norte" },
  { code: "KR", en: "South Korea", es: "Corea del Sur" },
  { code: "KW", en: "Kuwait", es: "Kuwait" },
  { code: "KG", en: "Kyrgyzstan", es: "Kirguistán" },
  { code: "LA", en: "Laos", es: "Laos" },
  { code: "LV", en: "Latvia", es: "Letonia" },
  { code: "LB", en: "Lebanon", es: "Líbano" },
  { code: "LS", en: "Lesotho", es: "Lesoto" },
  { code: "LR", en: "Liberia", es: "Liberia" },
  { code: "LY", en: "Libya", es: "Libia" },
  { code: "LI", en: "Liechtenstein", es: "Liechtenstein" },
  { code: "LT", en: "Lithuania", es: "Lituania" },
  { code: "LU", en: "Luxembourg", es: "Luxemburgo" },
  { code: "MG", en: "Madagascar", es: "Madagascar" },
  { code: "MW", en: "Malawi", es: "Malaui" },
  { code: "MY", en: "Malaysia", es: "Malasia" },
  { code: "MV", en: "Maldives", es: "Maldivas" },
  { code: "ML", en: "Mali", es: "Malí" },
  { code: "MT", en: "Malta", es: "Malta" },
  { code: "MH", en: "Marshall Islands", es: "Islas Marshall" },
  { code: "MR", en: "Mauritania", es: "Mauritania" },
  { code: "MU", en: "Mauritius", es: "Mauricio" },
  { code: "MX", en: "Mexico", es: "México" },
  { code: "FM", en: "Micronesia", es: "Micronesia" },
  { code: "MD", en: "Moldova", es: "Moldavia" },
  { code: "MC", en: "Monaco", es: "Mónaco" },
  { code: "MN", en: "Mongolia", es: "Mongolia" },
  { code: "ME", en: "Montenegro", es: "Montenegro" },
  { code: "MA", en: "Morocco", es: "Marruecos" },
  { code: "MZ", en: "Mozambique", es: "Mozambique" },
  { code: "MM", en: "Myanmar", es: "Myanmar" },
  { code: "NA", en: "Namibia", es: "Namibia" },
  { code: "NR", en: "Nauru", es: "Nauru" },
  { code: "NP", en: "Nepal", es: "Nepal" },
  { code: "NL", en: "Netherlands", es: "Países Bajos" },
  { code: "NZ", en: "New Zealand", es: "Nueva Zelanda" },
  { code: "NI", en: "Nicaragua", es: "Nicaragua" },
  { code: "NE", en: "Niger", es: "Níger" },
  { code: "NG", en: "Nigeria", es: "Nigeria" },
  { code: "MK", en: "North Macedonia", es: "Macedonia del Norte" },
  { code: "NO", en: "Norway", es: "Noruega" },
  { code: "OM", en: "Oman", es: "Omán" },
  { code: "PK", en: "Pakistan", es: "Pakistán" },
  { code: "PW", en: "Palau", es: "Palaos" },
  { code: "PS", en: "Palestine", es: "Palestina" },
  { code: "PA", en: "Panama", es: "Panamá" },
  { code: "PG", en: "Papua New Guinea", es: "Papúa Nueva Guinea" },
  { code: "PY", en: "Paraguay", es: "Paraguay" },
  { code: "PE", en: "Peru", es: "Perú" },
  { code: "PH", en: "Philippines", es: "Filipinas" },
  { code: "PL", en: "Poland", es: "Polonia" },
  { code: "PT", en: "Portugal", es: "Portugal" },
  { code: "QA", en: "Qatar", es: "Catar" },
  { code: "RO", en: "Romania", es: "Rumania" },
  { code: "RU", en: "Russia", es: "Rusia" },
  { code: "RW", en: "Rwanda", es: "Ruanda" },
  { code: "KN", en: "Saint Kitts and Nevis", es: "San Cristóbal y Nieves" },
  { code: "LC", en: "Saint Lucia", es: "Santa Lucía" },
  { code: "VC", en: "Saint Vincent and the Grenadines", es: "San Vicente y las Granadinas" },
  { code: "WS", en: "Samoa", es: "Samoa" },
  { code: "SM", en: "San Marino", es: "San Marino" },
  { code: "ST", en: "Sao Tome and Principe", es: "Santo Tomé y Príncipe" },
  { code: "SA", en: "Saudi Arabia", es: "Arabia Saudita" },
  { code: "SN", en: "Senegal", es: "Senegal" },
  { code: "RS", en: "Serbia", es: "Serbia" },
  { code: "SC", en: "Seychelles", es: "Seychelles" },
  { code: "SL", en: "Sierra Leone", es: "Sierra Leona" },
  { code: "SG", en: "Singapore", es: "Singapur" },
  { code: "SK", en: "Slovakia", es: "Eslovaquia" },
  { code: "SI", en: "Slovenia", es: "Eslovenia" },
  { code: "SB", en: "Solomon Islands", es: "Islas Salomón" },
  { code: "SO", en: "Somalia", es: "Somalia" },
  { code: "ZA", en: "South Africa", es: "Sudáfrica" },
  { code: "SS", en: "South Sudan", es: "Sudán del Sur" },
  { code: "ES", en: "Spain", es: "España" },
  { code: "LK", en: "Sri Lanka", es: "Sri Lanka" },
  { code: "SD", en: "Sudan", es: "Sudán" },
  { code: "SR", en: "Suriname", es: "Surinam" },
  { code: "SE", en: "Sweden", es: "Suecia" },
  { code: "CH", en: "Switzerland", es: "Suiza" },
  { code: "SY", en: "Syria", es: "Siria" },
  { code: "TW", en: "Taiwan", es: "Taiwán" },
  { code: "TJ", en: "Tajikistan", es: "Tayikistán" },
  { code: "TZ", en: "Tanzania", es: "Tanzania" },
  { code: "TH", en: "Thailand", es: "Tailandia" },
  { code: "TL", en: "Timor-Leste", es: "Timor Oriental" },
  { code: "TG", en: "Togo", es: "Togo" },
  { code: "TO", en: "Tonga", es: "Tonga" },
  { code: "TT", en: "Trinidad and Tobago", es: "Trinidad y Tobago" },
  { code: "TN", en: "Tunisia", es: "Túnez" },
  { code: "TR", en: "Turkey", es: "Turquía" },
  { code: "TM", en: "Turkmenistan", es: "Turkmenistán" },
  { code: "TV", en: "Tuvalu", es: "Tuvalu" },
  { code: "UG", en: "Uganda", es: "Uganda" },
  { code: "UA", en: "Ukraine", es: "Ucrania" },
  { code: "AE", en: "United Arab Emirates", es: "Emiratos Árabes Unidos" },
  { code: "GB", en: "United Kingdom", es: "Reino Unido" },
  { code: "US", en: "United States", es: "Estados Unidos" },
  { code: "UY", en: "Uruguay", es: "Uruguay" },
  { code: "UZ", en: "Uzbekistan", es: "Uzbekistán" },
  { code: "VU", en: "Vanuatu", es: "Vanuatu" },
  { code: "VA", en: "Vatican City", es: "Ciudad del Vaticano" },
  { code: "VE", en: "Venezuela", es: "Venezuela" },
  { code: "VN", en: "Vietnam", es: "Vietnam" },
  { code: "YE", en: "Yemen", es: "Yemen" },
  { code: "ZM", en: "Zambia", es: "Zambia" },
  { code: "ZW", en: "Zimbabwe", es: "Zimbabue" },
]

// Función para obtener el emoji de la bandera a partir del código ISO del país
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode) return ""

  // Convertir el código ISO a emoji de bandera
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0))

  return String.fromCodePoint(...codePoints)
}

// Cambiar la interfaz CountrySelectorProps para renombrar onChange a onChangeAction
export interface CountrySelectorProps {
  value: string
  onChangeAction: (value: string) => void
  className?: string
}

// Actualizar la desestructuración de props en la función CountrySelector
export function CountrySelector({ value, onChangeAction, className = "" }: CountrySelectorProps) {
  const { t, locale } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCountry, setSelectedCountry] = useState<(typeof countries)[0] | null>(null)

  // Encontrar el país seleccionado cuando cambia el valor
  useEffect(() => {
    if (value) {
      const country = countries.find((c) => c.code === value)
      if (country) {
        setSelectedCountry(country)
      }
    } else {
      setSelectedCountry(null)
    }
  }, [value])

  // Filtrar países según el término de búsqueda
  const filteredCountries = countries.filter(
    (country) =>
      country.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.es.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Actualizar la llamada a onChange en handleSelectCountry
  const handleSelectCountry = (country: (typeof countries)[0]) => {
    onChangeAction(country.code)
    setSelectedCountry(country)
    setIsOpen(false)
    setSearchTerm("")
  }

  return (
    <div className={`relative ${className}`}>
      {/* Botón para abrir/cerrar el selector */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-black border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[#4ebd0a]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedCountry ? (
          <div className="flex items-center">
            <span className="mr-2 text-xl">{getFlagEmoji(selectedCountry.code)}</span>
            <span className="text-white">{locale === "es" ? selectedCountry.es : selectedCountry.en}</span>
          </div>
        ) : (
          <span className="text-gray-400">{t("select_your_country")}</span>
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? "transform rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown con buscador y lista de países */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-black border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Buscador */}
          <div className="sticky top-0 bg-black p-2 border-b border-gray-700">
            <input
              type="text"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#4ebd0a]"
              placeholder={locale === "es" ? "Buscar país..." : "Search country..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Lista de países */}
          <div className="py-1">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  className={`w-full text-left px-4 py-2 hover:bg-gray-800 flex items-center ${
                    selectedCountry?.code === country.code ? "bg-gray-800" : ""
                  }`}
                  onClick={() => handleSelectCountry(country)}
                >
                  <span className="mr-2 text-xl">{getFlagEmoji(country.code)}</span>
                  <span className="text-white">{locale === "es" ? country.es : country.en}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-400 text-center">
                {locale === "es" ? "No se encontraron países" : "No countries found"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
