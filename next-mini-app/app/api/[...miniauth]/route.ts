import WorldAuth from "next-world-auth"

// Configuración simplificada usando solo propiedades válidas
const handler = WorldAuth({
  // No necesitamos pasar configuración adicional aquí
  // WorldAuth tomará las variables de entorno automáticamente
})

export { handler as GET, handler as POST }
