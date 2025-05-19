import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Inicializar el cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

// Definir interfaces para tipar correctamente
interface StakingInfo {
  staked_amount: number | string
}

interface UserWithStaking {
  country: string
  staking_info: StakingInfo[]
}

interface CountryStatsResult {
  country: string
  total_cdt: string | number
  user_count: string | number
}

// Definir el tipo para los rankings que devolvemos en la respuesta
type CountryRanking = {
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
      // Usar la consulta SQL directamente como RPC para obtener los totales de CDT por país
      const { data: cdtByCountry, error: cdtError } = await supabase.rpc("get_country_stats")

      if (cdtError) {
        console.error("Error fetching CDT by country:", cdtError)

        // Si la función RPC falla, intentamos con una consulta directa
        console.log("Intentando con consulta directa...")

        // Ejecutar consulta SQL directamente
        const { data: directQueryData, error: directQueryError } = await supabase
          .from("users")
          .select(`
            country,
            staking_info!inner (
              staked_amount
            )
          `)
          .not("country", "is", null)
          .not("country", "eq", "")

        if (directQueryError) {
          console.error("Error en consulta directa:", directQueryError)
          return NextResponse.json({ success: false, error: "Error fetching country data" }, { status: 500 })
        }

        // Procesar los resultados de la consulta directa
        const countryTotals: Record<string, { totalCDT: number; userCount: number }> = {}

        directQueryData.forEach((user: UserWithStaking) => {
          const country = user.country
          const stakedAmount = Array.isArray(user.staking_info)
            ? user.staking_info.reduce(
                (sum: number, item: StakingInfo) => sum + (Number.parseFloat(String(item.staked_amount)) || 0),
                0,
              )
            : 0

          if (!countryTotals[country]) {
            countryTotals[country] = { totalCDT: 0, userCount: 0 }
          }

          countryTotals[country].totalCDT += stakedAmount
          countryTotals[country].userCount += 1
        })

        // Convertir a array y ordenar
        const countryRankings: CountryRanking[] = Object.entries(countryTotals)
          .map(([country, stats]) => ({
            country,
            totalCDT: stats.totalCDT,
            userCount: stats.userCount,
            position: 0, // Se asignará después de ordenar
          }))
          .sort((a, b) => b.userCount - a.userCount) // Ordenar por cantidad de usuarios
          .map((item, index) => ({ ...item, position: index + 1 })) // Asignar posiciones después de ordenar

        return NextResponse.json({
          success: true,
          rankings: countryRankings,
        })
      }

      // Si la función RPC funciona, usamos esos datos
      const countryRankings: CountryRanking[] = (cdtByCountry as CountryStatsResult[])
        .map((item) => ({
          country: item.country,
          totalCDT: Number.parseFloat(String(item.total_cdt)) || 0,
          userCount: Number.parseInt(String(item.user_count)) || 0,
          position: 0, // Se asignará después de ordenar
        }))
        .sort((a, b) => b.userCount - a.userCount) // Ordenar por cantidad de usuarios
        .map((item, index) => ({ ...item, position: index + 1 })) // Asignar posiciones después de ordenar

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
