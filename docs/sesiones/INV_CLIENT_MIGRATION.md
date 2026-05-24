# Pre-Investigación — Migración UI del Cliente a Cielo y Campo

## TAREA 1 — Inventario de componentes Cielo y Campo (admin)

### 1. Lista de componentes UI Base
Se encontraron los siguientes componentes reutilizables en `src/components/ui/`:
- `Card.jsx`
- `PageHeader.jsx`
- `Badge.jsx`
- `Modal.jsx`
- `DataTable.jsx`
- `EmptyState.jsx`
- `Tabs.jsx`

### 2. Contrato de Componentes
- **`Card.jsx`**: `src/components/ui/Card.jsx`
  - Props típicas: `children`, `className`, `hoverable`.
  - Uso real: Envuelta de KPIs o formularios en admin.
- **`PageHeader.jsx`**: `src/components/ui/PageHeader.jsx`
  - Props: `title`, `description`, `action` (botón), `kicker`.
  - Uso real: Encabezados de página (ej. `TenantEquipment.jsx`).
- **`Badge.jsx`**: `src/components/ui/Badge.jsx`
  - Props: `children`, `tone` (`primary`, `success`, `danger`, `gold`, `neutral`), `className`.
  - Uso real: Estados de requests, roles, etc.
- **`Modal.jsx`**: `src/components/ui/Modal.jsx`
  - Props: `isOpen`, `onClose`, `title`, `children`, `footer`.
  - Uso real: Formularios de creación (ej. admin modales).
- **`DataTable.jsx`**: `src/components/ui/DataTable.jsx`
  - Props: `columns`, `data`, `emptyState`, `pagination`.
  - Uso real: Tablas de datos en Admin.
- **`EmptyState.jsx`**: `src/components/ui/EmptyState.jsx`
  - Props: `icon`, `title`, `description`, `action`.
  - Uso real: Cuando no hay datos en una vista.
- **`Tabs.jsx`**: `src/components/ui/Tabs.jsx`
  - Props: `tabs` (array), `activeTab`, `onChange`.
  - Uso real: Sub-navegación como en `TenantEquipment.jsx`.

### 3. Sistema de Colores y Tokens Visuales
El sistema "Cielo y Campo" está definido en `tailwind.config.js`:
- **primary**: Azul ecuestre (500: `#2d6fb5` - botones, links).
- **sky**: Celeste de aire (fondos, `linear-gradient` en `body`).
- **gold**: Amarillo cálido (400: `#f0b840` - alertas, urgentes).
- **success**: Verde semántico (saldos, ocupación).
- **danger**: Rojo semántico (deudas, errores).
- **ink**: Neutros (textos principales y secundarios, bordes).
- Constantes de sombreado: `shadow-card`, `shadow-card-hover`.
- Gradientes: `sky-field` y `primary-gradient`.

### 4. Estados visuales típicos
Definidos globalmente en `src/index.css`:
- **Botón Primario**: `.btn-primary` (fondo azul `primary-500`, texto blanco, rounded-lg, hover, shadow).
- **Botón Secundario**: `.btn-secondary` (fondo blanco, borde `ink-200`, texto `ink-700`).
- **Botón Danger**: `.btn-danger` (fondo `danger-500`, texto blanco).
- **Inputs**: `.input-field` (fondo blanco, border `ink-200`, focus ring `primary-100`).
- **Cards KPIs**: `.kpi-card` con banda de color lateral (`.kpi-card-primary`, etc).

---

## TAREA 2 — Auditoría del estado actual del cliente

El cliente aún utiliza el "dark mode legacy", combinando Tailwind utilities inline y clases CSS legacy retenidas en `src/index.css`.

- `src/pages/client/MyHorses.jsx` (~200 líneas)
  - Visual: Dark mode legacy. Usa `glass-card`, `.btn-primary`, `.btn-glass`.
- `src/pages/client/HorseDetails.jsx` (~800 líneas)
  - Visual: Dark mode legacy. Usa extensivamente `glass-panel`, `glass-card`, y text colors `.text-slate-*`.
- `src/pages/client/ClientStaffView.jsx` (~150 líneas)
  - Visual: Dark mode legacy. `glass-card`, `bg-slate-800`.
- `src/pages/client/ClientFinance.jsx` (~300 líneas)
  - Visual: Dark mode legacy. `glass-card`, `.text-gold-500`.
- `src/pages/client/Events.jsx` (~100 líneas)
  - Visual: Dark mode legacy. `glass-card`.
- `src/pages/client/ServiceRequest.jsx` (~300 líneas)
  - Visual: Dark mode legacy. Usa formularios dentro de `glass-panel`.
- `src/pages/client/ClientEquipment.jsx` (~200 líneas, introducido en D8)
  - Visual: Dark mode legacy (mantenido por coherencia). `glass-card`.
- `src/pages/client/BoxReservation.jsx` (~150 líneas)
  - Visual: Dark mode legacy. Oculto del menú, pendiente de migración a web pública.
- `src/components/layout/ClientLayout.jsx` (~100 líneas)
  - Visual: Dark mode legacy. Fondo `bg-slate-900` con `radial-gradient`. Menú lateral off-canvas estilo glass y bottom nav fijo (`pb-20`, `safe-area-bottom`).
- `src/components/client/EquipmentItemModal.jsx` (~200 líneas, D8)
  - Visual: Modal oscuro (`bg-slate-900/60`, `backdrop-blur-xl`). Formulario embebido.

**Patrones Visuales Repetidos y Dependencias:**
- Se depende de las clases `glass-card`, `glass-panel`, `btn-glass` que están reservadas al final de `index.css`.
- Fondos de pantalla utilizan `bg-slate-900` u `800` en contraste agresivo con el nuevo `bg-sky-field` del body (que el admin usa implícitamente).

---

## TAREA 3 — Inventario de patrones repetidos cliente

- **Cards de objetos**: Grid responsive muy común (`ClientEquipment.jsx`, `MyHorses.jsx`, `ClientStaffView.jsx`). Típicamente usan `glass-card`.
- **Modales con formulario**: `EquipmentItemModal.jsx`, modales en finanzas o ServiceRequest. Comparten envoltura en `div` fijo negro semitransparente y caja interior `glass-panel`.
- **Botones de acción**: Uso mixto de `btn-primary` (ahora se renderiza en azul Cielo y Campo gracias al CSS global actualizado) y `btn-glass` (bordes grises, hover dorado).
- **Empty states**: Básicos, centrados con textos en `text-slate-400`.
- **Badges**: Hechos con `span` inline y colores duros de tailwind (`bg-green-500/20 text-green-400`, etc).
- **Headers de página**: Texto blanco en negrita simple, a veces acompañado de descripción en `text-slate-400`.
- **Navegación**: Menú lateral hamburguesa (Mobile/Desktop) y Bottom Nav (Mobile).

---

## TAREA 4 — Pantallas del admin como referencia visual

Las pantallas de admin ya migradas que servirán de referencia (todas ubicadas en `src/pages/tenant/`):

| Pantalla admin | Pantalla cliente equivalente |
|---|---|
| `TenantEquipment.jsx` | `ClientEquipment.jsx` |
| `FinanceOverview.jsx` | `ClientFinance.jsx` |
| `EventsManager.jsx` | `Events.jsx` |
| `HorseManagement.jsx` | `MyHorses.jsx` + `HorseDetails.jsx` |
| `RequestsCenter.jsx` / `RoutineManagement.jsx` | `ServiceRequest.jsx` |
| `StaffManagement.jsx` | `ClientStaffView.jsx` |

---

## TAREA 5 — Particularidades del cliente

1. **Mobile-first**: La UX del cliente asume fuertemente el uso móvil. Las cards de caballos y equipos se apilan, los botones son grandes.
2. **Bottom navigation**: Ubicada en `ClientLayout.jsx`. Consta de 3 ítems (Inicio, Mis Caballos, Solicitar). Fija en el bottom (`bottom-0`).
3. **NotificationBell**: Renderizada en `ClientLayout.jsx`. El componente `src/components/common/NotificationBell.jsx` es **compartido** con el admin, pero su markup tiene hardcodeados colores oscuros (`bg-slate-900/50`, `bg-slate-800`). Se ve bien en el header oscuro del admin y en el layout oscuro del cliente, pero en un layout claro de cliente requerirá ajuste.
4. **Theme tokens propios**: `bg-[radial-gradient(...)]` exclusivo del cliente en el layout. `text-gold-500` muy presente en títulos o destaques.

---

## TAREA 6 — Identificación de "valle de la migración"

1. **Componentes compartidos**: `NotificationBell.jsx` es el puente crítico. Al cambiar el cliente a Cielo y Campo (fondo claro), la campana deberá adaptar sus colores (posible dark mode local o refactor a colores claros).
2. **Estilos globales (`index.css`)**: Las clases `.glass-panel`, `.glass-card`, `.btn-glass` no pueden borrarse hasta que TODAS las pantallas del cliente hayan sido migradas, ya que se usan concurrentemente en múltiples rutas.
3. El `body` global ya tiene el degradado `sky-field` del sistema nuevo. El layout actual del cliente sobreescribe esto tapándolo con contenedores `min-h-screen bg-slate-900`. Al retirar estas clases envolventes, las vistas del cliente revelarán el fondo claro del body automáticamente.

---

## TAREA 7 — Estrategia de rediseño UX (oportunidades detectadas)

- **Unificación de Botones**: El cliente utiliza un híbrido donde los `btn-primary` se ven azules (nuevos) y los `btn-glass` se ven oscuros/dorados. Esto se unificará usando los `btn-primary`, `btn-secondary` y `btn-danger` del admin.
- **Badges Semánticos**: Reemplazar los badges inline por el componente `<Badge>` estandarizado, usando los tintes `success`, `danger`, `gold` del sistema.
- **Empty States**: Reemplazar los textos sueltos con `<EmptyState>` que incluye ícono e ilustración, aportando un diseño más premium.
- **Modales**: Migrar todos los modales oscuros al componente `<Modal>`, que ya incluye gestión de click outside, títulos consistentes y footer semántico.
- **Bottom Navigation**: Hacer que el bottom nav en mobile use fondo de cristal (`backdrop-blur`) pero en tonos neutros o blancos (`bg-white/80`), reemplazando los íconos grises/dorados por los `ink`/`primary` correspondientes a activo/inactivo.

---

## TAREA 8 — Mapa de complejidad de migración

| Pantalla | Complejidad | Razón |
|---|---|---|
| `ClientLayout.jsx` | Media | Requiere adaptar bottom nav y sidebar a colores claros, y ajustar integración con `NotificationBell`. |
| `MyHorses.jsx` | Baja | Grid de cards simple. Sustitución 1:1 por `<Card>`. |
| `ClientEquipment.jsx` | Baja | Grid de cards introducido en D8. Reemplazo por `<Card>` y `<Badge>`. |
| `HorseDetails.jsx` | Alta | Vista muy larga y detallada. Requiere reestructuración de la jerarquía visual con sub-cards y `<Tabs>` (patrón admin). |
| `ServiceRequest.jsx` | Media | Formulario principal. Requiere uso de `<Card>`, `<Modal>` y clases inputs nuevas. |
| `ClientFinance.jsx` | Media | Uso intensivo de tablas y balances. Hay que migrar a `<DataTable>` o listas con dividers de Cielo y Campo. |
| `Events.jsx` | Baja | Simple lectura. Swap por `<Card>`. |
| `ClientStaffView.jsx`| Baja | Grid de personas. Swap por `<Card>`. |

---

## TAREA 9 — Hallazgos adicionales

- ⚠️ **`NotificationBell.jsx` Inconsistente**: El componente compartido está atado al diseño "Dark Mode". Al pasarse al diseño claro, los colores `slate-800` y textos `slate-400` desentonarán fuertemente.
- **Classes Legacy**: La definición de `.btn-primary` en `index.css` ya está actualizada a Cielo y Campo. Por tanto, donde el cliente usa `btn-primary` hoy ya se ve el azul nuevo, rompiendo la armonía "dark" en la que vive actualmente.
- **Web Pública**: `BoxReservation.jsx` permanece en `client/`, aunque está documentada (TR-29) su migración a una web pública. Por eficiencia, se podría obviar su migración de UI a Cielo y Campo, ya que saldrá del scope de la app interna pronto.
