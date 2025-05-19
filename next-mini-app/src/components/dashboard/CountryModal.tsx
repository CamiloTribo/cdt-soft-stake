"use client"

import type React from "react"
import { useTranslation } from "../../../src/components/TranslationProvider"
import { CountrySelector } from "../../../src/components/CountrySelector"

interface CountryModalProps {
  showCountryModal: boolean
  country: string
  isUpdatingCountry: boolean
  countryUpdateError: string | null
  handleSaveCountryAction: (selectedCountry: string) => Promise<void>
  onCloseAction: () => void
}

export const CountryModal: React.FC<CountryModalProps> = ({
  showCountryModal,
  country,
  isUpdatingCountry,
  countryUpdateError,
  handleSaveCountryAction,
  onCloseAction,
}) => {
  const { t } = useTranslation()

  if (!showCountryModal) return null

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="country-select-title"
    >
      <div className="bg-black/90 border border-primary rounded-xl shadow-lg p-6 max-w-md w-full animate-fadeIn">
        <h2 id="country-select-title" className="text-2xl font-semibold mb-4 text-white">
          {t("select_country_title")}
        </h2>
        <p className="text-gray-300 mb-6">{t("select_country_description")}</p>

        <CountrySelector value={country} onChangeAction={(value) => handleSaveCountryAction(value)} className="mb-6" />

        {countryUpdateError && (
          <div className="mb-4 p-3 bg-black/80 border border-secondary rounded-full">
            <p className="text-sm font-medium text-secondary text-center">{countryUpdateError}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={onCloseAction}
            disabled={isUpdatingCountry}
            className="flex-1 px-4 py-3 rounded-full transition-all duration-300 bg-gray-800 text-white font-medium shadow-md"
          >
            {t("remind_later")}
          </button>
        </div>
      </div>
    </div>
  )
}
