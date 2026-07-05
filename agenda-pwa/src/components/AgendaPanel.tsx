import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

type Turno = {
    id: string;
    cliente_nombre: string;
    cliente_telefono: string;
    fecha_hora: string;
    estado: 'pendiente' | 'confirmado' | 'cancelado' | 'atendido';
    servicios: { nombre: string; precio: number } | null;
};

export function AgendaPanel({ negocioId }: { negocioId: string }) {
    const [turnos, setTurnos] = useState<Turno[]>([]);
    const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0]);

useEffect(() => {
    let activo = true;

    async function cargarTurnos() {
        const inicioDia = `${filtroFecha}T00:00:00.000Z`;
        const finDia = `${filtroFecha}T23:59:59.999Z`;

        const { data } = await supabase
            .from('turnos')
            .select(
                `
          id,
          cliente_nombre,
          cliente_telefono,
          fecha_hora,
          estado,
          servicios (nombre, precio)
        `,
            )
            .eq('negocio_id', negocioId)
            .gte('fecha_hora', inicioDia)
            .lte('fecha_hora', finDia)
            .order('fecha_hora', { ascending: true });

        if (activo && data) {
            setTurnos(data as unknown as Turno[]);
        }
    }

    cargarTurnos();

    return () => {
        activo = false;
    };
}, [negocioId, filtroFecha]);

   async function cambiarEstado(id: string, nuevoEstado: Turno['estado']) {
       const { error } = await supabase
           .from('turnos')
           .update({
               // Doble casteo limpio para burlar el error de base de datos sin usar 'any'
               estado: nuevoEstado as unknown as 'pendiente' | 'confirmado' | 'cancelado',
           })
           .eq('id', id);

       if (!error) {
           const inicioDia = `${filtroFecha}T00:00:00.000Z`;
           const finDia = `${filtroFecha}T23:59:59.999Z`;

           const { data } = await supabase
               .from('turnos')
               .select(
                   `
          id,
          cliente_nombre,
          cliente_telefono,
          fecha_hora,
          estado,
          servicios (nombre, precio)
        `,
               )
               .eq('negocio_id', negocioId)
               .gte('fecha_hora', inicioDia)
               .lte('fecha_hora', finDia)
               .order('fecha_hora', { ascending: true });

           if (data) setTurnos(data as unknown as Turno[]);
       } else {
           alert('Error al cambiar estado: ' + error.message);
       }
   }

    const colorEstado = (estado: Turno['estado']) => {
        switch (estado) {
            case 'confirmado':
                return 'text-green-400 bg-green-950 border-green-800';
            case 'cancelado':
                return 'text-red-400 bg-red-950 border-red-900';
            case 'atendido':
                return 'text-slate-400 bg-slate-800 border-slate-700';
            default:
                return 'text-yellow-400 bg-yellow-950 border-yellow-800';
        }
    };

    return (
        <div className="mt-6 bg-slate-700 p-4 rounded border border-slate-600">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-white">📅 Agenda de Turnos</h3>
                <input
                    type="date"
                    className="p-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                />
            </div>

            <div className="space-y-2">
                {turnos.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No hay turnos agendados para este día.</p>
                ) : (
                    turnos.map((t) => {
                        const hora = new Date(t.fecha_hora).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        });
                        return (
                            <div
                                key={t.id}
                                className="p-3 bg-slate-800 rounded border border-slate-700 flex flex-col sm:flex-row justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono bg-slate-900 px-2 py-0.5 rounded text-green-400 font-bold">
                                            {hora}
                                        </span>
                                        <h4 className="font-bold text-white">{t.cliente_nombre}</h4>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">
                                        📱 {t.cliente_telefono} | ✂️ {t.servicios?.nombre || 'Servicio eliminado'} ($
                                        {t.servicios?.precio || 0})
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5 self-end sm:self-center">
                                    <span
                                        className={`text-xs px-2 py-1 rounded border font-medium uppercase ${colorEstado(t.estado)}`}>
                                        {t.estado}
                                    </span>

                                    {t.estado === 'pendiente' && (
                                        <button
                                            onClick={() => cambiarEstado(t.id, 'confirmado')}
                                            className="bg-green-600 hover:bg-green-700 p-1 rounded text-white text-xs px-2 transition">
                                            ✓
                                        </button>
                                    )}
                                    {t.estado !== 'atendido' && t.estado !== 'cancelado' && (
                                        <>
                                            <button
                                                onClick={() => cambiarEstado(t.id, 'atendido')}
                                                className="bg-blue-600 hover:bg-blue-700 p-1 rounded text-white text-xs px-2 transition"
                                                title="Marcar como Atendido">
                                                💈
                                            </button>
                                            <button
                                                onClick={() => cambiarEstado(t.id, 'cancelado')}
                                                className="bg-slate-700 hover:bg-red-900 p-1 rounded text-red-400 text-xs px-2 transition"
                                                title="Cancelar">
                                                ✕
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
