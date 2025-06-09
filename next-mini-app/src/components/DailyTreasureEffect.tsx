"use client"

import { useEffect, useState } from "react"

interface DailyTreasureEffectProps {
  active: boolean
}

export function DailyTreasureEffect({ active }: DailyTreasureEffectProps) {
  const [particles, setParticles] = useState<Array<{ id: number; left: string; animationDelay: string }>>([])

  // Generar partículas cuando el efecto está activo
  useEffect(() => {
    if (active) {
      const newParticles = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
      }))
      setParticles(newParticles)
    } else {
      setParticles([])
    }
  }, [active])

  if (!active) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full bg-yellow-400 opacity-70 animate-float"
          style={{
            left: particle.left,
            animationDelay: particle.animationDelay,
            boxShadow: "0 0 10px 2px rgba(234, 179, 8, 0.6)",
          }}
        />
      ))}

      {/* Resplandor dorado alrededor del dial */}
      <div
        className="absolute inset-0 rounded-full bg-yellow-400/10 animate-pulse-slow"
        style={{ boxShadow: "0 0 30px 10px rgba(234, 179, 8, 0.3)" }}
      />
    </div>
  )
}
