/**
 * Efecto visual de CDT saliendo del centro de la pantalla
 * Reutilizable para diferentes componentes
 */
export const showCDTEffect = () => {
  // Crear elementos CDT y animarlos
  const container = document.createElement("div")
  container.className = "cdt-container"
  document.body.appendChild(container)

  // Crear 20 tokens CDT
  for (let i = 0; i < 20; i++) {
    const cdt = document.createElement("div")
    cdt.className = "cdt-token"

    // Posición aleatoria
    const angle = Math.random() * 360
    const distance = 50 + Math.random() * 150
    const delay = Math.random() * 0.5

    cdt.style.setProperty("--angle", `${angle}deg`)
    cdt.style.setProperty("--distance", `${distance}px`)
    cdt.style.setProperty("--delay", `${delay}s`)

    container.appendChild(cdt)
  }

  // Eliminar después de la animación
  setTimeout(() => {
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
  }, 2000)
}

/**
 * Efecto visual más intenso para compras grandes
 * @param tokenCount - Número de tokens CDT a mostrar (default: 30)
 */
export const showCDTEffectIntense = (tokenCount = 30) => {
  const container = document.createElement("div")
  container.className = "cdt-container"
  document.body.appendChild(container)

  // Crear más tokens para efecto más intenso
  for (let i = 0; i < tokenCount; i++) {
    const cdt = document.createElement("div")
    cdt.className = "cdt-token"

    // Posición aleatoria con mayor dispersión
    const angle = Math.random() * 360
    const distance = 80 + Math.random() * 200
    const delay = Math.random() * 0.8

    cdt.style.setProperty("--angle", `${angle}deg`)
    cdt.style.setProperty("--distance", `${distance}px`)
    cdt.style.setProperty("--delay", `${delay}s`)

    container.appendChild(cdt)
  }

  // Eliminar después de la animación
  setTimeout(() => {
    if (document.body.contains(container)) {
      document.body.removeChild(container)
    }
  }, 3000)
}
