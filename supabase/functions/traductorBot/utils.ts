// supabase/functions/traductor-bot/utils.ts
export function extraerDatosWhatsApp(payload: any) {
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
