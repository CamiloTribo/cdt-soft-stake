"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "../../../src/components/TranslationProvider"
import { useWorldAuth } from "next-world-auth/react"
import Header from "@/src/components/Header"
import Image from "next/image"

type RankingType = "holders" | "stakers" | "referrals"

interface RankingUser {
  id: string
  username: string
  value: number
  position: number
  isCurrentUser: boolean
}

export default function Rankings() {
  const { t } = useTranslation()
  const [activeRanking, setActiveRanking] = useState<RankingType>("holders")
  const [rankings, setRankings] = useState<RankingUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { session } = useWorldAuth()

  // Obtener el ID del usuario actual
  const currentUserId = session?.user?.walletAddress || ""

  useEffect(() => {
    const fetchRankings = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Aquí llamaríamos a la API para obtener los rankings
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
        {/* Tabs para cambiar entre rankings */}
        <div className="flex bg-gray-900 rounded-xl p-1 mb-6">
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
        </div>

        {/* Podio (Top 3) - Diseño Horizontal */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4ebd0a]"></div>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-red-500">{error}</p>
          </div>
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
                      <p className="text-lg font-bold text-white truncate" title={`@${rankings[0].username}`}>
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
                      <p className="text-base font-medium text-white truncate" title={`@${rankings[1].username}`}>
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
                  </div>
                )}

                {rankings.length > 2 && (
                  <div className="bg-gray-900 rounded-xl p-3">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-base font-bold">3</span>
                      </div>
                      <p className="text-base font-medium text-white truncate" title={`@${rankings[2].username}`}>
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
                      <p
                        className={`font-medium truncate ${user.isCurrentUser ? "text-[#4ebd0a]" : "text-white"}`}
                        title={`@${user.username}`}
                      >
                        @{user.username}
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
                    {rankings.find((user) => user.isCurrentUser)?.position}
                  </div>
                  <div className="flex-1 ml-4 min-w-0">
                    <p
                      className="font-medium text-white truncate"
                      title={`@${rankings.find((user) => user.isCurrentUser)?.username}`}
                    >
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
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
