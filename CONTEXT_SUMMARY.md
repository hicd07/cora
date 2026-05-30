# 📋 Resumen de Contexto: Plataforma CoRa (Cotizador Rápido)

## 🎯 Objetivo
Transformar el diagrama de contexto de CoRa en una plataforma funcional que conecte ingenieros de obra con proveedores de materiales de construcción mediante un flujo estructurado (Portal Web) y un flujo desestructurado / automatizado (WhatsApp + AI).

## 🚀 Estado Actual (Sprints 1 al 4 Completados)

1. **Infraestructura Base:**
   - App construida con Vite, React 19, TypeScript, TailwindCSS, y shadcn/ui.
   - Backend-as-a-Service sobre Supabase (Postgres, PostGIS, Realtime, Edge Functions).

2. **Sprint 1 & 2 (FSM y Realtime):**
   - Tabla `bid_requests` extendida con columnas espaciales (`lat`, `lng`, `radius_km`) y Máquina de Estados (`state`).
   - Integración de Supabase Realtime para que las ofertas se actualicen sin recargar.
   - Creada la vista "Tablero en Vivo" (`/quote/:id/live`) para los ingenieros.

3. **Sprint 3 (Descubrimiento / Google Places):**
   - Creadas tablas `places_cache` y `external_stores`.
   - Edge Function `places-search` implementada para buscar y cachear proveedores cercanos según el radio definido por el ingeniero.
   - UI de creación de cotización conectada para mostrar "ferreterías candidatas" dinámicamente.

4. **Sprint 4 (PWA & Notificaciones Push):**
   - Añadido `manifest.json` y Service Worker (`sw.js`).
   - Creada tabla `push_subscriptions` y hook `usePushSubscription` para registrar dispositivos.
   - Edge Function `push-dispatch` y trigger de BD implementados para enviar notificaciones web-push automáticas.

## 🛣️ Siguientes Pasos (Sprints 5, 6 y Fase 4)

El próximo objetivo es activar el **Canal de WhatsApp** para alcanzar a los proveedores no registrados (Sprints 5 y 6), seguido de la integración con el motor de IA local (Fase 4).

### Sprint 5 — Canal WhatsApp (Outbound + Webhook)
1. **Modelado de BD:** Crear tablas `wa_conversations` (con su propia sub-FSM) y `wa_messages`.
2. **Edge Function `wa-send`:** Enviar plantillas HSM (vía WhatsApp API) a las ferreterías externas descubiertas (al pasar a estado `BROADCASTING`).
3. **Edge Function `wa-webhook`:** Punto de entrada público (con validación HMAC) para recibir mensajes de los proveedores y guardarlos en BD.

### Sprint 6 — Control Manual del Ingeniero
1. **UI Chat Embebido:** Crear `<ConversationDrawer>` para que el ingeniero vea el historial de WhatsApp.
2. **RPC de Control:** Función para que el ingeniero haga "override" de la IA y asuma la conversación manualmente.
3. **Edge Function `wa-reply`:** Enviar mensajes libres desde el ingeniero al proveedor (dentro de la ventana de 24h).

### Fase 4 — Integración Edge AI (Sprint 7 y 8)
- Crear el microservicio de Gemma 4 / Ollama en un repositorio aparte.
- Conectar Supabase mediante la Edge Function `parse-message` para estructurar el texto libre entrante y convertirlo en ofertas (`HardwareBid`).
- Implementar detectores de fricción (confianza baja, quejas) para escalar automáticamente al ingeniero.

---

> Continúa la implementación a partir del **Sprint 5** utilizando este documento como base.
