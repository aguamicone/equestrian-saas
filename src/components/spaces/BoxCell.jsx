// src/components/spaces/BoxCell.jsx
// Celda individual de la grilla de caballerizas.
// Maneja 4 estados: available, occupied, occupied-alert, maintenance.
// En modo edición muestra un botón de acciones (3 puntos).

import { MoreVertical, Plus, Wrench, AlertCircle } from 'lucide-react';
import { Badge } from '../ui';

/**
 * Props:
 *   space: documento del espacio
 *   horse: documento del caballo residente (null si está libre)
 *   owner: documento del dueño desde USERS (null si no hay/no se encontró)
 *   ownerDebt: deuda del dueño (number, 0 si está al día)
 *   editMode: boolean — si true muestra controles de edición
 *   hasAlert: boolean — si true marca el box como "requiere atención"
 *   onClick: () => void — click sobre el box
 *   onActionsClick: (event) => void — click sobre el botón de 3 puntos (solo en edit mode)
 */
export default function BoxCell({
  space,
  horse,
  owner = null,
  ownerDebt = 0,
  editMode = false,
  hasAlert = false,
  onClick,
  onActionsClick,
}) {
  // ===== Determinar variante visual =====
  const isOccupied = space.status === 'occupied' && horse;
  const isMaintenance = space.status === 'maintenance';
  const isAvailable = space.status === 'available';

  // ===== Clases según estado =====
  let cellClasses = '';
  let textClasses = '';

  if (isMaintenance) {
    cellClasses = 'bg-ink-50 border-ink-200 hover:border-ink-300';
    textClasses = 'text-ink-500';
  } else if (isOccupied && hasAlert) {
    cellClasses = 'bg-gold-50 border-gold-300 hover:border-gold-400 hover:shadow-card-hover';
    textClasses = 'text-gold-700';
  } else if (isOccupied) {
    cellClasses = 'bg-primary-50 border-primary-200 hover:border-primary-400 hover:shadow-card-hover';
    textClasses = 'text-primary-700';
  } else {
    // available
    cellClasses = 'bg-white border-ink-200 border-dashed hover:border-primary-400 hover:bg-sky-50';
    textClasses = 'text-ink-400';
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative aspect-square rounded-2xl border-2 p-3 flex flex-col
        transition-all duration-200 cursor-pointer
        animate-fade-in-up
        ${cellClasses}
        ${editMode ? 'hover:scale-[1.02]' : ''}
      `}
    >
      {/* ----- Header: nombre del box + tipo ----- */}
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className={`font-display font-medium text-sm leading-tight truncate ${isOccupied ? 'text-ink-800' : textClasses}`}>
            {space.name}
          </div>
          <div className="text-[9px] tracking-wider uppercase text-ink-500 mt-0.5">
            {space.type}
          </div>
        </div>

        {/* Botón de acciones (solo en edit mode + box ocupado) */}
        {editMode && isOccupied && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onActionsClick?.(e);
            }}
            className="p-1 rounded-md hover:bg-white/60 text-ink-500 hover:text-ink-800 flex-shrink-0"
            title="Acciones"
          >
            <MoreVertical size={14} />
          </button>
        )}
      </div>

      {/* ----- Contenido principal según estado ----- */}
      <div className="flex-1 flex items-center justify-center min-h-0">

        {isOccupied && (
          <div className="flex flex-col items-center text-center w-full">
            {/* Avatar */}
            <div className={`
              w-9 h-9 rounded-full flex items-center justify-center
              text-xs font-medium mb-1.5 flex-shrink-0
              ${hasAlert ? 'bg-gold-200 text-gold-800' : 'bg-primary-200 text-primary-800'}
            `}>
              {horse.name.charAt(0).toUpperCase()}
            </div>
            {/* Nombre caballo */}
            <div className="text-[11px] font-medium text-ink-800 truncate w-full leading-tight">
              {horse.name}
            </div>
            {/* Nombre dueño (si existe) */}
            {owner?.displayName && (
              <div className="text-[10px] text-ink-500 truncate w-full leading-tight mt-0.5">
                {owner.displayName}
              </div>
            )}
            {/* Indicador de deuda (si la hay) */}
            {ownerDebt > 0 && (
              <div className="mt-1 text-[9px] text-danger-600 font-medium tracking-wide">
                Con deuda
              </div>
            )}
          </div>
        )}

        {isAvailable && (
          <div className="flex flex-col items-center text-ink-400">
            <Plus size={20} strokeWidth={1.5} className="opacity-60" />
            <span className="text-[10px] uppercase tracking-wider mt-1">Disponible</span>
          </div>
        )}

        {isMaintenance && (
          <div className="flex flex-col items-center text-ink-500">
            <Wrench size={18} strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-wider mt-1">Mantenimiento</span>
          </div>
        )}
      </div>

      {/* ----- Indicador de alerta (esquina sup-derecha) ----- */}
      {hasAlert && isOccupied && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 rounded-full bg-gold-400 flex items-center justify-center shadow-sm animate-pulse-soft">
            <AlertCircle size={11} strokeWidth={2.5} className="text-white" />
          </div>
        </div>
      )}
    </div>
  );
}
