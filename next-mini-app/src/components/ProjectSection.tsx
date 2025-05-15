import type { ReactNode } from "react"

interface ProjectSectionProps {
  title: string
  children: ReactNode
  className?: string
  titleClassName?: string
}

export default function ProjectSection({ title, children, className = "", titleClassName = "" }: ProjectSectionProps) {
  return (
    <section className={`mb-10 ${className}`}>
      <h2 className={`text-2xl font-bold text-[#4ebd0a] mb-4 ${titleClassName}`}>{title}</h2>
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">{children}</div>
    </section>
  )
}
