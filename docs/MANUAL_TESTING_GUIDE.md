# Guía de Pruebas Manuales (Equestrian SaaS)

Sigue estos pasos para validar que todo el sistema funciona correctamente.

## 1. Preparación
Asegúrate de que la aplicación esté corriendo:
```bash
npm run dev
# Abre http://localhost:5173
```

## 2. Prueba de Roles y Datos (Multi-Tenant)

### A. Super Admin (Visión Global)
1. Inicia sesión con: `super@admin.com` / `password123`.
2. Verifica que puedes ver el Dashboard "Resumen del Sistema".
3. Ve a "Tenants" y confirma que ves "Haras San Pablo" y "Equus Fidei".

### B. Tenant Admin (Haras San Pablo)
1. **Login**: Usa `admin@haras.com` / `password123`.
   * *Nota*: Asegúrate de seleccionar "Haras San Pablo" en el dropdown (si es que la URL no lo autoselecciona).
2. **Espacios**: Verifica el Grid de boxes.
3. **Caballos**: Agrega un nuevo caballo (ej: "Relámpago").
4. **Rutinas (Nuevo!)**: Ve a "Rutinas" y crea una tarea: "Limpieza Cascos", Hora "10:00".
5. **Configuración (Branding)**: 
   * Pega esta URL: `https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=800&q=80`
   * Guarda cambios.

### C. Staff (El trabajador)
1. **Login**: Usa `staff@haras.com` / `password123` (Selecciona Haras San Pablo).
2. **Tareas**: Deberías ver la rutina "Limpieza Cascos" que creaste como Admin.
3. **Completar**: Click en la tarea -> Escribe "Listo" -> Click icono Cámara (simulado) -> Pagar/Confirmar.
4. **Validación**: Verifica que salga el mensaje "Toast" verde de éxito y la tarea se marque (tachada).

### D. Cliente (El dueño)
*Aquí probaremos la persistencia y el branding*
1. **Login**: Usa `client@equus.com` / `password123` (Selecciona Equus Fidei... OJO: El branding lo configuramos en Haras San Pablo, así que para ver el cambio de imagen, ¡Mejor loguéate como un cliente de Haras San Pablo! 
   * *Truco*: Crearemos un cliente rápido para Haras o asumiremos que el login detecta el tenant.
   * *Alternativa*: Logueate como `admin@haras.com` y cambia el branding. Luego logueate como un usuario de ese tenant. (Como el Staff `staff@haras`). *El staff también ve el dashboard? No, el staff tiene su propia vista. El cliente `client@equus.com` está en OTRO tenant.*

   **Prueba de Finanzas (Con `client@equus.com` - Tenant Equus Fidei)**
1. Inicia sesión: `client@equus.com`.
2. **Finanzas**: Menú hamburguesa -> "Mis Finanzas".
3. Verifica el saldo pendiente ($150).
4. Click "Pagar Ahora".
5. Espera 2 segs. El saldo debe ir a $0 y aparecer la transacción en el historial.

## 3. Prueba de Persistencia (Offline)
1. Estando logueado (como cualquier usuario), recarga la página con `F5` o `Ctrl+R`.
2. Verifica que **no te deslogueó** (o si lo hizo, al entrar de nuevo, los datos como el "Caballo Relámpago" o la "Tarea Completada" siguen ahí).
   * *Los datos ahora viven en el LocalStorage de tu navegador.*

---
**Nota sobre "Flutter"**:
Mencionaste Flutter. Este prototipo está hecho en **React**. 
- Si quieres ir a móvil nativo aprovechando este código, el camino natural es **React Native (Expo)**.
- Si prefieres **Flutter** (Dart), tendrías que reescribir la interfaz ("Vistas") desde cero, aunque podrías reutilizar la lógica de negocio si la tienes en un backend separado (Firebase real).
