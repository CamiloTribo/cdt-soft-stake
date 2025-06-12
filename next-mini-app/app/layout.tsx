import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { WorldAuthProvider } from "next-world-auth/react"
import { TranslationProvider } from "../src/components/TranslationProvider"
import MaintenanceMode from "../src/components/MaintenanceMode"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tribo Vault - Mantenimiento",
  description: "Sistema temporalmente en mantenimiento",
}

// 🚨 MODO MANTENIMIENTO ACTIVO - Cambiar a false para desactivar
const MAINTENANCE_MODE = false

// Forzar no-cache para el modo mantenimiento
export const dynamic = "force-dynamic"
export const revalidate = 0

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Log para debug
  console.log("🔧 MAINTENANCE_MODE:", MAINTENANCE_MODE)

  return (
    <html lang="es">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={`${inter.className} bg-black text-white`}>
        <TranslationProvider>
          <WorldAuthProvider>{MAINTENANCE_MODE ? <MaintenanceMode /> : children}</WorldAuthProvider>
        </TranslationProvider>
      </body>
    </html>
  )
}
