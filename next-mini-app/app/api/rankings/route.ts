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
      // Para holders, hacemos una consulta más simple
      const { data, error } = await supabase
        .from("staking_info")
        .select(`
          user_id,
          staked_amount,
          users (
            username
          )
        `)
        .order("staked_amount", { ascending: false })
        .limit(100)

      if (error) {
        console.error("Error fetching holders rankings:", error)
        return NextResponse.json({ error: "Error al obtener rankings de holders" }, { status: 500 })
      }

      rankings = data.map((item, index) => {
        // Accedemos al primer elemento del array users si existe
        const username = Array.isArray(item.users) && item.users.length > 0 ? item.users[0].username : "Unknown"

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
      const { data, error } = await supabase
        .from("users")
        .select("id, username, referral_count")
        .order("referral_count", { ascending: false })
        .limit(100)

      if (error) {
        console.error("Error fetching referral rankings:", error)
        return NextResponse.json({ error: "Error al obtener rankings de referidos" }, { status: 500 })
      }

      rankings = data.map((item, index) => ({
        id: item.id,
        username: item.username || "Unknown",
        value: item.referral_count || 0,
        position: index + 1,
      }))
    }

    return NextResponse.json({ rankings })
  } catch (error) {
    console.error("Error in rankings API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
