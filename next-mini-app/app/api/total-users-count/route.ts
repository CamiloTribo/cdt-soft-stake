import { NextResponse } from "next/server"
import { supabase } from "@/src/lib/supabase"

export async function GET() {
  try {
    // Contar todos los usuarios en la tabla users
    const { count, error } = await supabase.from("users").select("*", { count: "exact", head: true })

    if (error) {
      console.error("Error counting users:", error)
      return NextResponse.json({ error: "Failed to count users" }, { status: 500 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error("Error in total-users-count API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
