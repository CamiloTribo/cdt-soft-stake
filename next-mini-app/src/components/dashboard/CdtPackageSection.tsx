"use client"

import { useState } from "react"
import Image from "next/image"
import { useTranslation } from "../TranslationProvider"
import { CdtPackageModal } from "./CdtPackageModal"

export type PackageType = "basic" | "premium"

interface CdtPackageSectionProps {
  walletAddress: string
  username: string
}

export function CdtPackageSection({ walletAddress, username }: CdtPackageSectionProps) {
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null)

  const openModalWithPackage = (packageType: PackageType) => {
    setSelectedPackage(packageType)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedPackage(null)
  }

  return (
    <>
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] border border-secondary/30 rounded-xl p-6 relative overflow-hidden mb-6">
        {/* Efectos de fondo */}
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-transparent"></div>

        {/* Contenido principal */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
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

          <div className="space-y-4">
            {/* Botón para Paquete Básico */}
            <button
              onClick={() => openModalWithPackage("basic")}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold py-3 px-6 rounded-full hover:shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition-all duration-300"
              aria-label={t("buy_basic_package_cta_aria_label")} // defaultValue eliminado
            >
              {t("buy_basic_package_cta")} {/* defaultValue eliminado */}
            </button>

            {/* Botón para Paquete Premium */}
            <button
              onClick={() => openModalWithPackage("premium")}
              className="w-full bg-gradient-to-r from-secondary to-[#ff4081] text-white font-bold py-3 px-6 rounded-full hover:shadow-lg hover:shadow-secondary/25 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75 transition-all duration-300"
              aria-label={t("buy_premium_package_cta_aria_label")} // defaultValue eliminado
            >
              {t("buy_premium_package_cta")} {/* defaultValue eliminado */}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedPackage && (
        <CdtPackageModal
          isOpen={showModal}
          onCloseAction={closeModal}
          walletAddress={walletAddress}
          username={username}
          packageType={selectedPackage} 
        />
      )}
    </>
  )
}