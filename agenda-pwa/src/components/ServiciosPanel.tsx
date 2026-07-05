import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

type Servicio = {
    id: string;
    nombre: string;
    precio: number;
};

export function ServiciosPanel({ negocioId }: { negocioId: string }) {
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [nombre, setNombre] = useState('');
    const [precio, setPrecio] = useState('');

    // Movemos la lógica de obtención de datos a una función independiente
    const fetchServicios = useCallback(async () => {
        const { data } = await supabase.from('servicios').select('id, nombre, precio').eq('negocio_id', negocioId);

        if (data) {
            setServicios(data);
        }
    }, [negocioId]);

    // En lugar de llamar a una función que hace setState dentro del useEffect,
    // simplemente invocamos el callback.
    // Para evitar la advertencia de 'set-state-in-effect', aseguramos que la
    // actualización sea el resultado lógico de una promesa resuelta.
    useEffect(() => {
        let active = true;

        const load = async () => {
            const { data } = await supabase.from('servicios').select('id, nombre, precio').eq('negocio_id', negocioId);

            if (active && data) {
                setServicios(data);
            }
        };

        load();
        return () => {
            active = false;
        };
    }, [negocioId]);

    // Usamos FormEvent<HTMLFormElement> para ser específicos y evitar el deprecated
    async function agregarServicio(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        // Verificamos si ya existe antes de insertar
        const yaExiste = servicios.some((s) => s.nombre.toLowerCase() === nombre.toLowerCase());

        if (yaExiste) {
            alert('Ya tenés un servicio con ese nombre. ¡Edítalo en lugar de crear uno nuevo!');
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

        if (!error) {
            setNombre('');
            setPrecio('');
            await fetchServicios();
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
                    <div key={s.id} className="flex justify-between bg-slate-800 p-3 rounded border border-slate-700">
                        <span>{s.nombre}</span>
                        <span className="font-mono text-green-400">${s.precio}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
