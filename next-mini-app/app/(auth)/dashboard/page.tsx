"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useWorldAuth } from "next-world-auth/react"
import { Tokens } from "next-world-auth"
import Image from "next/image"
import Link from "next/link"
import { useTranslation } from "../../../src/components/TranslationProvider"

// Componente PriceDisplay simplificado
const PriceDisplay = React.memo(
  ({
    initialPrice,
    stakedAmount,
    priceChange,
    lastUpdated,
  }: {
    initialPrice: number | null
    stakedAmount: number
    priceChange: { value: number; isPositive: boolean }
    lastUpdated?: string | null
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

    return (
      <>
        {/* Estadísticas adicionales con diseño simplificado */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-black p-4 rounded-lg border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">{t("estimated_value")}</p>
            <p className="text-lg font-semibold text-white">
              <span className="text-[#4ebd0a]">$</span>
              {calculateUsdValue} <span className="text-xs text-gray-400">USD</span>
            </p>
          </div>
          <div className="bg-black p-4 rounded-lg border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">{t("yearly_earnings")}</p>
            <p className="text-lg font-semibold text-white">
              <span className="text-[#4ebd0a]">+</span>
              {Math.round(stakedAmount * 0.44).toLocaleString()} <span className="text-xs text-gray-400">CDT</span>
            </p>
          </div>
        </div>

        {/* Sección de precio con diseño simplificado */}
        <div className="flex items-center justify-between mb-6 bg-black p-3 rounded-lg border border-gray-800">
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
              <span className={`ml-1 text-xs ${priceChange.isPositive ? "text-green-500" : "text-red-500"}`}>
                {priceChange.isPositive ? "+" : "-"}
                {priceChange.value.toFixed(2)}%
              </span>
            </div>
            {lastUpdated && <p className="text-xs text-gray-500 mt-1">{new Date(lastUpdated).toLocaleTimeString()}</p>}
          </div>
          <div className="h-10 w-20 bg-black/50 rounded-md overflow-hidden">
            {/* Mini gráfico simulado */}
            <div className="h-full w-full flex items-end">
              <div className="h-[30%] w-1 bg-[#4ebd0a] mx-[1px]"></div>
              <div className="h-[50%] w-1 bg-[#4ebd0a] mx-[1px]"></div>
              <div className="h-[40%] w-1 bg-[#4ebd0a] mx-[1px]"></div>
              <div className="h-[70%] w-1 bg-[#4ebd0a] mx-[1px]"></div>
              <div className="h-[60%] w-1 bg-[#4ebd0a] mx-[1px]"></div>
              <div className="h-[80%] w-1 bg-[#4ebd0a] mx-[1px]"></div>
              <div className="h-[75%] w-1 bg-[#4ebd0a] mx-[1px]"></div>
              <div className="h-[90%] w-1 bg-[#4ebd0a] mx-[1px]"></div>
            </div>
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
  const [cdtPrice, setCdtPrice] = useState<number | null>(null)
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string | null>(null)

  // Estado para el porcentaje de cambio del precio
  const [priceChange, setPriceChange] = useState<{ value: number; isPositive: boolean }>({
    value: 2.34,
    isPositive: true,
  })

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
  const [isTransactionsHovered, setIsTransactionsHovered] = useState(false)

  // Estados para mensajes de claim y update
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const { session, pay } = useWorldAuth()

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
        return t("rewards_ready")
      }

      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000)

      return `${diffHrs.toString().padStart(2, "0")}:${diffMins.toString().padStart(2, "0")}:${diffSecs.toString().padStart(2, "0")}`
    },
    [t],
  )

  // Función para formatear fecha
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Función para obtener el precio del token
  const fetchTokenPrice = useCallback(async () => {
    try {
      console.log("Obteniendo precio del token en vivo...")
      const response = await fetch("/api/token-price")

      if (!response.ok) {
        throw new Error(t("error_updating"))
      }

      const data = await response.json()
      console.log("Respuesta de la API token-price:", data)

      if (data.success) {
        // Actualizar el precio y el timestamp
        setCdtPrice(data.price)
        if (data.timestamp) {
          setLastPriceUpdate(data.timestamp)
        }

        // Generar un pequeño cambio aleatorio para simular movimiento en vivo
        // (ya que la API no proporciona el cambio de precio)
        const randomChange = (Math.random() * 3).toFixed(2)
        const isPositive = Math.random() > 0.3 // 70% probabilidad de ser positivo

        setPriceChange({
          value: Number.parseFloat(randomChange),
          isPositive: isPositive,
        })
      } else {
        console.error("Error en la respuesta de la API:", data.error)
      }
    } catch (error) {
      console.error("Error al obtener el precio del token:", error)
    }
  }, [t])

  // Asegurarnos de que fetchStakingData no cause re-renderizados innecesarios
  const fetchStakingData = useCallback(async () => {
    try {
      setIsLoading(true)

      const identifier = getUserIdentifier()
      if (!identifier) {
        console.error("No se pudo obtener identificador de usuario")
        return
      }

      const response = await fetch(`/api/staking?wallet_address=${identifier}`)

      if (!response.ok) {
        throw new Error(t("error_loading"))
      }

      const data = await response.json()

      // Solo actualizar si los valores han cambiado
      if (data.staked_amount !== stakedAmount) {
        setStakedAmount(data.staked_amount)
      }

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

      // Obtener el username del usuario con la nueva API
      try {
        const usernameResponse = await fetch(`/api/username?wallet_address=${identifier}`)
        if (usernameResponse.ok) {
          const usernameData = await usernameResponse.json()
          if (usernameData.username && usernameData.username !== username) {
            setUsername(usernameData.username)
          }
        }
      } catch (error) {
        console.error("Error fetching username:", error)
      }

      // Obtener el precio del token
      await fetchTokenPrice()
    } catch (error) {
      console.error("Error fetching staking data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [getUserIdentifier, fetchTokenPrice, t, stakedAmount, pendingRewards, lastClaimDate, username])

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

  // Cargar datos iniciales y configurar actualizaciones periódicas
  useEffect(() => {
    fetchStakingData()

    // Configurar un intervalo para actualizar SOLO el precio cada 3 segundos
    const priceInterval = setInterval(() => {
      fetchTokenPrice()
    }, 3000) // 3 segundos en lugar de 10 segundos

    return () => clearInterval(priceInterval)
  }, [fetchStakingData, fetchTokenPrice])

  const handleClaimRewards = useCallback(async () => {
    const identifier = getUserIdentifier()
    if (!identifier) return

    try {
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

        // Recargar datos después de reclamar
        fetchStakingData()
      } else {
        setClaimError(data.error || t("error_claiming"))
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
        amount: 0.023,
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
      if (hasHash || hasSuccess) {
        // La transacción tiene un hash o success=true, lo que significa que se completó en la blockchain
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
                amount: 0.023,
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ebd0a]"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Aplicar Helvetica Neue a todo el dashboard */}
      <style jsx global>{`
        .dashboard-content * {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
      `}</style>
      <div className="dashboard-content">
        {/* Banner de bienvenida - Solo se muestra en la primera visita */}
        {isFirstVisit && (
          <div className="mb-6 bg-black border-l-4 border-[#4ebd0a] p-4 rounded-md shadow-lg animate-fadeIn">
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">
                  {t("welcome")}, {username}! 🎉
                </h3>
                <p className="text-gray-300 mt-2">{t("how_works_desc")}</p>
                <div className="mt-3 flex gap-4">
                  <button
                    onClick={handleUpdateStake}
                    className="px-4 py-2 bg-[#4ebd0a] hover:bg-[#4ebd0a]/80 text-black font-medium rounded-md transition-colors text-sm"
                  >
                    {t("update_balance")}
                  </button>
                  <button
                    onClick={() => setIsFirstVisit(false)}
                    className="px-4 py-2 bg-transparent border border-gray-600 hover:bg-gray-800 text-white rounded-md transition-colors text-sm"
                  >
                    {t("disconnect")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección de usuario y saludo - Sin corona */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white">
            Tribo <span className="text-[#4ebd0a]">Vault</span>
          </h2>
          {username && (
            <p className="text-white text-xl mt-1">
              {t("hello")}, <span className="font-bold text-[#4ebd0a]">{username}</span>
            </p>
          )}
        </div>

        {/* Botón Buy CDT - Primero según la captura */}
        <div className="mb-6">
          <Link
            href={
              process.env.NEXT_PUBLIC_BUY_CDT_URL ||
              "https://world.org/mini-app?app_id=app_15daccf5b7d4ec9b7dbba044a8fdeab5"
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-3 w-full px-6 py-4 rounded-md text-white font-medium text-lg transition-all duration-300 ${
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
          </Link>
        </div>

        {/* Card de TRIBO Wallet - Versión simplificada con branding consistente */}
        <div className="mb-6 bg-black rounded-xl shadow-lg p-6 border border-gray-800">
          <div className="flex items-center mb-4">
            <Image src="/TRIBO Wallet sin fondo.png" alt="TRIBO Wallet" width={32} height={32} className="mr-3" />
            <h2 className="text-xl font-semibold text-[#4ebd0a]">{t("tribo_wallet")}</h2>
          </div>

          <p className="text-gray-400 text-sm mb-2">{t("tokens_staked")}</p>
          <div className="flex items-center mb-4">
            <p className="text-3xl font-bold text-white">
              {stakedAmount.toLocaleString()} <span className="text-[#4ebd0a]">CDT</span>
            </p>
          </div>

          {/* Componente separado para la sección de precio y estadísticas */}
          <PriceDisplay
            initialPrice={cdtPrice}
            stakedAmount={stakedAmount}
            priceChange={priceChange}
            lastUpdated={lastPriceUpdate}
          />

          <button
            onClick={handleUpdateStake}
            disabled={isUpdating}
            className={`w-full px-4 py-3 rounded-md ${
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

          {/* Mensaje de éxito para actualización de balance */}
          {updateSuccess && !updateError && !isUpdating && (
            <div className="mt-4 p-3 bg-black/70 border border-[#4ebd0a] rounded-md animate-pulse">
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
                {updateSuccess}
              </p>
            </div>
          )}

          {/* Mensaje de error para actualización de balance */}
          {updateError && !isUpdating && (
            <div className="mt-4 p-3 bg-black/70 border border-[#ff1744] rounded-md">
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
        <div className="mb-6 bg-black rounded-xl shadow-lg p-6 border border-gray-800">
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
            className={`w-full px-4 py-3 rounded-md ${
              isClaiming || pendingRewards <= 0 ? "bg-gray-700 cursor-not-allowed" : "bg-[#ff1744] hover:bg-[#ff2954]"
            } text-white font-medium transition-colors`}
          >
            {isClaiming ? t("claiming") : pendingRewards <= 0 ? t("no_rewards") : t("claim_rewards")}
          </button>

          {/* Mensajes de éxito/error para claim */}
          {claimSuccess && !claimError && !isClaiming && (
            <div className="mt-4 p-3 bg-black border border-[#4ebd0a] rounded-md">
              <p className="text-sm font-medium text-[#4ebd0a]">{claimSuccess}</p>
            </div>
          )}

          {claimError && !isClaiming && (
            <div className="mt-4 p-3 bg-black border border-[#ff1744] rounded-md">
              <p className="text-sm font-medium text-[#ff1744]">{t("error_claiming")}</p>
              <p className="text-xs mt-1 text-[#ff1744]">{claimError}</p>
            </div>
          )}
        </div>

        {/* NUEVO: Link a historial de transacciones */}
        <div className="mb-6">
          <Link
            href="/transactions"
            className={`flex items-center justify-center gap-3 w-full px-6 py-3 rounded-md text-white font-medium transition-all duration-300 ${
              isTransactionsHovered
                ? "bg-[#ff1744] shadow-lg transform -translate-y-1"
                : "bg-[#4ebd0a] hover:bg-[#3fa008]"
            }`}
            onMouseEnter={() => setIsTransactionsHovered(true)}
            onMouseLeave={() => setIsTransactionsHovered(false)}
            onTouchStart={() => setIsTransactionsHovered(true)}
            onTouchEnd={() => setIsTransactionsHovered(false)}
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
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <span className="whitespace-nowrap">{t("view_transactions")}</span>
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
              className={`transition-transform duration-300 ${isTransactionsHovered ? "translate-x-1" : ""}`}
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </Link>
        </div>

        {/* Botón de Discord - Corregido para que el texto no esté en dos líneas */}
        <div className="mb-6 flex items-center gap-4">
          <Image src="/Jefe Tribo Discord.png" alt="Discord" width={48} height={48} className="rounded-full" />
          <Link
            href={process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/tribo"}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-md text-white font-medium transition-all duration-300 ${
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

        {/* NUEVO: Botón de Swap CDT */}
        <div className="mb-6">
          <Link
            href="https://world.org/mini-app?app_id=app_a4f7f3e62c1de0b9490a5260cb390b56"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-3 w-full px-6 py-3 rounded-md text-white font-medium transition-all duration-300 ${
              isSwapButtonHovered
                ? "bg-[#4ebd0a] shadow-lg transform -translate-y-1"
                : "bg-[#ff1744]/80 hover:bg-[#ff1744]"
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
          <div className="bg-black rounded-xl shadow-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-2 text-[#4ebd0a]">{t("support_project")}</h2>
            <p className="text-gray-400 text-sm mb-4">{t("support_help")}</p>
            <button
              onClick={handleSendCDT}
              disabled={isSendingCDT}
              className={`w-full px-4 py-3 rounded-md ${
                isSendingCDT ? "bg-gray-700 cursor-not-allowed" : "bg-[#ff1744] hover:bg-[#ff2954]"
              } text-white font-medium transition-colors`}
            >
              {isSendingCDT ? t("processing") : t("support_with")}
            </button>

            {txHash && !txError && isSendingCDT === false && (
              <div className="mt-4 p-3 bg-black border border-[#4ebd0a] rounded-md">
                <p className="text-sm font-medium text-[#4ebd0a]">{txHash}</p>
                <p className="text-xs mt-1 text-[#4ebd0a]">{t("reward_message")}</p>
              </div>
            )}

            {txError && isSendingCDT === false && (
              <div className="mt-4 p-3 bg-black border border-[#ff1744] rounded-md">
                <p className="text-sm font-medium text-[#ff1744]">{t("error_sending")}</p>
                <p className="text-xs mt-1 text-[#ff1744]">{txError}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
