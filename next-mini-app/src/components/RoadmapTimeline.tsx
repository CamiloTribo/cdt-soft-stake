"use client"

import { useTranslation } from "@/src/components/TranslationProvider"

interface TimelineItemProps {
  title: string
  date: string
  items: string[]
  isCurrent?: boolean
}

function TimelineItem({ title, date, items, isCurrent = false }: TimelineItemProps) {
  const { t } = useTranslation()

  return (
    <div className={`relative flex-1 ${isCurrent ? "opacity-100" : "opacity-80"}`}>
      <div
        className={`
          h-4 w-4 rounded-full absolute -left-2 top-0 z-10
          ${isCurrent ? "bg-[#4ebd0a] animate-pulse" : "bg-gray-600"}
        `}
      />
      <div
        className={`
        pl-6 pb-8 border-l-2 
        ${isCurrent ? "border-[#4ebd0a]" : "border-gray-700"}
      `}
      >
        <h3 className="text-lg font-bold mb-1">
          {title}
          {isCurrent && (
            <span className="ml-2 text-xs font-normal bg-[#4ebd0a] text-black px-2 py-0.5 rounded-full">
              {t("current")}
            </span>
          )}
        </h3>
        <p className="text-sm text-gray-400 mb-3">{date}</p>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="text-[#4ebd0a] mr-2">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function RoadmapTimeline() {
  const { t } = useTranslation()

  return (
    <div className="mt-6">
      <div className="flex flex-col md:flex-row gap-4">
        <TimelineItem
          title={t("q2_2025")}
          date={t("april_june")}
          items={[t("token_launch"), t("contract_redeploy"), t("community_growth")]}
          isCurrent={true}
        />

        <TimelineItem
          title={t("q3_2025")}
          date={t("july_september")}
          items={[t("ecosystem_development"), t("new_app_features"), t("partnerships_expansion")]}
        />

        <TimelineItem
          title={t("q4_2025")}
          date={t("october_december")}
          items={[t("nft_launch"), t("advanced_features"), t("token_utilities")]}
        />

        <TimelineItem
          title={t("q1_2026")}
          date={t("january_march")}
          items={[t("new_integrations"), t("global_expansion")]}
        />
      </div>
    </div>
  )
}
