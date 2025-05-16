import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Inicializar el cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

// Definir interfaces para tipar correctamente
interface CountryStats {
  country: string
  totalCDT: number
  userCount: number
  position: number
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "stats"

    // Si solo queremos el conteo de países
    if (type === "stats") {
      const { data: countryData, error: countryError } = await supabase
        .from("users")
        .select("country")
        .not("country", "is", null)

      if (countryError) {
        console.error("Error fetching country data:", countryError)
        return NextResponse.json({ success: false, error: "Error fetching country data" }, { status: 500 })
      }

      // Filtrar países únicos y no vacíos
      const uniqueCountries = [
        ...new Set(countryData.map((user) => user.country).filter((country) => country && country.trim() !== "")),
      ]

      return NextResponse.json({
        success: true,
        uniqueCountries: uniqueCountries.length,
      })
    }

    // Si queremos el ranking de países
    else if (type === "ranking") {
      // 1. Obtener todos los usuarios con su país
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, country")
        .not("country", "is", null)
        .not("country", "eq", "")

      if (userError) {
        console.error("Error fetching user data:", userError)
        return NextResponse.json({ success: false, error: "Error fetching user data" }, { status: 500 })
      }

      // 2. Obtener datos de staking
      const { data: stakingData, error: stakingError } = await supabase
        .from("staking_info")
        .select("user_id, staked_amount")

      if (stakingError) {
        console.error("Error fetching staking data:", stakingError)
        return NextResponse.json({ success: false, error: "Error fetching staking data" }, { status: 500 })
      }

      // 3. Crear un mapa de usuario a país
      const userToCountry: Record<string, string> = {}
      userData.forEach((user) => {
        if (user.id && user.country) {
          userToCountry[user.id] = user.country
        }
      })

      // 4. Agregar datos por país
      const countryStats: Record<string, { totalCDT: number; userCount: number }> = {}
      
      // Contar usuarios por país
      userData.forEach((user) => {
        if (user.country) {
          if (!countryStats[user.country]) {
            countryStats[user.country] = { totalCDT: 0, userCount: 0 }
          }
          countryStats[user.country].userCount += 1
        }
      })

      // Sumar CDT por país
      stakingData.forEach((stake) => {
        const country = userToCountry[stake.user_id]
        if (country && stake.staked_amount) {
          if (!countryStats[country]) {
            countryStats[country] = { totalCDT: 0, userCount: 0 }
          }
          countryStats[country].totalCDT += stake.staked_amount
        }
      })

      // 5. Convertir a array y ordenar por totalCDT
      const countryRankings: CountryStats[] = Object.entries(countryStats)
        .map(([country, stats], index) => ({
          country,
          totalCDT: stats.totalCDT,
          userCount: stats.userCount,
          position: index + 1, // Se actualizará después de ordenar
        }))
        .sort((a, b) => b.totalCDT - a.totalCDT)
        .map((item, index) => ({ ...item, position: index + 1 })) // Actualizar posiciones después de ordenar
        .slice(0, 25) // Limitar a 25 elementos

      return NextResponse.json({
        success: true,
        rankings: countryRankings,
      })
    }

    return NextResponse.json({ success: false, error: "Invalid type parameter" }, { status: 400 })
  } catch (error) {
    console.error("Error in country-stats API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
