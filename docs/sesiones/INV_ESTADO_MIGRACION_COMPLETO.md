# Estado de Migración - Snapshot completo

## Tabla resumen

| Archivo | Path | Líneas | Estado | UI base | Migrado en | Complejidad restante |
|---|---|---|---|---|---|---|
| ClientDashboard.jsx | `src/pages/dashboards/` | 145 | ✅ Cielo y Campo | Card, Badge | V1 | - |
| MyHorses.jsx | `src/pages/client/` | 136 | ✅ Cielo y Campo | Card, Badge, EmptyState, PageHeader | V2 | - |
| HorseDetails.jsx | `src/pages/client/` | 502 | ✅ Cielo y Campo | Card, Badge, Tabs | V2 | - |
| ClientLayout.jsx | `src/components/layout/` | 118 | ✅ Cielo y Campo | - | V1 | - |
| TenantAdminDashboard.jsx | `src/pages/dashboards/` | 266 | ✅ Cielo y Campo | Card, Badge | pre-V1 | - |
| TenantAdminLayout.jsx | `src/components/layout/` | 163 | ✅ Cielo y Campo | - | pre-V1 | - |
| HealthManagement.jsx | `src/pages/tenant/` | 263 | ✅ Cielo y Campo | Card, Badge | pre-V1 | - |
| HorseManagement.jsx | `src/pages/tenant/` | 364 | ✅ Cielo y Campo | Card, Badge | pre-V1 | - |
| InventoryManager.jsx | `src/pages/tenant/` | 533 | ✅ Cielo y Campo | Card, Badge | pre-V1 | - |
| RoutineManagement.jsx | `src/pages/tenant/` | 348 | ✅ Cielo y Campo | Card, Badge | pre-V1 | - |
| TenantEquipment.jsx | `src/pages/tenant/` | 346 | ⬛ Dark Legacy | glass-card, bg-slate-* | - | Alta (D8) |
| FinanceOverview.jsx | `src/pages/tenant/` | 263 | ⬛ Dark Legacy | glass-card, bg-slate-* | - | Alta (D5+D6) |
| StaffManagement.jsx | `src/pages/tenant/` | 336 | ⬛ Dark Legacy | glass-card, bg-slate-* | - | Media |
| EventsManager.jsx | `src/pages/tenant/` | 91 | ⬛ Dark Legacy | glass-card, bg-slate-* | - | Baja |
| ActivityLog.jsx | `src/pages/tenant/` | 115 | ⬛ Dark Legacy | glass-card, bg-slate-* | - | Baja (D7) |
| DebtorsDashboard.jsx | `src/pages/tenant/` | 52 | ⬛ Dark Legacy | glass-card, bg-slate-* | - | Baja |
| RequestsCenter.jsx | `src/pages/tenant/` | 105 | ⬛ Dark Legacy | glass-card, bg-slate-* | - | Baja |
| Settings.jsx | `src/pages/tenant/` | 56 | ⬛ Dark Legacy | glass-card, bg-slate-* | - | Baja |
| SupplyRequests.jsx | `src/pages/tenant/` | 103 | ⬛ Dark Legacy | glass-card, bg-slate-* | - | Baja |
| UserManagement.jsx | `src/pages/tenant/` | 182 | ⬛ Dark Legacy | glass-card, bg-slate-* | - | Media |
| BoxReservation.jsx | `src/pages/client/` | 100 | ⬛ Dark Legacy (NO se migra) | glass-card | - | TR-29 |
| ClientEquipment.jsx | `src/pages/client/` | 129 | ⬛ Dark Legacy | glass-card, bg-slate-* | - | Media (D8) |
| ClientFinance.jsx | `src/pages/client/` | 161 | ⬛ Dark Legacy | glass-card, bg-slate-* | - | Media (D6) |
| ClientStaffView.jsx | `src/pages/client/` | 89 | ⬛ Dark Legacy | glass-card, bg-slate-* | - | Baja |
| Events.jsx | `src/pages/client/` | 70 | ⬛ Dark Legacy | glass-card, bg-slate-* | - | Baja |
| ServiceRequest.jsx | `src/pages/client/` | 183 | ⬛ Dark Legacy | glass-card, bg-slate-* | - | Media (D7) |
| StaffDashboard.jsx | `src/pages/dashboards/` | 80 | ⬛ Dark Legacy | glass-card, bg-slate-* | - | Baja |
| SuperAdminDashboard.jsx| `src/pages/dashboards/` | 41 | ⬛ Dark Legacy | glass-card, bg-slate-* | - | Baja |
| TaskManager.jsx | `src/pages/staff/` | 312 | ⬛ Dark Legacy | glass-card, bg-slate-* | - | Alta |
| QuickLog.jsx | `src/pages/staff/` | 89 | ⬛ Dark Legacy | bg-slate-* | - | Baja |
| StaffSupplies.jsx | `src/pages/staff/` | 197 | ⬛ Dark Legacy | bg-slate-* | - | Media |
| StaffLayout.jsx | `src/components/layout/` | 54 | ⬛ Dark Legacy | bg-slate-* | - | Baja |
| SuperAdminLayout.jsx | `src/components/layout/` | 37 | ⬛ Dark Legacy | bg-slate-* | - | Baja |

## Estado por área

### Admin
- **Migrados a Cielo y Campo:** `TenantAdminDashboard.jsx`, `HealthManagement.jsx`, `HorseManagement.jsx`, `InventoryManager.jsx`, `RoutineManagement.jsx`.
- **Pendientes (Dark Legacy):** `ActivityLog.jsx`, `DebtorsDashboard.jsx`, `EventsManager.jsx`, `FinanceOverview.jsx`, `RequestsCenter.jsx`, `Settings.jsx`, `StaffManagement.jsx`, `SupplyRequests.jsx`, `TenantEquipment.jsx`, `UserManagement.jsx`, `TenantManager.jsx`.

### Cliente
- **Migrados a Cielo y Campo:** `ClientDashboard.jsx`, `MyHorses.jsx`, `HorseDetails.jsx`.
- **Pendientes (Dark Legacy):** `ClientEquipment.jsx`, `ClientFinance.jsx`, `ClientStaffView.jsx`, `Events.jsx`, `ServiceRequest.jsx`.
- **No se migra (TR-29):** `BoxReservation.jsx`.

### Staff & SuperAdmin
- **Pendientes (Dark Legacy):** `StaffDashboard.jsx`, `SuperAdminDashboard.jsx`, `TaskManager.jsx`, `QuickLog.jsx`, `StaffSupplies.jsx`.

### Layouts
- **Migrados a Cielo y Campo:** `ClientLayout.jsx`, `TenantAdminLayout.jsx`.
- **Pendientes (Dark Legacy):** `StaffLayout.jsx`, `SuperAdminLayout.jsx`.

## Métricas globales

- **Total archivos auditados (Pages/Dashboards/Layouts):** 33
- **Archivos migrados:** 10 (30%)
- **Archivos en dark legacy:** 22 (67%)
- **Archivos mixtos:** 0 (0%)
- **Archivos NO se migran (TR-29 u otros):** 1 (3%)

## Clases legacy presentes (resumen)

- `.glass-card`: Encontrado abundantemente en todo el admin (TenantEquipment, FinanceOverview, ActivityLog, etc.), cliente (ClientEquipment, ClientFinance, etc.) y dashboards.
- `.glass-panel`: En modales legacy y contenedores específicos.
- `.btn-glass`: En múltiples vistas (TenantEquipment, etc.).
- `bg-slate-*`: Usado masivamente en backgrounds de componentes Dark Legacy.
- `text-slate-*`: Textos secundarios en la UI Dark Legacy.

## Archivos críticos a migrar (más usados o más visibles)

1. **ClientEquipment / TenantEquipment (V3):** Módulo central de inventario.
2. **ClientFinance / FinanceOverview (V4):** Impacto directo en la facturación y retención.
3. **ServiceRequest / TaskManager (V5):** Flujo de trabajo diario para staff y clientes.
4. **Events / EventsManager (V6):** Visualización y participación de la comunidad.
