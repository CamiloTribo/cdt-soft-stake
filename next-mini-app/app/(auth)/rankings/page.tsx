"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "../../../src/components/TranslationProvider"
import { useWorldAuth } from "next-world-auth/react"
import { useSearchParams } from "next/navigation"
import Header from "@/src/components/Header"
import Image from "next/image"
import { CountryFlag } from "../../../src/components/CountryFlag"
import Link from "next/link"

// Añadir "countries" y "levels" al tipo RankingType
type RankingType = "holders" | "stakers" | "referrals" | "countries" | "levels"

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

// Interfaz para niveles de staking
interface StakingLevel {
  id: string
  name: string
  minAmount: number
  maxAmount: number | null
  color: string
  benefits: string[]
  dailyRate: number
  apy: number
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
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Definir los niveles de staking con APY calculado
  const stakingLevels: StakingLevel[] = [
    {
      id: "tribers",
      name: "TRIBERS",
      minAmount: 0,
      maxAmount: 99999,
      color: "#4ebd0a",
      benefits: ["0.10% diario (tasa base)"],
      dailyRate: 0.1,
      apy: 36.5,
    },
    {
      id: "cryptotribers",
      name: "CRYPTOTRIBERS",
      minAmount: 100000,
      maxAmount: 999999,
      color: "#C0C0C0",
      benefits: ["0.11% diario", "Acceso a canales exclusivos"],
      dailyRate: 0.11,
      apy: 40.15,
    },
    {
      id: "millotribers",
      name: "MILLOTRIBERS",
      minAmount: 1000000,
      maxAmount: 9999999,
      color: "#FFD700",
      benefits: ["0.12% diario", "Acceso a grupo especial de Discord"],
      dailyRate: 0.12,
      apy: 43.8,
    },
    {
      id: "legendarytribers",
      name: "LEGENDARYTRIBERS",
      minAmount: 10000000,
      maxAmount: null,
      color: "#B9F2FF",
      benefits: ["0.13% diario", "Beneficios exclusivos para leyendas"],
      dailyRate: 0.13,
      apy: 47.45,
    },
  ]

  // Obtener el ID del usuario actual
  const currentUserId = session?.user?.walletAddress || ""

  // Obtener el país del usuario actual si está disponible en algún lugar
  // Nota: Esto dependerá de cómo almacenas el país del usuario actual
  const [userCountry, setUserCountry] = useState<string>("")

  // Cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

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

  const fetchRankings = useCallback(async () => {
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
      else if (activeRanking !== "levels") {
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
      } else {
        // Para la sección "Coming Soon" de niveles, no cargamos datos
        setRankings([])
      }
    } catch (err) {
      console.error("Error fetching rankings:", err)
      setError(t("error_loading_rankings"))
    } finally {
      setIsLoading(false)
    }
  }, [activeRanking, currentUserId, t])

  useEffect(() => {
    fetchRankings()
  }, [fetchRankings])

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

  // Función para cambiar el ranking activo
  const handleRankingChange = (ranking: RankingType) => {
    setActiveRanking(ranking)
    setShowDropdown(false)
  }

  // Obtener el nombre del ranking actual para mostrar en el dropdown
  const getCurrentRankingName = () => {
    switch (activeRanking) {
      case "holders":
        return t("holders")
      case "stakers":
        return t("stakers")
      case "referrals":
        return t("referrals_ranking")
      case "countries":
        return "Países"
      case "levels":
        return "Niveles"
      default:
        return t("rankings")
    }
  }

  // (handleSubscribe removed because it was unused)

  return (
    <main className="min-h-screen bg-black text-white pb-20 font-['Helvetica Neue']">
      <Header />

      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Nuevo selector de rankings con dropdown */}
        <div className="relative mb-6" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between bg-gray-900 rounded-xl p-4 text-white font-medium transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4ebd0a]/50"
            aria-haspopup="listbox"
            aria-expanded={showDropdown}
          >
            <span className="flex items-center">
              {activeRanking === "holders" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-[#4ebd0a]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v6.5l3-3"></path>
                  <path d="M12 2v6.5l-3-3"></path>
                  <path d="M17 17.5l5-1.5-5-1.5"></path>
                  <path d="M7 17.5l-5-1.5 5-1.5"></path>
                  <circle cx="12" cy="17" r="3"></circle>
                  <path d="M12 14v-3"></path>
                </svg>
              )}
              {activeRanking === "stakers" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-[#4ebd0a]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              )}
              {activeRanking === "referrals" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-[#4ebd0a]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              )}
              {activeRanking === "countries" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-[#4ebd0a]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  <path d="M2 12h20"></path>
                </svg>
              )}
              {activeRanking === "levels" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-[#4ebd0a]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20v-6M6 20V10M18 20V4"></path>
                </svg>
              )}
              {getCurrentRankingName()}
              {activeRanking === "levels" && (
                <span className="ml-2 text-xs bg-[#4ebd0a] text-black px-2 py-0.5 rounded-full">Próximamente</span>
              )}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {/* Dropdown menu */}
          {showDropdown && (
            <div
              className="absolute z-50 mt-1 w-full bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-lg py-1 border border-gray-800 animate-in fade-in-50 slide-in-from-top-5 duration-200"
              role="listbox"
            >
              <button
                onClick={() => handleRankingChange("holders")}
                className={`w-full text-left px-4 py-3 flex items-center hover:bg-gray-800 transition-colors ${
                  activeRanking === "holders" ? "bg-[#4ebd0a]/10 text-[#4ebd0a]" : "text-white"
                }`}
                role="option"
                aria-selected={activeRanking === "holders"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v6.5l3-3"></path>
                  <path d="M12 2v6.5l-3-3"></path>
                  <path d="M17 17.5l5-1.5-5-1.5"></path>
                  <path d="M7 17.5l-5-1.5 5-1.5"></path>
                  <circle cx="12" cy="17" r="3"></circle>
                  <path d="M12 14v-3"></path>
                </svg>
                {t("holders")}
              </button>
              <button
                onClick={() => handleRankingChange("stakers")}
                className={`w-full text-left px-4 py-3 flex items-center hover:bg-gray-800 transition-colors ${
                  activeRanking === "stakers" ? "bg-[#4ebd0a]/10 text-[#4ebd0a]" : "text-white"
                }`}
                role="option"
                aria-selected={activeRanking === "stakers"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                {t("stakers")}
              </button>
              <button
                onClick={() => handleRankingChange("referrals")}
                className={`w-full text-left px-4 py-3 flex items-center hover:bg-gray-800 transition-colors ${
                  activeRanking === "referrals" ? "bg-[#4ebd0a]/10 text-[#4ebd0a]" : "text-white"
                }`}
                role="option"
                aria-selected={activeRanking === "referrals"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                {t("referrals_ranking")}
              </button>
              <button
                onClick={() => handleRankingChange("countries")}
                className={`w-full text-left px-4 py-3 flex items-center hover:bg-gray-800 transition-colors ${
                  activeRanking === "countries" ? "bg-[#4ebd0a]/10 text-[#4ebd0a]" : "text-white"
                }`}
                role="option"
                aria-selected={activeRanking === "countries"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  <path d="M2 12h20"></path>
                </svg>
                Países
              </button>
              <button
                onClick={() => handleRankingChange("levels")}
                className={`w-full text-left px-4 py-3 flex items-center hover:bg-gray-800 transition-colors ${
                  activeRanking === "levels" ? "bg-[#4ebd0a]/10 text-[#4ebd0a]" : "text-white"
                }`}
                role="option"
                aria-selected={activeRanking === "levels"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20v-6M6 20V10M18 20V4"></path>
                </svg>
                Niveles
                <span className="ml-2 text-xs bg-[#4ebd0a] text-black px-2 py-0.5 rounded-full">Próximamente</span>
              </button>
            </div>
          )}
        </div>

        {/* Banner de premio para referidos */}
        {activeRanking === "referrals" && (
          <div className="bg-gradient-to-r from-[#4ebd0a]/30 to-[#4ebd0a]/10 rounded-xl p-4 mb-6 border border-[#4ebd0a]/50 transform transition-all hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(78,189,10,0.3)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[#4ebd0a] font-bold text-lg flex items-center">
                <span className="animate-bounce inline-block mr-1">🏆</span> {t("referral_contest")}
              </h3>
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
                <div className="bg-black/30 rounded p-1 text-center transform transition-all hover:bg-black/50 hover:scale-105">
                  <span className="text-[#4ebd0a]">1st: 5,000 CDT</span>
                </div>
                <div className="bg-black/30 rounded p-1 text-center transform transition-all hover:bg-black/50 hover:scale-105">
                  <span className="text-[#4ebd0a]">2nd: 3,000 CDT</span>
                </div>
                <div className="bg-black/30 rounded p-1 text-center transform transition-all hover:bg-black/50 hover:scale-105">
                  <span className="text-[#4ebd0a]">3rd: 1,000 CDT</span>
                </div>
              </div>
              <div className="bg-black/30 rounded p-1 text-center mt-1 transform transition-all hover:bg-black/50 hover:scale-[1.02]">
                <span className="text-[#4ebd0a]">4th-13th: 100 CDT each</span>
              </div>
            </div>
          </div>
        )}

        {/* Banner informativo para países */}
        {activeRanking === "countries" && (
          <div className="bg-gradient-to-r from-[#4ebd0a]/30 to-[#4ebd0a]/10 rounded-xl p-4 mb-6 border border-[#4ebd0a]/50 transform transition-all hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(78,189,10,0.3)]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[#4ebd0a] font-bold text-lg flex items-center">
                <span className="inline-block mr-1">🌎</span> Estadísticas Globales
              </h3>
            </div>
            <p className="text-white text-sm mb-2">Ranking de países por cantidad total de CDT y usuarios.</p>
          </div>
        )}

        {/* Banner Coming Soon para niveles - Mejorado con APY */}
        {activeRanking === "levels" && (
          <div className="bg-gradient-to-br from-[#4ebd0a]/30 via-[#4ebd0a]/20 to-[#4ebd0a]/5 rounded-xl p-6 mb-6 border border-[#4ebd0a]/50 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/abstract-green-gradient.png')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
            <div className="relative z-10">
              <div className="inline-block bg-[#4ebd0a] text-black px-3 py-1 rounded-full text-sm font-bold mb-4 animate-pulse">
                Próximamente
              </div>
              <h3 className="text-[#4ebd0a] font-bold text-2xl mb-3">Niveles de Staking</h3>
              <p className="text-white text-sm mb-6 max-w-xs mx-auto">
                Una nueva forma de competir y ganar recompensas basada en tu nivel de staking. ¡Prepárate para
                desbloquear beneficios exclusivos y mayores APY!
              </p>

              {/* Sección de niveles mejorada con APY */}
              <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
                {stakingLevels.map((level) => (
                  <div
                    key={level.id}
                    className="bg-black/30 rounded-lg p-3 transform transition-all hover:bg-black/50 hover:scale-105 border border-gray-800"
                    style={{ borderLeft: `3px solid ${level.color}` }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2"
                      style={{ backgroundColor: `${level.color}30` }}
                    >
                      <span style={{ color: level.color }} className="font-bold text-xs">
                        {level.name.charAt(0)}
                      </span>
                    </div>
                    <p className="text-white text-xs font-medium text-center">{level.name}</p>
                    <div className="flex flex-col items-center mt-1">
                      <p className="text-[#4ebd0a] text-xs font-bold">+{level.dailyRate}% diario</p>
                      <p className="text-yellow-400 text-[10px] font-medium">{level.apy}% APY</p>
                    </div>
                    <p className="text-gray-400 text-[10px] mt-1 text-center">
                      {level.maxAmount
                        ? `${formatLargeNumber(level.minAmount)}-${formatLargeNumber(level.maxAmount)} CDT`
                        : `${formatLargeNumber(level.minAmount)}+ CDT`}
                    </p>
                  </div>
                ))}
              </div>

              {/* Sección de Boost */}
              <div className="bg-gradient-to-r from-[#4ebd0a]/20 to-yellow-500/20 rounded-lg p-4 mt-4 border border-yellow-500/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m8 13.5 4 4.5 4-4.5"></path>
                    <path d="m8 4.5 4 4.5 4-4.5"></path>
                    <line x1="12" y1="9" x2="12" y2="18"></line>
                  </svg>
                  <h4 className="text-yellow-400 font-bold">BOOST</h4>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m8 13.5 4 4.5 4-4.5"></path>
                    <path d="m8 4.5 4 4.5 4-4.5"></path>
                    <line x1="12" y1="9" x2="12" y2="18"></line>
                  </svg>
                </div>
                <p className="text-white text-sm">
                  Próximamente: Aumenta tu tasa diaria hasta <span className="text-yellow-400 font-bold">0.2%</span> con
                  nuestro sistema de boost
                </p>
                <p className="text-yellow-400 font-bold text-lg mt-1">¡Hasta 73% APY!</p>
              </div>

              {/* Botón para volver al dashboard */}
              <Link
                href="/dashboard"
                className="mt-6 inline-block bg-[#4ebd0a] hover:bg-[#3da008] text-black font-bold py-2 px-6 rounded-full transition-all transform hover:scale-105"
              >
                Volver al Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[#4ebd0a] animate-spin"></div>
              <div className="absolute inset-3 rounded-full border-t-2 border-r-2 border-[#4ebd0a]/70 animate-spin animation-delay-150"></div>
              <div className="absolute inset-6 rounded-full border-t-2 border-r-2 border-[#4ebd0a]/40 animate-spin animation-delay-300"></div>
            </div>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 inline-flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p className="text-red-500">{error}</p>
            </div>
          </div>
        ) : activeRanking === "levels" ? (
          // No renderizamos nada adicional para la sección de niveles, ya que mostramos el banner "Coming Soon"
          <></>
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
                  <div className="bg-[#4ebd0a]/10 border border-[#4ebd0a] rounded-xl p-4 mb-4 transform transition-all hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(78,189,10,0.2)]">
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
                          <Image
                            src="/TOKEN CDT.png"
                            alt="CDT"
                            width={18}
                            height={18}
                            className="ml-1"
                            priority={true}
                          />
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
                    <div className="bg-gray-900 rounded-xl p-3 transform transition-all hover:scale-[1.02] hover:bg-gray-800">
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
                    <div className="bg-gray-900 rounded-xl p-3 transform transition-all hover:scale-[1.02] hover:bg-gray-800">
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
                      className={`flex items-center p-4 border-b border-gray-800 last:border-b-0 transition-colors hover:bg-gray-900 ${
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
                <div className="mt-6 bg-[#4ebd0a]/20 rounded-xl p-4 border border-[#4ebd0a] transform transition-all hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(78,189,10,0.3)]">
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
                <div className="bg-[#4ebd0a]/10 border border-[#4ebd0a] rounded-xl p-4 mb-4 transform transition-all hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(78,189,10,0.2)]">
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
                        {rankings[0].isCurrentUser && (
                          <span className="ml-2 text-xs bg-[#4ebd0a] text-black px-2 py-0.5 rounded-full">Tú</span>
                        )}
                      </p>
                      <div className="flex items-center">
                        <p className="text-[#4ebd0a] font-bold text-lg">{formatLargeNumber(rankings[0].value)}</p>
                        {activeRanking !== "referrals" ? (
                          <Image
                            src="/TOKEN CDT.png"
                            alt="CDT"
                            width={18}
                            height={18}
                            className="ml-1"
                            priority={true}
                          />
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
                  <div
                    className={`bg-gray-900 rounded-xl p-3 transform transition-all hover:scale-[1.02] hover:bg-gray-800 ${
                      rankings[1].isCurrentUser ? "border border-[#4ebd0a]/50" : ""
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-base font-bold">2</span>
                      </div>
                      {/* En el segundo lugar */}
                      <p
                        className={`text-base font-medium truncate ${
                          rankings[1].isCurrentUser ? "text-[#4ebd0a]" : "text-white"
                        }`}
                        title={`@${rankings[1].username}`}
                      >
                        {rankings[1].country && (
                          <CountryFlag countryCode={rankings[1].country} className="mr-1 inline-block" />
                        )}
                        @{rankings[1].username}
                        {rankings[1].isCurrentUser && (
                          <span className="ml-1 text-xs bg-[#4ebd0a] text-black px-1 py-0.5 rounded-full">Tú</span>
                        )}
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
                  <div
                    className={`bg-gray-900 rounded-xl p-3 transform transition-all hover:scale-[1.02] hover:bg-gray-800 ${
                      rankings[2].isCurrentUser ? "border border-[#4ebd0a]/50" : ""
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-base font-bold">3</span>
                      </div>
                      {/* En el tercer lugar */}
                      <p
                        className={`text-base font-medium truncate ${
                          rankings[2].isCurrentUser ? "text-[#4ebd0a]" : "text-white"
                        }`}
                        title={`@${rankings[2].username}`}
                      >
                        {rankings[2].country && (
                          <CountryFlag countryCode={rankings[2].country} className="mr-1 inline-block" />
                        )}
                        @{rankings[2].username}
                        {rankings[2].isCurrentUser && (
                          <span className="ml-1 text-xs bg-[#4ebd0a] text-black px-1 py-0.5 rounded-full">Tú</span>
                        )}
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
                    className={`flex items-center p-4 border-b border-gray-800 last:border-b-0 transition-colors hover:bg-gray-900 ${
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
                        {user.isCurrentUser && (
                          <span className="ml-1 text-xs bg-[#4ebd0a] text-black px-1 py-0.5 rounded-full">Tú</span>
                        )}
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
              <div className="mt-6 bg-[#4ebd0a]/20 rounded-xl p-4 border border-[#4ebd0a] transform transition-all hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(78,189,10,0.3)]">
                <p className="text-sm text-gray-300 mb-1">{t("your_position")}</p>
                <div className="flex items-center">
                  <div className="w-8 text-center font-bold text-[#4ebd0a] flex-shrink-0">
                    {rankings.find((user) => user.isCurrentUser)?.position || 0}
                  </div>
                  <div className="flex-1 ml-4 min-w-0">
                    <p className="font-medium text-white truncate">
                      @{rankings.find((user) => user.isCurrentUser)?.username || ""}
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
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
