import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Inicializamos el cliente de servidor
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
    // 1. Recibir el Webhook
    const payload = await req.json();

    // 2. Filtrar solo mensajes entrantes
    if (payload.event === 'messages-upsert') {
        const remoteJid = payload.data.key.remoteJid;
        const messageContent = payload.data.message.conversation || payload.data.message.extendedTextMessage?.text;

        console.log(`Mensaje de ${remoteJid}: ${messageContent}`);

        // AQUÍ LLAMAS A TU LÓGICA DE TRADUCCIÓN
        // Podés llamar a una función que tenías en tu traductorBot.ts
    }

    return new Response(JSON.stringify({ status: 'success' }), {
        headers: { 'Content-Type': 'application/json' },
    });
});
