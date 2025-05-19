"use client"

import type React from "react"
import { useTranslation } from "../../../src/components/TranslationProvider"

interface WelcomeGiftModalProps {
  showWelcomeGift: boolean
  isClaimingWelcomeGift: boolean
  welcomeGiftError: string | null
  handleClaimWelcomeGiftAction: () => Promise<void>
}

export const WelcomeGiftModal: React.FC<WelcomeGiftModalProps> = ({
  showWelcomeGift,
  isClaimingWelcomeGift,
  welcomeGiftError,
  handleClaimWelcomeGiftAction,
}) => {
  const { t } = useTranslation()

  if (!showWelcomeGift) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-gift-title"
    >
      <div className="bg-black/90 border border-primary rounded-xl shadow-lg p-6 max-w-md w-full animate-fadeIn">
        <h2 id="welcome-gift-title" className="text-2xl font-semibold mb-4 text-white">
          {t("welcome_gift_title")}
        </h2>
        <p className="text-gray-300 mb-6">{t("welcome_gift_description")}</p>

        <button
          onClick={handleClaimWelcomeGiftAction}
          disabled={isClaimingWelcomeGift}
          className="w-full px-4 py-3 rounded-full transition-all duration-300 bg-primary text-black font-medium shadow-md"
          aria-live="polite"
        >
          {isClaimingWelcomeGift ? t("claiming_welcome_gift") : t("claim_welcome_gift")}
        </button>

        {welcomeGiftError && (
          <div className="mt-4 p-3 bg-black/80 border border-secondary rounded-full">
            <p className="text-sm font-medium text-secondary text-center">{welcomeGiftError}</p>
          </div>
        )}
      </div>
    </div>
  )
}
