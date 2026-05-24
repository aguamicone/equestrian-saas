# Auditoría TR-33 - Subscribes Globales del DataContext

## Estado actual de los subscribes

El archivo `src/context/DataContext.jsx` contiene un `useEffect` (líneas 43-106) que dispara 17 suscripciones globales en tiempo real mediante `onSnapshot` cuando `currentTenant` está disponible, independientemente del rol del usuario.

| Colección | Filtro en Query | Filtro posterior en frontend |
|---|---|---|
| `SPACES` | `tenantId == currentTenant.id` | No (el frontend filtra localmente según necesidad) |
| `HORSES` | `tenantId == currentTenant.id` | No |
| `FINANCES` | `tenantId == currentTenant.id` | `getFinanceForUser()` filtra localmente |
| `LOGS` | `tenantId == currentTenant.id` | `getLogsForHorse()` filtra localmente |
| `REQUESTS` | `tenantId == currentTenant.id` | `getActiveRequestsForClient()` filtra localmente |
| `ROUTINES` | `tenantId == currentTenant.id` | No |
| `PRICING_PLANS` | `tenantId == currentTenant.id` | No |
| `SHIFTS` | `tenantId == currentTenant.id` | No |
| `INVENTORY` | `tenantId == currentTenant.id` | No |
| `INVENTORY_LOGS`| `tenantId == currentTenant.id` | No |
| `SERVICES_CATALOG`| `tenantId == currentTenant.id` | No |
| `PAYROLL_ADVANCES`| `tenantId == currentTenant.id` | No |
| `EVENTS` | `tenantId == currentTenant.id` | No |
| `HEALTH_RECORDS`| `tenantId == currentTenant.id` | No |
| `HORSE_HEALTH_BOOKLETS`| `tenantId == currentTenant.id` | No |
| `USERS` | `tenantId == currentTenant.id` | No |
| `EQUIPMENT_ITEMS`| `tenantId == currentTenant.id` | `getMyEquipmentItems()` filtra localmente |

## Firestore Rules - mapa por rol

La mayoría de las reglas en `firestore.rules` usan el helper `belongsToTenant(resource.data.tenantId)`. Esto significa que si el usuario pertenece al tenant, puede **leer todo**.

| Colección | SuperAdmin | TenantAdmin | Staff | Client |
|---|---|---|---|---|
| `PAYROLL_ADVANCES` | Lee todo | Lee todo | **Solo lee los suyos** (`staffId == uid`) | **Denegado** |
| `EQUIPMENT_ITEMS` | Lee todo | Lee todo | Lee todo | Lee todo (Riesgo de privacidad) |
| `FINANCES` | Lee todo | Lee todo | Lee todo | Lee todo (Riesgo de privacidad) |
| *Otras 14 colecciones*| Lee todo | Lee todo | Lee todo | Lee todo |

## Errores específicos en consola

El "permission-denied" ocurre por dos motivos arquitectónicos detectados en esta auditoría:

1. **Causa Raíz 1 (PAYROLL_ADVANCES):** El cliente o caballerizo se loguea. El `DataContext` ejecuta `onSnapshot` pidiendo *todos* los `PAYROLL_ADVANCES` del tenant. Firestore evalúa la regla, ve que el cliente no es tenantAdmin y rechaza la query completa.
2. **Causa Raíz 2 (Condición de Carrera en Auth):** El `useEffect` se dispara cuando `currentTenant` está definido, pero **NO verifica** si `currentUser` está autenticado completamente. Si un usuario anónimo entra a una vista pública (con tenantId en la URL), las 17 queries se disparan y fallan instantáneamente porque las reglas exigen `isSignedIn()`.

*(Nota: como no tengo acceso al detalle original de TR-33, asumo que los "19 errores" reportados son las 17 colecciones fallando simultáneamente en carga pública/deslogueada, más `PAYROLL_ADVANCES` fallando consistentemente para clientes y staff).*

## Propuestas de refactor

### Estrategia A: Subscribes condicionales por rol
Mantener el `useEffect` gigante, pero agregar `if` statements basados en `currentUser.role`.
- **Detalle:** Si es cliente, no suscribir a `PAYROLL_ADVANCES` ni `INVENTORY`. Si es staff, suscribir a `PAYROLL_ADVANCES` con un `where("staffId", "==", currentUser.uid)`.
- **Pros:** Fácil de implementar en el patrón actual.
- **Contras:** El `DataContext.jsx` seguirá creciendo. Los clientes siguen descargando TODO `FINANCES` (grave riesgo de privacidad de datos).

### Estrategia B: where() basado en currentUser.uid
Cambiar las queries globales para que los clientes solo pidan sus propios datos.
- **Detalle:** En `FINANCES`, `REQUESTS`, `EQUIPMENT_ITEMS`: `query(..., where("clientId", "==", currentUser.uid))`.
- **Pros:** Seguro, evita descargar gigabytes de datos de otros clientes.
- **Contras:** Requiere adaptar todas las reglas de Firestore. No soluciona el acoplamiento masivo en `DataContext`.

### Estrategia C: Hooks por feature (Recomendada)
Desacoplar `DataContext.jsx`. Crear hooks individuales: `useFinances()`, `useEquipment()`, `useHorses()`.
- **Detalle:** Cada componente llama al hook que necesita. El hook maneja el `onSnapshot` con los filtros correctos según el rol.
- **Pros:** Arquitectura escalable, segura, carga perezosa (lazy load) de datos (el cliente no descarga `INVENTORY` si no entra a esa pantalla).
- **Contras:** Invasivo. Requiere refactorizar todos los imports en los componentes.

## Recomendación

**Estrategia C (Hooks por feature)** combinada con **Estrategia B (Filtros en Query)**. 
El `DataContext` actual carga toda la base de datos de un tenant en la memoria RAM del dispositivo del usuario apenas se abre la app. Esto no solo genera errores de permisos, sino que explotará en costos de lectura de Firebase y colapsará navegadores móviles cuando el haras tenga miles de registros.

## Plan de migración propuesto (Estrategia C+B)

1. **Fase 1 (Hotfix TR-33):** Modificar el `useEffect` actual para inyectar condiciones rápidas.
   - Si `!currentUser`, retornar inmediatamente (mata 17 de los 19 errores).
   - Para `PAYROLL_ADVANCES`, usar `where('staffId', '==', currentUser.uid)` si el rol es `staff`, o ignorar si es `client`.
2. **Fase 2 (Seguridad):** Modificar las queries de `FINANCES`, `EQUIPMENT_ITEMS` y `REQUESTS` para usar `where("clientId", "==", uid)` si el rol es `client`. Actualizar `firestore.rules`.
3. **Fase 3 (Refactor Arquitectónico):** Extraer colecciones a `useHorses.js`, `useFinances.js`, etc. y eliminar `DataContext` gradualmente.

## Riesgos

- **Rompimiento de UI:** Si un frontend asume que `finances` tiene todos los registros y de repente solo trae los propios, lógicas como `getFinanceForUser(uid)` fallarán si la query ya no trae esa data.
- **Costos temporales:** Mover queries a componentes puede causar múltiples re-renders y re-suscripciones si no se memorizan bien.

## Tiempo estimado

- **Fase 1 (Hotfix):** 1-2 horas.
- **Fase 2 (Seguridad):** 4-5 horas (incluyendo testing exhaustivo).
- **Fase 3 (Arquitectura):** 1-2 semanas (refactor progresivo).
