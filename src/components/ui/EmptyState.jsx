// src/components/ui/EmptyState.jsx
// Mensaje de "no hay datos" estándar. Se usa dentro de DataTable
// y en cualquier listado vacío.

import { Inbox } from 'lucide-react';

export default function EmptyState({
  message = 'No hay datos para mostrar',
  description = null,
  icon: Icon = null,
  action = null, // JSX opcional, ej. un botón "Crear primero"
  className = '',
}) {
  const IconComp = Icon || Inbox;

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center mb-3">
        <IconComp size={24} strokeWidth={1.5} className="text-ink-400" />
      </div>
      <p className="text-sm font-medium text-ink-700">{message}</p>
      {description && (
        <p className="text-xs text-ink-500 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
