"use client"

import React, { useMemo } from "react"
import Image from "next/image"
import { useTranslation } from "../../../src/components/TranslationProvider"

interface PriceDisplayProps {
  initialPrice: number | null
  stakedAmount: number
  priceChange: { isPositive: boolean }
}

export const PriceDisplay = React.memo(({ initialPrice, stakedAmount, priceChange }: PriceDisplayProps) => {
  const { t } = useTranslation()

  // Memoizar el valor formateado del precio
  const formattedPrice = useMemo(() => {
    return initialPrice !== null ? initialPrice.toFixed(9) : "0.000000000"
  }, [initialPrice])

  // Calcular el valor estimado en USD
  const calculateUsdValue = useMemo(() => {
    if (initialPrice && stakedAmount) {
      return (initialPrice * stakedAmount).toFixed(2)
    }
    return "0.00"
  }, [initialPrice, stakedAmount])

  // Calcular las ganancias anuales estimadas
  const yearlyEarnings = useMemo(() => {
    return Math.round(stakedAmount * 0.44)
  }, [stakedAmount])

  return (
    <>
      {/* Estadísticas adicionales con diseño mejorado */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/60 p-4 rounded-xl border border-gray-800 transition-all hover:border-gray-700 hover:bg-black/70">
          <p className="text-xs text-gray-400 mb-1">{t("estimated_value")}</p>
          <p className="text-lg font-semibold text-white">
            <span className="text-primary">$</span>
            {calculateUsdValue} <span className="text-xs text-gray-400">USD</span>
          </p>
        </div>
        <div className="bg-black/60 p-4 rounded-xl border border-gray-800 transition-all hover:border-gray-700 hover:bg-black/70">
          <p className="text-xs text-gray-400 mb-1">{t("yearly_earnings")}</p>
          <p className="text-lg font-semibold text-white">
            <span className="text-primary">+</span>
            {yearlyEarnings.toLocaleString()} <span className="text-xs text-gray-400">CDT</span>
          </p>
        </div>
      </div>

      {/* Sección de precio con diseño mejorado */}
      <div className="flex items-center justify-between mb-6 bg-black/60 p-4 rounded-xl border border-gray-800 transition-all hover:border-gray-700 hover:bg-black/70">
        <div>
          <p className="text-xs text-gray-400 mb-1">{t("current_price")}</p>
          <div className="flex items-center">
            <p className="text-lg font-semibold text-white" style={{ fontFamily: "Helvetica Neue, sans-serif" }}>
              <span className="text-primary">$</span>
              <span>{formattedPrice}</span>
            </p>
            <span className={`ml-2 ${priceChange.isPositive ? "text-green-500" : "text-red-500"}`}>
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
                {priceChange.isPositive ? (
                  <path d="m18 15-6-6-6 6" /> // Flecha hacia arriba
                ) : (
                  <path d="m6 9 6 6 6-6" /> // Flecha hacia abajo
                )}
              </svg>
            </span>
          </div>
        </div>
        <div className="h-10 w-10 flex items-center justify-center">
          <Image src="/TOKEN CDT.png" alt="CDT Token" width={24} height={24} className="rounded-full" />
        </div>
      </div>
    </>
  )
})

PriceDisplay.displayName = "PriceDisplay"
