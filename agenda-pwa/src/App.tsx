import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabaseClient';
import { ServiciosPanel } from './components/ServiciosPanel';
import { AgendaPanel } from './components/AgendaPanel';
import { ConfiguracionPanel } from './components/ConfiguracionPanel';

function App() {
    const { user, perfil, loading, iniciarSesionConOtp, verificarCodigoOtp, cerrarSesion } = useAuth();

    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [statusMsg, setStatusMsg] = useState('');

    const [nombreNegocio, setNombreNegocio] = useState('');
    const [telefono, setTelefono] = useState('');
    const [creando, setCreando] = useState(false);

    const handleRequestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            setStatusMsg('Enviando código...');
            await iniciarSesionConOtp(email);
            setStep('verify');
            setStatusMsg('Revisa tu bandeja de entrada o spam.');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setStatusMsg(`Error: ${error.message}`);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            setStatusMsg('Verificando código...');
            await verificarCodigoOtp(email, token);
            setStatusMsg('¡Sesión iniciada exitosamente!');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setStatusMsg(`Error: ${error.message}`);
        }
    };

    const handleCrearNegocio = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;

        setCreando(true);
        try {
            // Código limpio, sin parches "any"
            const { data: nuevoNegocio, error: errNegocio } = await supabase
                .from('negocios')
                .insert([{ nombre: nombreNegocio, telefono_whatsapp: telefono }])
                .select()
                .single();

            if (errNegocio) throw errNegocio;

            const { error: errPerfil } = await supabase
                .from('perfiles')
                .update({ negocio_id: nuevoNegocio.id })
                .eq('id', user.id);

            if (errPerfil) throw errPerfil;

            window.location.reload();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setCreando(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Cargando sistema...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
            <div className="max-w-md mx-auto bg-slate-800 p-6 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-4 border-b border-slate-700 pb-2">MVP Barbería - Auth</h1>

                {user ? (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-green-400 font-semibold text-sm">✓ {user.email}</p>
                            <button
                                onClick={cerrarSesion}
                                className="text-xs text-red-400 hover:text-red-300 underline">
                                Cerrar Sesión
                            </button>
                        </div>

                        {!perfil?.negocio_id ? (
                            <div className="bg-slate-700 p-4 rounded border border-slate-600">
                                <h2 className="font-bold text-lg text-white mb-2">Paso Final: Crea tu Barbería</h2>
                                <p className="text-sm text-slate-300 mb-4">
                                    Para empezar a cargar servicios, necesitamos los datos de tu local.
                                </p>

                                <form onSubmit={handleCrearNegocio} className="flex flex-col gap-3">
                                    <input
                                        type="text"
                                        placeholder="Nombre del local (Ej: Yako Barber)"
                                        value={nombreNegocio}
                                        onChange={(e) => setNombreNegocio(e.target.value)}
                                        className="p-2 rounded bg-slate-800 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                    <input
                                        type="tel"
                                        placeholder="WhatsApp del bot (Ej: +54911...)"
                                        value={telefono}
                                        onChange={(e) => setTelefono(e.target.value)}
                                        className="p-2 rounded bg-slate-800 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={creando}
                                        className="bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold transition disabled:opacity-50">
                                        {creando ? 'Creando...' : 'Crear mi Barbería'}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            /* --- DASHBOARD PRINCIPAL --- */
                            <div className="bg-slate-700 p-4 rounded border border-slate-600">
                                {/* AQUÍ AGREGAMOS EL NOMBRE */}
                                <h2 className="font-bold text-xl text-white mb-1">
                                    ¡Bienvenido a {perfil.negocios?.nombre || 'tu Barbería'}!
                                </h2>
                                <ServiciosPanel negocioId={perfil.negocio_id} />
                                <AgendaPanel negocioId={perfil.negocio_id} />
                                <ConfiguracionPanel negocioId={perfil.negocio_id} />
                                <p className="text-sm text-slate-400 mb-4">
                                    ID de Negocio:{' '}
                                    <code className="text-xs bg-slate-800 p-1 rounded break-all">
                                        {perfil.negocio_id}
                                    </code>
                                </p>

                                <div className="p-4 bg-slate-800 rounded text-center text-slate-400">
                                    Aquí irá la lista de Servicios (Corte, Barba) y el botón para editar precios.
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        {step === 'request' ? (
                            <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
                                <input
                                    type="email"
                                    placeholder="Tu correo electrónico"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="p-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:border-blue-500"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 py-2 rounded font-semibold transition">
                                    Enviar Código OTP
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                                <p className="text-sm text-slate-400">Código enviado a: {email}</p>
                                <input
                                    type="text"
                                    placeholder="Código de 6 dígitos"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    className="p-2 rounded bg-slate-700 text-white border border-slate-600 tracking-widest text-center focus:outline-none focus:border-blue-500"
                                    required
                                />
                                <button
                                    type="submit"
                                    className="bg-green-600 hover:bg-green-700 py-2 rounded font-semibold transition">
                                    Verificar e Ingresar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep('request')}
                                    className="text-sm text-slate-400 hover:text-white">
                                    Volver / Cambiar correo
                                </button>
                            </form>
                        )}

                        {statusMsg && <p className="mt-4 text-sm text-center text-slate-300">{statusMsg}</p>}
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
