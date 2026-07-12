-- 1. Habilitar la extensión para UUID si aún no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla Principal: Negocios (SaaS Tenants)
CREATE TABLE negocios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    rubro VARCHAR(50) NOT NULL, -- Ej: 'barberia', 'jugueteria', 'servicio_tecnico'
    slug VARCHAR(100) UNIQUE NOT NULL, -- URL amigable para la PWA (ej: 'luna-de-abril')
    telefono_contacto VARCHAR(20),
    creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    actualizado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Tabla: Perfiles de Usuarios / Dueños (Asociados a un negocio)
CREATE TABLE perfiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    rol VARCHAR(30) DEFAULT 'empleado' NOT NULL, -- 'dueno', 'administrador', 'empleado'
    creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Un usuario solo puede pertenecer a un negocio en este esquema simple
    CONSTRAINT fk_negocio FOREIGN KEY (negocio_id) REFERENCES negocios(id)
);

-- 4. Tabla: Configuración de Horarios (Estructura para control de baches libres)
CREATE TABLE configuracion_horarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
    dia_semana INT NOT NULL, -- 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    hora_apertura TIME NOT NULL, -- Ej: '09:00:00'
    hora_cierre TIME NOT NULL,   -- Ej: '20:00:00'
    esta_activo BOOLEAN DEFAULT true NOT NULL,
    creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Restricción para evitar días duplicados en el mismo negocio
    CONSTRAINT uq_negocio_dia UNIQUE (negocio_id, dia_semana),
    -- Validación lógica de horas
    CONSTRAINT chk_horas CHECK (hora_apertura < hora_cierre),
    -- Validación de días válidos
    CONSTRAINT chk_dia_semana CHECK (dia_semana BETWEEN 0 AND 6)
);

-- 5. Tabla: Servicios (Para rubros de estética, barberías o técnicos)
CREATE TABLE servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    negocio_id UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL, -- Ideal para manejo exacto de dinero sin floats
    duracion_minutos INT DEFAULT 30 NOT NULL, -- Bloques de tiempo para la agenda
    esta_disponible BOOLEAN DEFAULT true NOT NULL,
    creado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. Índices de Rendimiento (Críticos para el filtrado multi-tenant rápido)
CREATE INDEX idx_perfiles_negocio ON perfiles(negocio_id);
CREATE INDEX idx_horarios_negocio ON configuracion_horarios(negocio_id);
CREATE INDEX idx_servicios_negocio ON servicios(negocio_id);
