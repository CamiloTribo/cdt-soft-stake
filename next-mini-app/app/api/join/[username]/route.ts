// app/api/join/[username]/route.ts
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente de Supabase para el servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export async function GET(request: Request) {
  try {
    // Extraer el username de la URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const username = pathParts[pathParts.length - 1];
    
    if (!username) {
      return NextResponse.json({ success: false, error: "Username is required" }, { status: 400 });
    }
    
    // Obtener información del cliente para tracking
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || 'unknown';
    const clientIP = headersList.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    
    // Crear hashes para privacidad
    const ipHash = Buffer.from(clientIP).toString('base64');
    const uaHash = Buffer.from(userAgent).toString('base64');
    
    // Registrar el clic en la tabla de clics
    await supabase.from('collaborator_clicks').insert({
      username,
      ip_hash: ipHash,
      user_agent_hash: uaHash
    });
    
    // Incrementar el contador en la tabla principal
    const { data: existingLink } = await supabase
      .from('collaborator_links')
      .select('id')
      .eq('username', username)
      .single();
    
    if (existingLink) {
      // Si ya existe un registro para este colaborador, incrementar el contador
      await supabase
        .from('collaborator_links')
        .update({ 
          clicks: supabase.rpc('increment', { row_id: existingLink.id }),
          last_click_at: new Date().toISOString()
        })
        .eq('id', existingLink.id);
    } else {
      // Si no existe, crear un nuevo registro
      await supabase.from('collaborator_links').insert({
        username,
        clicks: 1,
        last_click_at: new Date().toISOString()
      });
    }
    
    // Guardar el código de referido en una cookie
    const cookieStore = await cookies();
    cookieStore.set('referral_code', username, { 
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/'
    });
    
    // Redirigir a la URL correcta de la mini-app
    return NextResponse.redirect('https://worldcoin.org/mini-app?app_id=app_adf5744abe7aef9fe2a5841d4f1552d3');
  } catch (error) {
    console.error('Error in join API:', error);
    // En caso de error, redirigir de todos modos
    return NextResponse.redirect('https://worldcoin.org/mini-app?app_id=app_adf5744abe7aef9fe2a5841d4f1552d3');
  }
}