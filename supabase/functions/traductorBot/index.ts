import { serve } from 'std/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { extraerDatosWhatsApp } from './utils.ts';
import { procesarMensajeWhatsApp } from './traductorBot.ts';

// Inicialización de Supabase Client Local
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'http://host.docker.internal:54321';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
    try {
        // Validar que sea un POST válido
        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405 });
        }

        const payload = await req.json();

        // Usamos tu módulo utils.ts para parsear el mensaje de la v2.3.7
        const datos = extraerDatosWhatsApp(payload);

        // 1. Filtro de seguridad: Solo procesamos mensajes de texto entrantes (evitamos bucles si responde el bot)
        if (datos.event === 'messages.upsert' && datos.texto && datos.remoteJid && datos.instance && !datos.fromMe) {
            console.log(`\n============================`);
            console.log(`📩 MENSAJE ENTRANTE DE: ${datos.remoteJid}`);
            console.log(`💬 TEXTO: "${datos.texto}"`);
            console.log(`============================`);

            // 2. Ejecutar tu lógica de negocio (traductorBot.ts) para generar la respuesta de la barbería
            const respuestaBot = await procesarMensajeWhatsApp(supabase, datos.remoteJid, datos.texto);

            // 3. Responderle al cliente usando la API que acabamos de levantar en el puerto 8080
            if (respuestaBot) {
                const urlEvolution = `http://host.docker.internal:8080/message/sendText/${datos.instance}`;

                const responseEvo = await fetch(urlEvolution, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        apikey: 'EmaNaon2026SecretoMaster',
                    },
                    body: JSON.stringify({
                        number: datos.remoteJid,
                        text: respuestaBot,
                    }),
                });

                if (!responseEvo.ok) {
                    const errText = await responseEvo.text();
                    console.error(`❌ Error al enviar mensaje mediante Evolution API: ${errText}`);
                } else {
                    console.log(`✅ Respuesta del bot enviada con éxito a ${datos.remoteJid}`);
                }
            }
        }

        return new Response(JSON.stringify({ status: 'success' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('💥 Error crítico en Edge Function:', message);
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});
