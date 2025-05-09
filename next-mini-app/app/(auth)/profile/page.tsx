"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useWorldAuth } from "next-world-auth/react"
import Image from "next/image"
import Link from "next/link"
// Eliminamos la importación de useTranslation si no la estamos usando
// import { useTranslation } from "../../../src/components/TranslationProvider"

type UserStats = {
  totalStaked: number
  totalClaimed: number
  referralCount: number
  referralCode: string
  referralUrl: string
  joinDate: string
  lastClaimDate: string | null
}

export default function Profile() {
  // Eliminamos la línea que causa el error
  // const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState("")
  const [userStats, setUserStats] = useState<UserStats>({
    totalStaked: 0,
    totalClaimed: 0,
    referralCount: 0,
    referralCode: "",
    referralUrl: "",
    joinDate: "",
    lastClaimDate: null,
  })
  const [isCopied, setIsCopied] = useState(false)
  const [cdtPrice, setCdtPrice] = useState<number | null>(null)

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

      // Obtener el username del usuario
      try {
        const usernameResponse = await fetch(`/api/username?wallet_address=${identifier}`)
        if (usernameResponse.ok) {
          const usernameData = await usernameResponse.json()
          if (usernameData.username) {
            setUsername(usernameData.username)
          }
        }
      } catch (error) {
        console.error("Error fetching username:", error)
      }

      // Obtener datos de staking y referidos
      try {
        // Obtener datos de staking
        const stakingResponse = await fetch(`/api/staking?wallet_address=${identifier}`)
        let stakedAmount = 0

        if (stakingResponse.ok) {
          const stakingData = await stakingResponse.json()
          stakedAmount = stakingData.staked_amount || 0
        }

        // Obtener datos de referidos y total reclamado
        const userDataResponse = await fetch(`/api/user-data?wallet_address=${identifier}`)
        let referralCount = 0
        let totalClaimed = 0

        if (userDataResponse.ok) {
          const userData = await userDataResponse.json()
          referralCount = userData.referralCount || 0
          totalClaimed = userData.totalClaimed || 0
        }

        // Actualizar estadísticas del usuario
        const referralCode = username || "user" + Math.floor(Math.random() * 1000)
        const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "https://tribovault.com"

        setUserStats({
          totalStaked: stakedAmount,
          totalClaimed: totalClaimed,
          referralCount: referralCount,
          referralCode: referralCode,
          referralUrl: `${websiteUrl}?ref=${referralCode}`,
          joinDate: new Date(Date.now() - Math.random() * 10000000000).toISOString().split("T")[0], // Temporal
          lastClaimDate: new Date(Date.now() - Math.random() * 1000000000).toISOString(), // Temporal
        })
      } catch (error) {
        console.error("Error fetching user data:", error)
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
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [getUserIdentifier, username])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    fetchUserData()
  }, [isAuthenticated, router, fetchUserData])

  // Función para copiar la URL de referido
  const copyReferralUrl = () => {
    navigator.clipboard.writeText(userStats.referralUrl)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
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
    // 0.1% diario durante 365 días con interés compuesto
    if (userStats.totalStaked) {
      let amount = userStats.totalStaked
      for (let i = 0; i < 365; i++) {
        amount += amount * 0.001 // 0.1% diario
      }
      return Math.round(amount - userStats.totalStaked)
    }
    return 0
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
          {/* Título de la página */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white">Perfil de Usuario</h2>
            <p className="text-gray-400 mt-1">Gestiona tu cuenta y revisa tus estadísticas</p>
          </div>

          {/* Tarjeta de perfil */}
          <div className="mb-6 bg-black rounded-xl shadow-lg p-6 border border-gray-800">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-[#4ebd0a] rounded-full flex items-center justify-center text-2xl font-bold text-black">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-white">@{username}</h3>
                <p className="text-gray-400 text-sm">Miembro desde {userStats.joinDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Wallet Address</p>
                <p className="text-sm font-mono text-white truncate">
                  {session?.user?.walletAddress || "0x0000...0000"}
                </p>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Último claim</p>
                <p className="text-sm text-white">
                  {userStats.lastClaimDate
                    ? new Date(userStats.lastClaimDate).toLocaleDateString() +
                      " " +
                      new Date(userStats.lastClaimDate).toLocaleTimeString()
                    : "Nunca"}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-4 mt-2">
              <h4 className="text-lg font-semibold text-[#4ebd0a] mb-3">Programa de Referidos</h4>
              <p className="text-sm text-gray-300 mb-4">
                Invita a tus amigos a TRIBO Vault y ayuda a crecer la comunidad
              </p>

              <div className="bg-gray-900/50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-400 mb-2">Tu enlace de referido</p>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={userStats.referralUrl}
                    readOnly
                    className="flex-1 bg-black border border-gray-700 rounded-l-md px-3 py-2 text-sm font-mono text-white"
                  />
                  <button
                    onClick={copyReferralUrl}
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
              </div>

              <div className="bg-gray-900/50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-400">Referidos activos</p>
                    <p className="text-xl font-bold text-white">{userStats.referralCount}</p>
                  </div>
                  <Link href="/referrals" className="text-[#4ebd0a] text-sm hover:underline flex items-center">
                    Ver detalles
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
                      className="ml-1"
                    >
                      <path d="m9 18 6-6-6-6"></path>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Estadísticas de Staking</h3>

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
                    <p className="text-lg font-semibold text-[#4ebd0a]">44.02%</p>
                  </div>
                </div>
              </div>

              <div className="bg-black rounded-xl shadow-lg p-6 border border-gray-800">
                <h4 className="text-lg font-semibold text-[#4ebd0a] mb-2">Historial de Claims</h4>
                <p className="text-3xl font-bold text-white mb-1">{userStats.totalClaimed.toLocaleString()} CDT</p>
                <p className="text-sm text-gray-400">≈ ${calculateUsdValue(userStats.totalClaimed)} USD reclamados</p>

                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-400">Último claim</p>
                    <p className="text-sm text-white">
                      {userStats.lastClaimDate ? new Date(userStats.lastClaimDate).toLocaleDateString() : "Nunca"}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-400">Promedio diario</p>
                    <p className="text-sm text-white">{Math.round(userStats.totalClaimed / 30).toLocaleString()} CDT</p>
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

            <div className="bg-black rounded-xl shadow-lg p-6 border border-gray-800">
              <h4 className="text-lg font-semibold text-[#4ebd0a] mb-4">Información del Token</h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Precio actual</p>
                  <p className="text-lg font-semibold text-white">${cdtPrice?.toFixed(9) || "0.000000000"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Cambio 24h</p>
                  <p className="text-lg font-semibold text-green-500">+2.34%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Market Cap</p>
                  <p className="text-lg font-semibold text-white">$1.23M</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Volumen 24h</p>
                  <p className="text-lg font-semibold text-white">$45.6K</p>
                </div>
              </div>

              <div className="mt-4 text-center">
                <Link
                  href="https://www.geckoterminal.com/worldchain/pools/0x3cb880f7ac84950c369e700dee2778d023b0c52d"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4ebd0a] text-sm hover:underline inline-flex items-center"
                >
                  Ver en Gecko Terminal
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
                    className="ml-1"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </Link>
              </div>
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
