// supabase/functions/traductor-bot/utils.ts
interface WhatsAppPayload {
    event?: string;
    instance?: string;
    data?: {
        key?: {
            remoteJid?: string;
            fromMe?: boolean;
        };
        message?: {
            conversation?: string;
            extendedTextMessage?: { text?: string };
        };
    };
}

export function extraerDatosWhatsApp(payload: WhatsAppPayload) {
    // Evolution API v2 usa este formato para mensajes recibidos
    const data = payload.data;
    const message = data?.message;

    return {
        event: payload.event,
        instance: payload.instance,
        remoteJid: data?.key?.remoteJid,
        // Extrae texto ya sea de una conversación simple o de un mensaje extendido
        texto: message?.conversation || message?.extendedTextMessage?.text || '',
        fromMe: data?.key?.fromMe || false,
    };
}
