"use client"
import { useTranslation } from "../../components/TranslationProvider"
import { getUserLevel, getNextLevel, getProgressToNextLevel } from "../../lib/levels"
import type { TranslationKey } from "../../types/translations"

interface LevelSectionProps {
  stakedAmount: number
}

export function LevelSection({ stakedAmount }: LevelSectionProps) {
  const { t } = useTranslation()

  // Convertir la función t para que acepte string en lugar de TranslationKey
  const tString = (key: string) => t(key as TranslationKey)

  const currentLevel = getUserLevel(stakedAmount, tString)
  const nextLevel = getNextLevel(stakedAmount, tString)
  const progress = getProgressToNextLevel(stakedAmount, tString)

  return (
    <div className="mb-6 dashboard-card p-6">
      <h4 className="text-lg font-semibold text-primary mb-2">{t("your_level")}</h4>

      {/* Nivel actual */}
      <div className="flex items-center mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mr-3"
          style={{ backgroundColor: `${currentLevel.color}30` }}
        >
          <span style={{ color: currentLevel.color }} className="font-bold text-lg">
            {currentLevel.name.charAt(0)}
          </span>
        </div>
        <div>
          <p className="text-xl font-bold text-white">{currentLevel.name}</p>
          <p className="text-sm text-primary">
            {t("current_apy")}: {currentLevel.apy}%
          </p>
        </div>
      </div>

      {/* Progreso al siguiente nivel */}
      {nextLevel ? (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">{t("progress_to_next")}</span>
            <span className="text-primary">{progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: nextLevel.color,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-500">{currentLevel.minAmount.toLocaleString()} CDT</span>
            <span className="text-gray-500">{nextLevel.minAmount.toLocaleString()} CDT</span>
          </div>
        </div>
      ) : (
        <div className="mb-4 bg-gray-800/50 p-2 rounded-lg text-center">
          <p className="text-primary text-sm">{t("max_level_reached")}</p>
        </div>
      )}

      {/* Beneficios del nivel */}
      <div className="mb-4">
        <p className="text-sm font-medium text-white mb-2">{t("level_benefits")}:</p>
        <ul className="space-y-1">
          {currentLevel.benefits.map((benefit, index) => (
            <li key={index} className="text-sm text-gray-400 flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
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

      {/* Siguiente nivel (si existe) */}
      {nextLevel && (
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
          <p className="text-sm font-medium text-white mb-1">
            {t("next_level")}: {nextLevel.name}
          </p>
          <p className="text-xs text-gray-400">
            {t("need")} {(nextLevel.minAmount - stakedAmount).toLocaleString()} {t("more_cdt")}
          </p>
        </div>
      )}
    </div>
  )
}
