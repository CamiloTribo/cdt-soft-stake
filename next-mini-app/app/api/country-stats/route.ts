import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Inicializar el cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // Contar el número total de países distintos
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
  } catch (error) {
    console.error("Error in country-stats API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
