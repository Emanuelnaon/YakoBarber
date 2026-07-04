export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
    public: {
        Tables: {
            negocios: {
                Row: {
                    id: string;
                    nombre: string;
                    telefono_whatsapp: string;
                    created_at: string;
                };
                Insert: Record<string, unknown>;
                Update: Record<string, unknown>;
            };
            perfiles: {
                Row: {
                    id: string;
                    negocio_id: string;
                    nombre: string;
                    rol: 'admin' | 'empleado';
                    created_at: string;
                };
            };
            servicios: {
                Row: {
                    id: string;
                    negocio_id: string;
                    nombre: string;
                    precio: number;
                    duracion_minutos: number;
                    active: boolean;
                };
            };
            turnos: {
                Row: {
                    id: string;
                    negocio_id: string;
                    servicio_id: string | null;
                    cliente_nombre: string;
                    fecha_hora: string;
                    estado: 'pendiente' | 'confirmado' | 'cancelado';
                    created_at: string;
                };
            };
        };
    };
}
