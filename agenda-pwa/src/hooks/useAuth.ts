import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [perfil, setPerfil] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    async function fetchPerfil(userId: string) {
        try {
            setLoading(true);
            // Traemos el perfil y el nombre del negocio en una sola consulta
            const { data, error } = await supabase
                .from('perfiles')
                .select(
                    `
          *,
          negocios (
            nombre
          )
        `,
                )
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;
            setPerfil(data);
        } catch (err) {
            console.error('Error al obtener el perfil:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchPerfil(session.user.id);
            else setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchPerfil(session.user.id);
            } else {
                setPerfil(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    async function iniciarSesionConOtp(email: string) {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
    }

    async function verificarCodigoOtp(email: string, token: string) {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'magiclink',
        });
        if (error) throw error;
        return data.session;
    }

    async function cerrarSesion() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    return {
        user,
        perfil,
        loading,
        iniciarSesionConOtp,
        verificarCodigoOtp,
        cerrarSesion,
    };
}
