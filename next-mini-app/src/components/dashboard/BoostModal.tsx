// next-mini-app/src/components/dashboard/BoostModal.tsx
"use client"

import { useState } from "react"
import Image from "next/image"
import { useWorldAuth } from "next-world-auth/react"
import { Tokens } from "next-world-auth"
import { useTranslation } from "../TranslationProvider"

// Definir interfaz para el resultado de pago
interface PaymentResult {
  success: boolean
  txHash?: string
  transactionHash?: string
  hash?: string
}

interface BoostModalProps {
  isOpen: boolean
  onCloseAction: () => void
  userLevel: number
  walletAddress: string
  username: string
  currentBoosts: number
  onPurchaseSuccessAction: () => void
}

export function BoostModal({
  isOpen,
  onCloseAction,
  userLevel,
  walletAddress,
  username,
  currentBoosts,
  onPurchaseSuccessAction,
}: BoostModalProps) {
  const { t } = useTranslation()
  const { pay } = useWorldAuth()
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [verifyingTransaction, setVerifyingTransaction] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Función para calcular precio del boost según nivel
  const getBoostPrice = (level: number): number => {
    const basePrices = [0.05, 0.5, 5, 10]
    const basePrice = basePrices[level] || basePrices[0]
    return basePrice * 0.5 // 50% de descuento
  }

  const boostPrice = getBoostPrice(userLevel)
  const totalPrice = boostPrice * quantity
  const maxQuantity = Math.min(7 - currentBoosts, 7)

  const handlePurchase = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Realizar el pago con World ID
      const result = (await pay({
        amount: totalPrice,
        token: Tokens.WLD,
        recipient: process.env.NEXT_PUBLIC_CENTRAL_WALLET || "0x8a89B684145849cc994be122ddEc5b268CAE0cB6",
      })) as PaymentResult

      console.log("Payment result:", result)

      // Verificar que el pago fue exitoso
      if (!result || !result.success) {
        console.log("Payment was cancelled or failed")
        setError(t("payment_cancelled_or_failed"))
        setIsLoading(false)
        return
      }

      // Extraer el hash de la transacción
      const txHash = result.txHash || result.transactionHash || result.hash

      if (!txHash) {
        console.error("No transaction hash received")
        setError(t("no_transaction_hash"))
        setIsLoading(false)
        return
      }

      console.log("Transaction hash:", txHash)

      // Cambiar a estado de verificación
      setVerifyingTransaction(true)
      setIsLoading(false)

      // Esperar un poco para que la transacción se propague
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Verificar la transacción
      const verifyResponse = await fetch("/api/verify-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ txHash }),
      })

      if (!verifyResponse.ok) {
        throw new Error("Failed to verify transaction")
      }

      const verifyData = await verifyResponse.json()
      console.log("Verification result:", verifyData)

      setVerifyingTransaction(false)

      // Solo proceder si la verificación fue exitosa
      if (verifyData.success && verifyData.isValid) {
        // Registrar compra en la base de datos
        const response = await fetch("/api/boosts/purchase", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet_address: walletAddress,
            username,
            quantity,
            price_paid: totalPrice,
            level: userLevel,
            transaction_hash: txHash,
          }),
        })

        const data = await response.json()

        if (data.success) {
          setPurchaseSuccess(true)
          setTimeout(() => {
            onPurchaseSuccessAction()
            onCloseAction()
          }, 2000)
        } else {
          setError(data.error || t("error_registering_purchase"))
        }
      } else {
        setError(t("transaction_verification_failed"))
      }
    } catch (error) {
      console.error("Error purchasing boost:", error)
      setError(t("error_processing_purchase"))
      setVerifyingTransaction(false)
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] border border-[#4ebd0a] rounded-xl p-6 max-w-md w-full">
        {!isLoading && !verifyingTransaction && !purchaseSuccess ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#4ebd0a]">{t("buy_boosts")}</h2>
              <button onClick={onCloseAction} className="text-gray-400 hover:text-white text-xl">
                ✕
              </button>
            </div>

            <div className="flex items-center justify-center mb-6">
              <Image src="/BOOSTER-TRIBER.png" alt="Boost Triber" width={120} height={120} />
            </div>

            <div className="mb-6">
              <p className="text-center text-gray-300 mb-4">{t("multiply_x2_next_rewards")}</p>

              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">{t("price_per_boost")}:</span>
                  <span className="text-[#4ebd0a] font-bold">
                    {boostPrice} WLD <span className="text-sm">({t("fifty_percent_off")})</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center text-xl disabled:opacity-50 hover:border-[#4ebd0a] transition-colors"
                >
                  -
                </button>
                <div className="text-2xl font-bold w-16 text-center">{quantity}</div>
                <button
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  disabled={quantity >= maxQuantity}
                  className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center text-xl disabled:opacity-50 hover:border-[#4ebd0a] transition-colors"
                >
                  +
                </button>
              </div>

              <div className="text-center mb-6">
                <p className="text-sm text-gray-300">{t("total_to_pay")}:</p>
                <p className="text-3xl font-bold text-[#4ebd0a]">{totalPrice.toFixed(3)} WLD</p>
              </div>

              <button
                onClick={handlePurchase}
                className="w-full bg-gradient-to-r from-[#4ebd0a] to-[#6dd00f] text-black font-bold py-3 px-6 rounded-full hover:shadow-lg hover:shadow-[#4ebd0a]/25 transition-all duration-300"
              >
                {t("confirm_purchase")}
              </button>

              <p className="text-xs text-gray-500 text-center mt-2">{t("max_7_boosts_per_wallet")}</p>
            </div>

            {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
          </>
        ) : verifyingTransaction ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4ebd0a]"></div>
            </div>
            <p className="text-gray-300">Verificando transacción en blockchain...</p>
            <p className="text-xs text-gray-500 mt-2">Esto puede tomar unos segundos</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4ebd0a]"></div>
            </div>
            <p className="text-gray-300">{t("processing_purchase")}</p>
            <p className="text-xs text-gray-500 mt-2">{t("dont_close_window")}</p>
          </div>
        ) : purchaseSuccess ? (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="relative animate-bounce">
                <Image src="/BOOSTER-TRIBER.png" alt="Boost Triber" width={150} height={150} />
                <div className="absolute -top-2 -right-2 bg-[#4ebd0a] text-black text-lg font-bold rounded-full w-10 h-10 flex items-center justify-center">
                  x2
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#4ebd0a] mb-2">{t("purchase_successful")}</h3>
            <p className="text-gray-300 mb-6">{t("acquired_boosts").replace("{quantity}", quantity.toString())}</p>
            <p className="text-sm text-gray-400">{t("next_rewards_multiplied")}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
