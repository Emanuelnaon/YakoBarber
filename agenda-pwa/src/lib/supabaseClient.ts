import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
}

// Inicialización del cliente con el tipado de la base de datos
export const supabase = createClient<Database, 'public'>(supabaseUrl, supabaseAnonKey);
