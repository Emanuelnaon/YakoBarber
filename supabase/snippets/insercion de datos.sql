-- ============================================================================
-- 1. Insertar Negocio
-- ============================================================================
INSERT INTO "public"."negocios" ("id", "nombre", "rubro", "slug", "telefono_contacto", "creado_at") 
VALUES (
    'ba493ad9-2548-4b1c-aea8-58e2b346dce0', 
    'Navajazo', 
    'barberia',             -- CAMBIO: Se agregó 'rubro' (requerido por el diseño original)
    'navajazo',             -- CAMBIO: Se agregó 'slug' (requerido para la URL de la PWA)
    '+5491128555582',       -- CAMBIO: 'telefono_whatsapp' cambió a 'telefono_contacto'
    '2026-07-05 04:58:48.630024+00' -- CAMBIO: 'created_at' cambió a 'creado_at'
);

-- ============================================================================
-- 2. Insertar Perfil
-- ============================================================================
INSERT INTO "public"."perfiles" ("id", "negocio_id", "nombre", "email", "rol", "creado_at") 
VALUES (
    'f1b7c638-dbb9-44f9-aa6b-8d3f76e0649f', 
    'ba493ad9-2548-4b1c-aea8-58e2b346dce0', 
    'Dueño', 
    'contacto@navajazo.com', -- CAMBIO: Se agregó 'email' (requerido con restricción UNIQUE)
    'dueno',                 -- CAMBIO: 'admin' cambió a 'dueno' para respetar la restricción CHECK de roles
    '2026-07-05 05:04:56.431483+00' -- CAMBIO: 'created_at' cambió a 'creado_at'
);

-- ============================================================================
-- 3. Insertar Configuración de Horarios
-- ============================================================================
-- CAMBIO: El diseño original maneja días individuales (INT) del 0 al 6 en lugar de un ARRAY.
-- CAMBIO: Se eliminó 'bloque_minutos' ya que los servicios manejan su propia duración.
-- Se generan registros individuales para Lunes(1), Martes(2), Miércoles(3), Jueves(4), Viernes(5) y Sábado(6).
INSERT INTO "public"."configuracion_horarios" ("negocio_id", "dia_semana", "hora_apertura", "hora_cierre", "esta_activo") 
VALUES 
('ba493ad9-2548-4b1c-aea8-58e2b346dce0', 1, '08:00:00', '22:00:00', true),
('ba493ad9-2548-4b1c-aea8-58e2b346dce0', 2, '08:00:00', '22:00:00', true),
('ba493ad9-2548-4b1c-aea8-58e2b346dce0', 3, '08:00:00', '22:00:00', true),
('ba493ad9-2548-4b1c-aea8-58e2b346dce0', 4, '08:00:00', '22:00:00', true),
('ba493ad9-2548-4b1c-aea8-58e2b346dce0', 5, '08:00:00', '22:00:00', true),
('ba493ad9-2548-4b1c-aea8-58e2b346dce0', 6, '08:00:00', '22:00:00', true);

-- ============================================================================
-- 4. Insertar Servicios
-- ============================================================================
-- CAMBIO: El campo 'active' cambió a 'esta_disponible'.
-- Los precios se insertan como valores numéricos puros que mapean directamente a NUMERIC(10,2).
INSERT INTO "public"."servicios" ("id", "negocio_id", "nombre", "precio", "duracion_minutos", "esta_disponible") 
VALUES 
('5f2335e3-ca17-4786-b788-510f976d2166', 'ba493ad9-2548-4b1c-aea8-58e2b346dce0', 'corte con diseño', 15000.00, 30, true), 
('60371eef-c881-4e7e-947a-16c45b581102', 'ba493ad9-2548-4b1c-aea8-58e2b346dce0', 'corte', 9000.00, 30, true), 
('a0242275-d050-42da-999c-c4ac0f2a37da', 'ba493ad9-2548-4b1c-aea8-58e2b346dce0', 'promo corte y barba', 12000.00, 30, true), 
('d5c0c39f-8b77-4c0d-8445-5cc520b2b482', 'ba493ad9-2548-4b1c-aea8-58e2b346dce0', 'color', 4000.00, 30, true);
