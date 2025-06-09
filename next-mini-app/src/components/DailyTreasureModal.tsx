"use client"

import { useState } from "react"
import Image from "next/image"
import { useTranslation } from "./TranslationProvider"

interface DailyTreasureModalProps {
  isOpen: boolean
  onClose: () => void
  onClaim: () => Promise<void>
  prizeAmount: number
  isLoading: boolean
  isSuccess: boolean
  error: string | null
}

export function DailyTreasureModal({
  isOpen,
  onClose,
  onClaim,
  prizeAmount,
  isLoading,
  isSuccess,
  error,
}: DailyTreasureModalProps) {
  const { t } = useTranslation()
  const [showConfetti, setShowConfetti] = useState(false)

  // Mostrar confeti cuando se reclama con éxito
  if (isSuccess && !showConfetti) {
    setShowConfetti(true)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-6 mx-4 bg-black border border-[#4ebd0a] rounded-xl shadow-lg overflow-hidden">
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label={t("close")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Contenido del modal */}
        <div className="flex flex-col items-center justify-center">
          {/* Imagen del tesoro */}
          <div className="mb-4">
            <Image
              src="/LOGO TRIBO Vault- sin fondo.png"
              alt="Tribo Treasure"
              width={80}
              height={80}
              className={`${isSuccess ? "animate-bounce" : "animate-pulse"}`}
            />
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold text-center text-white mb-2">
            {isSuccess ? t("treasure_claimed") : t("daily_treasure_found")}
          </h2>

          {/* Mensaje */}
          {!isSuccess && !error && <p className="text-center text-gray-300 mb-6">{t("daily_treasure_description")}</p>}

          {/* Premio */}
          {!isSuccess && !error && (
            <div className="flex items-center justify-center mb-6">
              <div className="bg-[#4ebd0a]/20 border border-[#4ebd0a] rounded-lg px-6 py-4">
                <p className="text-center text-gray-300 text-sm mb-1">{t("you_won")}</p>
                <p className="text-center text-3xl font-bold text-[#4ebd0a]">
                  {prizeAmount} <span className="text-xl">CDT</span>
                </p>
              </div>
            </div>
          )}

          {/* Mensaje de éxito */}
          {isSuccess && (
            <div className="text-center mb-6">
              <p className="text-gray-300 mb-2">{t("treasure_success_message")}</p>
              <p className="text-xl font-bold text-[#4ebd0a]">{prizeAmount} CDT</p>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="text-center mb-6">
              <p className="text-red-500">
                {error === "already_claimed" ? t("treasure_already_claimed") : t("treasure_claim_error")}
              </p>
            </div>
          )}

          {/* Botón de acción */}
          {!isSuccess && !error && (
            <button
              onClick={onClaim}
              disabled={isLoading}
              className={`w-full px-6 py-3 rounded-full ${
                isLoading ? "bg-gray-700 cursor-not-allowed" : "bg-[#4ebd0a] hover:bg-[#3fa008] text-black"
              } font-medium transition-colors shadow-lg`}
            >
              {isLoading ? t("claiming") : t("claim_treasure")}
            </button>
          )}

          {/* Botón de cerrar después de éxito o error */}
          {(isSuccess || error) && (
            <button
              onClick={onClose}
              className="w-full px-6 py-3 rounded-full bg-[#4ebd0a] hover:bg-[#3fa008] text-black font-medium transition-colors shadow-lg"
            >
              {t("continue")}
            </button>
          )}
        </div>

        {/* Confeti para celebración */}
        {showConfetti && (
          <div className="confetti-container">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
