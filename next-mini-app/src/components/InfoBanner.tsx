"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "./TranslationProvider"

interface InfoBannerProps {
  // Días que el banner estará visible (por defecto 2 días)
  expirationDays?: number
}

export default function InfoBanner({ expirationDays = 2 }: InfoBannerProps) {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Comprobar si el banner ya ha sido cerrado o ha expirado
    const bannerStatus = localStorage.getItem("username_change_banner")
    const bannerTimestamp = localStorage.getItem("username_change_banner_timestamp")

    const shouldShow = () => {
      // Si el usuario ha cerrado el banner manualmente
      if (bannerStatus === "closed") return false

      // Si el banner tiene timestamp, comprobar si ha expirado
      if (bannerTimestamp) {
        const expirationTime = Number.parseInt(bannerTimestamp) + expirationDays * 24 * 60 * 60 * 1000
        if (Date.now() > expirationTime) {
          return false
        }
      }

      // En cualquier otro caso, mostrar el banner
      return true
    }

    // Si es la primera vez que se muestra, guardar timestamp
    if (!bannerTimestamp) {
      localStorage.setItem("username_change_banner_timestamp", Date.now().toString())
    }

    setIsVisible(shouldShow())
  }, [expirationDays])

  const closeBanner = () => {
    localStorage.setItem("username_change_banner", "closed")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="bg-[#4ebd0a]/10 border border-[#4ebd0a] rounded-lg p-4 mb-6 relative animate-fadeIn">
      <button
        onClick={closeBanner}
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
        aria-label="Cerrar"
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
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <h4 className="text-[#4ebd0a] font-medium mb-2">{t("username_changes_title")}</h4>
      <p className="text-sm text-gray-300">{t("username_changes_description")}</p>
    </div>
  )
}
