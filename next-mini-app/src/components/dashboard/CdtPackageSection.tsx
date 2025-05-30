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
                <Image
                  src="/BOX_TRIBO VAULT_CDT.png"
                  alt="CDT Package Box"
                  width={60}
                  height={60}
                  className="drop-shadow-lg"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full animate-ping"></div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-secondary flex items-center">💰 {t("buy_cdt_packages")}</h3>
                <p className="text-gray-400 text-sm">{t("get_cdt_instantly")}</p>
              </div>
            </div>
          </div>

          {/* Información del paquete */}
          <div className="bg-black/30 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">{t("package_price")}:</span>
              <span className="text-secondary font-bold text-lg">0.1 WLD</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-300">{t("cdt_amount")}:</span>
              <span className="text-secondary font-bold text-lg">50 CDT</span>
            </div>
          </div>

          {/* Botón de compra */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-gradient-to-r from-secondary to-[#ff4081] text-white font-bold py-3 px-6 rounded-full hover:shadow-lg hover:shadow-secondary/25 transition-all duration-300"
          >
            {t("buy_cdt_package")}
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
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
