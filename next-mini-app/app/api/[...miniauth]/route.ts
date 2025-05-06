import WorldAuth from "next-world-auth"

// Configuración básica sin opciones adicionales, exactamente como en el template
const handler = WorldAuth({})

export { handler as GET, handler as POST }
