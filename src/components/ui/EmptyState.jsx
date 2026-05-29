// src/components/ui/EmptyState.jsx
// Mensaje de "no hay datos" estándar. Se usa dentro de DataTable
// y en cualquier listado vacío.

import { Inbox } from 'lucide-react';

export default function EmptyState({
  message = null,
  title = null,
  description = null,
  icon: Icon = null,
  action = null, // JSX opcional, ej. un botón "Crear primero"
  className = '',
}) {
  const displayMessage = message || title || 'No hay datos para mostrar';

  const renderIcon = () => {
    if (!Icon) return <Inbox size={24} strokeWidth={1.5} className="text-ink-400" />;
    
    // If it's a function/class component OR a forwardRef object (lucide-react):
    if (typeof Icon === 'function' || (typeof Icon === 'object' && Icon.$$typeof)) {
      const IconComponent = Icon;
      return <IconComponent size={24} strokeWidth={1.5} className="text-ink-400" />;
    }
    
    // If it's already a React element (JSX):
    return Icon;
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center mb-3">
        {renderIcon()}
      </div>
      <p className="text-sm font-medium text-ink-700">{displayMessage}</p>
      {description && (
        <p className="text-xs text-ink-500 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

