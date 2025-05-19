"use client"

import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { useTranslation } from "../../../src/components/TranslationProvider"
import { PriceDisplay } from "./PriceDisplay"

interface WalletCardProps {
  stakedAmount: number
  cdtPrice: number | null
  priceChange: { isPositive: boolean }
  isUpdating: boolean
  updateSuccess: string | null
  updateError: string | null
  handleUpdateStakeAction: () => Promise<void>
  isProfileHovered: boolean
  setIsProfileHoveredAction: (value: boolean) => void
}

export const WalletCard: React.FC<WalletCardProps> = ({
  stakedAmount,
  cdtPrice,
  priceChange,
  isUpdating,
  updateSuccess,
  updateError,
  handleUpdateStakeAction,
  isProfileHovered,
  setIsProfileHoveredAction,
}) => {
  const { t } = useTranslation()

  return (
    <div className="mb-6 dashboard-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {/* Logo más grande sin texto */}
          <Image src="/TRIBO Wallet sin fondo.png" alt="TRIBO Wallet" width={60} height={60} className="mr-3" />
        </div>
        {/* Botón para ir a la página de perfil - Mejorado */}
        <Link
          href="/profile"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 bg-primary text-black shadow-md"
          onMouseEnter={() => setIsProfileHoveredAction(true)}
          onMouseLeave={() => setIsProfileHoveredAction(false)}
          onTouchStart={() => setIsProfileHoveredAction(true)}
          onTouchEnd={() => setIsProfileHoveredAction(false)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
            <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
          </svg>
          <span>{t("view_full_profile")}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 ${isProfileHovered ? "translate-x-0.5" : ""}`}
          >
            <path d="m9 18 6-6-6-6"></path>
          </svg>
        </Link>
      </div>

      <p className="text-gray-400 text-sm mb-2">{t("tokens_staked")}</p>
      <div className="flex items-center mb-4">
        <p className="text-3xl font-bold text-white">
          {stakedAmount.toLocaleString()} <span className="text-primary">CDT</span>
        </p>
      </div>

      {/* Componente separado para la sección de precio y estadísticas */}
      <PriceDisplay initialPrice={cdtPrice} stakedAmount={stakedAmount} priceChange={priceChange} />

      <button
        onClick={handleUpdateStakeAction}
        disabled={isUpdating}
        className="w-full px-4 py-3 rounded-full transition-all duration-300 bg-primary text-black font-medium shadow-md"
        aria-live="polite"
      >
        {isUpdating ? (
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
            {t("updating")}
          </span>
        ) : (
          t("update_balance")
        )}
      </button>

      {/* Mensaje de éxito para actualización de balance - Mejorado */}
      {updateSuccess && !updateError && !isUpdating && (
        <div className="mt-4 p-3 bg-black/70 border border-primary rounded-full animate-pulse">
          <p className="text-sm font-medium text-primary flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t("balance_updated")}
          </p>
        </div>
      )}

      {/* Mensaje de error para actualización de balance - Mejorado */}
      {updateError && !isUpdating && (
        <div className="mt-4 p-3 bg-black/70 border border-secondary rounded-full">
          <p className="text-sm font-medium text-secondary flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {t("error_updating")}
          </p>
          <p className="text-xs mt-1 text-secondary text-center">{updateError}</p>
        </div>
      )}
    </div>
  )
}
