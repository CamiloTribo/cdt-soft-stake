"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "../../../src/components/TranslationProvider"
import { useWorldAuth } from "next-world-auth/react"
import { useSearchParams } from "next/navigation"
import Header from "@/src/components/Header"
import Image from "next/image"
import { CountryFlag } from "../../../src/components/CountryFlag"

// Añadir "countries" al tipo RankingType
type RankingType = "holders" | "stakers" | "referrals" | "countries"

// Interfaz para usuarios
interface RankingUser {
  id: string
  username: string
  value: number
  position: number
  isCurrentUser: boolean
  country?: string
}

// Nueva interfaz para países
interface CountryRanking {
  country: string
  totalCDT: number
  userCount: number
  position: number
}

export default function Rankings() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  // Obtener el parámetro tab de la URL y usarlo como valor inicial si existe
  const initialTab = (searchParams.get("tab") as RankingType) || "holders"
  const [activeRanking, setActiveRanking] = useState<RankingType>(initialTab)
  const [rankings, setRankings] = useState<RankingUser[]>([])
  const [countryRankings, setCountryRankings] = useState<CountryRanking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { session } = useWorldAuth()
  const [timeRemaining, setTimeRemaining] = useState<string>("")

  // Obtener el ID del usuario actual
  const currentUserId = session?.user?.walletAddress || ""

  // Obtener el país del usuario actual si está disponible en algún lugar
  // Nota: Esto dependerá de cómo almacenas el país del usuario actual
  const [userCountry, setUserCountry] = useState<string>("")

  // Intentar obtener el país del usuario actual
  useEffect(() => {
    const fetchUserCountry = async () => {
      if (!currentUserId) return

      try {
        const response = await fetch(`/api/username?wallet_address=${currentUserId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.country) {
            setUserCountry(data.country)
          }
        }
      } catch (error) {
        console.error("Error fetching user country:", error)
      }
    }

    fetchUserCountry()
  }, [currentUserId])

  // Calcular tiempo restante hasta el 18/05/25 a las 23:59 UTC
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date()
      const target = new Date("2025-05-18T23:59:00Z")

      // Calcular diferencia en milisegundos
      const diff = target.getTime() - now.getTime()

      if (diff <= 0) {
        return "Contest ended"
      }

      // Convertir a días, horas, minutos, segundos
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      return `${days}d ${hours}h ${minutes}m ${seconds}s`
    }

    // Actualizar cada segundo
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining())
    }, 1000)

    // Inicializar
    setTimeRemaining(calculateTimeRemaining())

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchRankings = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Si es ranking de países, usar el endpoint de country-stats
        if (activeRanking === "countries") {
          const response = await fetch(`/api/country-stats?type=ranking`)

          if (!response.ok) {
            throw new Error("Error al cargar rankings de países")
          }

          const data = await response.json()

          if (data.success && data.rankings) {
            setCountryRankings(data.rankings)
          } else {
            throw new Error("Formato de respuesta inválido")
          }
        }
        // Para otros tipos de ranking, usar el endpoint de rankings
        else {
          const response = await fetch(`/api/rankings?type=${activeRanking}`)

          if (!response.ok) {
            throw new Error("Error al cargar rankings")
          }

          const data = await response.json()

          // Marcar al usuario actual en los rankings
          const rankingsWithCurrentUser = data.rankings.map((user: RankingUser) => ({
            ...user,
            isCurrentUser: user.id === currentUserId,
          }))

          // Limitar a 25 elementos
          const limitedRankings = rankingsWithCurrentUser.slice(0, 25)
          setRankings(limitedRankings)
        }
      } catch (err) {
        console.error("Error fetching rankings:", err)
        setError(t("error_loading_rankings"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchRankings()
  }, [activeRanking, currentUserId, t])

  // Función para formatear números grandes
  const formatLargeNumber = (num: number): string => {
    if (num >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(1) + "B"
    } else if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + "M"
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + "K"
    } else {
      // Para números menores a 1000, mostrar solo el entero
      return Math.floor(num).toString()
    }
  }

  return (
    <main className="min-h-screen bg-black text-white pb-20 font-['Helvetica Neue']">
      <Header />

      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Tabs para cambiar entre rankings - Añadir pestaña de países */}
        <div className="flex bg-gray-900 rounded-xl p-1 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveRanking("holders")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeRanking === "holders" ? "bg-[#4ebd0a] text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            {t("holders")}
          </button>
          <button
            onClick={() => setActiveRanking("stakers")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeRanking === "stakers" ? "bg-[#4ebd0a] text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            {t("stakers")}
          </button>
          <button
            onClick={() => setActiveRanking("referrals")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeRanking === "referrals" ? "bg-[#4ebd0a] text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            {t("referrals_ranking")}
          </button>
          <button
            onClick={() => setActiveRanking("countries")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeRanking === "countries" ? "bg-[#4ebd0a] text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            {/* Usar texto directo en lugar de traducción */}
            Países
          </button>
        </div>

        {/* Banner de premio para referidos */}
        {activeRanking === "referrals" && (
          <div className="bg-gradient-to-r from-[#4ebd0a]/30 to-[#4ebd0a]/10 rounded-xl p-4 mb-6 border border-[#4ebd0a]/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[#4ebd0a] font-bold text-lg">🏆 {t("referral_contest")}</h3>
              <div className="bg-black/30 rounded-full px-3 py-1 text-sm">
                <span className="text-[#4ebd0a] font-mono">{timeRemaining}</span>
              </div>
            </div>
            <p className="text-white text-sm mb-2">{t("referral_contest_description")}</p>
            <div className="flex flex-col gap-1 mt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-300">{t("referral_contest_ends")}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div className="bg-black/30 rounded p-1 text-center">
                  <span className="text-[#4ebd0a]">1st: 5,000 CDT</span>
                </div>
                <div className="bg-black/30 rounded p-1 text-center">
                  <span className="text-[#4ebd0a]">2nd: 3,000 CDT</span>
                </div>
                <div className="bg-black/30 rounded p-1 text-center">
                  <span className="text-[#4ebd0a]">3rd: 1,000 CDT</span>
                </div>
              </div>
              <div className="bg-black/30 rounded p-1 text-center mt-1">
                <span className="text-[#4ebd0a]">4th-13th: 100 CDT each</span>
              </div>
            </div>
          </div>
        )}

        {/* Banner informativo para países */}
        {activeRanking === "countries" && (
          <div className="bg-gradient-to-r from-[#4ebd0a]/30 to-[#4ebd0a]/10 rounded-xl p-4 mb-6 border border-[#4ebd0a]/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[#4ebd0a] font-bold text-lg">🌎 Estadísticas Globales</h3>
            </div>
            <p className="text-white text-sm mb-2">Ranking de países por cantidad total de CDT y usuarios.</p>
          </div>
        )}

        {/* Podio (Top 3) - Diseño Horizontal */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4ebd0a]"></div>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : activeRanking === "countries" ? (
          // Renderizar ranking de países
          countryRankings.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-400">{t("no_rankings_available")}</p>
            </div>
          ) : (
            <>
              {/* Nuevo diseño horizontal para el Top 3 de países */}
              <div className="mb-6">
                {/* Primer lugar - Destacado */}
                {countryRankings.length > 0 && (
                  <div className="bg-[#4ebd0a]/10 border border-[#4ebd0a] rounded-xl p-4 mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-[#4ebd0a]/20 flex items-center justify-center border-2 border-[#4ebd0a] mr-4 flex-shrink-0">
                        <span className="text-xl font-bold text-[#4ebd0a]">1</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-white truncate">
                          <CountryFlag countryCode={countryRankings[0].country} className="mr-1 inline-block" />
                          {countryRankings[0].country}
                        </p>
                        <div className="flex items-center">
                          <p className="text-[#4ebd0a] font-bold text-lg">
                            {formatLargeNumber(countryRankings[0].totalCDT)}
                          </p>
                          <Image src="/TOKEN CDT.png" alt="CDT" width={18} height={18} className="ml-1" />
                          <span className="ml-2 text-gray-400 text-sm">{countryRankings[0].userCount} usuarios</span>
                        </div>
                      </div>
                      <div className="bg-[#4ebd0a] rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="black"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Segundo y tercer lugar - En fila */}
                <div className="grid grid-cols-2 gap-3">
                  {countryRankings.length > 1 && (
                    <div className="bg-gray-900 rounded-xl p-3">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-2 flex-shrink-0">
                          <span className="text-base font-bold">2</span>
                        </div>
                        <p className="text-base font-medium text-white truncate">
                          <CountryFlag countryCode={countryRankings[1].country} className="mr-1 inline-block" />
                          {countryRankings[1].country}
                        </p>
                      </div>
                      <div className="flex items-center justify-center">
                        <p className="text-[#4ebd0a] font-bold">{formatLargeNumber(countryRankings[1].totalCDT)}</p>
                        <Image src="/TOKEN CDT.png" alt="CDT" width={16} height={16} className="ml-1" />
                      </div>
                      <div className="text-center mt-1 text-xs text-gray-400">
                        {countryRankings[1].userCount} usuarios
                      </div>
                    </div>
                  )}

                  {countryRankings.length > 2 && (
                    <div className="bg-gray-900 rounded-xl p-3">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-2 flex-shrink-0">
                          <span className="text-base font-bold">3</span>
                        </div>
                        <p className="text-base font-medium text-white truncate">
                          <CountryFlag countryCode={countryRankings[2].country} className="mr-1 inline-block" />
                          {countryRankings[2].country}
                        </p>
                      </div>
                      <div className="flex items-center justify-center">
                        <p className="text-[#4ebd0a] font-bold">{formatLargeNumber(countryRankings[2].totalCDT)}</p>
                        <Image src="/TOKEN CDT.png" alt="CDT" width={16} height={16} className="ml-1" />
                      </div>
                      <div className="text-center mt-1 text-xs text-gray-400">
                        {countryRankings[2].userCount} usuarios
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de rankings de países */}
              <div className="bg-black rounded-2xl shadow-lg border border-gray-800 overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  {countryRankings.slice(3).map((country) => (
                    <div
                      key={country.country}
                      className={`flex items-center p-4 border-b border-gray-800 last:border-b-0 ${
                        country.country === userCountry ? "bg-[#4ebd0a]/10" : ""
                      }`}
                    >
                      <div className="w-8 text-center font-bold text-gray-400 flex-shrink-0">{country.position}</div>
                      <div className="flex-1 ml-4 min-w-0">
                        <p
                          className={`font-medium truncate ${country.country === userCountry ? "text-[#4ebd0a]" : "text-white"}`}
                        >
                          <CountryFlag countryCode={country.country} className="mr-1 inline-block" />
                          {country.country}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end justify-end flex-shrink-0">
                        <div className="flex items-center">
                          <p className="font-mono font-bold text-[#4ebd0a]">{formatLargeNumber(country.totalCDT)}</p>
                          <Image src="/TOKEN CDT.png" alt="CDT" width={16} height={16} className="ml-1" />
                        </div>
                        <p className="text-xs text-gray-400">{country.userCount} usuarios</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tu país - si el usuario tiene un país asignado y está en el ranking */}
              {userCountry && countryRankings.some((c) => c.country === userCountry) && (
                <div className="mt-6 bg-[#4ebd0a]/20 rounded-xl p-4 border border-[#4ebd0a]">
                  <p className="text-sm text-gray-300 mb-1">Tu país</p>
                  <div className="flex items-center">
                    <div className="w-8 text-center font-bold text-[#4ebd0a] flex-shrink-0">
                      {countryRankings.find((c) => c.country === userCountry)?.position || 0}
                    </div>
                    <div className="flex-1 ml-4 min-w-0">
                      <p className="font-medium text-white truncate">
                        <CountryFlag countryCode={userCountry} className="mr-1 inline-block" />
                        {userCountry}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end justify-end flex-shrink-0">
                      <div className="flex items-center">
                        <p className="font-mono font-bold text-[#4ebd0a]">
                          {formatLargeNumber(countryRankings.find((c) => c.country === userCountry)?.totalCDT || 0)}
                        </p>
                        <Image src="/TOKEN CDT.png" alt="CDT" width={16} height={16} className="ml-1" />
                      </div>
                      <p className="text-xs text-gray-400">
                        {countryRankings.find((c) => c.country === userCountry)?.userCount || 0} usuarios
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )
        ) : rankings.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-400">{t("no_rankings_available")}</p>
          </div>
        ) : (
          <>
            {/* Nuevo diseño horizontal para el Top 3 */}
            <div className="mb-6">
              {/* Primer lugar - Destacado */}
              {rankings.length > 0 && (
                <div className="bg-[#4ebd0a]/10 border border-[#4ebd0a] rounded-xl p-4 mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-[#4ebd0a]/20 flex items-center justify-center border-2 border-[#4ebd0a] mr-4 flex-shrink-0">
                      <span className="text-xl font-bold text-[#4ebd0a]">1</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* En el primer lugar (destacado) */}
                      <p className="text-lg font-bold text-white truncate" title={`@${rankings[0].username}`}>
                        {rankings[0].country && (
                          <CountryFlag countryCode={rankings[0].country} className="mr-1 inline-block" />
                        )}
                        @{rankings[0].username}
                      </p>
                      <div className="flex items-center">
                        <p className="text-[#4ebd0a] font-bold text-lg">{formatLargeNumber(rankings[0].value)}</p>
                        {activeRanking !== "referrals" ? (
                          <Image src="/TOKEN CDT.png" alt="CDT" width={18} height={18} className="ml-1" />
                        ) : (
                          <span className="ml-1 text-[#4ebd0a]">{t("friends")}</span>
                        )}
                      </div>
                    </div>
                    <div className="bg-[#4ebd0a] rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="black"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                    </div>
                  </div>
                  {activeRanking === "referrals" && (
                    <div className="mt-2 bg-black/20 rounded px-2 py-1 text-xs text-center">
                      <span className="text-[#4ebd0a] font-semibold">{t("referral_prize")}: 5,000 CDT</span>
                    </div>
                  )}
                </div>
              )}

              {/* Segundo y tercer lugar - En fila */}
              <div className="grid grid-cols-2 gap-3">
                {rankings.length > 1 && (
                  <div className="bg-gray-900 rounded-xl p-3">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-base font-bold">2</span>
                      </div>
                      {/* En el segundo lugar */}
                      <p className="text-base font-medium text-white truncate" title={`@${rankings[1].username}`}>
                        {rankings[1].country && (
                          <CountryFlag countryCode={rankings[1].country} className="mr-1 inline-block" />
                        )}
                        @{rankings[1].username}
                      </p>
                    </div>
                    <div className="flex items-center justify-center">
                      <p className="text-[#4ebd0a] font-bold">{formatLargeNumber(rankings[1].value)}</p>
                      {activeRanking !== "referrals" ? (
                        <Image src="/TOKEN CDT.png" alt="CDT" width={16} height={16} className="ml-1" />
                      ) : (
                        <span className="ml-1 text-[#4ebd0a]">{t("friends")}</span>
                      )}
                    </div>
                    {activeRanking === "referrals" && (
                      <div className="mt-2 bg-black/20 rounded px-2 py-1 text-xs text-center">
                        <span className="text-[#4ebd0a]">{t("referral_prize")}: 3,000 CDT</span>
                      </div>
                    )}
                  </div>
                )}

                {rankings.length > 2 && (
                  <div className="bg-gray-900 rounded-xl p-3">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-base font-bold">3</span>
                      </div>
                      {/* En el tercer lugar */}
                      <p className="text-base font-medium text-white truncate" title={`@${rankings[2].username}`}>
                        {rankings[2].country && (
                          <CountryFlag countryCode={rankings[2].country} className="mr-1 inline-block" />
                        )}
                        @{rankings[2].username}
                      </p>
                    </div>
                    <div className="flex items-center justify-center">
                      <p className="text-[#4ebd0a] font-bold">{formatLargeNumber(rankings[2].value)}</p>
                      {activeRanking !== "referrals" ? (
                        <Image src="/TOKEN CDT.png" alt="CDT" width={16} height={16} className="ml-1" />
                      ) : (
                        <span className="ml-1 text-[#4ebd0a]">{t("friends")}</span>
                      )}
                    </div>
                    {activeRanking === "referrals" && (
                      <div className="mt-2 bg-black/20 rounded px-2 py-1 text-xs text-center">
                        <span className="text-[#4ebd0a]">{t("referral_prize")}: 1,000 CDT</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Lista de rankings */}
            <div className="bg-black rounded-2xl shadow-lg border border-gray-800 overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {rankings.slice(3).map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center p-4 border-b border-gray-800 last:border-b-0 ${
                      user.isCurrentUser ? "bg-[#4ebd0a]/10" : ""
                    }`}
                  >
                    <div className="w-8 text-center font-bold text-gray-400 flex-shrink-0">{user.position}</div>
                    <div className="flex-1 ml-4 min-w-0">
                      {/* En la lista de rankings (posiciones 4 en adelante) */}
                      <p
                        className={`font-medium truncate ${user.isCurrentUser ? "text-[#4ebd0a]" : "text-white"}`}
                        title={`@${user.username}`}
                      >
                        {user.country && <CountryFlag countryCode={user.country} className="mr-1 inline-block" />}@
                        {user.username}
                      </p>
                    </div>
                    <div className="text-right flex items-center justify-end flex-shrink-0">
                      <p className="font-mono font-bold text-[#4ebd0a]">{formatLargeNumber(user.value)}</p>
                      {activeRanking !== "referrals" ? (
                        <Image src="/TOKEN CDT.png" alt="CDT" width={16} height={16} className="ml-1" />
                      ) : (
                        <span className="ml-1 text-[#4ebd0a]">{t("friends")}</span>
                      )}
                    </div>
                    {activeRanking === "referrals" && user.position <= 13 && (
                      <div className="ml-2 bg-black/30 rounded px-2 py-1 text-xs flex-shrink-0">
                        <span className="text-[#4ebd0a]">
                          {user.position <= 3
                            ? user.position === 1
                              ? "5,000"
                              : user.position === 2
                                ? "3,000"
                                : "1,000"
                            : "100"}{" "}
                          CDT
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tu posición */}
            {rankings.some((user) => user.isCurrentUser) && (
              <div className="mt-6 bg-[#4ebd0a]/20 rounded-xl p-4 border border-[#4ebd0a]">
                <p className="text-sm text-gray-300 mb-1">{t("your_position")}</p>
                <div className="flex items-center">
                  <div className="w-8 text-center font-bold text-[#4ebd0a] flex-shrink-0">
                    {rankings.find((user) => user.isCurrentUser)?.position || 0}
                  </div>
                  <div className="flex-1 ml-4 min-w-0">
                    {/* En la sección "Tu posición" */}
                    <p
                      className="font-medium text-white truncate"
                      title={`@${rankings.find((user) => user.isCurrentUser)?.username}`}
                    >
                      {rankings.find((user) => user.isCurrentUser)?.country && (
                        <CountryFlag
                          countryCode={rankings.find((user) => user.isCurrentUser)?.country || ""}
                          className="mr-1 inline-block"
                        />
                      )}
                      @{rankings.find((user) => user.isCurrentUser)?.username}
                    </p>
                  </div>
                  <div className="text-right flex items-center justify-end flex-shrink-0">
                    <p className="font-mono font-bold text-[#4ebd0a]">
                      {formatLargeNumber(rankings.find((user) => user.isCurrentUser)?.value || 0)}
                    </p>
                    {activeRanking !== "referrals" ? (
                      <Image src="/TOKEN CDT.png" alt="CDT" width={16} height={16} className="ml-1" />
                    ) : (
                      <span className="ml-1 text-[#4ebd0a]">{t("friends")}</span>
                    )}
                  </div>
                  {activeRanking === "referrals" &&
                    rankings.find((user) => user.isCurrentUser)?.position &&
                    (rankings.find((user) => user.isCurrentUser)?.position || 0) <= 13 && (
                      <div className="ml-2 bg-black/30 rounded px-2 py-1 text-xs flex-shrink-0">
                        <span className="text-[#4ebd0a]">
                          {(rankings.find((user) => user.isCurrentUser)?.position || 0) === 1
                            ? "5,000"
                            : (rankings.find((user) => user.isCurrentUser)?.position || 0) === 2
                              ? "3,000"
                              : (rankings.find((user) => user.isCurrentUser)?.position || 0) === 3
                                ? "1,000"
                                : "100"}{" "}
                          CDT
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
