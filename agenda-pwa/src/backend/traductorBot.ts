import { supabase } from '../lib/supabaseClient';
import type { Database } from '../lib/database.types';

interface MensajeEntrante {
    telefonoCliente: string;
    texto: string;
    negocioId: string;
}

interface RespuestaBot {
    textoEnviar: string;
}

type ConfigHorarios = Database['public']['Tables']['configuracion_horarios']['Row'];

// Función auxiliar para calcular los bloques libres (Algoritmo Fase 3)
function calcularBloquesLibres(
    horaApertura: string,
    horaCierre: string,
    bloqueMinutos: number,
    horasOcupadas: string[],
): string[] {
    const listaLibres: string[] = [];

    const [hApertura, mApertura] = horaApertura.split(':').map(Number);
    const [hCierre, mCierre] = horaCierre.split(':').map(Number);

    let tiempoActual = hApertura * 60 + mApertura;
    const tiempoCierre = hCierre * 60 + mCierre;

    while (tiempoActual + bloqueMinutos <= tiempoCierre) {
        const horas = Math.floor(tiempoActual / 60);
        const minutos = tiempoActual % 60;

        const stringHora = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;

        if (!horasOcupadas.includes(stringHora)) {
            listaLibres.push(stringHora);
        }

        tiempoActual += bloqueMinutos;
    }

    return listaLibres;
}

export async function procesarMensajeWhatsApp(msg: MensajeEntrante): Promise<RespuestaBot> {
    const textoLimpio = msg.texto.toLowerCase().trim();
    const fechaHoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    // 1. INTENCIÓN: Consulta de Precios y Servicios
    if (textoLimpio.includes('hola') || textoLimpio.includes('precio') || textoLimpio.includes('servicio')) {
        const { data: servicios } = await supabase
            .from('servicios')
            .select('nombre, precio')
            .eq('negocio_id', msg.negocioId);

        if (!servicios || servicios.length === 0) {
            return { textoEnviar: '¡Hola! Bienvenidos. Por el momento no tenemos servicios cargados.' };
        }

        let respuesta = '¡Hola! Bienvenid@. Estos son nuestros servicios y precios actuales:\n\n';
        servicios.forEach((s) => {
            respuesta += `🔹 *${s.nombre}* — $${s.precio}\n`;
        });
        respuesta += '\nSi querés reservar un turno, respondé con la palabra *TURNO*.';
        return { textoEnviar: respuesta };
    }

    // 2. INTENCIÓN: Consulta de Horarios Disponibles
    if (textoLimpio === 'turno' || textoLimpio.includes('horarios') || textoLimpio.includes('turnos')) {
        // Buscamos la configuración horaria del negocio
        const { data: configData } = await supabase
            .from('configuracion_horarios')
            .select('hora_apertura, hora_cierre, bloque_minutos')
            .eq('negocio_id', msg.negocioId)
            .maybeSingle();

        if (!configData) {
            return { textoEnviar: 'La barbería aún no configuró sus horarios de atención.' };
        }

        // Casteamos el resultado a la interfaz tipada de la tabla
        const config = configData as ConfigHorarios;

        // Buscamos los turnos ocupados para el día de hoy
        const inicioDia = `${fechaHoy}T00:00:00.000Z`;
        const finDia = `${fechaHoy}T23:59:59.999Z`;

        const { data: turnosOcupados } = await supabase
            .from('turnos')
            .select('fecha_hora')
            .eq('negocio_id', msg.negocioId)
            .not('estado', 'eq', 'cancelado')
            .gte('fecha_hora', inicioDia)
            .lte('fecha_hora', finDia);

        const horasOcupadas = (turnosOcupados || []).map((t) => {
            // Casteamos de forma segura cada fila para extraer la propiedad de Supabase
            const fila = t as unknown as { fecha_hora: string };
            const d = new Date(fila.fecha_hora);
            return d.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Argentina/Buenos_Aires',
            });
        });

        const libres = calcularBloquesLibres(
            config.hora_apertura,
            config.hora_cierre,
            config.bloque_minutos,
            horasOcupadas,
        );

        if (libres.length === 0) {
            return { textoEnviar: 'Lo sentimos, ya no quedan turnos disponibles para el día de hoy. 📆' };
        }

        let respuestaTurnos = `Perfecto, estos son los turnos disponibles para hoy (*${fechaHoy}*):\n\n`;
        libres.forEach((hora) => {
            respuestaTurnos += `⏰ *${hora}*\n`;
        });
        respuestaTurnos += '\nRespondé escribiendo el horario que te guste (por ejemplo: *10:30*) para agendarlo.';
        return { textoEnviar: respuestaTurnos };
    }

    // 3. INTENCIÓN: Intento de Reserva (El usuario escribe una hora ej: "15:30")
    const esHora = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(textoLimpio);
    if (esHora) {
        const timestampTurno = `${fechaHoy}T${textoLimpio}:00.000Z`;

        // RESOLUCIÓN DE CONFLICTOS: Verificamos si alguien lo ocupó un milisegundo antes
        const { data: yaExiste } = await supabase
            .from('turnos')
            .select('id')
            .eq('negocio_id', msg.negocioId)
            .eq('fecha_hora', timestampTurno)
            .not('estado', 'eq', 'cancelado')
            .maybeSingle();

        if (yaExiste) {
            return {
                textoEnviar: `¡Upa! Alguien se adelantó y reservó las *${textoLimpio}* hace un momento. Por favor escribí *TURNO* de nuevo para ver los que quedan.`,
            };
        }

        // Estructuramos el objeto local inmutable para la inserción
        const nuevoTurno: Database['public']['Tables']['turnos']['Insert'] = {
            negocio_id: msg.negocioId,
            cliente_nombre: `Cliente WhatsApp (${msg.telefonoCliente.slice(-4)})`,
            cliente_telefono: msg.telefonoCliente,
            fecha_hora: timestampTurno,
            estado: 'pendiente',
        };

        const { error } = await supabase.from('turnos').insert([nuevoTurno]);

        if (error) {
            return { textoEnviar: 'Hubo un problema al registrar tu turno. Por favor, intentá nuevamente.' };
        }

        return {
            textoEnviar: `¡Excelente! Tu turno para hoy a las *${textoLimpio}* fue reservado con éxito. ¡Te esperamos! 💈`,
        };
    }

    // Caso por defecto
    return {
        textoEnviar:
            'No logré entender tu mensaje. Escribí *HOLA* para ver los precios o *TURNO* para ver los horarios disponibles.',
    };
}
