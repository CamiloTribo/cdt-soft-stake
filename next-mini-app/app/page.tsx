"use client"

import Image from "next/image"
import { useWorldAuth } from "next-world-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { useTranslation } from "../src/components/TranslationProvider"
import { LanguageSelector } from "../src/components/LanguageSelector"

export default function Home() {
  const { t } = useTranslation()
  const { isLoading, isAuthenticated, session, signInWallet, signInWorldID } = useWorldAuth()

  const router = useRouter()
  const [username, setUsername] = useState("")
  const [isSavingUsername, setIsSavingUsername] = useState(false)
  const [showUsernameForm, setShowUsernameForm] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [isMascotHovered, setIsMascotHovered] = useState(false)

  // Función para obtener un identificador único del usuario
  const getUserIdentifier = useCallback(() => {
    if (!session || !session.user || !session.user.walletAddress) return null
    return session.user.walletAddress
  }, [session])

  // Verificar si el usuario está autenticado - Simplificado para evitar redirecciones automáticas
  useEffect(() => {
    if (isAuthenticated && session?.isAuthenticatedWallet) {
      console.log("Usuario autenticado:", session)
      // No hacemos nada automáticamente para evitar ciclos
    }
  }, [isAuthenticated, session])

  // Función para manejar el clic en la mascota - Simplificada para ir al dashboard
  const handleMascotClick = () => {
    if (isAuthenticated && session?.isAuthenticatedWallet) {
      router.push("/dashboard")
    }
  }

  // Modifica la función handleWorldIDSignIn para simplificarla
  const handleWorldIDSignIn = () => {
    console.log("Botón de verificación humana clickeado")

    try {
      console.log("Objeto session:", session)
      console.log("Intentando llamar a signInWorldID")

      // Llamar a signInWorldID con un parámetro mínimo
      signInWorldID({ state: "exampleState" })

      console.log("signInWorldID llamado exitosamente")
    } catch (error) {
      console.error("Error al llamar signInWorldID:", error)
    }
  }

  // Función para guardar username
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
        console.log("Username guardado correctamente, redirigiendo a dashboard")

        // Añadir un pequeño retraso antes de redirigir
        setTimeout(() => {
          router.push("/dashboard")
        }, 500)
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
    if (isAuthenticated && session?.isAuthenticatedWallet) {
      handleContinueToDashboard()
    }
  }, [isAuthenticated, session, handleContinueToDashboard])

  // Efecto para registrar el estado del botón en la consola
  useEffect(() => {
    console.log("Estado del botón - disabled:", session?.isAuthenticatedWorldID)
  }, [session?.isAuthenticatedWorldID])

  return (
    <div className="min-h-screen bg-black text-white">
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

      <main className="container max-w-4xl mx-auto px-4 py-12 pt-20 flex flex-col items-center">
        {/* Main Content */}
        {isLoading ? (
          <div className="flex items-center justify-center mt-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ebd0a]"></div>
          </div>
        ) : (
          <div className="w-full">
            {/* Mascota DETECTRIBER - Reemplazando al Jefe Tribo */}
            {(!isAuthenticated || !showUsernameForm) && (
              <div className="relative flex justify-center mb-8">
                <div
                  className={`relative cursor-pointer transition-transform duration-300 ${
                    isMascotHovered ? "scale-110" : ""
                  }`}
                  onMouseEnter={() => setIsMascotHovered(true)}
                  onMouseLeave={() => setIsMascotHovered(false)}
                  onClick={handleMascotClick}
                >
                  <Image src="/DETECTRIBER.png" alt="Detectriber" width={200} height={200} className="animate-pulse" />
                  {/* Texto flotante que aparece al hacer hover */}
                  {isMascotHovered && (
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 px-4 py-2 rounded-full border border-[#4ebd0a] whitespace-nowrap">
                      {t("verify_human_detective")}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sección de verificación y conexión */}
            {(!isAuthenticated || !showUsernameForm) && (
              <div className="bg-black border border-[#4ebd0a] rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-center text-white">{t("verify_as_human")}</h2>
                <p className="text-center text-sm text-gray-400 mb-6">{t("verify_human_explanation")}</p>

                {/* Botones de verificación y conexión */}
                <div className="flex flex-col gap-4">
                  {/* Botón de verificación humana - Usando una función intermedia para manejar el parámetro state */}
                  <button
                    onClick={handleWorldIDSignIn}
                    className="w-full px-6 py-3 bg-[#ff1744] hover:bg-[#ff2954] text-white font-medium rounded-md transition-colors"
                    disabled={session?.isAuthenticatedWorldID}
                    data-testid="verify-human-button"
                  >
                    {session?.isAuthenticatedWorldID ? "✓ Verificado como humano" : t("verify_as_human")}
                  </button>

                  {/* Botón de conectar wallet */}
                  <button
                    onClick={signInWallet}
                    className="w-full px-6 py-3 bg-[#4ebd0a] hover:bg-[#3fa008] text-black font-medium rounded-md transition-colors"
                    disabled={session?.isAuthenticatedWallet}
                  >
                    {session?.isAuthenticatedWallet ? "✓ Wallet conectada" : t("connect")}
                  </button>

                  {/* Botón para continuar al dashboard si está autenticado */}
                  {isAuthenticated && session?.isAuthenticatedWallet && (
                    <button
                      onClick={handleContinueToDashboard}
                      className="w-full px-6 py-3 bg-[#4ebd0a] hover:bg-[#3fa008] text-black font-medium rounded-md transition-colors mt-4"
                    >
                      {t("go_dashboard")}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Username Form - Solo se muestra si el usuario está autenticado pero no tiene username */}
            {isAuthenticated && session?.isAuthenticatedWallet && showUsernameForm && (
              <div className="bg-black border border-[#4ebd0a] rounded-xl shadow-lg p-8 mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-white">{t("welcome_tribo")}</h2>
                <p className="text-gray-300 mb-6">{t("choose_name")}</p>

                <div className="mb-6">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
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

                {usernameError && (
                  <div className="mb-4 p-3 bg-black border border-[#ff1744] rounded-md">
                    <p className="text-sm text-[#ff1744]">{usernameError}</p>
                  </div>
                )}

                <button
                  onClick={handleSaveUsername}
                  disabled={isSavingUsername || !username}
                  className={`w-full px-6 py-3 rounded-md ${
                    isSavingUsername || !username
                      ? "bg-gray-700 cursor-not-allowed"
                      : "bg-[#ff1744] hover:bg-[#ff2954] text-white"
                  } font-medium transition-colors`}
                >
                  {isSavingUsername ? t("saving") : t("continue_dashboard")}
                </button>
              </div>
            )}

            {/* Sección de ganancias */}
            {(!isAuthenticated || !showUsernameForm) && (
              <div className="bg-black border border-[#4ebd0a] rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-center text-white">{t("earn_daily")}</h2>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-black/50 p-4 rounded-lg border border-gray-800 text-center">
                    <p className="text-sm text-gray-400 mb-1">{t("daily")}</p>
                    <p className="text-xl font-bold text-[#4ebd0a]">0.1%</p>
                  </div>
                  <div className="bg-black/50 p-4 rounded-lg border border-gray-800 text-center">
                    <p className="text-sm text-gray-400 mb-1">{t("monthly")}</p>
                    <p className="text-xl font-bold text-[#4ebd0a]">3%</p>
                  </div>
                  <div className="bg-black/50 p-4 rounded-lg border border-gray-800 text-center">
                    <p className="text-sm text-gray-400 mb-1">{t("yearly")}</p>
                    <p className="text-xl font-bold text-[#4ebd0a]">36.5%</p>
                  </div>
                </div>

                <p className="text-center text-sm text-gray-400 mb-6">{t("how_works_desc")}</p>
              </div>
            )}

            {/* Resto del contenido... */}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500">
        <p>{t("footer_home")}</p>
      </footer>
    </div>
  )
}
