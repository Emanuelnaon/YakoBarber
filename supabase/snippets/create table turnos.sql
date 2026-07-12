-- 1. Tabla: Turnos (Reservas Reales)
CREATE TABLE turnos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
    servicio_id UUID NOT NULL REFERENCES servicios(id),
    cliente_nombre VARCHAR(100) NOT NULL,
    cliente_telefono VARCHAR(20) NOT NULL,
    
    -- Definimos el rango del turno (Inicio y Fin)
    horario TSTZRANGE NOT NULL,
    
    estado VARCHAR(20) DEFAULT 'confirmado' NOT NULL, -- 'confirmado', 'cancelado', 'finalizado'
    creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Restricción para evitar solapamientos (Double Booking)
    -- Solo permite insertar si el rango no se solapa con otro para el mismo negocio
    -- Requiere la extensión btree_gist: CREATE EXTENSION IF NOT EXISTS btree_gist;
    CONSTRAINT no_overlap_turnos EXCLUDE USING gist (
        negocio_id WITH =,
        horario WITH &&
    ) WHERE (estado != 'cancelado')
);

-- 2. Índices para consultas rápidas de agenda
CREATE INDEX idx_turnos_negocio ON turnos(negocio_id);
CREATE INDEX idx_turnos_horario ON turnos USING gist (horario);
