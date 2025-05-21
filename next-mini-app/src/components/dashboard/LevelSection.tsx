"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useTranslation } from "../../components/TranslationProvider"
import { getUserLevel, getNextLevel, getProgressToNextLevel } from "../../lib/levels"
import type { TranslationKey } from "../../types/translations"

interface LevelSectionProps {
  stakedAmount: number
}

// Función para formatear números grandes
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}k`;
  }
  return num.toString();
};

export function LevelSection({ stakedAmount }: LevelSectionProps) {
  const { t } = useTranslation()
  const [showTooltip, setShowTooltip] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Convertir la función t para que acepte string en lugar de TranslationKey
  const tString = (key: string) => t(key as TranslationKey)

  const currentLevel = getUserLevel(stakedAmount, tString)
  const nextLevel = getNextLevel(stakedAmount, tString)
  const progress = getProgressToNextLevel(stakedAmount, tString)

  const handleImageClick = () => {
    setShowTooltip(!showTooltip)
  }

  return (
    <div className="mb-6 dashboard-card p-6 relative overflow-hidden">
      {/* Fondo con efecto de brillo según el nivel */}
      <div
        className="absolute inset-0 opacity-10 z-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${currentLevel.bgColor}, transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-lg font-semibold text-primary">{t("your_level")}</h4>

          {/* Enlace a la sección de rankings */}
          <Link
            href="/rankings?tab=levels"
            className="text-xs text-primary hover:text-primary-hover flex items-center transition-all duration-300"
          >
            {t("view_all_levels")}
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

        {/* Nivel actual con imagen */}
        <div className="flex items-center mb-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mr-3 overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-110 relative`}
            onClick={handleImageClick}
            style={{
              backgroundColor: `${currentLevel.bgColor}40`,
              boxShadow: `0 0 15px ${currentLevel.bgColor}60`,
            }}
          >
            <div
              className={`absolute inset-0 ${imageLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-500`}
            >
              <Image
                src={currentLevel.imageUrl || "/placeholder.svg"}
                alt={currentLevel.name}
                width={64}
                height={64}
                className="object-cover"
                onLoad={() => setImageLoaded(true)}
              />
            </div>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
          <div>
            {/* Nombre del nivel actual con el color del nivel */}
            <p 
              className="text-xl font-bold" 
              style={{ color: currentLevel.color }}
            >
              {currentLevel.name}
            </p>
            <p className="text-sm text-primary">
              {t("current_apy")}: {currentLevel.apy}%
            </p>
          </div>
        </div>

        {/* Tooltip informativo */}
        {showTooltip && (
          <div className="mb-3 p-3 bg-black/60 border border-primary/30 rounded-lg animate-fadeIn">
            <p className="text-sm text-white mb-1">{t("level_info")}</p>
            <p className="text-xs text-gray-400">{t("click_for_more_details")}</p>
          </div>
        )}

        {/* Progreso al siguiente nivel con animación */}
        {nextLevel ? (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">{t("progress_to_next")}</span>
              <span className="text-primary">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full animate-pulse-slow"
                style={{
                  width: `${progress}%`,
                  backgroundColor: currentLevel.color, // Usar el color del nivel actual
                  transition: "width 1s ease-in-out",
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">{formatNumber(currentLevel.minAmount)} CDT</span>
              <span className="text-gray-500">{formatNumber(nextLevel.minAmount)} CDT</span>
            </div>
          </div>
        ) : (
          <div className="mb-4 bg-gray-800/50 p-2 rounded-lg text-center">
            <p className="text-primary text-sm">{t("max_level_reached")}</p>
          </div>
        )}

        {/* Beneficios del nivel mejorados */}
        <div className="mb-4">
          <p 
            className="text-sm font-medium mb-2" 
            style={{ color: currentLevel.color }}
          >
            {t("level_benefits")}:
          </p>
          <ul className="space-y-1">
            {currentLevel.benefits.map((benefit, index) => (
              <li key={index} className="text-sm text-gray-400 flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={currentLevel.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* Siguiente nivel (si existe) con estilo mejorado */}
        {nextLevel && (
          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-center mb-1">
              <div
                className="w-6 h-6 rounded-full overflow-hidden mr-2"
                style={{ backgroundColor: `${nextLevel.bgColor}40` }}
              >
                <Image
                  src={nextLevel.imageUrl || "/placeholder.svg"}
                  alt={nextLevel.name}
                  width={24}
                  height={24}
                  className="object-cover"
                />
              </div>
              <p className="text-sm font-medium">
                {t("next_level")}: <span style={{ color: nextLevel.color }}>{nextLevel.name}</span>
              </p>
            </div>
            <p className="text-xs text-gray-400">
              {t("need")} {formatNumber(nextLevel.minAmount - stakedAmount)} {t("more_cdt")}
            </p>
          </div>
        )}
      </div>

      {/* Estilos globales para animaciones */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0% { opacity: 0.8; }
          50% { opacity: 1; }
          100% { opacity: 0.8; }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s infinite;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}