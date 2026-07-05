import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

type Servicio = { id: string; nombre: string; precio: number };

export function ServiciosPanel({ negocioId }: { negocioId: string }) {
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');

    const fetchServicios = useCallback(async () => {
        const { data } = await supabase.from('servicios').select('id, nombre, precio').eq('negocio_id', negocioId);
        if (data) setServicios(data);
    }, [negocioId]);

    async function refrescarLista() {
        const { data } = await supabase.from('servicios').select('id, nombre, precio').eq('negocio_id', negocioId);
        if (data) setServicios(data);
    }
    
    useEffect(() => {
        let activo = true;

        async function cargar() {
            const { data } = await supabase.from('servicios').select('id, nombre, precio').eq('negocio_id', negocioId);

            if (activo && data) {
                setServicios(data);
            }
        }

        cargar();

        return () => {
            activo = false;
        };
    }, [negocioId]); // Tu única dependencia real es el negocioId

    async function agregarServicio(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();

        // Protección 1: Frontend (evita el viaje a la BD si ya sabemos que está)
        if (servicios.some((s) => s.nombre.toLowerCase() === nombre.toLowerCase())) {
            alert('Ya tenés un servicio con ese nombre. ¡Edítalo luego!');
            return;
        }

        const { error } = await supabase.from('servicios').insert([
            {
                negocio_id: negocioId,
                nombre,
                precio: Number(precio),
                duracion_minutos: 30,
            },
        ]);

        // Protección 2: Base de Datos (capturamos el error por si acaso)
        if (error) {
            if (error.code === '23505') alert('Error: Ese nombre de servicio ya existe en la base de datos.');
            else alert('Error: ' + error.message);
        } else {
            setNombre('');
            setPrecio('');
            await fetchServicios();
        }
    }

    async function eliminarServicio(id: string) {
        if (!confirm('¿Seguro que querés eliminar este servicio?')) return;

        const { error } = await supabase.from('servicios').delete().eq('id', id);

        if (error) {
            alert('Error al eliminar: ' + error.message);
        } else {
            await refrescarLista();
        }
    }

    async function editarPrecio(id: string, nombreActual: string, precioActual: number) {
        const nuevoPrecio = prompt(`Editar precio para ${nombreActual}:`, precioActual.toString());

        // Si cancela o no pone un número válido, salimos
        if (nuevoPrecio === null || isNaN(Number(nuevoPrecio)) || Number(nuevoPrecio) <= 0) return;

        const { error } = await supabase
            .from('servicios')
            .update({ precio: Number(nuevoPrecio) })
            .eq('id', id);

        if (error) {
            alert('Error al actualizar: ' + error.message);
        } else {
            await refrescarLista();
        }
    }

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Tus Servicios</h3>
            <form onSubmit={agregarServicio} className="flex gap-2 mb-4">
                <input
                    placeholder="Nombre"
                    className="p-2 rounded bg-slate-800 w-full border border-slate-600"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                />
                <input
                    type="number"
                    placeholder="Precio"
                    className="p-2 rounded bg-slate-800 w-24 border border-slate-600"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    required
                />
                <button type="submit" className="bg-green-600 px-4 rounded font-bold">
                    +
                </button>
            </form>
            <div className="space-y-2">
                {servicios.map((s) => (
                    <div
                        key={s.id}
                        className="flex justify-between items-center bg-slate-800 p-3 rounded border border-slate-700">
                        <div>
                            <span className="font-medium text-white">{s.nombre}</span>
                            <span className="font-mono text-green-400 ml-4">${s.precio}</span>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => editarPrecio(s.id, s.nombre, s.precio)}
                                className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-blue-400 transition"
                                title="Editar Precio">
                                ✏️
                            </button>
                            <button
                                onClick={() => eliminarServicio(s.id)}
                                className="text-xs bg-slate-700 hover:bg-red-950 px-2 py-1 rounded text-red-400 transition"
                                title="Eliminar">
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
