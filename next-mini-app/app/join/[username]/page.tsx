import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente de Supabase para el servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// Corregir la definición de tipos para Next.js 15
type Props = {
  params: {
    username: string;
  };
};

export default async function CollaboratorRedirect({ params }: Props) {
  const { username } = params;
  
  try {
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
  } catch (error) {
    console.error('Error registering collaborator click:', error);
    // Continuar con la redirección incluso si hay un error
  }
  
  // Redirigir a la URL correcta de la mini-app
  redirect('https://worldcoin.org/mini-app?app_id=app_adf5744abe7aef9fe2a5841d4f1552d3');
}