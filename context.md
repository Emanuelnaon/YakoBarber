# Contexto del Proyecto: PWA Agenda y Bot de Turnos

## 1. Descripción del Proyecto
MVP de un sistema de gestión de turnos para barberías/salones. Se compone de dos partes:
- **PWA (Frontend):** Interfaz administrativa mobile-first para que el dueño gestione servicios, precios dinámicos y visualice la agenda en tiempo real.
- **Bot de WhatsApp (Backend):** Interfaz conversacional (Gemini API) para que los clientes reserven turnos interactuando con la base de datos.

## 2. Stack Tecnológico
- **Frontend:** React, Vite, Tailwind CSS (Mobile-first).
- **Backend/Database:** Supabase (PostgreSQL, Auth, Realtime, Edge Functions).
- **IA:** Google Gemini API.

## 3. Reglas de Arquitectura y Desarrollo
- **Autenticación:** Implementación estricta de Magic Links (OTP) mediante Supabase Auth. Cero contraseñas.
- **Código Limpio:** Separación de responsabilidades. Lógica de acceso a datos en `/src/lib` y `/src/hooks`. UI puramente presentacional.
- **Seguridad:** El frontend opera con la `anon key` y políticas RLS. El bot operará con `service_role key`.
- **Offline-First:** Considerar el uso de localStorage/IndexedDB a través de vite-plugin-pwa para mantener la vitrina funcional ante cortes de red.

## 4. Esquema de Base de Datos (Supabase)
- **negocios:** `id` (UUID), `nombre`, `telefono_whatsapp`.
- **perfiles:** `id` (FK auth.users), `negocio_id` (FK), `nombre`, `rol` ('admin', 'empleado').
- **servicios:** `id`, `negocio_id` (FK), `nombre`, `precio`, `duracion_minutos`, `active`.
- **turnos:** `id`, `negocio_id` (FK), `servicio_id` (FK), `cliente_nombre`, `fecha_hora`, `estado`.

## 5. Flujo Crítico Actual (Vitrina PWA)
1. Login OTP del dueño.
2. Carga de los servicios activos filtrados por RLS (`negocio_id`).
3. Actualización de precios que impactan directamente en la BD para que el bot los consuma.