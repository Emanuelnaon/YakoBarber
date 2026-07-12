import type { SupabaseClient } from '@supabase/supabase-js';

// --- Interfaces actualizadas para tu nueva DB ---
interface ConfigHorarios {
    hora_apertura: string;
    hora_cierre: string;
    // Quitamos bloque_minutos si ahora dependemos de la duración del servicio
}

interface TurnoOcupado {
    horario: string; // Postgres devuelve los rangos como strings: "[2026-07-15 10:00:00, 2026-07-15 10:30:00)"
}

interface TurnoInsert {
    negocio_id: string;
    servicio_id: string; // Nuevo: obligatorio para saber qué estamos haciendo
    cliente_nombre: string;
    cliente_telefono: string;
    horario: string; // El rango TSTZRANGE
    estado: 'pendiente' | 'confirmado' | 'cancelado';
}

// Función auxiliar para generar baches (puedes ajustar bloqueMinutos a 30 por defecto)
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

export async function procesarMensajeWhatsApp(
    supabase: SupabaseClient,
    telefonoCliente: string,
    texto: string,
    negocioId?: string,
): Promise<string> {
    const negocioIdFinal = negocioId ?? Deno.env.get('NEGOCIO_ID') ?? 'default';
    const textoLimpio = texto.toLowerCase().trim();
    const fechaHoy = new Date().toISOString().split('T')[0];

    // 1. CONSULTA DE PRECIOS
    if (textoLimpio.includes('hola') || textoLimpio.includes('precio') || textoLimpio.includes('servicio')) {
        const { data: servicios } = await supabase
            .from('servicios')
            .select('nombre, precio')
            .eq('negocio_id', negocioIdFinal)
            .eq('esta_disponible', true);

        if (!servicios || servicios.length === 0) {
            return '¡Hola! Bienvenidos. Por el momento no tenemos servicios cargados.';
        }

        let respuesta = '¡Hola! Bienvenid@. Estos son nuestros servicios y precios actuales:\n\n';
        servicios.forEach((s) => {
            respuesta += `🔹 *${s.nombre}* — $${s.precio}\n`;
        });
        respuesta += '\nSi querés reservar un turno, respondé con la palabra *TURNO*.';
        return respuesta;
    }

    // 2. CONSULTA DE DISPONIBILIDAD (Fase 3)
    if (textoLimpio === 'turno' || textoLimpio.includes('horarios') || textoLimpio.includes('turnos')) {
        // Obtenemos horarios de apertura del negocio
        const { data: config } = await supabase
            .from('configuracion_horarios')
            .select('hora_apertura, hora_cierre')
            .eq('negocio_id', negocioIdFinal)
            .eq('dia_semana', new Date().getDay()) // Filtramos por el día de hoy
            .maybeSingle();

        if (!config) {
            return 'Hoy no abrimos o la barbería no configuró sus horarios aún.';
        }

        // Buscamos turnos que se solapen con el día de hoy
        const { data: turnosOcupados } = await supabase
            .from('turnos')
            .select('horario')
            .eq('negocio_id', negocioIdFinal)
            .not('estado', 'eq', 'cancelado')
            .filter('horario', '&&', `[${fechaHoy} 00:00:00, ${fechaHoy} 23:59:59)`);

        const horasOcupadas = (turnosOcupados || []).map((t) => {
            const d = new Date(t.horario.split(',')[0].replace('[', ''));
            return d.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Argentina/Buenos_Aires',
            });
        });

        const libres = calcularBloquesLibres(
            config.hora_apertura,
            config.hora_cierre,
            30, // Bloques fijos de 30 min para el listado
            horasOcupadas,
        );

        if (libres.length === 0) {
            return 'Ya no quedan turnos para hoy. 📆';
        }

        let respuestaTurnos = `Turnos para hoy (*${fechaHoy}*):\n\n`;
        libres.forEach((hora) => (respuestaTurnos += `⏰ *${hora}*\n`));
        respuestaTurnos += '\nEscribí la hora (ej: *10:30*) para agendar.';
        return respuestaTurnos;
    }

    // 3. REGISTRO DE TURNO (Usando rangos)
    const esHora = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(textoLimpio);
    if (esHora) {
        // Primero necesitamos un servicio por defecto (el primero disponible) para saber la duración
        const { data: servicio } = await supabase
            .from('servicios')
            .select('id, duracion_minutos')
            .eq('negocio_id', negocioIdFinal)
            .limit(1)
            .single();

        if (!servicio) return 'No hay servicios configurados.';

        // Calculamos el inicio y fin del bloque
        const [hora, min] = textoLimpio.split(':').map(Number);
        const fechaInicio = new Date();
        fechaInicio.setHours(hora, min, 0, 0);

        const fechaFin = new Date(fechaInicio.getTime() + servicio.duracion_minutos * 60000);
        const rangoIso = `[${fechaInicio.toISOString()},${fechaFin.toISOString()})`;

        // Verificamos si se solapa (Operador &&)
        const { data: solapado } = await supabase
            .from('turnos')
            .select('id')
            .eq('negocio_id', negocioIdFinal)
            .not('estado', 'eq', 'cancelado')
            .filter('horario', '&&', rangoIso)
            .maybeSingle();

        if (solapado) {
            return `¡Esa hora ya se ocupó! Elegí otra.`;
        }

        const nuevoTurno: TurnoInsert = {
            negocio_id: negocioIdFinal,
            servicio_id: servicio.id,
            cliente_nombre: `WhatsApp (${telefonoCliente.slice(-4)})`,
            cliente_telefono: telefonoCliente,
            horario: rangoIso,
            estado: 'pendiente',
        };

        const { error } = await supabase.from('turnos').insert([nuevoTurno]);

        if (error) {
            console.error(error);
            return 'Error al reservar. Intentá de nuevo.';
        }

        return `¡Listo! Reservado hoy a las *${textoLimpio}*. ¡Te esperamos! 💈`;
    }

    return 'Escribí *HOLA* o *TURNO*.';
}
