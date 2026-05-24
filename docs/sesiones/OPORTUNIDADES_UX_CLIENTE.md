# Oportunidades UX detectadas en Cliente

## Resumen ejecutivo

1. **Jerarquía visual en Modales:** Los modales legacy carecen de contraste adecuado entre acciones primarias y secundarias (botones de cancelar y confirmar compiten visualmente).
2. **Uso de espacio en Mobile (Tablas y Grids):** Vistas como Inventario (`ClientEquipment`) o listados extensos obligan al scroll horizontal o amontonan información en un ancho fijo en mobile.
3. **Puntos ciegos de acción (Hover states):** Las acciones CRUD (editar, borrar) en las tarjetas dependen del evento `:hover` que no existe en dispositivos táctiles, creando fricción innecesaria.
4. **Falta de Feedback en tiempo real:** Formularios o acciones (como "Pagar Ahora" inhabilitado) carecen de explicaciones in-app inmediatas (dependen de un `title` nativo que no funciona en mobile).
5. **Inconsistencia de estados vacíos (Empty States):** Múltiples pantallas (Finanzas, Service Requests) tienen mensajes de error crudos de texto en vez de usar componentes ilustrativos (EmptyState) que inviten a la acción.

## Por pantalla

### ClientDashboard.jsx (Migrado V1)
- **Pain point 1:** Tarjetas de métricas (caballos activos, próximos eventos) no son siempre cliqueables, interrumpiendo el flujo natural de navegación hacia los detalles.
- **Pain point 2:** La sección de notificaciones puede volverse abrumadora si no se agrupa por tipo de notificación.

### MyHorses.jsx (Migrado V2)
- **Pain point 1:** El truncado de nombres de caballos es correcto, pero no hay un `tooltip` accesible en mobile para ver el nombre completo si es muy largo.
- **Pain point 2:** La grilla de caballos en desktop podría aprovechar mejor el espacio vertical si se usa un layout tipo masonry o listado compacto.

### HorseDetails.jsx (Migrado V2)
- **Pain point 1:** El sistema de Tabs requiere swipe horizontal en mobile, pero no hay un indicador visual claro (flecha o gradiente) de que se puede hacer scroll hacia los costados.
- **Pain point 2:** En la tab de Bitácora, los filtros del timeline pueden quedar ocultos si hay demasiados tipos de logs (Entreno, Concurso, Sanidad, etc.).

### ClientEquipment.jsx (No migrado)
- **Pain point 1:** Botones de editar y borrar en las cards solo aparecen en `group-hover:opacity-100`. En mobile, el usuario tiene que hacer tap en lugares "invisibles" o se frustra al no poder borrar un ítem.
- **Pain point 2:** Los filtros para buscar equipos no existen en la vista cliente (sí en admin), lo que dificulta encontrar ítems cuando la lista crece.

### ClientFinance.jsx (No migrado)
- **Pain point 1:** El botón "Pagar Ahora" está deshabilitado con un atributo `title` nativo. En mobile, el usuario no puede leer el tooltip nativo del navegador, por lo que no entiende por qué está gris.
- **Pain point 2:** La lista de cargos pendientes y el historial de pagos carecen de paginación o un "Ver más", lo que alargará la página infinitamente.

### ServiceRequest.jsx (No migrado)
- **Pain point 1:** Al seleccionar un caballo, el select nativo ocupa mucho espacio vertical y rompe la experiencia in-app. Sería mejor un bottom-sheet en mobile o pills rápidas.
- **Pain point 2:** La animación de carga (success state) reemplaza todo el formulario. Si el usuario quería cargar dos pedidos seguidos (ej. dos servicios distintos), tiene que esperar los 3 segundos de timeout.

### Events.jsx (No migrado)
- **Pain point 1:** No hay separación clara entre "Mis eventos confirmados" y "Todos los eventos", lo que obliga al usuario a escanear toda la pantalla.
- **Pain point 2:** Faltan botones para agregar el evento al calendario nativo del teléfono (Google Calendar/Apple Calendar).

### ClientStaffView.jsx (No migrado)
- **Pain point 1:** Listar al staff sin foto de perfil o avatar de iniciales hace que la lista sea muy pesada de leer y menos humana.
- **Pain point 2:** No hay botones de acción rápida directos (ej. "Llamar" o "Solicitar servicio") ligados a un perfil específico de staff.

## Patrones transversales

- **Falta de Floating Action Buttons (FAB):** En vistas principales como MyHorses o Equipment, el botón principal "Agregar" está arriba de todo. Cuando el usuario scrollea hacia abajo en mobile, pierde la acción principal y debe volver a subir.
- **Uso abusivo de Selects Nativos:** En `ServiceRequest`, `EquipmentModal` y otros, se usan selects nativos (`<select>`). Esto rompe la experiencia inmersiva de la UI personalizada, especialmente en iOS.
- **Micro-interacciones inexistentes:** Muchos botones primarios carecen de estados de `active:scale-95` o loadings spinners integrados mientras procesan las request a Firestore, permitiendo clicks dobles.

## Recomendación de priorización

1. **Alta:** Cambiar las acciones de hover (`opacity-0` a `opacity-100`) en ClientEquipment por menú contextual (3 puntos) o siempre visibles. (Bajo costo, Alto impacto en Mobile).
2. **Alta:** Reemplazar el `title` de "Pagar Ahora" por un texto/tooltip real de React visible en mobile en ClientFinance. (Bajo costo, mitiga frustración alta).
3. **Media:** Implementar protección de doble-click (disable + spinner) en todos los submit handlers que interactúan con el `DataContext`.
4. **Media:** Extender el `<EmptyState>` que creamos en V2 a ClientEquipment, ClientFinance, y ServiceRequest para estandarizar la UI vacía.
