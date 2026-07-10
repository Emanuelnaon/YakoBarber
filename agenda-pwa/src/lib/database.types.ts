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
                Insert: {
                    id?: string; // Opcional porque la BD lo genera
                    nombre: string;
                    telefono_whatsapp: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    nombre?: string;
                    telefono_whatsapp?: string;
                    created_at?: string;
                };
                Relationships: {
                    foreignKeyName: string;
                    columns: string[];
                    isOneToOne?: boolean;
                    referencedRelation: string;
                    referencedColumns: string[];
                }[];
            };
            perfiles: {
                Row: {
                    id: string;
                    negocio_id: string | null;
                    nombre: string;
                    rol: 'admin' | 'empleado';
                    created_at: string;
                };
                Insert: {
                    id: string;
                    negocio_id?: string | null;
                    nombre: string;
                    rol?: 'admin' | 'empleado';
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    negocio_id?: string | null;
                    nombre?: string;
                    rol?: 'admin' | 'empleado';
                    created_at?: string;
                };
                Relationships: {
                    foreignKeyName: string;
                    columns: string[];
                    isOneToOne?: boolean;
                    referencedRelation: string;
                    referencedColumns: string[];
                }[];
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
                Insert: {
                    id?: string;
                    negocio_id: string;
                    nombre: string;
                    precio: number;
                    duracion_minutos: number;
                    active?: boolean;
                };
                Update: {
                    id?: string;
                    negocio_id?: string;
                    nombre?: string;
                    precio?: number;
                    duracion_minutos?: number;
                    active?: boolean;
                };
                Relationships: {
                    foreignKeyName: string;
                    columns: string[];
                    isOneToOne?: boolean;
                    referencedRelation: string;
                    referencedColumns: string[];
                }[];
            };
            configuracion_horarios: {
                Row: {
                    negocio_id: string;
                    hora_apertura: string;
                    hora_cierre: string;
                    bloque_minutos: number;
                    dias_laborales: number[];
                    created_at: string | null;
                };
                Insert: {
                    negocio_id: string;
                    hora_apertura: string;
                    hora_cierre: string;
                    bloque_minutos: number;
                    dias_laborales?: number[];
                    created_at?: string;
                };
                Update: {
                    negocio_id?: string;
                    hora_apertura?: string;
                    hora_cierre?: string;
                    bloque_minutos?: number;
                    dias_laborales?: number[];
                    created_at?: string;
                };
                Relationships: {
                    foreignKeyName: string;
                    columns: string[];
                    isOneToOne?: boolean;
                    referencedRelation: string;
                    referencedColumns: string[];
                }[];
            };
            turnos: {
                Row: {
                    id: string;
                    negocio_id: string;
                    servicio_id: string | null;
                    cliente_nombre: string;
                    cliente_telefono: string;
                    fecha_hora: string;
                    estado: 'pendiente' | 'confirmado' | 'cancelado';
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    negocio_id: string;
                    servicio_id?: string | null;
                    cliente_nombre: string;
                    cliente_telefono: string;
                    fecha_hora: string;
                    estado?: 'pendiente' | 'confirmado' | 'cancelado';
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    negocio_id?: string;
                    servicio_id?: string | null;
                    cliente_nombre?: string;
                    cliente_telefono?: string;
                    fecha_hora?: string;
                    estado?: 'pendiente' | 'confirmado' | 'cancelado';
                    created_at?: string;
                };
                Relationships: {
                    foreignKeyName: string;
                    columns: string[];
                    isOneToOne?: boolean;
                    referencedRelation: string;
                    referencedColumns: string[];
                }[];
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
    };
}
