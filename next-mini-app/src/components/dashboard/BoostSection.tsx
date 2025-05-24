// next-mini-app/src/components/dashboard/BoostSection.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { BoostModal } from "./BoostModal"
import { useTranslation } from "../TranslationProvider"

interface BoostSectionProps {
  userLevel: number
  walletAddress: string
  username: string
  hasBoost: boolean
}

export function BoostSection({ userLevel, walletAddress, username, hasBoost }: BoostSectionProps) {
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)
  const [availableBoosts, setAvailableBoosts] = useState(0)
  const [loading, setLoading] = useState(true)

  // Función para obtener boosts disponibles
  const fetchAvailableBoosts = useCallback(async () => {
    try {
      console.log("🔍 BOOST SECTION: Obteniendo boosts disponibles para:", walletAddress)
      const response = await fetch(`/api/boosts/available?wallet_address=${walletAddress}`)
      const data = await response.json()

      if (data.success) {
        console.log("✅ BOOST SECTION: Boosts disponibles:", data.available_boosts)
        setAvailableBoosts(data.available_boosts)
      }
    } catch (error) {
      console.error("❌ BOOST SECTION: Error fetching available boosts:", error)
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  useEffect(() => {
    if (walletAddress) {
      fetchAvailableBoosts()
    }
  }, [walletAddress, fetchAvailableBoosts])

  // Función para calcular precio del boost según nivel
  const getBoostPrice = (level: number): number => {
    const basePrices = [0.05, 0.5, 5, 10] // Precios base por nivel
    const basePrice = basePrices[level] || basePrices[0]
    return basePrice * 0.5 // 50% de descuento
  }

  const levelNames = [t("tribers"), t("cryptotribers"), t("millotribers"), t("legendarytribers")]
  const currentLevelName = levelNames[userLevel] || t("tribers")
  const boostPrice = getBoostPrice(userLevel)

  const handleOpenModal = () => {
    console.log("🚀 BOOST SECTION: Abriendo modal de compra de boost")
    setShowModal(true)
  }

  return (
    <>
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] border border-[#4ebd0a]/30 rounded-xl p-6 relative overflow-hidden">
        {/* Efectos de fondo */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#4ebd0a]/5 to-transparent"></div>

        {/* Contenido principal */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`relative ${hasBoost ? "animate-pulse" : ""}`}>
                <Image
                  src="/BOOSTER-TRIBER.png"
                  alt="Booster Triber"
                  width={60}
                  height={60}
                  className="drop-shadow-lg"
                />
                {hasBoost && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#4ebd0a] rounded-full animate-ping"></div>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#4ebd0a] flex items-center">
                  🚀 {t("boost_your_power")}
                  {hasBoost && (
                    <span className="ml-2 text-sm bg-[#4ebd0a] text-black px-2 py-1 rounded-full">{t("active")}</span>
                  )}
                </h3>
                <p className="text-gray-400 text-sm">{t("multiply_x2_rewards")}</p>
              </div>
            </div>
          </div>

          {/* Información de boosts */}
          <div className="bg-black/30 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">{t("available_boosts")}:</span>
              {loading ? (
                <div className="animate-spin w-4 h-4 border-2 border-[#4ebd0a] border-t-transparent rounded-full"></div>
              ) : (
                <span className="text-[#4ebd0a] font-bold text-lg">{availableBoosts}/7</span>
              )}
            </div>

            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[#4ebd0a] to-[#6dd00f] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(availableBoosts / 7) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Información de precio */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-400">
                {t("price_for")} {currentLevelName}:
              </p>
              <p className="text-lg font-bold text-white">
                {boostPrice} WLD
                <span className="text-sm text-[#4ebd0a] ml-2">{t("fifty_percent_off")}</span>
              </p>
            </div>

            {/* BOTÓN ACTIVADO */}
            {availableBoosts < 7 && (
              <button
                onClick={handleOpenModal}
                className="bg-[#4ebd0a] hover:bg-[#3da008] text-black font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {t("buy_boost")}
              </button>
            )}
          </div>

          {/* Mensaje si ya tiene el máximo */}
          {availableBoosts >= 7 && (
            <div className="text-center py-2">
              <p className="text-[#4ebd0a] font-medium">{t("weekly_limit_reached")}</p>
              <p className="text-gray-400 text-sm">{t("use_boosts_next_week")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal activado */}
      {showModal && (
        <BoostModal
          isOpen={showModal}
          onCloseAction={() => setShowModal(false)}
          userLevel={userLevel}
          walletAddress={walletAddress}
          username={username}
          currentBoosts={availableBoosts}
          onPurchaseSuccessAction={fetchAvailableBoosts}
        />
      )}
    </>
  )
}
