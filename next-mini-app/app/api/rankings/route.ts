import { NextResponse } from "next/server"
import { supabase } from "@/src/lib/supabase"

interface RankingItem {
  id: string
  username: string
  value: number
  position: number
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "holders"

    let rankings: RankingItem[] = []

    // Obtener rankings según el tipo
    if (type === "holders") {
      // Para holders, necesitamos unir con la tabla users para obtener el username
      const { data, error } = await supabase
        .from("staking_info")
        .select(`
          user_id,
          staked_amount,
          users (id, username)
        `)
        .order("staked_amount", { ascending: false })
        .limit(100)

      if (error) {
        console.error("Error fetching holders rankings:", error)
        return NextResponse.json({ error: "Error al obtener rankings de holders" }, { status: 500 })
      }

      rankings = data.map((item, index) => {
        // Intentamos obtener el username de diferentes formas posibles
        let username = "Unknown"

        if (item.users) {
          if (Array.isArray(item.users) && item.users.length > 0 && item.users[0].username) {
            username = item.users[0].username
          } else if (typeof item.users === "object" && item.users && "username" in item.users && item.users.username) {
            username = String(item.users.username)
          }
        }

        return {
          id: item.user_id,
          username: username,
          value: item.staked_amount || 0,
          position: index + 1,
        }
      })
    } else if (type === "stakers") {
      // Para stakers, la información está en la tabla users
      const { data, error } = await supabase
        .from("users")
        .select("id, username, total_claimed")
        .order("total_claimed", { ascending: false })
        .limit(100)

      if (error) {
        console.error("Error fetching stakers rankings:", error)
        return NextResponse.json({ error: "Error al obtener rankings de stakers" }, { status: 500 })
      }

      rankings = data.map((item, index) => ({
        id: item.id,
        username: item.username || "Unknown",
        value: item.total_claimed || 0,
        position: index + 1,
      }))
    } else if (type === "referrals") {
      // Para referrals, la información está en la tabla users
      // Aseguramos que referral_count sea un número y no NULL
      const { data, error } = await supabase
        .from("users")
        .select("id, username, referral_count")
        .not("referral_count", "is", null)
        .order("referral_count", { ascending: false })
        .limit(100)

      if (error) {
        console.error("Error fetching referral rankings:", error)
        return NextResponse.json({ error: "Error al obtener rankings de referidos" }, { status: 500 })
      }

      // Verificamos la estructura de los datos para depuración
      console.log("Referrals data:", JSON.stringify(data.slice(0, 3)))

      rankings = data.map((item, index) => {
        // Aseguramos que referral_count sea un número
        const referralCount =
          typeof item.referral_count === "number"
            ? item.referral_count
            : item.referral_count
              ? Number.parseInt(item.referral_count.toString())
              : 0

        return {
          id: item.id,
          username: item.username || "Unknown",
          value: referralCount,
          position: index + 1,
        }
      })
    }

    return NextResponse.json({ rankings })
  } catch (error) {
    console.error("Error in rankings API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
