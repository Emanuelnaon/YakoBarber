import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
    const payload = await req.json();

    // Solo procesamos mensajes (ignorar eventos de conexión o QR)
    if (payload.event === 'messages-upsert') {
        const telefonoCliente = payload.data.key.remoteJid;
        const textoCliente = payload.data.message.conversation || payload.data.message.extendedTextMessage?.text;
        const negocioId = 'TU_NEGOCIO_ID'; // Asegurate de tener esto definido

        // Aquí insertás la lógica de procesarMensajeWhatsApp que ya teníamos
        // ... (Tu lógica de negocio aquí)

        console.log(`Procesando mensaje de ${telefonoCliente}: ${textoCliente}`);
    }

    return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
});
