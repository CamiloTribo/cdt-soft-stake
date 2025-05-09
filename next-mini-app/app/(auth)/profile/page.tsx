"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useWorldAuth } from "next-world-auth/react"
import Image from "next/image"
import Link from "next/link"

type UserStats = {
  totalStaked: number
  totalClaimed: number
  referralCount: number
}

type Referral = {
  id: string
  created_at: string
  referred: {
    id: string
    username: string
    address: string
    created_at: string
  }
}

export default function Profile() {
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState("")
  const [userStats, setUserStats] = useState<UserStats>({
    totalStaked: 0,
    totalClaimed: 0,
    referralCount: 0,
  })
  const [isCopied, setIsCopied] = useState(false)
  const [cdtPrice, setCdtPrice] = useState<number | null>(null)
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null)
  const [referralCode, setReferralCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [referralSuccess, setReferralSuccess] = useState(false)
  const [referralError, setReferralError] = useState("")

  // Estados para la lista de referidos
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false)
  const [referralsError, setReferralsError] = useState<string | null>(null)

  const { isAuthenticated, session } = useWorldAuth()
  const router = useRouter()

  // Función para obtener un identificador único del usuario
  const getUserIdentifier = useCallback(() => {
    if (!session || !session.user || !session.user.walletAddress) return null
    return session.user.walletAddress
  }, [session])

  // Función para obtener datos del usuario
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true)

      const identifier = getUserIdentifier()
      if (!identifier) {
        console.error("No se pudo obtener identificador de usuario")
        return
      }

      // Obtener el username y datos del usuario
      try {
        const usernameResponse = await fetch(`/api/username?wallet_address=${identifier}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (usernameResponse.ok) {
          const usernameData = await usernameResponse.json()
          if (usernameData.username) {
            setUsername(usernameData.username)

            // Actualizar total_claimed y referral_count desde la API de username
            setUserStats((prev) => ({
              ...prev,
              totalClaimed: usernameData.total_claimed || 0,
              referralCount: usernameData.referral_count || 0,
            }))
          }
        }
      } catch (error) {
        console.error("Error fetching username:", error)
      }

      // Obtener datos de staking
      try {
        const stakingResponse = await fetch(`/api/staking?wallet_address=${identifier}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (stakingResponse.ok) {
          const stakingData = await stakingResponse.json()

          setUserStats((prev) => ({
            ...prev,
            totalStaked: stakingData.staked_amount || 0,
          }))

          // Obtener la fecha del último claim
          if (stakingData.last_claim_timestamp) {
            setLastClaimDate(stakingData.last_claim_timestamp)
          }
        }
      } catch (error) {
        console.error("Error fetching staking data:", error)
      }

      // Obtener el precio del token CDT
      try {
        const priceResponse = await fetch("/api/token-price")
        if (priceResponse.ok) {
          const priceData = await priceResponse.json()
          if (priceData.success) {
            setCdtPrice(priceData.price)
          }
        }
      } catch (error) {
        console.error("Error fetching token price:", error)
      }

      // Obtener la lista de referidos
      fetchReferrals(identifier)
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [getUserIdentifier])

  // Función para obtener la lista de referidos
  const fetchReferrals = async (walletAddress: string) => {
    if (!walletAddress) return

    try {
      setIsLoadingReferrals(true)
      setReferralsError(null)

      const response = await fetch(`/api/referral?wallet_address=${walletAddress}`)

      if (!response.ok) {
        throw new Error("Error al cargar referidos")
      }

      const data = await response.json()

      if (data.success && data.referrals) {
        setReferrals(data.referrals)
      } else {
        setReferrals([])
      }
    } catch (err) {
      console.error("Error fetching referrals:", err)
      setReferralsError(err instanceof Error ? err.message : "Error al cargar referidos")
    } finally {
      setIsLoadingReferrals(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    fetchUserData()
  }, [isAuthenticated, router, fetchUserData])

  // Función para copiar el código de referido
  const copyReferralCode = () => {
    navigator.clipboard.writeText(username)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Función para registrar un referido
  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!referralCode.trim()) {
      setReferralError("Por favor, introduce un código de referido")
      return
    }

    setIsSubmitting(true)
    setReferralError("")
    setReferralSuccess(false)

    try {
      const identifier = getUserIdentifier()
      if (!identifier) {
        throw new Error("No se pudo obtener identificador de usuario")
      }

      const response = await fetch("/api/referral", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: identifier,
          referral_code: referralCode,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setReferralSuccess(true)
        setReferralCode("")
        // Actualizar datos para reflejar el nuevo referido
        fetchUserData()
      } else {
        setReferralError(data.error || "Error al registrar el referido")
      }
    } catch (error) {
      console.error("Error registering referral:", error)
      setReferralError("Error al procesar la solicitud")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calcular el valor estimado en USD
  const calculateUsdValue = (amount: number) => {
    if (cdtPrice && amount) {
      return (cdtPrice * amount).toFixed(2)
    }
    return "0.00"
  }

  // Calcular las ganancias anuales estimadas
  const calculateYearlyEarnings = () => {
    // 0.1% diario durante 365 días con interés compuesto (36.5% anual)
    if (userStats.totalStaked) {
      let amount = userStats.totalStaked
      for (let i = 0; i < 365; i++) {
        amount += amount * 0.001 // 0.1% diario
      }
      return Math.round(amount - userStats.totalStaked)
    }
    return 0
  }

  // Formatear la fecha del último claim
  const formatLastClaimDate = () => {
    if (!lastClaimDate) return "Nunca"

    const date = new Date(lastClaimDate)
    return date.toLocaleDateString()
  }

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ebd0a]"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Image src="/LOGO TRIBO Vault- sin fondo.png" alt="Tribo Logo" width={28} height={28} className="mr-2" />
            <h1 className="text-xl font-bold">TRIBO Vault</h1>
          </div>
          <div className="flex items-center gap-3">
            {username && (
              <span className="text-sm bg-gray-800 px-3 py-1 rounded-full text-white truncate max-w-[150px]">
                @{username}
              </span>
            )}
            <button
              onClick={() => router.push("/dashboard")}
              className="p-1.5 rounded-full bg-black/50 border border-gray-700 hover:bg-gray-900"
              title="Volver al Dashboard"
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
                <path d="m15 18-6-6 6-6"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="pt-16 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Título de la página y nombre de usuario destacado */}
          <div className="mb-6">
            <div className="flex items-center">
              <Image src="/TRIBO Wallet sin fondo.png" alt="TRIBO Wallet" width={40} height={40} className="mr-3" />
              <h2 className="text-3xl font-bold text-white">TRIBO WALLET</h2>
            </div>
            {username && (
              <div className="mt-3 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                <p className="text-gray-400 text-sm">Bienvenido</p>
                <p className="text-2xl font-bold text-[#4ebd0a]">@{username}</p>
              </div>
            )}
          </div>

          {/* Estadísticas */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-black rounded-xl shadow-lg p-6 border border-gray-800">
                <h4 className="text-lg font-semibold text-[#4ebd0a] mb-2">Balance Total</h4>
                <p className="text-3xl font-bold text-white mb-1">{userStats.totalStaked.toLocaleString()} CDT</p>
                <p className="text-sm text-gray-400">≈ ${calculateUsdValue(userStats.totalStaked)} USD</p>

                <div className="mt-4 pt-4 border-t border-gray-800">
                  <h5 className="text-sm font-medium text-white mb-2">Proyección anual (365 días)</h5>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-400">Ganancias estimadas</p>
                    <p className="text-lg font-semibold text-[#4ebd0a]">
                      +{calculateYearlyEarnings().toLocaleString()} CDT
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-400">APY</p>
                    <p className="text-lg font-semibold text-[#4ebd0a]">36.5%</p>
                  </div>
                </div>
              </div>

              <div className="bg-black rounded-xl shadow-lg p-6 border border-gray-800">
                <h4 className="text-lg font-semibold text-[#4ebd0a] mb-2">CDTs Ganados</h4>
                <p className="text-3xl font-bold text-white mb-1">{userStats.totalClaimed.toLocaleString()} CDT</p>
                <p className="text-sm text-gray-400">≈ ${calculateUsdValue(userStats.totalClaimed)} USD reclamados</p>

                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-400">Último claim</p>
                    <p className="text-sm text-white">{formatLastClaimDate()}</p>
                  </div>
                  <div className="mt-4">
                    <Link
                      href="/transactions"
                      className="w-full px-4 py-2 bg-black border border-gray-700 rounded-md hover:bg-gray-900 text-white text-center block"
                    >
                      Ver historial completo
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de referidos mejorada */}
          <div className="mb-6 bg-black rounded-xl shadow-lg p-6 border border-gray-800">
            <h4 className="text-lg font-semibold text-[#4ebd0a] mb-3">Programa de Referidos</h4>

            {/* Tabs para la sección de referidos */}
            <div className="flex border-b border-gray-800 mb-5">
              <button className="px-4 py-2 border-b-2 border-[#4ebd0a] text-[#4ebd0a] font-medium">Invitar</button>
              <button className="px-4 py-2 text-gray-400 hover:text-white">Amigos</button>
            </div>

            {/* Contador de invitaciones totales */}
            <div className="bg-black/30 rounded-xl border border-gray-800 p-4 mb-5 text-center">
              <p className="text-gray-400 mb-2">Invitaciones Totales</p>
              <p className="text-4xl font-bold text-[#4ebd0a]">{userStats.referralCount}</p>
            </div>

            {/* Tu código de referido */}
            <div className="mb-5">
              <p className="text-sm text-gray-300 mb-3">
                Comparte tu código de referido con amigos y gana recompensas cuando se unan
              </p>

              <div className="bg-gray-900/50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-400 mb-2">Tu código de referido</p>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={username}
                    readOnly
                    className="flex-1 bg-black border border-gray-700 rounded-l-md px-3 py-2 text-sm font-mono text-white"
                  />
                  <button
                    onClick={copyReferralCode}
                    className="bg-[#4ebd0a] hover:bg-[#4ebd0a]/80 text-black px-3 py-2 rounded-r-md"
                  >
                    {isCopied ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Tus amigos deben usar este código al registrarse</p>
              </div>

              <div className="bg-gray-900/50 p-4 rounded-lg mb-5">
                <p className="text-sm text-gray-400 mb-2">Referidos activos</p>
                <p className="text-3xl font-bold text-white">{userStats.referralCount}</p>
              </div>

              {/* Lista de referidos */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-white">Tus referidos</p>

                {isLoadingReferrals ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#4ebd0a]"></div>
                  </div>
                ) : referralsError ? (
                  <div className="bg-black/30 rounded-lg p-4 text-center">
                    <p className="text-red-500 text-sm">{referralsError}</p>
                  </div>
                ) : referrals.length === 0 ? (
                  <div className="bg-gray-900/30 rounded-lg p-4 text-center">
                    <p className="text-gray-400 text-sm">Aún no tienes referidos</p>
                    <p className="text-xs text-gray-500 mt-1">Comparte tu código para comenzar a invitar amigos</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {referrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="bg-black/30 rounded-lg p-3 flex items-center justify-between border border-gray-800 hover:border-gray-700 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="bg-[#4ebd0a]/20 rounded-full p-2 mr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#4ebd0a"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <line x1="19" y1="8" x2="19" y2="14"></line>
                              <line x1="16" y1="11" x2="22" y2="11"></line>
                            </svg>
                          </div>
                          <div>
                            <p className="text-white font-medium">@{referral.referred.username}</p>
                            <p className="text-xs text-gray-400">Unido el {formatDate(referral.referred.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="bg-[#4ebd0a]/10 rounded-full px-3 py-1 flex items-center">
                            <Image src="/TOKEN CDT.png" alt="CDT Token" width={16} height={16} className="mr-1" />
                            <span className="text-[#4ebd0a] text-sm font-medium">
                              {/* Simulamos un balance aleatorio entre 1K y 2M */}
                              {(() => {
                                const balance = Math.floor(Math.random() * 2000000)
                                if (balance >= 1000000) {
                                  return (balance / 1000000).toFixed(1) + "M"
                                } else if (balance >= 1000) {
                                  return (balance / 1000).toFixed(1) + "K"
                                } else {
                                  return balance.toFixed(1)
                                }
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Formulario para añadir un referido */}
            <div className="mt-5 pt-5 border-t border-gray-800">
              <p className="text-sm text-gray-300 mb-3">
                ¿Te ha invitado un amigo? Introduce su código de referido aquí
              </p>

              <form onSubmit={handleReferralSubmit} className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Código de referido"
                    className="flex-1 bg-black border border-gray-700 rounded-l-md px-3 py-2 text-sm text-white"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2 rounded-r-md font-medium text-base ${
                      isSubmitting ? "bg-gray-700 cursor-not-allowed" : "bg-[#4ebd0a] hover:bg-[#4ebd0a]/80 text-black"
                    }`}
                  >
                    {isSubmitting ? "Enviando..." : "Registrar"}
                  </button>
                </div>

                {referralError && <p className="text-sm text-red-500">{referralError}</p>}

                {referralSuccess && <p className="text-sm text-[#4ebd0a]">¡Referido registrado con éxito!</p>}
              </form>
            </div>
          </div>

          {/* Botón para volver al dashboard */}
          <div className="mb-6 text-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-black border border-gray-700 rounded-md hover:bg-gray-900 text-white"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500">
        <p>La mejor forma de stakear tus CDT</p>
      </footer>
    </main>
  )
}
