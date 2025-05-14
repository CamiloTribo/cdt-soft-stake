"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "./TranslationProvider"

interface CountryCounterProps {
  className?: string
}

export function CountryCounter({ className = "" }: CountryCounterProps) {
  const { t } = useTranslation()
  const [totalCountries, setTotalCountries] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCountryStats = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/country-stats")
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setTotalCountries(data.uniqueCountries)
          }
        }
      } catch (error) {
        console.error("Error fetching country stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCountryStats()
  }, [])

  return (
    <div className={`flex items-center bg-[#4ebd0a]/10 px-4 py-2 rounded-full border border-[#4ebd0a]/30 ${className}`}>
      <div className="h-8 w-8 flex items-center justify-center bg-[#4ebd0a]/20 rounded-full mr-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4ebd0a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      </div>
      <span className="text-gray-300 text-sm">
        {t("countries_using_app")}:{" "}
        <span className="text-[#4ebd0a] font-medium">
          {isLoading ? (
            <span className="inline-block w-8 h-4 bg-gray-700 animate-pulse rounded"></span>
          ) : (
            totalCountries?.toLocaleString() || "0"
          )}
        </span>
      </span>
    </div>
  )
}
