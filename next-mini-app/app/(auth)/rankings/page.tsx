"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "../../../src/components/TranslationProvider"
import { useWorldAuth } from "next-world-auth/react"
import Header from "@/src/components/Header"

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

        setRankings(rankingsWithCurrentUser)
      } catch (err) {
        console.error("Error fetching rankings:", err)
        setError(t("error_loading_rankings"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchRankings()
  }, [activeRanking, currentUserId, t])

  // Función para obtener el título según el tipo de ranking
  const getRankingTitle = () => {
    switch (activeRanking) {
      case "holders":
        return t("top_holders")
      case "stakers":
        return t("top_stakers")
      case "referrals":
        return t("referrals_ranking")
      default:
        return ""
    }
  }

  // Función para obtener la unidad según el tipo de ranking
  const getRankingUnit = () => {
    switch (activeRanking) {
      case "holders":
      case "stakers":
        return "CDT"
      case "referrals":
        return t("friends")
      default:
        return ""
    }
  }

  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <Header />

      <div className="max-w-md mx-auto px-4 pt-4">
        <h1 className="text-2xl font-bold mb-4 text-center">{t("rankings")}</h1>

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

        {/* Título del ranking actual */}
        <h2 className="text-xl font-semibold text-[#4ebd0a] mb-4">{getRankingTitle()}</h2>

        {/* Podio (Top 3) */}
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
            <div className="flex justify-center items-end mb-8">
              {rankings.length > 1 && (
                <div className="flex flex-col items-center mx-2">
                  <div className="w-16 h-16 rounded-full bg-gray-800 mb-2 flex items-center justify-center overflow-hidden">
                    <span className="text-xl font-bold">2</span>
                  </div>
                  <div className="h-20 w-20 bg-gray-800 rounded-t-lg flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm font-medium truncate max-w-16">@{rankings[1].username}</p>
                      <p className="text-xs text-[#4ebd0a]">
                        {rankings[1].value.toLocaleString()} {getRankingUnit()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {rankings.length > 0 && (
                <div className="flex flex-col items-center mx-2 -mt-4">
                  <div className="w-20 h-20 rounded-full bg-[#4ebd0a]/20 mb-2 flex items-center justify-center overflow-hidden border-2 border-[#4ebd0a]">
                    <span className="text-2xl font-bold text-[#4ebd0a]">1</span>
                  </div>
                  <div className="h-24 w-24 bg-[#4ebd0a]/20 rounded-t-lg flex items-center justify-center border-t-2 border-l-2 border-r-2 border-[#4ebd0a]">
                    <div className="text-center">
                      <p className="text-sm font-medium truncate max-w-20">@{rankings[0].username}</p>
                      <p className="text-xs text-[#4ebd0a] font-bold">
                        {rankings[0].value.toLocaleString()} {getRankingUnit()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {rankings.length > 2 && (
                <div className="flex flex-col items-center mx-2">
                  <div className="w-16 h-16 rounded-full bg-gray-800 mb-2 flex items-center justify-center overflow-hidden">
                    <span className="text-xl font-bold">3</span>
                  </div>
                  <div className="h-16 w-20 bg-gray-800 rounded-t-lg flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm font-medium truncate max-w-16">@{rankings[2].username}</p>
                      <p className="text-xs text-[#4ebd0a]">
                        {rankings[2].value.toLocaleString()} {getRankingUnit()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                    <div className="w-8 text-center font-bold text-gray-400">{user.position}</div>
                    <div className="flex-1 ml-4">
                      <p className={`font-medium ${user.isCurrentUser ? "text-[#4ebd0a]" : "text-white"}`}>
                        @{user.username}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-[#4ebd0a]">
                        {user.value.toLocaleString()} {getRankingUnit()}
                      </p>
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
                  <div className="w-8 text-center font-bold text-[#4ebd0a]">
                    {rankings.find((user) => user.isCurrentUser)?.position}
                  </div>
                  <div className="flex-1 ml-4">
                    <p className="font-medium text-white">@{rankings.find((user) => user.isCurrentUser)?.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-[#4ebd0a]">
                      {rankings.find((user) => user.isCurrentUser)?.value.toLocaleString()} {getRankingUnit()}
                    </p>
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
