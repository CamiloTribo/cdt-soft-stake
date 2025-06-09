"use client"

import { useState } from "react"
import Image from "next/image"
import { MiniKit, Tokens, tokenToDecimals } from "@worldcoin/minikit-js"
import { useTranslation } from "../TranslationProvider"

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
  currentBoosts,
  onPurchaseSuccessAction,
}: BoostModalProps) {
  const { t } = useTranslation()
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedToken, setSelectedToken] = useState<'WLD' | 'USDCE'>('USDCE') // Default a USDC

  // Función para calcular precio original del boost según nivel
  const getOriginalPrice = (level: number): number => {
    if (level === 0) return 0.05
    if (level === 1) return 0.5 
    if (level === 2) return 5   
    if (level === 3) return 10  
    return 0.05
  }

  // Función para calcular precio con descuento
  const getBoostPrice = (level: number): number => {
    if (level === 0) return 0.045
    if (level === 1) return 0.123
    if (level === 2) return 1.23
    if (level === 3) return 7
    return 0.045
  }

  // Función para convertir precio WLD a USDC (aproximadamente 1 WLD = 2 USDC)
  const convertToUSDC = (wldPrice: number): number => {
    return wldPrice * 2 // Ajusta esta tasa según el precio real
  }

  // Función para obtener el porcentaje de descuento según el nivel
  const getDiscountPercentage = (level: number): number => {
    const originalPrice = getOriginalPrice(level);
    const boostPrice = getBoostPrice(level);
    if (originalPrice === 0) return 0;
    return Math.round(((originalPrice - boostPrice) / originalPrice) * 100);
  }

  const boostPriceWLD = getBoostPrice(userLevel)
  const originalPriceWLD = getOriginalPrice(userLevel)
  
  // Precios en la moneda seleccionada
  const boostPrice = selectedToken === 'WLD' ? boostPriceWLD : convertToUSDC(boostPriceWLD)
  const originalPrice = selectedToken === 'WLD' ? originalPriceWLD : convertToUSDC(originalPriceWLD)
  
  const totalPrice = boostPrice * quantity
  const totalOriginalPrice = originalPrice * quantity
  const maxQuantity = Math.min(7 - currentBoosts, 7)
  const discountPercentage = getDiscountPercentage(userLevel)

  const handlePurchase = async () => {
    try {
      console.log("🚀 BOOST: Iniciando proceso de compra de boost")
      setIsLoading(true)
      setError(null)

      // Crear referencia de pago
      const res = await fetch("/api/initiate-payment", {
        method: "POST",
      })
      const { id } = await res.json()

      const amountToPay = parseFloat(totalPrice.toFixed(5));

      console.log(`💰 BOOST: Iniciando pago con ${selectedToken}, cantidad:`, amountToPay)

      // Usar MiniKit.commandsAsync.pay con múltiples opciones
      const result = await MiniKit.commandsAsync.pay({
        reference: id,
        to: process.env.NEXT_PUBLIC_CENTRAL_WALLET || "0x8a89B684145849cc994be122ddEc5b268CAE0cB6",
        tokens: [
          {
            symbol: selectedToken === 'WLD' ? Tokens.WLD : Tokens.USDCE,
            token_amount: tokenToDecimals(amountToPay, selectedToken === 'WLD' ? Tokens.WLD : Tokens.USDCE).toString(),
          }
        ],
        description: `Boost purchase - ${quantity} boost(s)`,
      })

      console.log("💰 BOOST: Resultado del pago:", result.finalPayload)

      if (!result.finalPayload || result.finalPayload.status === 'error') {
        console.log("❌ BOOST: Pago cancelado o fallido")
        setError(t("payment_cancelled_or_failed"))
        setIsLoading(false)
        return
      }
      
      console.log("🎁 BOOST: Pago exitoso, procediendo a registrar la compra del boost")
      
      const response = await fetch("/api/boosts/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: walletAddress,
          quantity,
          level: userLevel,
          paymentReference: id,
          token: selectedToken,
          amount: amountToPay
        }),
      })

      const data = await response.json()
      console.log("🎁 BOOST: Respuesta del registro de compra:", data)

      if (data.success) {
        console.log("✅ BOOST: Compra registrada exitosamente!")
        setPurchaseSuccess(true)
        setTimeout(() => {
          onPurchaseSuccessAction()
          onCloseAction()
        }, 2000)
      } else {
        console.error("❌ BOOST: Error al registrar la compra:", data.error)
        setError(data.error || t("error_registering_purchase"))
      }
    } catch (error) {
      console.error("❌ BOOST: Error en el proceso de compra:", error)
      setError(t("error_processing_purchase"))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const formatPrice = (price: number): string => {
    if (Number.isInteger(price)) {
      return price.toString();
    }
    let formattedPrice = price.toFixed(selectedToken === 'USDCE' ? 2 : 3);
    formattedPrice = formattedPrice.replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
    return formattedPrice;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] border border-[#4ebd0a] rounded-xl p-6 max-w-md w-full">
        {!isLoading && !purchaseSuccess ? (
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

              {/* Selector de método de pago */}
              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <p className="text-gray-300 mb-3 text-sm">{t("payment_method") || "Método de pago"}:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedToken('USDCE')}
                    className={`flex-1 p-3 rounded-lg border transition-all ${
                      selectedToken === 'USDCE' 
                        ? 'border-[#4ebd0a] bg-[#4ebd0a]/10 text-[#4ebd0a]' 
                        : 'border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg">💵</div>
                      <div className="text-sm font-medium">USDC</div>
                      <div className="text-xs opacity-75">Estable</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedToken('WLD')}
                    className={`flex-1 p-3 rounded-lg border transition-all ${
                      selectedToken === 'WLD' 
                        ? 'border-[#4ebd0a] bg-[#4ebd0a]/10 text-[#4ebd0a]' 
                        : 'border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg">🌍</div>
                      <div className="text-sm font-medium">WLD</div>
                      <div className="text-xs opacity-75">Worldcoin</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">{t("price_per_boost")}:</span>
                  <span className="text-[#4ebd0a] font-bold">
                    <span className="line-through text-gray-500 mr-2">
                      {formatPrice(originalPrice)} {selectedToken === 'USDCE' ? 'USDC' : 'WLD'}
                    </span>
                    {formatPrice(boostPrice)} {selectedToken === 'USDCE' ? 'USDC' : 'WLD'}
                    {discountPercentage > 0 && (
                       <span className="text-sm text-[#ff1744] ml-1">({discountPercentage}% {t("off")})</span>
                    )}
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
                  disabled={quantity >= maxQuantity || quantity >= 7}
                  className="w-10 h-10 rounded-full border border-gray-600 flex items-center justify-center text-xl disabled:opacity-50 hover:border-[#4ebd0a] transition-colors"
                >
                  +
                </button>
              </div>

              <div className="text-center mb-6">
                <p className="text-sm text-gray-300">{t("total_to_pay")}:</p>
                <p className="text-3xl font-bold text-[#4ebd0a]">
                  <span className="line-through text-gray-500 text-xl mr-2">
                    {formatPrice(totalOriginalPrice)} {selectedToken === 'USDCE' ? 'USDC' : 'WLD'}
                  </span>
                  {formatPrice(totalPrice)} {selectedToken === 'USDCE' ? 'USDC' : 'WLD'}
                </p>
              </div>

              <button
                onClick={handlePurchase}
                disabled={isLoading || maxQuantity === 0}
                className="w-full bg-gradient-to-r from-[#4ebd0a] to-[#6dd00f] text-black font-bold py-3 px-6 rounded-full hover:shadow-lg hover:shadow-[#4ebd0a]/25 transition-all duration-300 disabled:opacity-50"
              >
                {maxQuantity === 0 ? t("limit_reached_short") : t("confirm_purchase")}
              </button>

              <p className="text-xs text-gray-500 text-center mt-2">{t("max_7_boosts_per_wallet")}</p>
            </div>

            {error && <div className="text-red-500 text-sm text-center mt-2">{error}</div>}
          </>
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