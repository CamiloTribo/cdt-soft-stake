import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { WorldAuthProvider } from "next-world-auth/react"
import { TranslationProvider } from "../src/components/TranslationProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tribo Vault",
  description: "Gana un 0.1% diario stakeando tus tokens CDT",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-black text-white`}>
        <TranslationProvider>
          <WorldAuthProvider>{children}</WorldAuthProvider>
        </TranslationProvider>
      </body>
    </html>
  )
}
