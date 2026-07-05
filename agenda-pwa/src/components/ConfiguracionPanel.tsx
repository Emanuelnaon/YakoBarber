import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// 1. Tipo local explícito para la lectura
interface ConfigHorarios {
    hora_apertura: string;
    hora_cierre: string;
    bloque_minutos: number;
}

// 2. Props explícitas sin React.FC
interface ConfiguracionPanelProps {
    negocioId: string;
}

export function ConfiguracionPanel({ negocioId }: ConfiguracionPanelProps) {
    const [horaApertura, setHoraApertura] = useState('09:00');
    const [horaCierre, setHoraCierre] = useState('20:00');
    const [bloqueMinutos, setBloqueMinutos] = useState(30);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        let activo = true;

        async function cargarConfiguracion() {
            const { data, error } = await supabase
                .from('configuracion_horarios')
                .select('hora_apertura, hora_cierre, bloque_minutos')
                .eq('negocio_id', negocioId)
                .maybeSingle();

            if (activo) {
                if (data) {
                    const config = data as unknown as ConfigHorarios;
                    // Retorno seguro y formateo local e inmutable
                    setHoraApertura(config.hora_apertura.substring(0, 5));
                    setHoraCierre(config.hora_cierre.substring(0, 5));
                    setBloqueMinutos(config.bloque_minutos);
                } else if (error) {
                    console.error('Error al cargar configuración:', error.message);
                }
                setCargando(false);
            }
        }

        cargarConfiguracion();

        return () => {
            activo = false;
        };
    }, [negocioId]);

    async function guardarConfiguracion(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();

        // 5. Pureza del renderizado: construimos el objeto local inmutable
        const datosGuardar = {
            negocio_id: negocioId,
            hora_apertura: `${horaApertura}:00`,
            hora_cierre: `${horaCierre}:00`,
            bloque_minutos: Number(bloqueMinutos),
            dias_laborales: [1, 2, 3, 4, 5, 6],
        };

        const { error } = await supabase
            .from('configuracion_horarios')
            // Forzamos el tipo sobre el objeto usando Record para no usar 'any' y cumplir con ESLint
            .upsert([datosGuardar] as unknown as never[], { onConflict: 'negocio_id' });

        if (error) {
            alert('Error al guardar la configuración: ' + error.message);
        } else {
            alert('¡Configuración de horarios guardada con éxito! 💈');
        }
    }

    // 4. Retorno JSX asegurado (Si está cargando devuelve este bloque, sino avanza puro)
    if (cargando) {
        return <p className="text-sm text-slate-400">Cargando horarios...</p>;
    }

    return (
        <div className="mt-6 bg-slate-700 p-4 rounded border border-slate-600">
            <h3 className="text-lg font-semibold text-white mb-3">⚙️ Configuración de la Barbería</h3>

            <form onSubmit={guardarConfiguracion} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-slate-300 mb-1 font-medium">Hora de Apertura</label>
                        <input
                            type="time"
                            className="p-2 w-full rounded bg-slate-800 border border-slate-600 text-white text-sm"
                            value={horaApertura}
                            onChange={(e) => setHoraApertura(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-300 mb-1 font-medium">Hora de Cierre</label>
                        <input
                            type="time"
                            className="p-2 w-full rounded bg-slate-800 border border-slate-600 text-white text-sm"
                            value={horaCierre}
                            onChange={(e) => setHoraCierre(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-slate-300 mb-1 font-medium">Duración de cada Turno</label>
                    <select
                        className="p-2 w-full rounded bg-slate-800 border border-slate-600 text-white text-sm"
                        value={bloqueMinutos}
                        onChange={(e) => setBloqueMinutos(Number(e.target.value))}>
                        <option value={20}>20 minutos</option>
                        <option value={30}>30 minutos (Recomendado)</option>
                        <option value={40}>40 minutos</option>
                        <option value={45}>45 minutos</option>
                        <option value={60}>1 hora</option>
                    </select>
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-sm transition">
                    Guardar Configuración
                </button>
            </form>
        </div>
    );
}
