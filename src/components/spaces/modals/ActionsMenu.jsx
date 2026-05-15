// src/components/spaces/modals/ActionsMenu.jsx
// Menú de acciones para un box ocupado en modo edición.
// Aparece al hacer click en los 3 puntos (⋮) de un BoxCell.
//
// Responsive: popover anclado al botón en desktop, modal en mobile.
// La elección se hace por media query (≥768px = desktop).

import { useEffect, useRef, useState } from 'react';
import { ArrowRightLeft, Wrench, UserMinus, X } from 'lucide-react';

/**
 * Props:
 *   space: documento del espacio
 *   horse: documento del caballo residente
 *   anchorRect: DOMRect del botón que disparó el menú (para posicionar popover)
 *   onClose: () => void
 *   onSelectMove: () => void       — usuario eligió "Mover"
 *   onSelectMaintenance: () => void — usuario eligió "Mantenimiento"
 *   onSelectRelease: () => void    — usuario eligió "Dar de baja"
 */
export default function ActionsMenu({
  space,
  horse,
  anchorRect,
  onClose,
  onSelectMove,
  onSelectMaintenance,
  onSelectRelease,
}) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const menuRef = useRef(null);

  // Actualizar isMobile en resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cerrar con Esc
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Cerrar al hacer click fuera (solo en modo popover)
  useEffect(() => {
    if (isMobile) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    // Usamos setTimeout para evitar que el click que abrió el menú lo cierre inmediato
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, onClose]);

  const hasHorse = !!horse;

  const items = [
    {
      key: 'move',
      icon: ArrowRightLeft,
      label: 'Mover a otro espacio',
      description: 'Cambiar la asignación a otro box o piquete',
      onClick: onSelectMove,
      variant: 'default',
      disabled: false,
    },
    {
      key: 'maintenance',
      icon: Wrench,
      label: 'Cambiar a mantenimiento',
      description: hasHorse
        ? 'Primero mové al caballo a otro espacio'
        : 'Marcar el espacio como fuera de servicio',
      onClick: onSelectMaintenance,
      variant: 'default',
      disabled: hasHorse,
    },
    {
      key: 'release',
      icon: UserMinus,
      label: 'Dar de baja al caballo',
      description: 'Soft delete + liberar el espacio',
      onClick: onSelectRelease,
      variant: 'danger',
      disabled: false,
    },
  ];

  // ====== Render mobile: modal centrado ======
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-end animate-fade-in" onClick={onClose}>
        <div
          className="bg-white w-full rounded-t-3xl shadow-xl animate-slide-up overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="font-display text-base font-medium text-ink-900 truncate">
                {space.name}
              </div>
              <div className="text-xs text-ink-500 truncate">
                {horse?.name || 'Sin caballo'}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-ink-100 text-ink-500"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Acciones */}
          <div className="px-2 py-2">
            {items.map(item => (
              <ActionItem key={item.key} {...item} large />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ====== Render desktop: popover anclado ======
  // Calculamos la posición del popover relativa al botón.
  // Por defecto se abre hacia abajo-izquierda del botón.
  const popoverWidth = 280;
  const popoverPosition = anchorRect
    ? {
        // Si está cerca del borde derecho de la ventana, abrir hacia la izquierda
        left: anchorRect.right + popoverWidth > window.innerWidth - 16
          ? Math.max(16, anchorRect.right - popoverWidth)
          : anchorRect.left,
        // Si está cerca del fondo, abrir hacia arriba
        top: anchorRect.bottom + 300 > window.innerHeight
          ? anchorRect.top - 8
          : anchorRect.bottom + 8,
        transform: anchorRect.bottom + 300 > window.innerHeight
          ? 'translateY(-100%)'
          : 'none',
      }
    : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        ref={menuRef}
        className="absolute pointer-events-auto bg-white rounded-xl shadow-card-hover border border-ink-100 overflow-hidden animate-fade-in-up"
        style={{
          left: popoverPosition.left,
          top: popoverPosition.top,
          transform: popoverPosition.transform,
          width: popoverWidth,
        }}
      >
        {/* Header chico */}
        <div className="px-3 py-2 border-b border-ink-100 bg-ink-50/50">
          <div className="text-[10px] uppercase tracking-wider text-ink-500">
            Acciones · {space.name}
          </div>
        </div>

        {/* Items */}
        <div className="py-1">
          {items.map(item => (
            <ActionItem key={item.key} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ====== Sub-componente: item del menú ======
function ActionItem({ icon: Icon, label, description, onClick, variant = 'default', large = false, disabled = false }) {
  const colorClasses = disabled
    ? 'text-ink-400 cursor-not-allowed'
    : variant === 'danger'
      ? 'text-danger-600 hover:bg-danger-50'
      : 'text-ink-700 hover:bg-ink-50';

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full px-3 py-2.5 flex items-start gap-3 text-left transition-colors ${colorClasses}`}
    >
      <div className={`flex-shrink-0 ${large ? 'mt-0.5' : ''}`}>
        <Icon size={large ? 18 : 16} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className={`font-medium leading-tight ${large ? 'text-sm' : 'text-xs'}`}>
          {label}
        </div>
        {(large || disabled) && description && (
          <div className={`text-[11px] mt-0.5 leading-snug ${disabled ? 'text-ink-400' : 'text-ink-500'}`}>
            {description}
          </div>
        )}
      </div>
    </button>
  );
}
