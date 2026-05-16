// src/components/spaces/modals/SpaceAdminMenu.jsx
// Menú de acciones para boxes en estado available o reserved.
// Estructura visual idéntica al ActionsMenu (popover desktop / bottom-sheet mobile).
//
// Las opciones cambian según el estado del space:
//   - available: Marcar como reservado · Mantenimiento · Editar · Borrar
//   - reserved:  Cancelar reserva · Editar reserva · Editar espacio · Borrar

import { useEffect, useRef, useState } from 'react';
import {
  Bookmark, BookmarkX, Wrench, Pencil, Trash2, X
} from 'lucide-react';

/**
 * Props:
 *   space: documento del espacio
 *   anchorRect: DOMRect del botón disparador (para posicionar popover)
 *   onClose: () => void
 *   onSelectReserve: () => void       — marcar como reservado (solo available)
 *   onSelectCancelReserve: () => void — cancelar reserva (solo reserved)
 *   onSelectEditReserve: () => void   — editar nota de reserva (solo reserved)
 *   onSelectMaintenance: () => void   — marcar como mantenimiento (solo available)
 *   onSelectEdit: () => void          — editar nombre/precio/notas del space
 *   onSelectDelete: () => void        — borrar el space (con confirmación simple)
 */
export default function SpaceAdminMenu({
  space,
  anchorRect,
  onClose,
  onSelectReserve,
  onSelectCancelReserve,
  onSelectEditReserve,
  onSelectMaintenance,
  onSelectEdit,
  onSelectDelete,
}) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const menuRef = useRef(null);

  // ===== Responsive: actualizar isMobile en resize =====
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===== Cerrar con Esc =====
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // ===== Cerrar al click fuera (solo popover/desktop) =====
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

  // ===== Construir items según estado =====
  const isReserved = space.status === 'reserved';
  const isAvailable = space.status === 'available';

  const items = [];

  if (isAvailable) {
    items.push({
      key: 'reserve',
      icon: Bookmark,
      label: 'Marcar como reservado',
      description: 'Apartar el espacio para un cliente o uso futuro',
      onClick: onSelectReserve,
      variant: 'default',
    });
    items.push({
      key: 'maintenance',
      icon: Wrench,
      label: 'Cambiar a mantenimiento',
      description: 'Marcar el espacio como fuera de servicio',
      onClick: onSelectMaintenance,
      variant: 'default',
    });
  }

  if (isReserved) {
    items.push({
      key: 'cancel-reserve',
      icon: BookmarkX,
      label: 'Cancelar reserva',
      description: 'Volver a disponible para nuevas asignaciones',
      onClick: onSelectCancelReserve,
      variant: 'default',
    });
    items.push({
      key: 'edit-reserve',
      icon: Pencil,
      label: 'Editar reserva',
      description: 'Cambiar cliente o nota de la reserva',
      onClick: onSelectEditReserve,
      variant: 'default',
    });
  }

  // Acciones comunes a ambos estados
  items.push({
    key: 'edit-space',
    icon: Pencil,
    label: 'Editar espacio',
    description: 'Cambiar nombre, precio o notas',
    onClick: onSelectEdit,
    variant: 'default',
  });
  items.push({
    key: 'delete',
    icon: Trash2,
    label: 'Borrar espacio',
    description: 'Eliminar el espacio permanentemente',
    onClick: onSelectDelete,
    variant: 'danger',
  });

  // ====== Render mobile: modal bottom-sheet ======
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
              <div className="text-xs text-ink-500 truncate uppercase tracking-wider">
                {isReserved ? 'Reservado' : 'Disponible'}
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
            {items.map(item => <ActionItem key={item.key} {...item} large />)}
          </div>
        </div>
      </div>
    );
  }

  // ====== Render desktop: popover anclado ======
  const popoverWidth = 280;
  // Altura aproximada del popover: 60px header + items × ~70px
  const estimatedHeight = 60 + items.length * 70;

  const popoverPosition = anchorRect
    ? {
        left: anchorRect.right + popoverWidth > window.innerWidth - 16
          ? Math.max(16, anchorRect.right - popoverWidth)
          : anchorRect.left,
        top: anchorRect.bottom + estimatedHeight > window.innerHeight
          ? anchorRect.top - 8
          : anchorRect.bottom + 8,
        transform: anchorRect.bottom + estimatedHeight > window.innerHeight
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
            {space.name} · {isReserved ? 'Reservado' : 'Disponible'}
          </div>
        </div>

        {/* Items */}
        <div className="py-1">
          {items.map(item => <ActionItem key={item.key} {...item} />)}
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
        {large && description && (
          <div className="text-[11px] text-ink-500 mt-0.5 leading-snug">
            {description}
          </div>
        )}
      </div>
    </button>
  );
}
