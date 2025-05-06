"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWorldAuth } from "next-world-auth/react"
import Header from "@/src/components/Header"
import Navbar from "@/src/components/Navbar"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated, session } = useWorldAuth()
  const router = useRouter()

  // Simplificamos la verificación para evitar redirecciones innecesarias
  useEffect(() => {
    // Solo verificamos si el usuario está autenticado
    if (!isAuthenticated) {
      console.log("AuthLayout - No autenticado, redirigiendo a /")
      router.push("/")
    } else {
      console.log("AuthLayout - Usuario autenticado:", session)
    }
    setIsLoading(false)
  }, [isAuthenticated, router, session])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ebd0a]"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <Header />

      {/* Contenido principal con padding para el header y navbar */}
      <div className="pt-16 pb-20 px-4">{children}</div>

      {/* Navbar */}
      <Navbar />
    </div>
  )
}
