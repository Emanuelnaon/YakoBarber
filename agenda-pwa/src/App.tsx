import { useState } from 'react';
import { useAuth } from './hooks/useAuth';

function App() {
    const { user, perfil, loading, iniciarSesionConOtp, verificarCodigoOtp, cerrarSesion } = useAuth();

    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [statusMsg, setStatusMsg] = useState('');
    

    const handleRequestOtp = async (e: React.FormEvent) => {
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

    const handleVerifyOtp = async (e: React.FormEvent) => {
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

    if (loading) return <div className="p-8 text-center">Cargando sistema...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
            <div className="max-w-md mx-auto bg-slate-800 p-6 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-4 border-b border-slate-700 pb-2">MVP Barbería - Auth</h1>

                {user ? (
                    <div>
                        <p className="text-green-400 font-semibold mb-4">Autenticado como: {user.email}</p>
                        <div className="bg-slate-700 p-4 rounded mb-4">
                            <h2 className="font-bold text-sm text-slate-300 mb-2">Datos del Perfil (DB):</h2>
                            <pre className="text-xs overflow-auto">{JSON.stringify(perfil, null, 2)}</pre>
                        </div>
                        <button
                            onClick={cerrarSesion}
                            className="w-full bg-red-600 hover:bg-red-700 py-2 rounded font-semibold transition">
                            Cerrar Sesión
                        </button>
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
                                    className="p-2 rounded bg-slate-700 text-white border border-slate-600"
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
                                    className="p-2 rounded bg-slate-700 text-white border border-slate-600 tracking-widest text-center"
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
