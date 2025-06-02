"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { useWorldAuth } from "next-world-auth/react"
import { Tokens } from "next-world-auth"
import { useTranslation } from "../TranslationProvider"
import { showCDTEffect } from "../../utils/cdtEffects"
import type { PackageType } from "./CdtPackageSection"
// Corregida la ruta de importación:
import type { TranslationKey } from "../../types/translations"

interface PackageConfig {
  wldAmount: number
  cdtBase: number
  cdtBonus: number
  totalCdt: number
  imageSrc: string
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  numberOnBox: string
  claimCdtKey: TranslationKey
  boxAltKey: TranslationKey
}

interface CdtPackageModalProps {
  isOpen: boolean
  onCloseAction: () => void
  walletAddress: string
  username: string
  packageType: PackageType
}

export function CdtPackageModal({
  isOpen,
  onCloseAction,
  walletAddress,
  username,
  packageType,
}: CdtPackageModalProps) {
  const { t } = useTranslation()
  const { pay } = useWorldAuth()
  // ... (estados sin cambios)
  const [isLoading, setIsLoading] = useState(false)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const [claimReady, setClaimReady] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [purchaseId, setPurchaseId] = useState<string | null>(null)

  const packageDetails: Record<PackageType, PackageConfig> = useMemo(() => ({
    basic: {
      wldAmount: 0.1,
      cdtBase: 50,
      cdtBonus: 0,
      totalCdt: 50,
      imageSrc: "/BOX_TRIBO VAULT_CDT.png",
      titleKey: "buy_cdt_package", 
      descriptionKey: "get_cdt_instantly_desc", 
      numberOnBox: "50",
      claimCdtKey: "claim_50_cdt", 
      boxAltKey: "cdt_package_box_alt_basic", 
    },
    premium: {
      wldAmount: 1.0,
      cdtBase: 500,
      cdtBonus: 100,
      totalCdt: 600,
      imageSrc: "/BOX_TRIBO_PREMIUM.png",
      titleKey: "buy_premium_package_title", 
      descriptionKey: "premium_package_desc", 
      numberOnBox: "600",
      claimCdtKey: "claim_600_cdt", 
      boxAltKey: "cdt_package_box_alt_premium", 
    },
  }), []);

  const currentPackage = packageDetails[packageType];

  useEffect(() => {
    if (isOpen) {
      setIsLoading(false);
      setPurchaseSuccess(false);
      setClaimReady(false);
      setIsClaiming(false);
      setClaimSuccess(false);
      setError(null);
      setPurchaseId(null);
    }
  }, [isOpen, packageType]);

  // ... (handlePurchase y handleClaim sin cambios lógicos, solo usan currentPackage)
  const handlePurchase = async () => {
    if (!currentPackage) return;

    try {
      console.log(`🚀 CDT: Iniciando proceso de compra de paquete ${packageType}`)
      setIsLoading(true)
      setError(null)

      if (!walletAddress || !username) {
        console.error("❌ CDT: Datos de usuario faltantes")
        setError(t("missing_user_data"))
        setIsLoading(false)
        return
      }

      console.log("💰 CDT: Iniciando pago con World ID, cantidad:", currentPackage.wldAmount, "WLD")
      const { finalPayload } = await pay({
        amount: currentPackage.wldAmount,
        token: Tokens.WLD,
        recipient: process.env.NEXT_PUBLIC_CENTRAL_WALLET || "0x8a89B684145849cc994be122ddEc5b268CAE0cB6",
      })

      console.log("💰 CDT: Resultado del pago:", finalPayload)

      if (!finalPayload || finalPayload.status === "error") {
        console.log("❌ CDT: Pago cancelado o fallido")
        setError(t("payment_cancelled_or_failed"))
        setIsLoading(false)
        return
      }
      
      console.log("🎁 CDT: Pago exitoso, procediendo a registrar la compra")
      const response = await fetch("/api/cdt/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: walletAddress,
          username: username,
          wldAmount: currentPackage.wldAmount,
          cdtAmount: currentPackage.totalCdt,
        }),
      })

      const data = await response.json()
      console.log("🎁 CDT: Respuesta del registro de compra:", data)

      if (data.success) {
        console.log("✅ CDT: Compra registrada exitosamente!")
        setPurchaseSuccess(true)
        setPurchaseId(data.purchase?.id)
        setClaimReady(true)
      } else {
        console.error("❌ CDT: Error al registrar la compra:", data.error)
        setError(data.error || t("error_registering_purchase"))
      }
    } catch (error) {
      console.error("❌ CDT: Error en el proceso de compra:", error)
      setError(t("error_processing_purchase"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaim = async () => {
    if (!purchaseId || !currentPackage) {
      setError(t("no_purchase_id"))
      return
    }

    try {
      setIsClaiming(true)
      setError(null)
      console.log(`🎁 CDT: Usuario ${username} reclamando compra ${purchaseId} del paquete ${packageType}`)
      const response = await fetch("/api/cdt/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: walletAddress,
          purchaseId: purchaseId,
        }),
      })
      const data = await response.json()
      if (data.success) {
        console.log("✅ CDT: Reclamación exitosa:", data)
        setClaimSuccess(true)
        showCDTEffect()
        setTimeout(() => {
          onCloseAction()
        }, 3000)
      } else {
        console.error("❌ CDT: Error al reclamar:", data.error)
        setError(data.error || t("error_claiming_cdt"))
      }
    } catch (error) {
      console.error("❌ CDT: Error al reclamar:", error)
      setError(t("error_claiming_cdt"))
    } finally {
      setIsClaiming(false)
    }
  }


  if (!isOpen || !currentPackage) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] border border-secondary rounded-xl p-6 max-w-md w-full relative overflow-hidden">
        {!isLoading && !purchaseSuccess ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-secondary">{t(currentPackage.titleKey)}</h2>
              <button onClick={onCloseAction} className="text-gray-400 hover:text-white text-xl">
                ✕
              </button>
            </div>

            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Image 
                  src={currentPackage.imageSrc || "/placeholder.svg"} 
                  alt={t(currentPackage.boxAltKey)} 
                  width={120} 
                  height={120} 
                />
                <div className={`absolute top-0 right-0 bg-secondary text-white text-lg font-bold rounded-full w-auto min-w-[2.5rem] h-10 flex items-center justify-center px-2`}>
                  {currentPackage.numberOnBox}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-center text-gray-300 mb-4">{t(currentPackage.descriptionKey)}</p>
              {packageType === 'premium' && currentPackage.cdtBonus > 0 && (
                <p className="text-center text-green-400 font-bold mb-4">
                  {/* Linea 232: defaultValue eliminado */}
                  {t("premium_bonus_text")} {currentPackage.cdtBonus} {t("cdt_free_gift_suffix")}
                </p>
              )}

              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">{t("price")}:</span>
                  <span className="text-secondary font-bold">{currentPackage.wldAmount.toFixed(1)} WLD</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">{t("you_receive")}:</span>
                  <span className="text-secondary font-bold">{currentPackage.totalCdt} CDT</span>
                </div>
              </div>

              <button
                onClick={handlePurchase}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-secondary to-[#ff4081] text-white font-bold py-3 px-6 rounded-full hover:shadow-lg hover:shadow-secondary/25 transition-all duration-300 disabled:opacity-50"
              >
                {t("confirm_purchase")}
              </button>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}
          </>
        // ... (resto del JSX sin cambios lógicos, solo las correcciones en t() )
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
            </div>
            <p className="text-gray-300">{t("processing_purchase")}</p>
            <p className="text-xs text-gray-500 mt-2">{t("dont_close_window")}</p>
          </div>
        ) : purchaseSuccess && claimReady && !claimSuccess ? (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Image 
                  src={currentPackage.imageSrc || "/placeholder.svg"} 
                  alt={t(currentPackage.boxAltKey)} 
                  width={150} 
                  height={150} 
                />
                <div className={`absolute top-0 right-0 bg-secondary text-white text-lg font-bold rounded-full w-auto min-w-[3rem] h-12 flex items-center justify-center px-2 animate-pulse`}>
                  {currentPackage.numberOnBox}
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-secondary mb-2">{t("purchase_successful")}</h3>
            <p className="text-gray-300 mb-6">{t("claim_your_cdt_now")}</p>

            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full bg-gradient-to-r from-secondary to-[#ff4081] text-white font-bold py-3 px-6 rounded-full hover:shadow-lg hover:shadow-secondary/25 transition-all duration-300 disabled:opacity-50"
            >
              {isClaiming ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("claiming")}
                </span>
              ) : (
                t(currentPackage.claimCdtKey)
              )}
            </button>

            {error && (
              <div className="text-red-500 text-sm text-center mt-4 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}
          </div>
        ) : claimSuccess ? (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="relative animate-bounce">
                <Image 
                  src={currentPackage.imageSrc || "/placeholder.svg"} 
                  alt={t(currentPackage.boxAltKey)} 
                  width={150} 
                  height={150} 
                />
                <div className={`absolute top-0 right-0 bg-secondary text-white text-lg font-bold rounded-full w-auto min-w-[3rem] h-12 flex items-center justify-center px-2`}>
                  +{currentPackage.totalCdt}
                </div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-secondary mb-2">{t("cdt_claimed")}</h3>
            {/* Linea 351: defaultValue eliminado */}
            <p className="text-gray-300 mb-2">{currentPackage.totalCdt} {t("cdt_added_to_balance_suffix")}</p>
            <p className="text-sm text-gray-400">{t("enjoy_your_cdt")}</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}