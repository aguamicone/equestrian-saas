# PRE-INVESTIGACIÓN V3 — Módulo Equipos (Admin + Cliente)

## 1. Estado Actual de Archivos Involucrados

### `src/pages/client/ClientEquipment.jsx`
- **Líneas:** 145
- **Estado Visual:** Dark Legacy (`glass-card`, `glass-panel`, `bg-slate-*`, `text-slate-*`)
- **Estructura JSX Raíz:** `<div>` simple con header, render condicional (Empty State vs Grid) y modales integrados.
- **Estados Locales:** `isModalOpen`, `selectedItem`, `itemToDelete`.
- **DataContext consumido:** `getMyEquipmentItems`, `deleteEquipmentItem`.
- **Funciones Críticas:** `handleAdd`, `handleEdit`, `handleDeleteConfirm`.

### `src/components/client/EquipmentItemModal.jsx`
- **Líneas:** 182
- **Estado Visual:** Dark Legacy (`glass-panel`, inputs oscuros, text-slate).
- **Rol:** Modal **COMPARTIDO** entre cliente (`ClientEquipment.jsx`) y admin (`TenantEquipment.jsx` -> `TabPropios`).
- **Estados Locales:** `name`, `type`, `brand`, `condition`, `usage`, `notes`, `error`.
- **DataContext consumido:** `createEquipmentItem`, `updateEquipmentItem`.
- **Funciones Críticas:** `handleSubmit` (detecta si es edit o create).

### `src/pages/tenant/TenantEquipment.jsx`
- **Líneas:** 372
- **Estado Visual:** Dark Legacy (`glass-card`, `bg-slate-800`, `text-slate-400`).
- **Estructura JSX Raíz:** `<div>` principal con Header, Quick Stats (2 cards), Navigation Tabs, Renders Condicionales (`TabTodos`, `TabPropios`), Modales integrados.
- **Estados Locales:** `activeTab` ('todos', 'propios'), estados de modal idénticos al cliente. Sub-estados en `TabTodos`: `filterOwner`, `filterType`, `filterCondition`, `filterUsage`, `searchQuery`.
- **DataContext consumido:** `equipmentItems`, `tenantUsers`, `getEquipmentItemsByTenantAdmins`, `deleteEquipmentItem`.
- **Funciones Críticas:** Renderizados pesados y `useMemo` para calcular `itemsByOwner` y `filteredItems`.

## 2. Mapa de Complejidad (MEDIA-ALTA)
- **Línea base de tokens a reemplazar:** Alta. Hay un uso intensivo de `bg-slate-*`, `border-slate-*`, opacidades y hover states manuales.
- **Complejidad Cliente:** Baja. Es un grid simple y un modal.
- **Complejidad Admin:** Media-Alta. Tiene sub-tabs, una tabla de datos completa con 5 filtros combinables, y cálculo de estadísticas en tiempo real.
- **Acoplamiento:** El modal `EquipmentItemModal` se usa en ambos entornos. Al migrarlo, obligatoriamente debe encajar visualmente con el Cielo y Campo tanto del cliente como del admin en la misma tanda.

## 3. Patrones repetidos y Duplicación
- **Mapeo de Tipos e Iconos:** `TYPE_ICONS` y `EQUIPMENT_TYPES` están definidos estáticamente dentro de cada archivo por separado. Hay oportunidad de extraerlos a un archivo de constantes o utils, pero por ahora se deben respetar.
- **Estilos Condicionales:** La lógica para pintar badges de `condition` (nueva, usada, a_reparar) y `usage` (entrenamiento, concurso) está literalmente copiada y pegada entre `ClientEquipment` y `TabPropios`.

## 4. Particularidades del módulo Equipos
- **Sub-tabs en Admin:** 
  - *Todos los Equipos:* Vista de tabla (`TabTodos`), muestra equipos de todos los clientes + propios. Múltiples filtros.
  - *Ítems Caballeriza:* Vista de grid (`TabPropios`), reutiliza la misma UI visual de `ClientEquipment` pero consume `getEquipmentItemsByTenantAdmins`.
- **Inventario de Items:** 9 tipos de items, 3 estados físicos, 2 usos operativos.
- **Photos:** No están implementadas todavía (mencionado en TR-37). Solo hay texto/iconos.

## 5. Riesgos Detectados
- **Riesgo Visual en Modal Compartido:** Al migrar `EquipmentItemModal` a blanco, afectará a la vez a `ClientEquipment` y `TenantEquipment`. Como ambos se migran en V3 juntos, este riesgo se mitiga, pero obliga a que la migración se haga en un solo gran commit visual para evitar Frankenstein.
- **Lógica de Filtros en TabTodos:** `filteredItems` tiene una cadena de condiciones encadenadas. Tocar algo de la estructura de la tabla podría romper el filtrado en cadena.
- **Estado de Users:** `itemsByOwner` hace un `.find` sobre `tenantUsers`. Si un owner es borrado, fallbackea a 'Desconocido', lo cual es seguro, pero debe mantenerse.

## 6. Oportunidades UX Detectadas (Solo Identificación)
- **Empty States:** Se pueden reemplazar los divs manuales con el nuevo componente `<EmptyState>` centralizado.
- **Densidad de Información:** En mobile, la tabla de `TabTodos` requiere scroll horizontal. Un diseño de Cards para mobile en vez de tabla podría mejorar drásticamente la UX.
- **Cards de Equipamiento:** En la vista de Grid, las acciones (Edit/Trash) solo aparecen en hover (`opacity-0 group-hover:opacity-100`). En mobile, el hover no existe por lo que obliga al tap repetido. Podrían usar un menú contextual de 3 puntos (Dots vertical) o estar siempre visibles en semitransparencia.
- **Duplicación de Código:** Las pills de `conditionStyle` y `usageStyle` (que manejan colores semánticos) podrían ser reemplazadas nativamente por el componente `<Badge>` del sistema.
