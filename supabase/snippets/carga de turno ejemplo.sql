INSERT INTO turnos (negocio_id, servicio_id, cliente_nombre, cliente_telefono, horario)
VALUES (
    'ba493ad9-2548-4b1c-aea8-58e2b346dce0', -- ID de Navajazo
    '60371eef-c881-4e7e-947a-16c45b581102', -- ID del servicio 'corte'
    'Juan Perez',
    '+5491122334455',
    tstzrange('2026-07-15 10:00:00-03', '2026-07-15 10:30:00-03')
);
