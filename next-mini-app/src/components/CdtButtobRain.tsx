"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

interface CdtButtonRainProps {
  isActive: boolean
  containerClassName?: string
}

const CdtButtonRain: React.FC<CdtButtonRainProps> = ({ isActive, containerClassName = "" }) => {
  const [tokens, setTokens] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; duration: number }>>([])

  // Generar tokens cuando el componente se monta o cuando isActive cambia
  useEffect(() => {
    if (isActive) {
      // Generar 8 tokens con posiciones aleatorias
      const newTokens = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // Posición horizontal aleatoria (%)
        y: -20 - Math.random() * 10, // Posición inicial por encima del contenedor
        size: 12 + Math.random() * 8, // Tamaño aleatorio entre 12px y 20px
        delay: Math.random() * 2, // Retraso aleatorio hasta 2s
        duration: 3 + Math.random() * 2, // Duración aleatoria entre 3s y 5s
      }))
      setTokens(newTokens)
    } else {
      setTokens([])
    }
  }, [isActive])

  if (!isActive || tokens.length === 0) {
    return null
  }

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${containerClassName}`}>
      {tokens.map((token) => (
        <div
          key={token.id}
          className="absolute"
          style={{
            left: `${token.x}%`,
            top: `${token.y}%`,
            width: `${token.size}px`,
            height: `${token.size}px`,
            animation: `cdtTokenFall ${token.duration}s linear infinite`,
            animationDelay: `${token.delay}s`,
          }}
        >
          <Image
            src="/TOKEN CDT.png"
            alt=""
            width={token.size}
            height={token.size}
            className="w-full h-full object-contain opacity-70"
          />
        </div>
      ))}

      <style jsx global>{`
        @keyframes cdtTokenFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          90% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(120%) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default CdtButtonRain
