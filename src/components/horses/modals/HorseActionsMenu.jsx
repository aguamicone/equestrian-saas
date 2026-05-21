// src/components/horses/modals/HorseActionsMenu.jsx
// Menú de acciones contextuales para un caballo en el grid.
// Aparece al hacer click en los 3 puntos (⋮) de una fila en HorseManagement.jsx.
//
// Responsive: popover anclado al botón en desktop (>=768px), bottom-sheet en mobile.

import { useEffect, useRef, useState } from 'react';
import { Archive, RotateCcw, Wrench, Play, X, ListChecks } from 'lucide-react';

/**
 * Props:
 *   horse: documento del caballo
 *   anchorRect: DOMRect del botón que disparó el menú (para posicionar popover)
 *   onClose: () => void
 *   onSelectArchive: () => void       — usuario eligió "Archivar"
 *   onSelectUnarchive: () => void     — usuario eligió "Desarchivar"
 *   onSelectMaintenance: () => void   — usuario eligió "Mover a mantenimiento"
 *   onSelectActive: () => void        — usuario eligió "Volver a activo"
 */
export default function HorseActionsMenu({
  horse,
  anchorRect,
  onClose,
  onSelectArchive,
  onSelectUnarchive,
  onSelectMaintenance,
  onSelectActive,
  onOpenGestionarPlanes,
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
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, onClose]);

  if (!horse) return null;

  const isArchived = horse.archived === true;
  const isMaintenance = horse.status === 'mantenimiento';

  // Generar items dinámicos según el estado del caballo
  const items = [];

  if (isArchived) {
    items.push({
      key: 'unarchive',
      icon: RotateCcw,
      label: 'Desarchivar caballo',
      description: 'Reactivar caballo para volver a mostrarlo en el grid principal',
      onClick: onSelectUnarchive,
      variant: 'default',
    });
  } else {
    // Tanda D2: nueva acción de gestión de planes asignados
    items.push({
      key: 'manage-plans',
      icon: ListChecks,
      label: 'Gestionar planes',
      description: 'Asignar o remover planes de facturación',
      onClick: () => onOpenGestionarPlanes(horse),
      variant: 'default',
    });

    // Si está en mantenimiento o activo
    if (isMaintenance) {
      items.push({
        key: 'set-active',
        icon: Play,
        label: 'Volver a activo',
        description: 'Restablecer el estado normal del caballo',
        onClick: onSelectActive,
        variant: 'default',
      });
    } else {
      items.push({
        key: 'set-maintenance',
        icon: Wrench,
        label: 'Mover a mantenimiento',
        description: 'Marcar temporalmente para revisión o cuidados especiales',
        onClick: onSelectMaintenance,
        variant: 'default',
      });
    }

    // Opción de archivar siempre disponible para caballos activos
    items.push({
      key: 'archive',
      icon: Archive,
      label: 'Archivar caballo',
      description: 'Dar de baja (soft delete) y liberar su espacio asignado',
      onClick: onSelectArchive,
      variant: 'danger',
    });
  }

  // ====== Render mobile: bottom-sheet ======
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
                {horse.name}
              </div>
              <div className="text-xs text-ink-500 truncate">
                {[horse.breed, horse.color].filter(Boolean).join(' · ') || 'Acciones del caballo'}
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
  const popoverWidth = 280;
  const popoverPosition = anchorRect
    ? {
        left: anchorRect.right + popoverWidth > window.innerWidth - 16
          ? Math.max(16, anchorRect.right - popoverWidth)
          : anchorRect.left,
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
            Acciones · {horse.name}
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
function ActionItem({ icon: Icon, label, description, onClick, variant = 'default', large = false }) {
  const colorClasses = variant === 'danger'
    ? 'text-danger-600 hover:bg-danger-50'
    : 'text-ink-700 hover:bg-ink-50';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-3 py-2.5 flex items-start gap-3 text-left transition-colors ${colorClasses}`}
    >
      <div className={`flex-shrink-0 ${large ? 'mt-0.5' : ''}`}>
        <Icon size={large ? 18 : 16} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className={`font-medium leading-tight ${large ? 'text-sm' : 'text-xs'}`}>
          {label}
        </div>
        {description && (
          <div className="text-[11px] mt-0.5 leading-snug text-ink-500">
            {description}
          </div>
        )}
      </div>
    </button>
  );
}
