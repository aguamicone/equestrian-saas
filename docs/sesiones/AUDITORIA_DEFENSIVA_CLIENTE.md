# Auditoría de Programación Defensiva en Formularios del Cliente

## Resumen Ejecutivo

Los formularios del cliente presentan vulnerabilidades comunes de *race conditions*, falta de validación robusta y pobre manejo de errores asíncronos. La ausencia generalizada de un estado `isSubmitting` permite el "double-submit" (múltiples clicks que generan múltiples registros en Firebase).

## 1. Módulo Equipos (`EquipmentItemModal.jsx`)

### Vulnerabilidades detectadas
- **Falta de bloqueo por submitting:** El botón de "Guardar" no se deshabilita durante el llamado a `updateEquipmentItem` o `createEquipmentItem`. Un usuario impaciente puede tocar "Guardar" tres veces rápido y crear tres monturas idénticas.
- **Validación de espacios en blanco:** El input de `name` tiene el atributo nativo `required`, pero si el usuario ingresa puros espacios (`"   "`), el navegador lo pasa. Aunque el `DataContext` hace `.trim()`, si queda vacío, fallaría a nivel de data o de Firebase. Debería validarse en el frontend (`if (!name.trim()) return setError('El nombre es requerido')`).
- **Manejo de promesas sin loading state:** La operación asíncrona no le da feedback visual al usuario mientras espera.

### Corrección sugerida (Snippet)
```javascript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
        setError("El nombre no puede estar vacío");
        return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
        // ... llamada al data context
    } finally {
        setIsSubmitting(false);
    }
}
// En el botón: 
<button type="submit" disabled={isSubmitting} className="flex-1 btn-primary">
    {isSubmitting ? 'Guardando...' : 'Guardar'}
</button>
```

## 2. Módulo Service Request (`ServiceRequest.jsx`)

### Vulnerabilidades detectadas
- **Falsa promesa de éxito (Fire and Forget):** La función `handleSubmit` llama a `createServiceRequest` pero **NO hace await**. Automáticamente ejecuta `setSubmitted(true)` mostrando la pantalla verde de "¡Solicitud Procesada!", independientemente de si la llamada a Firebase falló por falta de conexión o error de permisos.
- **Double Submit:** Igual que en equipos, si bien el render del success state oculta el botón rápido, un doble click muy rápido podría encolar dos requests idénticas a Firebase.
- **Validación silenciosa:** Si `!selectedService` o `!selectedHorseId`, la función hace un `return;` silencioso. El usuario clickea y no pasa nada, ni siquiera se le muestra un error.

### Corrección sugerida (Snippet)
```javascript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedService || !selectedHorseId) {
        notify("Faltan datos por seleccionar", "error"); // o un estado de error local
        return;
    }
    
    setIsSubmitting(true);
    const result = await createServiceRequest({ ... });
    setIsSubmitting(false);

    if (result.success) {
        setSubmitted(true);
        setTimeout(() => { ... }, 3000);
    } else {
        // Mostrar error en UI
    }
};
```

## 3. Vulnerabilidad General: Estados Iniciales de Selects
- En `ServiceRequest.jsx`, el estado inicial de `selectedHorseId` es `myHorses[0]?.id || ''`. 
- **Problema:** Si la promesa que carga `horses` desde Firebase se demora un milisegundo más en popular `myHorses` en el primer render, `selectedHorseId` queda como `''`. Luego `myHorses` se carga, pero el estado inicial ya quedó vacío. Al enviar el form, `!selectedHorseId` bloquea silenciosamente (ver punto anterior).
- **Solución:** Usar un `useEffect` para sincronizar el estado inicial o forzar a que el select obligue al usuario a elegir con un placeholder deshabilitado `<option value="" disabled>Seleccioná un caballo</option>`.

## Conclusión
Implementar estos blindajes debe ser **mandatorio** durante las migraciones (V3, V4, etc.). El componente nativo `Button` del sistema Cielo y Campo ya soporta la prop `loading={true}`, lo que mitigará esto naturalmente, pero los desarrolladores deben acordarse de crear y setear el estado `isSubmitting` y hacer `await` a todas las peticiones a Firestore.
