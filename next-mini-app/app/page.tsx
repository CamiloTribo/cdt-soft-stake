"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { useWorldAuth } from "next-world-auth/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "../src/components/TranslationProvider"
import { LanguageSelector } from "../src/components/LanguageSelector"
import VaultDial from "../src/components/VaultDial"
import { CountrySelector } from "../src/components/CountrySelector"
import { CountryCounter } from "../src/components/CountryCounter"

export default function Home() {
  const { t } = useTranslation()
  const { isLoading, isAuthenticated, session, signInWallet, signInWorldID } = useWorldAuth()
  const router = useRouter()

  const [showVault, setShowVault] = useState(false)
  const [username, setUsername] = useState("")
  const [isSavingUsername, setIsSavingUsername] = useState(false)
  const [showUsernameForm, setShowUsernameForm] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [isMascotHovered, setIsMascotHovered] = useState(false)
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)
  const [totalUsers, setTotalUsers] = useState(0)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // Estado para el país
  const [country, setCountry] = useState("")

  // Referencia para controlar si ya se inició la verificación
  const worldIDInitiated = useRef(false)

  // Función para obtener un identificador único del usuario
  const getUserIdentifier = useCallback(() => {
    if (!session || !session.user || !session.user.walletAddress) return null
    return session.user.walletAddress
  }, [session])

  // Función para obtener contadores de usuarios
  const fetchUserCounts = useCallback(async () => {
    try {
      setIsLoadingUsers(true)
      const response = await fetch("/api/total-users-count")
      if (response.ok) {
        const data = await response.json()
        if (data.count !== undefined) {
          setTotalUsers(data.count)
        }
      }
    } catch (error) {
      console.error("Error fetching user counts:", error)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [])

  // Cargar contadores de usuarios al inicio
  useEffect(() => {
    fetchUserCounts()
  }, [fetchUserCounts])

  // NUEVO: Iniciar verificación de World ID automáticamente
  useEffect(() => {
    // Solo iniciar si no está cargando, no está autenticado y no se ha iniciado antes
    if (!isLoading && !isAuthenticated && !worldIDInitiated.current) {
      console.log("Iniciando verificación de World ID automáticamente")
      worldIDInitiated.current = true

      // Pequeño retraso para asegurar que todo esté cargado
      const timer = setTimeout(() => {
        signInWorldID({ state: "verification" })
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [isLoading, isAuthenticated, signInWorldID])

  // Efecto para mostrar el dial después de la verificación
  useEffect(() => {
    // Si el usuario está autenticado con World ID, mostrar el dial
    if (isAuthenticated && session?.isAuthenticatedWorldID) {
      console.log("Usuario verificado con World ID, mostrando dial")
      setShowVault(true)
    }
  }, [isAuthenticated, session])

  // Nuevo efecto para actualizar el nivel de verificación
  useEffect(() => {
    // Solo ejecutar si el usuario está autenticado
    if (isAuthenticated && session?.user?.walletAddress) {
      // CAMBIO IMPORTANTE: Ahora siempre asignamos "human" como nivel de verificación
      // cuando el usuario se autentica con wallet
      const verificationLevel = "human"

      console.log("Actualizando nivel de verificación:", verificationLevel)

      // Actualizar el nivel de verificación en la base de datos
      fetch("/api/update-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: session.user.walletAddress,
          verification_level: verificationLevel,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            console.error("Error updating verification level")
          } else {
            console.log("Nivel de verificación actualizado correctamente")
            // Actualizar contadores después de verificación
            fetchUserCounts()
          }
        })
        .catch((error) => {
          console.error("Error updating verification level:", error)
        })
    }
  }, [isAuthenticated, session, fetchUserCounts])

  // Función para manejar el clic en la mascota - Ahora muestra mensaje si no está verificado
  const handleMascotClick = () => {
    // CAMBIO: Ahora solo verificamos si está autenticado con wallet
    if (isAuthenticated && session?.isAuthenticatedWallet) {
      router.push("/dashboard")
    } else {
      setShowVerificationMessage(true)
      setTimeout(() => {
        setShowVerificationMessage(false)
      }, 3000)
    }
  }

  // Función para manejar el cambio de país
  const handleCountryChange = (value: string) => {
    setCountry(value)
  }

  // Función para guardar username y país
  const handleSaveUsername = async () => {
    const identifier = getUserIdentifier()
    if (!identifier || !username) {
      console.error("No hay identifier o username")
      return
    }

    try {
      setIsSavingUsername(true)
      setUsernameError(null)

      console.log("Guardando username:", username, "para wallet:", identifier)

      // Primero guardamos el username
      const response = await fetch("/api/username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: identifier,
          username: username,
        }),
      })

      const data = await response.json()
      console.log("Respuesta al guardar username:", data)

      if (response.ok && data.success) {
        // Si se seleccionó un país, lo guardamos
        if (country) {
          try {
            const countryResponse = await fetch("/api/update-country", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                wallet_address: identifier,
                country: country,
              }),
            })

            if (!countryResponse.ok) {
              console.error("Error al guardar el país, pero continuamos con el flujo")
            }
          } catch (error) {
            console.error("Error al guardar el país:", error)
            // No bloqueamos el flujo si falla la actualización del país
          }
        }

        console.log("Username guardado correctamente, redirigiendo a dashboard")

        // Mostrar confeti
        setShowConfetti(true)

        // Añadir un pequeño retraso antes de redirigir
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        console.error("Error al guardar username:", data.error)
        setUsernameError(data.error || t("error_username"))
      }
    } catch (error) {
      console.error("Error registering username:", error)
      setUsernameError(t("error_username"))
    } finally {
      setIsSavingUsername(false)
    }
  }

  // Función para verificar si el usuario tiene username y redirigir al dashboard
  const handleContinueToDashboard = useCallback(async () => {
    const identifier = getUserIdentifier()
    if (!identifier) {
      console.error("No se pudo obtener identificador de usuario")
      return
    }

    try {
      const response = await fetch(`/api/username?wallet_address=${identifier}`)
      const data = await response.json()

      if (response.ok) {
        if (data.hasUsername) {
          router.push("/dashboard")
        } else {
          setShowUsernameForm(true)
        }
      }
    } catch (error) {
      console.error("Error checking username:", error)
      setShowUsernameForm(true)
    }
  }, [getUserIdentifier, router])

  useEffect(() => {
    // CAMBIO: Ahora solo verificamos si está autenticado con wallet
    if (isAuthenticated && session?.isAuthenticatedWallet) {
      handleContinueToDashboard()
    }
  }, [isAuthenticated, session, handleContinueToDashboard])

  // Función para manejar el desbloqueo de la caja fuerte
  const handleVaultUnlock = () => {
    setShowVault(false)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header simplificado para la página de inicio */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Image src="/LOGO TRIBO Vault- sin fondo.png" alt="Tribo Logo" width={28} height={28} className="mr-2" />
            <h1 className="text-xl font-bold">{t("tribo_vault")}</h1>
          </div>
          <LanguageSelector />
        </div>
      </div>

      {/* Contenido principal centrado verticalmente */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ebd0a]"></div>
          </div>
        ) : (
          <>
            {/* Mostrar el dial de la caja fuerte después de la verificación */}
            {showVault ? (
              <div className="flex flex-col items-center">
                <VaultDial onUnlockAction={handleVaultUnlock} />
                <p className="text-center text-gray-400 mt-8">{t("turn_to_unlock")}</p>
              </div>
            ) : (
              <>
                {/* Sección de mascota y autenticación */}
                {(!isAuthenticated || !showUsernameForm) && (
                  <div className="w-full flex flex-col items-center justify-center">
                    {/* Mascota DETECTRIBER - Con bocadillo siempre visible */}
                    <div className="detectriber-container flex justify-center mb-8 w-full">
                      <div className="speech-bubble">
                        <p className="text-center text-sm break-words">
                          {showVerificationMessage ? t("verify_first") : t("detectriber_message")}
                        </p>
                      </div>

                      <div
                        className={`relative cursor-pointer transition-transform duration-300 ${
                          isMascotHovered ? "scale-105" : ""
                        }`}
                        onMouseEnter={() => setIsMascotHovered(true)}
                        onMouseLeave={() => setIsMascotHovered(false)}
                        onClick={handleMascotClick}
                      >
                        <Image
                          src="/DETECTRIBER.png"
                          alt="Detectriber"
                          width={320}
                          height={320}
                          className={`${isMascotHovered ? "animate-bounce" : "animate-pulse"}`}
                        />
                      </div>
                    </div>

                    {/* Botón de conectar wallet - ACTUALIZADO */}
                    <button
                      onClick={signInWallet}
                      className="w-full max-w-xs px-6 py-4 bg-[#4ebd0a] hover:bg-[#3fa008] text-black font-medium rounded-full transition-colors text-lg shadow-lg shadow-[#4ebd0a]/20"
                      disabled={session?.isAuthenticatedWallet}
                    >
                      {session?.isAuthenticatedWallet ? "✓ Wallet conectada" : t("sign_in")}
                    </button>

                    {/* Botón para continuar al dashboard si está autenticado - ACTUALIZADO */}
                    {isAuthenticated && session?.isAuthenticatedWallet && (
                      <button
                        onClick={handleContinueToDashboard}
                        className="w-full max-w-xs px-6 py-4 bg-[#4ebd0a] hover:bg-[#3fa008] text-black font-medium rounded-full transition-colors mt-4 text-lg shadow-lg shadow-[#4ebd0a]/20"
                      >
                        {t("entering_vault")}
                      </button>
                    )}
                  </div>
                )}

                {/* Username Form - Solo se muestra si el usuario está autenticado pero no tiene username */}
                {isAuthenticated && session?.isAuthenticatedWallet && showUsernameForm && (
                  <div className="w-full max-w-md flex flex-col items-center mb-20">
                    {/* Imagen decorativa arriba del formulario - reducimos tamaño */}
                    <div className="mb-4">
                      <Image
                        src="/Jefe Tribo Discord.png"
                        alt="Jefe Tribo"
                        width={100}
                        height={100}
                        className="animate-pulse"
                      />
                    </div>

                    <div className="w-full bg-black border border-[#4ebd0a] rounded-xl shadow-lg p-6 mb-4 relative overflow-hidden">
                      <h2 className="text-xl font-semibold mb-4 text-white text-center">{t("welcome_tribo")}</h2>
                      <p className="text-gray-300 mb-4 text-center">{t("choose_name")}</p>

                      <div className="mb-4">
                        <label htmlFor="username" className="block text-sm font-medium text-[#4ebd0a] mb-2">
                          {t("triber_name")}
                        </label>
                        <input
                          type="text"
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder={t("enter_name")}
                          className="w-full px-4 py-3 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-[#4ebd0a] focus:border-[#4ebd0a] bg-black text-white"
                        />
                      </div>

                      {/* Selector de país */}
                      <div className="mb-4">
                        <label htmlFor="country" className="block text-sm font-medium text-[#4ebd0a] mb-2">
                          {t("select_your_country")}
                        </label>
                        <CountrySelector value={country} onChangeAction={handleCountryChange} className="w-full" />
                        <p className="text-xs text-gray-500 mt-1">{t("country_optional")}</p>
                      </div>

                      {usernameError && (
                        <div className="mb-4 p-2 bg-black border border-[#ff1744] rounded-md">
                          <p className="text-sm text-[#ff1744]">{usernameError}</p>
                        </div>
                      )}

                      <button
                        onClick={handleSaveUsername}
                        disabled={isSavingUsername || !username}
                        className={`w-full px-6 py-3 rounded-full ${
                          isSavingUsername || !username
                            ? "bg-gray-700 cursor-not-allowed"
                            : "bg-[#4ebd0a] hover:bg-[#3fa008] text-black"
                        } font-medium transition-colors shadow-lg`}
                      >
                        {isSavingUsername ? t("saving") : t("continue_dashboard")}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confeti cuando se guarda el username */}
                {showConfetti && <Confetti />}
              </>
            )}
          </>
        )}
      </main>

      {/* Barra inferior fija con contador de usuarios y países */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md py-2 px-4 z-30">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Contador de usuarios verificados */}
          <div className="flex items-center bg-[#4ebd0a]/10 px-4 py-2 rounded-full border border-[#4ebd0a]/30">
            <div className="h-8 w-8 flex items-center justify-center bg-[#4ebd0a]/20 rounded-full mr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4ebd0a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="m16 11 2 2 4-4" />
              </svg>
            </div>
            <span className="text-gray-300 text-sm">
              {t("verified_humans")}:{" "}
              <span className="text-[#4ebd0a] font-medium">
                {isLoadingUsers ? (
                  <span className="inline-block w-8 h-4 bg-gray-700 animate-pulse rounded"></span>
                ) : (
                  totalUsers.toLocaleString()
                )}
              </span>
            </span>
          </div>

          {/* Contador de países */}
          <CountryCounter />
        </div>
      </div>

      {/* Modificar el estilo global para permitir scroll en la pantalla de registro */}
      <style jsx global>{`
        html,
        body {
          width: 100vw;
          height: 100vh;
          overscroll-behavior: none;
        }
        
        /* Eliminamos overflow: hidden para permitir scroll */
        
        .detectriber-container {
          margin-top: 2rem;
          position: relative;
          padding-top: 3rem; /* Espacio para el bocadillo */
        }
        
        .speech-bubble {
          position: absolute;
          top: -2.5rem;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.8);
          border: 1px solid #4ebd0a;
          border-radius: 9999px;
          padding: 0.5rem 1rem;
          z-index: 10;
          max-width: 90%;
          margin: 0 auto;
          white-space: normal;
        }
        
        .speech-bubble:after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid #4ebd0a;
        }
        
        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 100;
        }
        
        .confetti {
          position: absolute;
          top: -10px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: confetti-fall 3s ease-in-out forwards;
        }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

// Componente de confeti
function Confetti() {
  return (
    <div className="confetti-container">
      {Array.from({ length: 100 }).map((_, i) => (
        <div
          key={i}
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
          }}
        />
      ))}
    </div>
  )
}
