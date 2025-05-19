interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  color?: string
  className?: string
}

export default function LoadingSpinner({ size = "md", color = "#4ebd0a", className = "" }: LoadingSpinnerProps) {
  // Determinar el tamaño basado en la prop
  const sizeClass = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }[size]

  const innerSizeClass = {
    sm: "inset-2",
    md: "inset-3",
    lg: "inset-4",
  }[size]

  const secondRingClass = {
    sm: "inset-1",
    md: "inset-1.5",
    lg: "inset-2",
  }[size]

  return (
    <div className={`relative ${sizeClass} ${className}`}>
      <div
        className="absolute inset-0 rounded-full border-t-2 border-r-2 animate-spin"
        style={{ borderColor: color }}
      ></div>
      <div
        className={`absolute ${innerSizeClass} rounded-full border-t-2 border-r-2 animate-spin animation-delay-150`}
        style={{ borderColor: `${color}70` }}
      ></div>
      <div
        className={`absolute ${secondRingClass} rounded-full border-t-2 border-r-2 animate-spin animation-delay-300`}
        style={{ borderColor: `${color}40` }}
      ></div>
    </div>
  )
}
