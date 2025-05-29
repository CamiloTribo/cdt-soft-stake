"use client"

import { useState } from "react"
import Image from "next/image"
import { useTranslation } from "../TranslationProvider"
import { CdtPackageModal } from "./CdtPackageModal"

interface CdtPackageSectionProps {
  walletAddress: string
  username: string
}

export function CdtPackageSection({ walletAddress, username }: CdtPackageSectionProps) {
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)

  // 🚨 DESACTIVADO COMPLETAMENTE - NO FUNCIONA

  // Validación básica antes de abrir el modal
  // const handleOpenModal = () => {
  //   // BLOQUEADO COMPLETAMENTE
  //   console.log("🚨 CDT PACKAGES: DESACTIVADO - EN MANTENIMIENTO")
  //   return
  // }

  return (
    <>
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] border border-secondary/30 rounded-xl p-6 relative overflow-hidden mb-6">
        {/* Efectos de fondo */}
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-transparent"></div>

        {/* Contenido principal */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Image src="/TOKEN CDT.png" alt="CDT Token" width={60} height={60} className="drop-shadow-lg" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-500 rounded-full"></div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-400 flex items-center">🔧 {t("buy_cdt_packages")}</h3>
                <p className="text-gray-500 text-sm">Funcionalidad en mantenimiento</p>
              </div>
            </div>
          </div>

          {/* Información del paquete */}
          <div className="bg-black/30 rounded-lg p-4 mb-4 opacity-50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500">{t("package_price")}:</span>
              <span className="text-gray-500 font-bold text-lg">0.1 WLD</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500">{t("cdt_amount")}:</span>
              <span className="text-gray-500 font-bold text-lg">50 CDT</span>
            </div>
          </div>

          {/* BOTÓN COMPLETAMENTE DESACTIVADO */}
          <div className="w-full bg-gray-600 text-gray-300 font-bold py-3 px-6 rounded-full text-center cursor-not-allowed">
            <div className="flex items-center justify-center gap-2">
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
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
              </svg>
              🔧 EN MANTENIMIENTO
            </div>
            <p className="text-xs mt-1 opacity-75">Funcionalidad temporalmente deshabilitada</p>
          </div>
        </div>
      </div>

      {/* MODAL COMPLETAMENTE BLOQUEADO */}
      {false && showModal && (
        <CdtPackageModal
          isOpen={showModal}
          onCloseAction={() => setShowModal(false)}
          walletAddress={walletAddress}
          username={username}
        />
      )}
    </>
  )
}