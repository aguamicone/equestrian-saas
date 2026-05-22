# Reporte de Cierre — Tanda D3 (Registrar cargo único)

## Branch
`feature/horse-management-tanda-d3` → mergeable a `main`

## Commits incluidos (en orden cronológico)

1. `fadaebb` feat(d3): add createOneTimeCharge to DataContext
2. `ac4af81` feat(d3): create RegistrarCargoModal with presets and custom concept
3. `09c3850` feat(d3): wire RegistrarCargoModal into HorseDetailModal
4. `c47d4f9` feat(d3): add "Cargos únicos" section in FinanceTab and exclude one-time from Cuenta corriente
5. `5caed21` fix(d3): robust dateText fallback in ChargeRow for Timestamp/ISO/missing
6. `5bcb29d` fix(tr7): filter monthly plans in Total mensual and add Único badge for one-time
7. `5f9f9d5` fix(d3): restructure plan layout in FinanceTab with right-aligned price column
8. `125616d` docs(d3): update NOTAS_AGUSTIN.md with D3 closure, learnings L1-L5, TRs 9-11
9. `213b138` fix(d3): rename statusBadge references to statusConfig and restore getStatusBadge

## Features entregadas

### Backend (DataContext)
- `createOneTimeCharge({ horse, amount, description, planId, date, markAsPaid })`: batch atómico que escribe HORSES + LOGS, opcionalmente + un segundo doc `type: 'payment'` cuando `markAsPaid === true`. Retorna `{ success, error }`. Usa `serverTimestamp()` para `createdAt` y `paidAt`.
- Schema del cargo: `{ tenantId, horseId, clientId|null, type: 'income', status, category: 'one-time', amount, description, planId|null, date: "YYYY-MM-DD", createdAt: Timestamp, paidAt: Timestamp|null, createdBy }`
- Log con `type: 'charge_created'` (cargo pending) o `type: 'charge_created_paid'` (cargo + payment en mismo batch). El log atómico incluye `chargeId` y opcionalmente `paymentId` cuando aplica.

### UI nuevo
- `RegistrarCargoModal`: dropdown de presets PRICING_PLANS con `frequency: 'one-time'` + opción "Otro concepto" para input libre. Monto pre-llenado al elegir preset (editable). Fecha default hoy con validación no-futura. Checkbox "Marcar este cargo como ya cobrado" que dispara el flow de cargo + payment en batch. Validaciones diferidas (sólo aparecen después de submit, no eager).
- Warning amarillo no-bloqueante cuando el caballo no tiene `ownerId`: el cargo se puede crear igual con `clientId: null`.
- Sección "Cargos únicos" en HorseDetailModal tab Plan y finanzas, entre "Planes asignados" y "Resumen". Reutiliza `ChargeRow` (`onMarkAsPaid` operativo desde la sección nueva). Muestra hasta 5 con expand "Ver todos los cargos únicos" si hay más.
- Acceso desde el botón "+ Cargo" ya existente en el header de la sección Cuenta corriente (línea 493 pre-D3, hoy cableado).

### Bugfixes
- HorseDetailModal `ChargeRow`: fallback robusto de `dateText` que maneja Timestamp Firestore (`.toDate?.()`), ISO string, o ausencia del campo. Evita crash futuro cuando un cargo tenga `createdAt` Timestamp y no tenga `date`.
- HorseDetailModal `FinanceTab` "Cuenta corriente": filtro `c.type !== 'payment' && c.category !== 'one-time'`. Single source of truth — los cargos one-time viven sólo en su sección propia, no se duplican.
- Reestructuración del render de planes asignados: nuevo bloque derecho `flex-col items-end flex-shrink-0` para alinear precio + badge condicional. Mejora visual + soporta el badge "Único" sin desalineamiento.

### Deuda técnica resuelta
- **TR-7**: `FinanceTab` separa `monthlyPlans = currentPlans.filter(p => p.frequency === 'monthly')` para calcular `totalMensual`. El sufijo "/ mes" sólo se renderiza cuando `plan.frequency === 'monthly'`. Planes `one-time` o sin frecuencia definida muestran badge "Único" o "Sin frecuencia" respectivamente, y NO suman al total mensual.

## Validación

- Parada 1 (Cargo pending desde UI con preset Herrería): PASS. Auditoría Firestore confirmó shape correcto incluyendo `createdAt: Timestamp`, `planId: 'plan-4'`, `status: 'pending'`. Log `charge_created` con `chargeId` referenciado.
- Parada 2 (Cargo paid con payment secundario, custom "Veterinario"): PASS. Integridad referencial verificada — `relatedChargeId` del payment coincide exactamente con el id del cargo. Mismo `_seconds` en `createdAt` y `paidAt` confirma escritura atómica. Log `charge_created_paid` con `chargeId` + `paymentId`.
- Parada 3 (Caso huérfano + TR-7 plan one-time temporal): PASS con `try/finally`. Warning huérfano dispara correctamente cuando `ownerId === null`, comportamiento no-bloqueante validado. Plan `plan-4` asignado temporalmente a Queca renderiza con badge "Único" sin sumar al Total mensual (sigue $600.000). `ownerId` y `assignedPlanIds` restaurados al estado original.
- Parada 4 (Golden state restaurado): PASS. FINANCES `equus-fidei` vuelve a 3 docs legacy (f1, f2a, f2b). Cero logs `charge_created` o `charge_created_paid` residuales. Queca con `ownerId: 'kbQ47xog2haJFgQfa7K7LFzxy1C3'` y `assignedPlanIds: ['plan-1', 'plan-2']` originales.
- Capturas E2E en `capturas-d3/` (no versionado en repo).

## Decisiones de producto (registradas para futuras tandas)

- `planId` se persiste cuando el cargo viene de un PRICING_PLAN preset. `planId: null` cuando viene de "Otro concepto" (texto libre). Permite trazabilidad analítica futura sin obligar tipado.
- `category: 'one-time'` fijo para todos los cargos D3 (sin importar si vienen de preset o custom). Convive con `category: 'Pensión'` legacy. No se intenta normalizar categorías existentes.
- Cargo "Ya cobrado" se crea en mismo batch que el payment derivado. Atomicidad transaccional sobre dos docs distintos en FINANCES + un log.
- Warning huérfano es **no-bloqueante**. El admin decide, el sistema informa.
- Edición/eliminación de cargo post-creación: **no soportado en D3**. Para corregir un cargo mal cargado, registrar un cargo compensatorio (decisión: opción 1 de las planteadas). Iterar a opción 3 si la frecuencia operativa lo justifica.
- Sin asociación a sector operativo / responsable en D3. Decisión: fuera de scope. Reevaluar si surge reporting por sector.
- Fecha del cargo: default hoy, editable, validación no-futura. Persistir como `"YYYY-MM-DD"` string (compatible con `date` legacy en FINANCES) + `createdAt: serverTimestamp()` adicional (forward para auditoría).
- "Cuenta corriente" en tab Finanzas excluye `category: 'one-time'`. Single source of truth — cargos únicos viven sólo en su sección propia.
- Manejo de más de 5 cargos únicos: expand inline con botón "Ver todos los cargos únicos (N)". Sin modal aparte.

## Deuda registrada (NO en scope de D3, dejar para futuro)

- **TR-9**: `GestionarPlanesModal` permite asignar planes `frequency: 'one-time'` como si fueran recurrentes (no filtra por frecuencia en la lista "Planes disponibles"). D3 mitigó visualmente con badge "Único" + exclusión del Total mensual, pero el flow de asignación sigue permitiendo el caso raro. Sprint dedicado: separar visualmente monthly/one-time en GestionarPlanesModal, o filtrar one-time fuera del listado si se confirma que asignar un one-time como recordatorio no tiene caso de uso real.
- **TR-10**: Campo `category` en FINANCES es texto libre sin enum ni validación. Convención implícita: `'Pensión'`, `'Pago'`, `'one-time'`. V2: cerrar con enum (`'plan'`, `'one-time'`, `'pago'`, `'perdonado'`) + script de migración para los 3 docs legacy.
- **TR-11**: `MarkAsPaidModal` (existente pre-D3) no crea log en LOGS al marcar un cargo como pagado. Inconsistencia con `ReleaseHorseModal` y con el patrón D3 que sí audita. Auditoría incompleta. Sprint dedicado: agregar log `payment_marked_paid` en el mismo batch del MarkAsPaidModal.
- **TR-5 redefinido**: FINANCES no tiene timestamps de auditoría — `date` es string `"YYYY-MM-DD"`, no Timestamp. D3 ya escribe `createdAt: serverTimestamp()` en cargos nuevos (forward), pero los 3 docs legacy (f1, f2a, f2b) no tienen `createdAt`. Migración: script dedicado que infiera `createdAt` desde `date` para los legacy.

## Aprendizajes de proceso (para sesiones futuras)

- **L1**: Scripts CDP/Puppeteer sobre forms React 18 deben usar native setters (`nativeInputValueSetter.call(el, value)`), no `dispatchEvent('change')` simple. React mantiene un tracker interno; eventos sintéticos sin el setter nativo son ignorados, llevando a falsos positivos en validación (el state default se mantiene mientras el DOM real cambia, el submit pasa con datos viejos).
- **L2**: Toda modificación temporal de Firestore para testing usa `try/finally` obligatorio. El restore vive en el bloque `finally` para garantizar ejecución incluso si el test falla a mitad. Patrón:
  ```javascript
  const originalValue = await readOriginal();
  try {
    await modifyTemp();
    await runTest();
  } finally {
    await restoreOriginal(originalValue);
  }
  ```
- **L3**: Cleanup de datos de testing debe vivir en script **aparte** del script de test, y sólo ejecutarse con luz verde explícita del product owner. Nunca incluido como "cleanup automático al final" del test. El criterio "restaurar golden state" se cumple AL FINAL del paso de validación supervisada, no al final de cada sub-test individual.
- **L4**: Antigravity tiene tendencia a expandir scope dentro de un paso para "resolver algo que aparece al pasar" — cleanup automático, fix latente detectado, mejora visual. Cualquier acción fuera del scope explícito del prompt requiere luz verde antes de ejecutar, incluso si la acción mejora el resultado. Esto vale especialmente en pasos de validación pura (sin scope de implementación).
- **L5**: Reportes de Antigravity pueden contener afirmaciones no verificadas con confianza ("captura regenerada", "modal limpio", "build limpio"). El product owner valida independientemente con sus propios ojos cuando hay riesgo de daño irreversible (push, deploy, escritura masiva). "Compila ok" ≠ "funciona ok". Verify, don't trust aplica a Antigravity también.
- **L6**: Reemplazos globales con `(Get-Content) -replace 'X', 'Y'` en PowerShell operan sobre substrings, no palabras completas. Si `X` aparece dentro de otro identificador (ej. `statusBadge` dentro de `getStatusBadge`), también se reemplaza y se introduce un bug nuevo. Para identificadores: reemplazo con boundaries (`\bstatusBadge\b`) o edición manual línea por línea. Lección descubierta al renombrar `statusBadge → statusConfig` en `HorseDetailModal.jsx` y romper accidentalmente `getStatusBadge` en tab Sanidad.

## Bugs introducidos y resueltos durante D3 (transparencia)

- Bug 1: durante la separación de hunks de Paso 5 (`5f9f9d5` restructure plan layout), Antigravity renombró la variable `statusBadge` a `statusConfig` en la declaración (línea 588) pero olvidó actualizar las dos referencias (líneas 615-616). `npm run build` pasó (sintaxis válida) pero la app crasheaba en runtime al renderizar `ChargeRow`. Resuelto en `213b138`.
- Bug 2: durante el fix manual del Bug 1 vía PowerShell `-replace`, el reemplazo global de `statusBadge → statusConfig` rompió accidentalmente la función legítima `getStatusBadge` (tab Sanidad), convirtiéndola en `getstatusConfig`. Resuelto en el mismo `213b138` con un segundo reemplazo targetting el call site específico.

Ambos bugs sirven de evidencia de L1 (build limpio no es validación funcional) y L6 (reemplazos globales sin boundaries son riesgosos). Registrados explícitamente para que la lección no se pierda.

## Recomendación

Mergear `feature/horse-management-tanda-d3` a `main` con `--no-ff` para preservar historia, replicando el patrón de D2.

Próxima tanda candidata: D4 (TBD). Pre-requisitos antes de arrancar D4:
1. Acordar método de trabajo con Antigravity tras los aprendizajes L4 + L5 (¿más checkpoints? ¿prompts más restrictivos? ¿menos autonomía por defecto?).
2. Limpiar working tree: capturas-d3, scripts auxiliares, archivos de pre-investigación.
3. Validar `equestrian-box.vercel.app` post-deploy con smoke test manual del flow completo de registrar cargo.
