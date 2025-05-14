"use client"

import React from "react"

import Image from "next/image"
import { useWorldAuth } from "next-world-auth/react"
import { Tokens } from "next-world-auth"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useTranslation } from "../../../src/components/TranslationProvider"
import Link from "next/link"

// Corregir la ruta de importación para que apunte a src/components
import CdtRain from "../../../src/components/CdtRain"
import CdtButtonRain from "../../../src/components/CdtButtonRain"

// Función para generar el enlace a UNO con parámetros específicos para swap
function getUnoDeeplinkUrl() {
  const UNO_APP_ID = "app_a4f7f3e62c1de0b9490a5260cb390b56"
  const CDT_TOKEN_ADDRESS = "0x3Cb880f7ac84950c369e700deE2778d023b0C52d"
  const WLD_TOKEN_ADDRESS = "0x2cFc85d8E48F8EAB294be644d9E25C3030863003"

  // Configurar para comprar CDT con WLD (toToken=CDT, fromToken=WLD)
  let path = `?tab=swap&fromToken=${WLD_TOKEN_ADDRESS}&toToken=${CDT_TOKEN_ADDRESS}`

  // Añadir referrerAppId si está disponible
  if (process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID) {
    path += `&referrerAppId=${process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID}`
  }

  const encodedPath = encodeURIComponent(path)
  return `https://worldcoin.org/mini-app?app_id=${UNO_APP_ID}&path=${encodedPath}`
}

// Componente PriceDisplay con flecha de dirección pero sin porcentaje
const PriceDisplay = React.memo(
  ({
    initialPrice,
    stakedAmount,
    priceChange,
  }: {
    initialPrice: number | null
    stakedAmount: number
    priceChange: { isPositive: boolean }
  }) => {
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
        {/* Estadísticas adicionales con diseño simplificado */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-black p-4 rounded-xl border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">{t("estimated_value")}</p>
            <p className="text-lg font-semibold text-white">
              <span className="text-[#4ebd0a]">$</span>
              {calculateUsdValue} <span className="text-xs text-gray-400">USD</span>
            </p>
          </div>
          <div className="bg-black p-4 rounded-xl border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">{t("yearly_earnings")}</p>
            <p className="text-lg font-semibold text-white">
              <span className="text-[#4ebd0a]">+</span>
              {yearlyEarnings.toLocaleString()} <span className="text-xs text-gray-400">CDT</span>
            </p>
          </div>
        </div>

        {/* Sección de precio con diseño simplificado */}
        <div className="flex items-center justify-between mb-6 bg-black p-3 rounded-xl border border-gray-800">
          <div>
            <p className="text-xs text-gray-400 mb-1">{t("current_price")}</p>
            <div className="flex items-center">
              <p className="text-lg font-semibold text-white" style={{ fontFamily: "Helvetica Neue, sans-serif" }}>
                <span className="text-[#4ebd0a]">$</span>
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
  },
)

PriceDisplay.displayName = "PriceDisplay"

export default function Dashboard() {
  const { t } = useTranslation()
  const [stakedAmount, setStakedAmount] = useState(0)
  const [pendingRewards, setPendingRewards] = useState(0)
  const [lastClaimDate, setLastClaimDate] = useState<Date | null>(null)
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [username, setUsername] = useState("")
  // Estado para el precio y su dirección
  const [cdtPrice, setCdtPrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState<{ isPositive: boolean }>({
    isPositive: true,
  })
  // Estado para el total claimed
  const [totalClaimed, setTotalClaimed] = useState(0)

  // Estado para controlar si es la primera visita
  const [isFirstVisit, setIsFirstVisit] = useState(false)

  // Estados para los botones de prueba
  const [isSendingCDT, setIsSendingCDT] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txError, setTxError] = useState<string | null>(null)

  // Estado para los botones con hover
  const [isBuyButtonHovered, setIsBuyButtonHovered] = useState(false)
  const [isDiscordHovered, setIsDiscordHovered] = useState(false)
  const [isSwapButtonHovered, setIsSwapButtonHovered] = useState(false)
  const [isProfileHovered, setIsProfileHovered] = useState(false)
  const [isReferralBannerHovered, setIsReferralBannerHovered] = useState(false)
  const [isDailyGiveawayHovered, setIsDailyGiveawayHovered] = useState(false)

  // También necesitamos añadir los estados para el hover de los nuevos botones.
  const [isTelegramHovered, setIsTelegramHovered] = useState(false)
  const [isTwitterHovered, setIsTwitterHovered] = useState(false)

  // Estados para mensajes de claim y update
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Añadir un nuevo estado para controlar la animación
  const [showCdtRain, setShowCdtRain] = useState(false)

  const { session, pay } = useWorldAuth()
  const translationValues = useTranslation() // Use a different name to avoid shadowing
  const { t: translation } = translationValues

  // Función para obtener un identificador único del usuario
  const getUserIdentifier = useCallback(() => {
    if (!session || !session.user || !session.user.walletAddress) return null
    return session.user.walletAddress
  }, [session])

  // Verificar si es la primera visita después de registrarse
  useEffect(() => {
    const checkFirstVisit = async () => {
      const identifier = getUserIdentifier()
      if (!identifier || !username) return

      const firstVisitKey = `tribo-first-visit-${identifier}`
      const hasVisitedBefore = localStorage.getItem(firstVisitKey)

      if (!hasVisitedBefore) {
        setIsFirstVisit(true)
        // Marcar como visitado para futuras sesiones
        localStorage.setItem(firstVisitKey, "true")
      }
    }

    if (username) {
      checkFirstVisit()
    }
  }, [username, getUserIdentifier])

  // Función para formatear el tiempo restante
  const formatTimeRemaining = useCallback(
    (targetDate: Date) => {
      const now = new Date()
      const diffMs = targetDate.getTime() - now.getTime()

      if (diffMs <= 0) {
        // Usar la clave "rewards_ready" para cuando las recompensas están listas
        return translation("rewards_ready")
      }

      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000)

      return `${diffHrs.toString().padStart(2, "0")}:${diffMins.toString().padStart(2, "0")}:${diffSecs.toString().padStart(2, "0")}`
    },
    [translation],
  )

  // Función para formatear fecha
  const formatDate = (date: Date) => {
    const day = date.toLocaleDateString("es-ES", { day: "2-digit" })
    const month = date.toLocaleDateString("es-ES", { month: "2-digit" })
    const year = date.toLocaleDateString("es-ES", { year: "numeric" })
    const hour = date.toLocaleTimeString("es-ES", { hour: "2-digit", hour12: false })
    const minute = date.toLocaleTimeString("es-ES", { minute: "2-digit" })

    return `${day}/${month}/${year} ${hour}:${minute}`
  }

  // Función para obtener el precio del token
  const fetchTokenPrice = useCallback(async () => {
    try {
      console.log("Obteniendo precio del token en vivo...")
      const response = await fetch("/api/token-price", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(t("error_updating"))
      }

      const data = await response.json()
      console.log("Respuesta de la API token-price:", data)

      if (data.success) {
        // Actualizar el precio y la dirección del cambio en una sola operación
        const newPrice = data.price

        // Actualizar en un solo paso para reducir renderizados
        if (cdtPrice !== null) {
          setCdtPrice(newPrice)
          setPriceChange({
            isPositive: newPrice >= cdtPrice,
          })
        } else {
          // Primera carga
          setCdtPrice(newPrice)
          setPriceChange({
            isPositive: true,
          })
        }
      } else {
        console.error("Error en la respuesta de la API:", data.error)
      }
    } catch (error) {
      console.error("Error al obtener el precio del token:", error)
    }
  }, [t, cdtPrice])

  // Función optimizada para obtener datos de staking
  const fetchStakingData = useCallback(async () => {
    try {
      const identifier = getUserIdentifier()
      if (!identifier) {
        console.error("No se pudo obtener identificador de usuario")
        return
      }

      // Añadir timestamp para evitar caché
      const timestamp = Date.now()
      const response = await fetch(`/api/staking?wallet_address=${identifier}&_t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(t("error_loading"))
      }

      const data = await response.json()

      // Actualizar siempre el balance con el valor real de la blockchain
      setStakedAmount(data.staked_amount)

      if (data.pending_rewards !== pendingRewards) {
        setPendingRewards(data.pending_rewards)
      }

      if (data.last_claim_timestamp) {
        const lastClaim = new Date(data.last_claim_timestamp)
        // Solo actualizar si la fecha ha cambiado
        if (!lastClaimDate || lastClaim.getTime() !== lastClaimDate.getTime()) {
          setLastClaimDate(lastClaim)

          // Calcular próximo claim (24h después del último)
          const nextClaim = new Date(lastClaim)
          nextClaim.setHours(nextClaim.getHours() + 24)
          setNextClaimTime(nextClaim)
        }
      }

      // Obtener el username del usuario si es necesario
      if (!username) {
        try {
          const usernameResponse = await fetch(`/api/username?wallet_address=${identifier}`)
          if (usernameResponse.ok) {
            const usernameData = await usernameResponse.json()
            if (usernameData.username && usernameData.username !== username) {
              setUsername(usernameData.username)
              // Obtener el total claimed
              setTotalClaimed(usernameData.total_claimed || 0)
            }
          }
        } catch (error) {
          console.error("Error fetching username:", error)
        }
      }
    } catch (error) {
      console.error("Error fetching staking data:", error)
      // No mostrar error al usuario para actualizaciones automáticas
    }
  }, [getUserIdentifier, t, pendingRewards, lastClaimDate, username])

  // Actualizar el contador cada segundo
  useEffect(() => {
    if (!nextClaimTime) return

    const updateTimer = () => {
      setTimeRemaining(formatTimeRemaining(nextClaimTime))
    }

    // Actualizar inmediatamente
    updateTimer()

    // Luego actualizar cada segundo
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [nextClaimTime, formatTimeRemaining])

  // Cargar datos iniciales y configurar actualizaciones automáticas
  useEffect(() => {
    let isMounted = true

    // Establecer isLoading a true solo al inicio
    setIsLoading(true)

    // Función para cargar datos iniciales
    const loadInitialData = async () => {
      try {
        await fetchStakingData()
        // Añadir llamada a fetchTokenPrice
        await fetchTokenPrice()
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    // Cargar datos iniciales
    loadInitialData()

    // Función para actualizar cuando la ventana recupera el foco
    const handleFocus = () => {
      console.log("Ventana enfocada, actualizando balance...")
      fetchStakingData()
      // Añadir llamada a fetchTokenPrice
      fetchTokenPrice()
    }

    // Función para actualizar cuando el usuario vuelve a la pestaña
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Pestaña visible, actualizando balance...")
        fetchStakingData()
        // Añadir llamada a fetchTokenPrice
        fetchTokenPrice()
      }
    }

    // Añadir event listeners
    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    // También actualizar cada 10 segundos automáticamente (más frecuente)
    const interval = setInterval(() => {
      console.log("Actualizando balance automáticamente...")
      fetchStakingData()
      fetchTokenPrice()
    }, 10000) // 10 segundos (más frecuente)

    // Limpiar
    return () => {
      isMounted = false
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      clearInterval(interval)
    }
  }, [fetchStakingData, fetchTokenPrice])

  // Modificar la función handleClaimRewards para activar la animación
  const handleClaimRewards = useCallback(async () => {
    const identifier = getUserIdentifier()
    if (!identifier) return

    try {
      // Actualizar el balance antes de reclamar
      await fetchStakingData()

      setIsClaiming(true)
      setClaimSuccess(null)
      setClaimError(null)

      const response = await fetch("/api/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallet_address: identifier }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setClaimSuccess(data.message || t("rewards_claimed"))

        // Activar la lluvia de CDT cuando el claim es exitoso
        setShowCdtRain(true)

        // Desactivar después de 5 segundos
        setTimeout(() => {
          setShowCdtRain(false)
        }, 5000)

        // Actualizar el total_claimed si la API devuelve la cantidad reclamada
        if (data.amount) {
          setTotalClaimed((prevTotal) => prevTotal + data.amount)
        }

        // Recargar datos después de reclamar
        fetchStakingData()
      } else {
        setClaimError(data.error || t("error_claiming"))
        console.error("Error details:", data.details || "No details provided")
      }
    } catch (error) {
      console.error("Error claiming rewards:", error)
      setClaimError(error instanceof Error ? error.message : t("error_claiming"))
    } finally {
      setIsClaiming(false)
    }
  }, [getUserIdentifier, fetchStakingData, t])

  const handleUpdateStake = useCallback(async () => {
    const identifier = getUserIdentifier()
    if (!identifier) return

    try {
      setIsUpdating(true)
      setUpdateSuccess(null)
      setUpdateError(null)

      const response = await fetch("/api/update-stake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallet_address: identifier }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUpdateSuccess(data.message || t("balance_updated"))

        // Recargar datos después de actualizar
        fetchStakingData()
      } else {
        setUpdateError(data.error || t("error_updating"))
      }
    } catch (error) {
      console.error("Error updating stake:", error)
      setUpdateError(error instanceof Error ? error.message : t("error_updating"))
    } finally {
      setIsUpdating(false)
    }
  }, [getUserIdentifier, fetchStakingData, t])

  // Función para enviar propina
  const handleSendCDT = async () => {
    setIsSendingCDT(true)
    setTxError(null)
    setTxHash(null)

    try {
      console.log("Intentando enviar propina de 0.023 WLD...")

      // Usar el método pay de World Auth
      const result = (await pay({
        amount: 0.23,
        token: Tokens.WLD,
        recipient: "0x8a89B684145849cc994be122ddEc5b268CAE0cB6",
      })) as { success?: boolean; txHash?: string; transactionHash?: string }

      console.log("Resultado completo de la transacción:", JSON.stringify(result, null, 2))

      // Verificación mejorada del éxito de la transacción
      const hasSuccess = result && result.success === true
      const hasHash = !!(result && (result.txHash || result.transactionHash))

      console.log("Verificación de transacción:", {
        hasSuccess,
        hasHash,
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : null,
      })

      // SOLUCIÓN: Si tenemos un hash de transacción, SIEMPRE consideramos que fue exitosa
      // independientemente del campo success
      // La transacción tiene un hash o success=true, lo que significa que se completó en la blockchain
      if (hasHash || hasSuccess) {
        setTxHash(t("thanks_support"))

        // Registrar la transacción en la base de datos
        const identifier = getUserIdentifier()
        if (identifier) {
          try {
            const transactionHash =
              result.txHash || result.transactionHash || "0x" + Math.random().toString(16).substring(2, 10)

            console.log("Registrando transacción exitosa con hash:", transactionHash)

            // IMPORTANTE: Asegurarnos de que el status sea "success" explícitamente
            const response = await fetch("/api/transactions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                wallet_address: identifier,
                type: "support",
                amount: 0.23,
                token_type: "WLD",
                tx_hash: transactionHash,
                status: "success", // Asegurarnos de que esto sea "success"
                description: "Apoyo al proyecto Tribo Vault",
              }),
            })

            console.log("Respuesta al registrar transacción:", {
              status: response.status,
              ok: response.ok,
              statusText: response.statusText,
            })

            if (!response.ok) {
              console.error("Error al registrar transacción:", response.statusText)
              // No mostrar error al usuario si la transacción blockchain fue exitosa
            }
          } catch (error) {
            console.error("Error registering support transaction:", error)
            // No mostrar error al usuario si la transacción blockchain fue exitosa
          }
        }
      } else if (result && result.success === false) {
        // La transacción fue explícitamente rechazada
        setTxError("Transacción rechazada")
      } else {
        // No hay hash ni éxito explícito, probablemente fue cancelada
        setTxError("Transacción cancelada o no completada")
      }
    } catch (error) {
      console.error("Error al enviar propina:", error)
      setTxError(error instanceof Error ? error.message : t("error_sending"))
    } finally {
      setIsSendingCDT(false)
    }
  }

  // Calcular el valor estimado en USD
  const calculateUsdValue = (amount: number) => {
    if (cdtPrice && amount) {
      return (cdtPrice * amount).toFixed(2)
    }
    return "0.00"
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ebd0a]"></div>
      </div>
    )
  }

  // URL directa al token CDT en World App - Asegurarse de que sea la correcta
  const cdtTokenUrl =
    "https://worldcoin.org/mini-app?app_id=app_15daccf5b7d4ec9b7dbba044a8fdeab5&path=app/token/0x3Cb880f7ac84950c369e700deE2778d023b0C52d"

  // URL del topic de sorteos en Telegram
  const telegramGiveawayUrl = "https://t.me/cryptodigitaltribe/10775"

  return (
    // FIX 1: Añadir clase overflow-hidden para evitar scroll horizontal y mantener contenido fijo
    <div className="max-w-4xl mx-auto relative overflow-hidden">
      {/* Aplicar Helvetica Neue a todo el dashboard */}
      <style jsx global>{`
        .dashboard-content * {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        
        /* FIX 1: Asegurar que el contenido no cause scroll horizontal */
        body {
          overflow-x: hidden;
          width: 100%;
          position: relative;
        }
        
        /* FIX 1: Asegurar que los elementos animados no causen problemas de layout */
        .cdt-rain-container {
          pointer-events: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          overflow: hidden;
        }
      `}</style>

      {/* FIX 1: Contenedor con posición relativa y overflow hidden para mantener todo en su lugar */}
      <div className="dashboard-content relative">
        {/* Banner de bienvenida - Solo se muestra en la primera visita */}
        {isFirstVisit && (
          <div className="mb-6 bg-black border-l-4 border-[#4ebd0a] p-4 rounded-xl shadow-lg animate-fadeIn">
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">
                  {t("welcome")}, {username}! 🎉
                </h3>
                <p className="text-gray-300 mt-2">{t("how_works_desc")}</p>
                <div className="mt-3 flex gap-4">
                  <button
                    onClick={handleUpdateStake}
                    className="px-4 py-2 bg-[#4ebd0a] hover:bg-[#4ebd0a]/80 text-black font-medium rounded-full transition-colors text-sm"
                  >
                    {t("update_balance")}
                  </button>
                  <button
                    onClick={() => setIsFirstVisit(false)}
                    className="px-4 py-2 bg-transparent border border-gray-600 hover:bg-gray-800 text-white rounded-full transition-colors text-sm"
                  >
                    {t("disconnect")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NUEVO: Banner de sorteos diarios con animación de lluvia de tokens CDT */}
        <Link
          href={telegramGiveawayUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`block mb-6 bg-gradient-to-r from-[#ff1744] to-[#ff2954] rounded-xl p-4 shadow-lg transition-all duration-300 relative overflow-hidden ${
            isDailyGiveawayHovered ? "transform -translate-y-1 shadow-xl" : ""
          }`}
          onMouseEnter={() => setIsDailyGiveawayHovered(true)}
          onMouseLeave={() => setIsDailyGiveawayHovered(false)}
          onTouchStart={() => setIsDailyGiveawayHovered(true)}
          onTouchEnd={() => setIsDailyGiveawayHovered(false)}
        >
          {/* Componente de lluvia de tokens CDT - ahora siempre activo */}
          <CdtButtonRain containerClassName="rounded-xl" />

          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-black font-bold text-xl">{t("daily_giveaway")}</h3>
              <p className="text-white text-sm mt-1">{t("join_daily_giveaway")}</p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-300 ${isDailyGiveawayHovered ? "translate-x-1" : ""}`}
              >
                <path d="m9 18 6-6-6-6"></path>
              </svg>
            </div>
          </div>
        </Link>

        {/* Banner de concurso de referidos */}
        <Link
          href="/rankings?tab=referrals"
          className={`block mb-6 bg-gradient-to-r from-[#4ebd0a] to-[#3fa008] rounded-xl p-4 shadow-lg transition-all duration-300 ${
            isReferralBannerHovered ? "transform -translate-y-1 shadow-xl" : ""
          }`}
          onMouseEnter={() => setIsReferralBannerHovered(true)}
          onMouseLeave={() => setIsReferralBannerHovered(false)}
          onTouchStart={() => setIsReferralBannerHovered(true)}
          onTouchEnd={() => setIsReferralBannerHovered(false)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-black font-bold text-xl">🏆 {t("weekly_rewards")}</h3>
              <p className="text-white text-sm mt-1">{t("join_referral_contest")}</p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-300 ${isReferralBannerHovered ? "translate-x-1" : ""}`}
              >
                <path d="m9 18 6-6-6-6"></path>
              </svg>
            </div>
          </div>
        </Link>

        {/* Sección de usuario y saludo con detective verificador */}
        <div className="mb-6 relative">
          <div className="flex items-center">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white">
                Tribo <span className="text-[#4ebd0a]">Vault</span>
              </h2>
              {username && (
                <p className="text-white text-xl mt-1">
                  {t("hello")}, <span className="font-bold text-[#4ebd0a]">{username}</span>
                </p>
              )}
            </div>
            {/* Ajustado para estar centrado verticalmente y a la derecha */}
            <div className="flex items-center justify-end">
              <Image
                src="/detective-verificador.png"
                alt="Detective Verificador"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* NUEVA SECCIÓN: CDTs Ganados - ACTUALIZADA */}
        <div className="mb-6 bg-black rounded-2xl shadow-lg p-6 border border-gray-800">
          <h4 className="text-lg font-semibold text-[#4ebd0a] mb-2">{t("cdts_earned")}</h4>
          <p className="text-4xl font-bold text-white mb-1">{totalClaimed.toLocaleString()} CDT</p>
          <p className="text-sm text-[#4ebd0a]">
            ≈ ${calculateUsdValue(totalClaimed)} {t("usd_claimed")}
          </p>
        </div>

        {/* Botón Buy CDT - Primero según la captura */}
        <div className="mb-6">
          <a
            href={cdtTokenUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-3 w-full px-6 py-4 rounded-full text-white font-medium text-lg transition-all duration-300 ${
              isBuyButtonHovered ? "bg-[#4ebd0a] shadow-lg transform -translate-y-1" : "bg-[#ff1744] hover:bg-[#ff2954]"
            }`}
            onMouseEnter={() => setIsBuyButtonHovered(true)}
            onMouseLeave={() => setIsBuyButtonHovered(false)}
            onTouchStart={() => setIsBuyButtonHovered(true)}
            onTouchEnd={() => setIsBuyButtonHovered(false)}
          >
            <Image src="/TOKEN CDT.png" alt="CDT Token" width={28} height={28} className="rounded-full" />
            <span className="font-bold">{t("buy_cdt")}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`ml-2 transition-transform duration-300 ${isBuyButtonHovered ? "translate-x-1" : ""}`}
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </a>
        </div>

        {/* Card de TRIBO Wallet - Versión simplificada con branding consistente */}
        <div className="mb-6 bg-black rounded-2xl shadow-lg p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {/* Logo más grande sin texto */}
              <Image src="/TRIBO Wallet sin fondo.png" alt="TRIBO Wallet" width={60} height={60} className="mr-3" />
            </div>
            {/* Botón para ir a la página de perfil ampliado - DESTACADO Y VISIBLE - ACTUALIZADO */}
            <Link
              href="/profile"
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                isProfileHovered
                  ? "bg-[#4ebd0a] text-black shadow-lg transform -translate-y-0.5"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
              onMouseEnter={() => setIsProfileHovered(true)}
              onMouseLeave={() => setIsProfileHovered(false)}
              onTouchStart={() => setIsProfileHovered(true)}
              onTouchEnd={() => setIsProfileHovered(false)}
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
              {stakedAmount.toLocaleString()} <span className="text-[#4ebd0a]">CDT</span>
            </p>
          </div>

          {/* Componente separado para la sección de precio y estadísticas */}
          <PriceDisplay initialPrice={cdtPrice} stakedAmount={stakedAmount} priceChange={priceChange} />

          <button
            onClick={handleUpdateStake}
            disabled={isUpdating}
            className={`w-full px-4 py-3 rounded-full ${
              isUpdating ? "bg-gray-700 cursor-not-allowed" : "bg-[#4ebd0a] hover:bg-[#3fa008] text-black"
            } font-medium transition-colors`}
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

          {/* Mensaje de éxito para actualización de balance - ACTUALIZADO */}
          {updateSuccess && !updateError && !isUpdating && (
            <div className="mt-4 p-3 bg-black/70 border border-[#4ebd0a] rounded-full animate-pulse">
              <p className="text-sm font-medium text-[#4ebd0a] flex items-center">
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

          {/* Mensaje de error para actualización de balance */}
          {updateError && !isUpdating && (
            <div className="mt-4 p-3 bg-black/70 border border-[#ff1744] rounded-full">
              <p className="text-sm font-medium text-[#ff1744] flex items-center">
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
              <p className="text-xs mt-1 text-[#ff1744]">{updateError}</p>
            </div>
          )}
        </div>

        {/* SECCIÓN UNIFICADA: Próximo Claim simplificada - Ahora con fecha */}
        <div className="mb-6 bg-black rounded-2xl shadow-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-center text-[#4ebd0a]">{t("next_claim")}</h2>

          {/* Countdown con barra */}
          {nextClaimTime ? (
            <>
              <div className="flex flex-col items-center mb-5">
                <div className="text-4xl font-mono font-bold mb-3 text-white">{timeRemaining}</div>
                {/* Fecha del próximo claim */}
                <div className="text-sm text-gray-400">
                  {nextClaimTime ? formatDate(nextClaimTime) : "Fecha no disponible"}
                </div>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3 mb-6">
                <div
                  className="bg-[#4ebd0a] h-3 rounded-full"
                  style={{
                    width: `${
                      nextClaimTime && lastClaimDate
                        ? Math.min(
                            100,
                            Math.max(
                              0,
                              100 - ((nextClaimTime.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)) * 100,
                            ),
                          )
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </>
          ) : (
            <p className="text-xl mb-6 text-center text-white">{t("no_claims_yet")}</p>
          )}

          {/* Cantidad a reclamar */}
          <div className="text-center mb-5">
            <p className="text-lg text-gray-300 mb-2">{t("available_rewards")}</p>
            <p className="text-4xl font-bold text-white">{pendingRewards.toLocaleString()} CDT</p>
          </div>

          {/* Botón de reclamar */}
          <button
            onClick={handleClaimRewards}
            disabled={isClaiming || pendingRewards <= 0}
            className={`w-full px-4 py-3 rounded-full ${
              isClaiming || pendingRewards <= 0 ? "bg-gray-700 cursor-not-allowed" : "bg-[#ff1744] hover:bg-[#ff2954]"
            } text-white font-medium transition-colors`}
          >
            {isClaiming ? t("claiming") : pendingRewards <= 0 ? t("no_rewards") : t("claim_rewards")}
          </button>

          {/* Mensajes de éxito/error para claim */}
          {claimSuccess && !claimError && !isClaiming && (
            <div className="mt-4 p-3 bg-black border border-[#4ebd0a] rounded-full">
              <p className="text-sm font-medium text-[#4ebd0a]">{claimSuccess}</p>
            </div>
          )}

          {claimError && !isClaiming && (
            <div className="mt-4 p-3 bg-black border border-[#ff1744] rounded-full">
              <p className="text-sm font-medium text-[#ff1744]">{t("error_claiming")}</p>
              <p className="text-xs mt-1 text-[#ff1744]">{claimError}</p>
            </div>
          )}
        </div>

        {/* Sección de ganancias - MODIFICADA con el estilo solicitado */}
        <div className="mb-6 bg-black rounded-2xl shadow-lg p-6 border border-gray-800">
          <h3 className="text-xl font-semibold mb-4 text-center text-white">{t("earn_daily")}</h3>

          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="bg-black/50 p-4 rounded-xl border border-[#4ebd0a] text-center">
              <p className="text-sm text-gray-400 mb-1">{t("daily")}</p>
              <p className="text-2xl font-bold text-[#4ebd0a]">0.1%</p>
            </div>
            <div className="bg-black/50 p-4 rounded-xl border border-[#4ebd0a] text-center">
              <p className="text-sm text-gray-400 mb-1">{t("monthly")}</p>
              <p className="text-2xl font-bold text-[#4ebd0a]">3%</p>
            </div>
            <div className="bg-black/50 p-4 rounded-xl border border-[#4ebd0a] text-center">
              <p className="text-sm text-gray-400 mb-1">{t("yearly")}</p>
              <p className="text-2xl font-bold text-[#4ebd0a]">36.5%</p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-400">{t("how_works_desc")}</p>
        </div>

        {/* Botón de Discord */}
        <div className="mb-6 flex items-center gap-4">
          <Image src="/Jefe Tribo Discord.png" alt="Discord" width={48} height={48} className="rounded-full" />
          <Link
            href={process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/BaYaaUsUuN"}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-full text-white font-medium transition-all duration-300 ${
              isDiscordHovered
                ? "bg-[#5865F2] shadow-lg transform -translate-y-1"
                : "bg-[#5865F2]/80 hover:bg-[#5865F2]"
            }`}
            onMouseEnter={() => setIsDiscordHovered(true)}
            onMouseLeave={() => setIsDiscordHovered(false)}
            onTouchStart={() => setIsDiscordHovered(true)}
            onTouchEnd={() => setIsDiscordHovered(false)}
          >
            <span className="whitespace-nowrap">{t("join_community")}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ${isDiscordHovered ? "translate-x-1" : ""}`}
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </Link>
        </div>

        {/* Botón de Telegram */}
        <div className="mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0088cc] rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m20 4-2 14-6-4-2 2v-4.5L18 6l-8 5-4-2Z" />
            </svg>
          </div>
          <Link
            href={process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/cryptodigitaltribe"}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-full text-white font-medium transition-all duration-300 ${
              isTelegramHovered
                ? "bg-[#0088cc] shadow-lg transform -translate-y-1"
                : "bg-[#0088cc]/80 hover:bg-[#0088cc]"
            }`}
            onMouseEnter={() => setIsTelegramHovered(true)}
            onMouseLeave={() => setIsTelegramHovered(false)}
            onTouchStart={() => setIsTelegramHovered(true)}
            onTouchEnd={() => setIsTelegramHovered(false)}
          >
            <span className="whitespace-nowrap">{t("join_telegram")}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ${isTelegramHovered ? "translate-x-1" : ""}`}
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </Link>
        </div>

        {/* Botón de Twitter/X */}
        <div className="mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center border border-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
              <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
            </svg>
          </div>
          <Link
            href={process.env.NEXT_PUBLIC_TWITTER_URL || "https://x.com/TriboCDT"}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-full text-white font-medium transition-all duration-300 ${
              isTwitterHovered ? "bg-gray-900 shadow-lg transform -translate-y-1" : "bg-gray-800 hover:bg-gray-900"
            }`}
            onMouseEnter={() => setIsTwitterHovered(true)}
            onMouseLeave={() => setIsTwitterHovered(false)}
            onTouchStart={() => setIsTwitterHovered(true)}
            onTouchEnd={() => setIsTwitterHovered(false)}
          >
            <span className="whitespace-nowrap">{t("follow_twitter")}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ${isTwitterHovered ? "translate-x-1" : ""}`}
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </Link>
        </div>

        {/* NUEVO: Botón de Swap CDT */}
        <div className="mb-6">
          <Link
            href={getUnoDeeplinkUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-3 w-full px-6 py-3 rounded-full text-white font-medium transition-all duration-300 ${
              isSwapButtonHovered
                ? "bg-[#4ebd0a] shadow-lg transform -translate-y-1"
                : "bg-[#ff1744] hover:bg-[#ff2954]"
            }`}
            onMouseEnter={() => setIsSwapButtonHovered(true)}
            onMouseLeave={() => setIsSwapButtonHovered(false)}
            onTouchStart={() => setIsSwapButtonHovered(true)}
            onTouchEnd={() => setIsSwapButtonHovered(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 3h5v5"></path>
              <path d="M4 20 21 3"></path>
              <path d="M21 16v5h-5"></path>
              <path d="M15 15 3 3"></path>
            </svg>
            <span className="whitespace-nowrap">{t("swap_cdt")}</span>
            <Image src="/TOKEN CDT.png" alt="CDT Token" width={20} height={20} className="rounded-full" />
          </Link>
        </div>

        {/* Sección de propina - Movida al final */}
        <div className="mb-6">
          <div className="bg-black rounded-2xl shadow-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-2 text-[#4ebd0a]">{t("support_project")}</h2>
            <p className="text-gray-400 text-sm mb-4">{t("support_help")}</p>
            <button
              onClick={handleSendCDT}
              disabled={isSendingCDT}
              className={`w-full px-4 py-3 rounded-full ${
                isSendingCDT ? "bg-gray-700 cursor-not-allowed" : "bg-[#ff1744] hover:bg-[#ff2954]"
              } text-white font-medium transition-colors`}
            >
              {isSendingCDT ? t("processing") : t("support_with").replace("0.023", "0.23")}
            </button>

            {txHash && !txError && isSendingCDT === false && (
              <div className="mt-4 p-3 bg-black border border-[#4ebd0a] rounded-full">
                <p className="text-sm font-medium text-[#4ebd0a]">{txHash}</p>
                <p className="text-xs mt-1 text-[#4ebd0a]">{t("reward_message")}</p>
              </div>
            )}

            {txError && isSendingCDT === false && (
              <div className="mt-4 p-3 bg-black border border-[#ff1744] rounded-full">
                <p className="text-sm font-medium text-[#ff1744]">{t("error_sending")}</p>
                <p className="text-xs mt-1 text-[#ff1744]">{txError}</p>
              </div>
            )}
          </div>
        </div>

        {/* FIX 2: Mejorar la implementación de CdtRain para que funcione correctamente */}
        {showCdtRain && (
          <div className="cdt-rain-container">
            <CdtRain count={50} duration={5} />
          </div>
        )}
      </div>
    </div>
  )
}
