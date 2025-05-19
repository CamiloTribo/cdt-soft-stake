"use client"

import type React from "react"
import { useTranslation } from "../../../src/components/TranslationProvider"

interface ClaimSectionProps {
  timeRemaining: string
  nextClaimTime: Date | null
  realtimeRewards: number
  isClaiming: boolean
  areRewardsClaimable: boolean
  claimSuccess: string | null
  claimError: string | null
  handleClaimRewardsAction: () => Promise<void>
  formatDateAction: (date: Date) => string
}

export const ClaimSection: React.FC<ClaimSectionProps> = ({
  timeRemaining,
  nextClaimTime,
  realtimeRewards,
  isClaiming,
  areRewardsClaimable,
  claimSuccess,
  claimError,
  handleClaimRewardsAction,
  formatDateAction,
}) => {
  const { t } = useTranslation()

  return (
    <div className="mb-6 dashboard-card p-6">
      <h2 className="text-xl font-semibold mb-4 text-center text-primary">{t("next_claim")}</h2>

      {/* Botón de reclamar - Mejorado */}
      <button
        onClick={handleClaimRewardsAction}
        disabled={isClaiming || !areRewardsClaimable}
        className={`w-full px-4 py-4 rounded-full text-xl font-medium mb-5 transition-all duration-300 ${
          isClaiming
            ? "bg-gray-700 cursor-not-allowed"
            : !areRewardsClaimable
              ? "bg-primary text-white primary-button"
              : "bg-secondary hover:bg-secondary-hover hover:shadow-lg transform hover:-translate-y-0.5 secondary-button"
        }`}
        aria-live="polite"
      >
        {isClaiming ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {t("claiming")}
          </span>
        ) : !areRewardsClaimable ? (
          <span className="flex items-center justify-center font-mono text-2xl text-white">{timeRemaining}</span>
        ) : (
          t("claim_rewards")
        )}
      </button>

      {/* Fecha y barra de progreso - Mejorada */}
      {nextClaimTime ? (
        <div className="flex flex-col items-center mb-5">
          {/* Fecha del próximo claim */}
          <div className="text-sm text-gray-400 mb-3">
            {nextClaimTime ? formatDateAction(nextClaimTime) : t("date_not_available")}
          </div>

          <div className="w-full bg-gray-800 rounded-full h-3 mb-6 overflow-hidden">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${
                  nextClaimTime
                    ? Math.min(
                        100,
                        Math.max(
                          0,
                          100 - ((nextClaimTime.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)) * 100,
                        ),
                      )
                    : 0
                }%`,
              }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={
                nextClaimTime
                  ? Math.min(
                      100,
                      Math.max(
                        0,
                        100 - ((nextClaimTime.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)) * 100,
                      ),
                    )
                  : 0
              }
            ></div>
          </div>
        </div>
      ) : (
        <p className="text-xl mb-6 text-center text-white">{t("no_claims_yet")}</p>
      )}

      {/* Cantidad a reclamar - Mejorada */}
      <div className="text-center mb-5">
        <p className="text-lg text-gray-300 mb-2">{t("available_rewards")}</p>
        <p className="text-4xl font-bold text-primary rewards-counter">
          {realtimeRewards.toFixed(6)} <span className="text-white">CDT</span>
        </p>
      </div>

      {/* Mensajes de éxito/error para claim - Mejorados */}
      {claimSuccess && !claimError && !isClaiming && (
        <div className="mt-4 p-3 bg-black/80 border border-primary rounded-full animate-pulse">
          <p className="text-sm font-medium text-primary text-center">{claimSuccess}</p>
        </div>
      )}

      {claimError && !isClaiming && (
        <div className="mt-4 p-3 bg-black/80 border border-secondary rounded-full">
          <p className="text-sm font-medium text-secondary text-center">{t("error_claiming")}</p>
          <p className="text-xs mt-1 text-secondary text-center">{claimError}</p>
        </div>
      )}
    </div>
  )
}
