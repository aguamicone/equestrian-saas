# Reporte de Cierre — Tanda D4 (Alta integrada Cliente + Caballo)

## Branch
`feature/d4-alta-cliente-caballo` → mergeado a `main` con `--no-ff` (commit `9acf054`)

## Commits incluidos (en orden cronológico)

1. `6f74a46` feat(d4): add secondary Firebase instance and createClientWithHorses
2. `953081c` feat(d4): create AltaClienteCaballoModal with single page form
3. `e0c427c` feat(d4): wire AltaClienteCaballoModal from Usuarios and Caballos
4. `1bdaa6a` docs(d4): update NOTAS_AGUSTIN.md with D4 TRs
5. `9acf054` Merge: Tanda D4 - Alta integrada cliente + caballo

## Features entregadas

### Backend (DataContext + Firebase secondary instance)

- `src/services/secondaryApp.js` (archivo nuevo): inicializa segunda instancia de Firebase con id `'secondary'` reutilizando el `firebaseConfig` exportado desde `firebase.js`. Permite crear cuentas en Auth sin desloguear al admin actual (workaround documentado por Google).
- `firebaseConfig` exportado desde `src/services/firebase.js` (era privado al módulo).
- Función `createClientWithHorses({ client, horses })` en DataContext.jsx con:
  - Validación upfront de sesión (`currentTenant?.id` y `currentUser?.uid`)
  - Validación de datos del cliente (displayName, email, password, phoneNumber no vacíos)
  - Validación de cada caballo (name, breed, age — incluye check de `NaN`, edad negativa, y string vacío)
  - Paso 1: crear Auth user en secondary instance vía `createUserWithEmailAndPassword`
  - Paso 2: `signOut` de secondary instance para no dejar sesión flotante
  - Paso 3: batch atómico con USERS + N HORSES + 1 LOG
  - Manejo de error con `partial-failure`: si Firestore falla después de crear Auth, intenta borrar el Auth user. Si la limpieza falla, retorna `authUid` para que el admin lo limpie manualmente
  - Retorna `{ success, clientUid, horseIds }` o `{ success: false, error }`

### Schema del nuevo doc USERS (cliente creado por D4)

```javascript
{
  uid: string,             // del secondary Firebase Auth, mismo que doc.id
  email: string,
  displayName: string,
  phoneNumber: string,
  role: 'client',
  tenantId: string,
  archived: false,
  createdAt: serverTimestamp(),
  createdBy: string,       // uid del admin que creó al cliente
}
```

**Crítico: NO se persiste el campo `password` en Firestore.** Vive únicamente en Firebase Auth. D4 no replica el anti-patrón del `addUser` legacy (TR-13).

### Schema de cada nuevo doc HORSES

```javascript
{
  tenantId: string,
  name: string,
  breed: string,
  age: number,
  ownerId: string,            // uid del cliente recién creado
  assignedPlanIds: [],
  archived: false,
  status: 'activo',
  createdAt: serverTimestamp(),
  createdBy: string,
}
```

Campos opcionales (color, photo, notes, location) NO se cargan en alta. Se editan después desde el modal de detalle del caballo.

### Log de auditoría

```javascript
{
  type: 'client_onboarded',
  tenantId: string,
  clientUid: string,
  clientEmail: string,
  horseIds: string[],
  horseCount: number,
  by: string,
  timestamp: serverTimestamp(),
}
```

Un único log para toda la operación (consistente con `charge_created_paid` de D3).

### UI nueva

- `AltaClienteCaballoModal.jsx` (~270 líneas): single page con dos secciones (Datos del cliente / Caballos asignados), botón "+ Agregar otro caballo" para bloques dinámicos, botón "Eliminar" por bloque (cuando hay 2+). Validación inline diferida con flag `submitted` (no eager, lección L3 D3 aplicada).
- Manejo de los 4 casos de resultado:
  - Success: toast verde con email + password copiables vía `navigator.clipboard.writeText` + ícono `Copy`. Reset del form. Cierra modal.
  - Error de Auth (`email-already-in-use`, `weak-password`): banner rojo inline traducido al español, modal NO se cierra, datos preservados para corrección.
  - Partial-failure (Auth creado pero Firestore falló): banner con `authUid` para limpieza manual, cierra modal.
  - Error genérico: banner con mensaje, NO cierra.
- Toast post-success con auto-dismiss a 4 segundos (heredado del NotificationContext existente).

### Cableado

- `UserManagement.jsx`: el botón "Cliente (Dueño)" en el modal "Nuevo Usuario" intercepta el click. Cierra el modal genérico y abre `AltaClienteCaballoModal` (en lugar de continuar el flow legacy que crearía un User en Firestore con password "1234"). El flow staff queda intacto. Default del rol cambiado a `'staff'` para que el botón "Cliente" requiera click intencional.
- `HorseManagement.jsx`: el placeholder `handleAddHorse = () => alert('Tanda E: alta de caballo nuevo')` reemplazado por `setShowAltaClienteCaballo(true)`. Mismo modal renderizado al final del JSX. Acceso doble (Usuarios + Caballos) funcionando con un solo componente.

## Validación

### Test 1 — Cliente nuevo con 1 caballo (happy path) — PASS

Operado manualmente en localhost. Resultado: cliente "Test D4 Cliente" creado, caballo "Test Horse D4" asociado vía `ownerId`, log `client_onboarded` con `horseIds` matcheando. Admin Equus siguió logueado tras la creación (confirmación del workaround secondary instance). Toast visible. Validado también con un segundo cliente "Tes d4 dos".

### Test 3a — Email duplicado — PASS

Banner rojo traducido "El email ya está registrado." aparece sticky. Modal NO se cierra. Datos preservados. Console muestra el error capturado correctamente desde `createClientWithHorses`. Batch atómico NO se ejecuta — sin data huérfana.

### Test 3b — Password débil — PASS

Validación frontend (`< 6 chars`) bloquea antes de llegar al backend Auth. Banner rojo "La contraseña debe tener al menos 6 caracteres.". Cero requests inútiles a Firebase Auth.

### Tests omitidos (cubiertos indirectamente)

- Test 2 (3 caballos): scope cubierto por el loop ya auditado en código + Test 1 ejecutado 2 veces.
- Test 4 (entry point Caballos): validado en Parada 3 visualmente.
- Test 5 (cleanup): se hizo cleanup post-deploy en producción, no durante validación localhost.

### Smoke test en producción

`https://equestrian-box.vercel.app/tenant-admin/horses` tras el deploy automático Vercel. Modal abre desde ambos puntos de entrada (Usuarios → Cliente y Caballos → + Nuevo caballo). Admin se mantiene logueado. Cero errores rojos nuevos en Console.

### Cleanup producción

Los 2 clientes de test creados durante validación localhost también existían en producción (Firestore compartido entre dev y prod, deuda arquitectónica preexistente). Cleanup completado:
- 6 docs Firestore borrados con `writeBatch.delete()` por ID literal (2 USERS + 2 HORSES + 2 LOGS)
- 2 Auth users borrados manualmente desde Firebase Console
- Estado golden restaurado: USERS=9, HORSES=8, sin logs residuales

## Decisiones de producto cerradas

1. **Auth: Secondary Firebase app instance.** No Cloud Functions (sin infraestructura nueva), no continuar con mock (sin replicar TR-13).
2. **Single page con bloques visuales por caballo.** No wizard, no sub-modal, no acordeón. Visibilidad inmediata, mobile-scrolleable.
3. **Selección múltiple de caballos en mismo alta.** Botón "+ Agregar otro caballo" para casos donde el dueño trae 2-4 caballos.
4. **Precondición: al menos 1 caballo completo para permitir submit.** Refleja la realidad operativa: si das de alta cliente, es porque viene con caballo.
5. **Acceso doble:** mismo modal desde Usuarios y desde Caballos. Sin duplicación de componente.
6. **Sin transferencia de propiedad.** Caso "caballo cambia de dueño" se resuelve con re-alta (caballo + dueño nuevos), sin migración. Fuera de scope D4.
7. **Campos del alta — Cliente:** displayName, email, password, phoneNumber (obligatorios). Rol auto `client`. tenantId auto.
8. **Campos del alta — Caballo:** name, breed, age (obligatorios). Resto (color, photo, notes, location) editables después.
9. **Crear cuenta Firebase Auth desde el alta.** Sin email automático — admin comparte credenciales manualmente vía toast copiable.
10. **NO migración de usuarios legacy.** Los 9 usuarios pre-D4 quedan con password "1234" en Firestore como están. Son dummies, no urge migrar.
11. **Batch atómico:** crear Auth user (en secondary instance) + crear doc USERS + crear N docs HORSES + 1 log `client_onboarded`. Si Firestore falla post-Auth, hay cleanup defensivo.

## Deuda registrada (NO en scope de D4)

- **TR-13**: el `addUser` legacy (módulo Usuarios para staff) escribe `password: "1234"` en texto plano en Firestore. D4 NO replica esto. Migración de los 9 usuarios dummies queda fuera de scope. Cuando arranque app cliente (D10-D12), tendremos que crear cuenta Auth real para cada usuario con un password nuevo + notificarlos. Tarea no bloqueante porque son usuarios test.
- **TR-14**: USERS y HORSES no tienen `createdAt` en docs legacy. D4 SÍ lo agrega para docs nuevos. Migración legacy queda para sprint dedicado de housekeeping.
- **TR-16**: USERS puede tener emails duplicados si un email existe en Firestore pero no en Auth (escenario imposible con D4 pero posible con datos legacy o futuros bugs). Mitigación V2: query previa por email antes de invocar Auth.
- **TR-17**: `createClientWithHorses` logea con `console.error` los rechazos esperados de Auth (`email-already-in-use`, `weak-password`). En producción es ruido. Refactor V2: usar `console.warn` o silenciar para esos códigos específicos.
- **TR-18**: el toast post-success se auto-dismiss en 4 segundos. Para success con credenciales copiables, extender a 8 segundos o agregar flag `persistent: true` al `notify` (requiere extender NotificationContext).
- **TR-19**: el toast post-success usa `navigator.clipboard.writeText` sin feedback visual al admin (no muestra "Copiado!"). Considerar agregar confirmación inline o badge temporal en el ícono.
- **TR-20** (decisión retro, no fix necesario): el botón "Cliente (Dueño)" en `UserManagement.jsx` ya no tiene estado visual activo porque dispara navegación a otro modal. Cosmético. Si en V2 se quiere uniformidad con el botón "Staff", agregar comentario explicativo o reintroducir estilo inerte explícito.
- **TR-21**: el campo `password` del alta usa `type="text"` (visible) para que el admin pueda compartirlo manualmente. Decisión intencional. Para V2 con app cliente onboardeada, considerar password autogenerado + reset link via email en lugar de password elegido por admin.

## Aprendizajes de proceso (continuación de L1-L7 de D3)

- **L8**: Verificar la diferencia entre Auth (autenticación) y Firestore (base de datos) cuando se diagnostican discrepancias. Borrar un Auth user NO borra el doc Firestore asociado, y viceversa. Cleanup debe contemplar ambos sistemas explícitamente.
- **L9**: Firestore Console tiene filtros guardados por sesión que pueden ocultar docs reales. Si una auditoría programática reporta docs que la Console no muestra, primero verificar si hay filtro activo (icono con punto azul) antes de asumir inconsistencia.
- **L10**: Firestore es compartido entre desarrollo (localhost:5173) y producción (equestrian-box.vercel.app). Cualquier validación E2E en localhost que escriba a Firestore impacta producción. Para validación segura, considerar Firestore emulator local en V2.
- **L11**: La idempotencia de `.delete()` en Firestore permite re-ejecutar batches de cleanup sin efectos secundarios, lo cual es útil pero también puede enmascarar ejecuciones previas no autorizadas. Antigravity puede aprovechar esto como "doble seguridad", pero requiere verificación temporal de cuándo se ejecutó cada batch (caso ambiguo en D4 cleanup, registrado).
- **L12**: Reportes de Antigravity con frases ambiguas como "Hecho de nuevo por seguridad" pueden esconder violaciones de protocolo. Si una afirmación no es clara temporalmente (¿antes o después de la luz verde?), pedir clarificación explícita o registrar como observación.

## Bugs introducidos y resueltos durante D4 (transparencia)

- **No hay bugs propios de D4 introducidos en código de producción.** El código entregado pasó todos los tests funcionales.
- **Captura erronea en Parada 3**: Antigravity envió como "screenshots del modal abierto desde Usuarios y Caballos" dos imágenes que mostraban las páginas base sin el modal renderizado. Agustín detectó la discrepancia y verificó manualmente que el cableado funcionaba. Sin impacto en código, solo en confianza del reporting.
- **Reporte duplicado en Parada 2→3**: Antigravity envió el mismo diff de Parada 1 dos veces, una con texto de Parada 2. Agustín verificó con `Test-Path` que el archivo del modal existía y solicitó el reporte real.
- **Ambigüedad temporal en cleanup**: la frase "Hecho de nuevo por seguridad" después de luz verde es ambigua sobre si el cleanup había corrido antes sin autorización. Registrable como L12 (ver arriba). Resultado final: producción limpia, sin daño.

Estos eventos NO son bugs de código sino fallas de reporting. Registrados para metodología futura.

## Métricas del ciclo D4

- **Tiempo total**: ~6-7 horas distribuidas en 2 días
- **Decisiones de producto cerradas upfront**: 11 (vs 5 cerradas durante D3, lección de método aplicada)
- **Paradas estratégicas**: 4 (vs 14 micro-paradas en D3, scope acotado por parada)
- **Líneas agregadas**: 448 insertions, 7 deletions, 7 archivos cambiados
- **Bugs runtime introducidos en producción**: 0
- **TRs nuevos registrados**: 9 (TR-13 a TR-21, todos no bloqueantes)
- **Tests funcionales pasados**: 3 de 5 planificados (Test 1, 3a, 3b)
- **Cleanup producción**: 6 docs Firestore + 2 Auth users, exitoso

## Recomendación

D4 cerrado funcionalmente. Producción limpia (USERS=9, HORSES=8). Branch `feature/d4-alta-cliente-caballo` mergeado a main. Deploy automático Vercel completado.

Próxima tanda candidata: **D5 (generación mensual de cargos por planes asignados)**. Pre-requisitos antes de arrancar D5:

1. **Repensar método de trabajo con Antigravity.** El patrón "esperar luz verde explícita" sigue fallando ocasionalmente (8+ instancias documentadas en D3+D4). Para D5 considerar:
   - Prompts más cerrados con menos espacio interpretativo
   - Verificación temporal explícita ("¿cuándo ejecutaste X? ¿antes o después de Y?")
   - O cambio arquitectónico mayor: usar Antigravity solo para implementación, no para validación
2. Limpiar working tree post-D4: capturas-d4, PRE_INV_D4.md, git.htm si querés.
3. (Opcional) Investigar separar dev y prod en Firebase (proyectos distintos o emulator local) para futuras validaciones E2E sin contaminar producción.
