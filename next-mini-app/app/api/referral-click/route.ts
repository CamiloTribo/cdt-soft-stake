import { NextResponse } from "next/server"
import { supabase } from "@/src/lib/supabase"

export async function POST(request: Request) {
  try {
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ success: false, error: "Username is required" }, { status: 400 })
    }

    console.log(`Registering click for referral code: ${username}`)

    // Incrementar el contador de clicks en la tabla referral_clicks
    const { error } = await supabase.from("referral_clicks").upsert(
      {
        username,
        clicks: 1,
        last_click: new Date().toISOString(),
      },
      {
        onConflict: "username",
        ignoreDuplicates: false,
      },
    )

    if (error) {
      console.error("Error inserting click:", error)

      // Intentar actualizar si la inserción falla
      const { error: updateError } = await supabase.rpc("increment_referral_clicks", {
        target_username: username,
      })

      if (updateError) {
        console.error("Error incrementing clicks:", updateError)
        return NextResponse.json({ success: false, error: "Failed to register click" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in referral-click:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
