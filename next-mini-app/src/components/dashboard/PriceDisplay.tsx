"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useTranslation } from "../../../src/components/TranslationProvider"

interface PriceDisplayProps {
  initialPrice: number | null
  stakedAmount: number
  priceChange: { isPositive: boolean }
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ initialPrice, stakedAmount, priceChange }) => {
  const { t } = useTranslation()
  const [price, setPrice] = useState<number | null>(initialPrice)

  useEffect(() => {
    setPrice(initialPrice)
  }, [initialPrice])

  // Calcular el valor en USD
  const calculateUsdValue = (amount: number): string => {
    if (!price) return "0.00"
    const value = amount * price
    return value.toFixed(2)
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400 text-sm">{t("current_price")}</p>
        <div className="flex items-center">
          <span
            className={`text-sm font-medium ${
              priceChange.isPositive ? "text-green-500" : "text-secondary"
            } flex items-center`}
          >
            {priceChange.isPositive ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12 13a1 1 0 110 2H7a1 1 0 01-1-1V9a1 1 0 112 0v2.586l4.293-4.293a1 1 0 011.414 0L16 9.586 20.293 5.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0L12 8.414l-3.293 3.293A1 1 0 018 12H7v3h5z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            24h
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <p className="text-xl font-bold text-white">
            ${price ? price.toFixed(6) : "0.000000"} <span className="text-primary">USD</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">{t("value")}</p>
          <p className="text-lg font-bold text-primary">${calculateUsdValue(stakedAmount)}</p>
        </div>
      </div>
    </div>
  )
}
