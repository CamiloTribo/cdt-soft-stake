"use client"

import type React from "react"
import { useTranslation } from "../../../src/components/TranslationProvider"

interface SupportSectionProps {
  isSendingCDT: boolean
  txHash: string | null
  txError: string | null
  handleSendCDTAction: () => Promise<void>
}

export const SupportSection: React.FC<SupportSectionProps> = ({
  isSendingCDT,
  txHash,
  txError,
  handleSendCDTAction,
}) => {
  const { t } = useTranslation()

  return (
    <div className="mb-6">
      <div className="dashboard-card p-6">
        <h2 className="text-xl font-semibold mb-2 text-primary">{t("support_project")}</h2>
        <p className="text-gray-400 text-sm mb-4">{t("support_help")}</p>
        <button
          onClick={handleSendCDTAction}
          disabled={isSendingCDT}
          className="w-full px-4 py-3 rounded-full transition-all duration-300 bg-secondary text-white font-medium shadow-md"
          aria-live="polite"
        >
          {isSendingCDT ? t("processing") : t("support_with").replace("0.023", "0.23")}
        </button>

        {txHash && !txError && isSendingCDT === false && (
          <div className="mt-4 p-3 bg-black/70 border border-primary rounded-full animate-pulse">
            <p className="text-sm font-medium text-primary text-center">{txHash}</p>
          </div>
        )}

        {txError && !isSendingCDT && (
          <div className="mt-4 p-3 bg-black/70 border border-secondary rounded-full">
            <p className="text-sm font-medium text-secondary text-center">{t("error_sending")}</p>
            <p className="text-xs mt-1 text-secondary text-center">{txError}</p>
          </div>
        )}
      </div>
    </div>
  )
}
