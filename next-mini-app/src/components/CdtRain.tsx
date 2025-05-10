"use client"

import type React from "react"

interface CdtRainProps {
  count: number
  duration: number
}

const CdtRain: React.FC<CdtRainProps> = ({ count, duration }) => {
  const cdtRainStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    overflow: "hidden",
    zIndex: 1000,
  } as React.CSSProperties

  const cdtTokenStyle = (index: number): React.CSSProperties => {
    // Usar el índice para crear variación en el tamaño
    const size = 25 + (index % 3) * 5 // Tamaños entre 25px y 35px

    const randomX = Math.random() * 100
    const randomOffset = Math.random() * 10 - 5
    const animationDelay = (Math.random() * duration) % duration

    return {
      position: "absolute",
      top: "-10%",
      left: `${randomX}%`,
      width: `${size}px`,
      height: `${size}px`,
      backgroundImage: "url(/TOKEN CDT.png)",
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      animation: `cdtFall ${duration}s linear infinite`,
      animationDelay: `${animationDelay}s`,
      transform: `translateX(${randomOffset}px)`,
    } as React.CSSProperties
  }

  const keyframesStyle = `
    @keyframes cdtFall {
      0% {
        transform: translateY(0) translateX(${Math.random() * 20 - 10}px);
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      80% {
        opacity: 1;
      }
      100% {
        transform: translateY(110vh) translateX(${Math.random() * 20 - 10}px);
        opacity: 0;
      }
    }
  `

  return (
    <div style={cdtRainStyle}>
      <style>{keyframesStyle}</style>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} style={cdtTokenStyle(index)} />
      ))}
    </div>
  )
}

export default CdtRain
