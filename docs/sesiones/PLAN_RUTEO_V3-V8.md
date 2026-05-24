# Plan de Ruteo V3 a V8 (Camino Crítico de Migración)

## Visión General
Este documento traza la ruta óptima para migrar los módulos restantes del "Dark Legacy" al sistema de diseño "Cielo y Campo", minimizando el riesgo de regresiones y gestionando la deuda técnica progresivamente.

---

## 🚦 V3 — Equipos e Inventario
**Componentes a migrar:** `ClientEquipment.jsx`, `TenantEquipment.jsx` y su dependencia compartida `EquipmentItemModal.jsx`.

**Por qué va primero:** Es un módulo autocontenido, de riesgo medio/bajo. Sirve como prueba de fuego para refactorizar un modal compartido entre Cliente y Admin. Nos obliga a resolver el diseño de listados densos de items en Cielo y Campo antes de tocar Finanzas.

**Metas críticas:**
1. Migrar `EquipmentItemModal.jsx` a Cielo y Campo asegurando que se vea bien tanto en Admin como en Cliente.
2. Implementar `<EmptyState>` nativos.
3. Blindaje defensivo en los formularios (evitar double-submit).

---

## 🚦 V4 — Finanzas
**Componentes a migrar:** `ClientFinance.jsx` (y revisión de dependencias con `TenantFinances.jsx` si las hay).

**Por qué va segundo:** Módulo altamente sensible pero fundamental para la monetización del SaaS. Visualmente es simple (cards de resumen, lista de pagos), pero su correcta visualización evita tickets de soporte.

**Metas críticas:**
1. Refactor de la jerarquía visual de cargos pendientes y deudas.
2. Solucionar el problema de UX del botón deshabilitado "Pagar Ahora" (reemplazar `title` nativo por tooltip o mensaje explícito en mobile).
3. **Pre-requisito:** Antes o durante V4, implementar FASE 2 de la auditoría TR-33 para que la query de `FINANCES` filtre server-side por `clientId == uid` para los clientes.

---

## 🚦 V5 — Pedidos y Tareas Operativas
**Componentes a migrar:** `ServiceRequest.jsx` (Cliente) y módulos asociados de Staff si los hay (Rutinas/Pedidos).

**Por qué va tercero:** Tiene los formularios más complejos y lógica de notificaciones acoplada.

**Metas críticas:**
1. Refactor del formulario de pedidos (`ServiceRequest`), implementando estado `isSubmitting` real y manejando promesas `await`.
2. Cambio de componentes nativos (`<select>`) por menús o modales inferiores para mobile.
3. Arreglar race condition del caballo pre-seleccionado (`myHorses[0]`).

---

## 🚦 V6 — Eventos y Calendario
**Componentes a migrar:** `Events.jsx` (Cliente/Shared), `ClientStaffView.jsx`.

**Por qué va cuarto:** Menos urgencia en el día a día.

**Metas críticas:**
1. Separación visual clara entre eventos propios vs eventos generales del haras.
2. Mejorar la UI del Staff View para que el cliente sienta una conexión más humana con el equipo del haras (idealmente prever avatares en un futuro).

---

## 🚦 V7 — Sanidad e Historial (Opcional)
**Componentes a migrar:** Visor de libretas sanitarias o historial médico para el cliente.

**Por qué va quinto:** Es puramente lectura en el lado del cliente y ya se migró una pestaña básica en V2 (HorseDetails). Quedaría pulir pantallas satélite si existen.

---

## 🚦 V8 — Housekeeping Final
**Metas Críticas de Limpieza:**
1. Borrar todas las clases "Dark Legacy" sobrantes (ej. `glass-card`, `glass-panel` si ya no se usan en todo el proyecto).
2. Revisar archivos CSS y purgar variables oscuras.
3. Fase 3 de TR-33 (Hooks de data independientes) si no se implementó.
4. QA de extremo a extremo, foco en accesibilidad y responsividad mobile.

---

## Resumen de Riesgos Transversales
- **Interdependencia Admin/Client:** Módulos que comparten modales o utils deben ser probados en ambos roles (ejemplo `EquipmentItemModal` en V3).
- **Sobrecarga del DataContext:** No retrasar demasiado la resolución de los filtros globales de `DataContext` (TR-33), de lo contrario, al lanzar nuevos features, el frontend se volverá inmanejable.
