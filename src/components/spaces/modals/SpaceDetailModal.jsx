// src/components/spaces/modals/SpaceDetailModal.jsx
// Modal de detalle de un box ocupado.
// Muestra: caballo, dueño, estado financiero, plan, ubicación actual.
// Acciones: ver perfil completo del caballo · editar caballo.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, User, Mail, MapPin, DollarSign, Calendar,
  Pencil, ExternalLink, AlertTriangle
} from 'lucide-react';
import { Modal, Badge } from '../../ui';
import EditHorseSubModal from './EditHorseSubModal';

/**
 * Props:
 *   space: documento del espacio (con info del box)
 *   horse: documento del caballo residente
 *   owner: documento del dueño (USER)
 *   ownerDebt: number — deuda total pendiente del dueño
 *   pricingPlan: documento del plan activo del caballo (o null)
 *   onClose: () => void
 */
export default function SpaceDetailModal({
  space,
  horse,
  owner,
  ownerDebt = 0,
  pricingPlan = null,
  onClose,
}) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  // ====== Defensiva ======
  // Si por algún motivo no hay caballo, mostramos un estado de error en lugar
  // de un crash. Puede pasar si el space.horseId apunta a un caballo borrado.
  if (!horse) {
    return (
      <Modal isOpen={true} onClose={onClose} title={space?.name || 'Sin información'}>
        <div className="p-6 text-center">
          <AlertTriangle size={32} className="mx-auto text-gold-500 mb-3" />
          <p className="text-ink-700 font-medium">No se encontró información del caballo</p>
          <p className="text-sm text-ink-500 mt-2">
            Este box aparece como ocupado pero el caballo asignado no existe en la base de datos.
            Quizás fue eliminado. Te recomendamos liberar el espacio.
          </p>
          <button onClick={onClose} className="btn-secondary mt-4">Cerrar</button>
        </div>
      </Modal>
    );
  }

  // ====== Handlers ======

  const handleViewProfile = () => {
    onClose();
    // Por ahora navega a Caballos con query param. Si tu HorseManagement
    // todavía no maneja ?selected=, no pasa nada — solo te lleva a la lista.
    navigate(`/tenant-admin/horses?selected=${horse.id}`);
  };

  const handleEdit = () => {
    setEditing(true);
  };

  // ====== Render ======

  // Si el sub-modal de edición está abierto, lo renderizamos en su lugar.
  // Cuando cierre, vuelve a este modal.
  if (editing) {
    return (
      <EditHorseSubModal
        horse={horse}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          // El onSnapshot del DataContext va a refrescar los datos automáticamente
        }}
      />
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} size="md" hideDefaultHeader>
      {/* ===== Header custom con info del box ===== */}
      <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between bg-gradient-to-br from-primary-50 to-white">
        <div className="min-w-0 flex-1">
          <div className="font-display text-2xl font-medium text-ink-900 leading-tight">
            {space.name}
          </div>
          <div className="text-xs tracking-wider uppercase text-ink-500 mt-0.5">
            {space.type} · Ocupado
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-white/80 text-ink-500 hover:text-ink-800 flex-shrink-0"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      </div>

      {/* ===== Body ===== */}
      <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">

        {/* --- Sección Caballo --- */}
        <section className="flex items-start gap-4">
          {/* Avatar grande */}
          <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-700 font-display text-2xl font-medium flex-shrink-0">
            {horse.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl text-ink-900 leading-tight">
              {horse.name}
            </h3>
            <div className="text-sm text-ink-600 mt-1 flex items-center gap-x-3 gap-y-1 flex-wrap">
              {horse.breed && <span>{horse.breed}</span>}
              {horse.age !== undefined && horse.age !== null && (
                <span>· {horse.age} {horse.age === 1 ? 'año' : 'años'}</span>
              )}
              {horse.color && <span>· {horse.color}</span>}
            </div>
          </div>
        </section>

        {/* --- Sección Dueño --- */}
        {owner ? (
          <section className="bg-ink-50 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink-500">
              <User size={11} strokeWidth={2.5} />
              Dueño
            </div>
            <div className="space-y-1.5">
              <div className="font-medium text-ink-900">{owner.displayName}</div>
              {owner.email && (
                <div className="text-sm text-ink-600 flex items-center gap-1.5">
                  <Mail size={13} strokeWidth={2} className="text-ink-400" />
                  <a href={`mailto:${owner.email}`} className="hover:text-primary-600 truncate">
                    {owner.email}
                  </a>
                </div>
              )}
            </div>
            {/* Estado financiero */}
            <div className="pt-2 border-t border-ink-100 flex items-center justify-between">
              <span className="text-xs text-ink-500 flex items-center gap-1.5">
                <DollarSign size={12} strokeWidth={2} />
                Estado de cuenta
              </span>
              {ownerDebt > 0 ? (
                <Badge variant="danger">
                  Debe ${ownerDebt.toLocaleString('es-AR')}
                </Badge>
              ) : (
                <Badge variant="success">Al día</Badge>
              )}
            </div>
          </section>
        ) : (
          <section className="bg-gold-50 border border-gold-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-gold-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-ink-700">
              <div className="font-medium">Dueño no asignado</div>
              <div className="text-xs text-ink-600 mt-1">
                Este caballo no tiene un usuario dueño vinculado. Editalo para asignar uno.
              </div>
            </div>
          </section>
        )}

        {/* --- Sección Plan --- */}
        <section>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink-500 mb-2">
            <Calendar size={11} strokeWidth={2.5} />
            Plan de pensión
          </div>
          {pricingPlan ? (
            <div className="flex items-center justify-between bg-white border border-ink-200 rounded-xl px-4 py-3">
              <div>
                <div className="font-medium text-ink-900">{pricingPlan.name}</div>
                {pricingPlan.description && (
                  <div className="text-xs text-ink-500 mt-0.5">{pricingPlan.description}</div>
                )}
              </div>
              {pricingPlan.price !== undefined && (
                <div className="font-display text-lg text-ink-900 flex-shrink-0">
                  ${pricingPlan.price.toLocaleString('es-AR')}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-ink-500 italic">Sin plan asignado</div>
          )}
        </section>

        {/* --- Sección Ubicación actual --- */}
        <section>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-ink-500 mb-2">
            <MapPin size={11} strokeWidth={2.5} />
            Ubicación actual
          </div>
          <div className="flex items-center gap-2">
            <LocationBadge location={horse.location} fallback={space.name} />
            <span className="text-xs text-ink-500">
              Box fijo: {space.name}
            </span>
          </div>
        </section>

      </div>

      {/* ===== Footer con acciones ===== */}
      <div className="px-6 py-4 border-t border-ink-100 bg-ink-50/50 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
        <button onClick={onClose} className="btn-secondary">
          Cerrar
        </button>
        <button onClick={handleEdit} className="btn-secondary">
          <Pencil size={14} />
          Editar caballo
        </button>
        <button onClick={handleViewProfile} className="btn-primary">
          Ver perfil completo
          <ExternalLink size={14} />
        </button>
      </div>
    </Modal>
  );
}

// ====== Sub-componente: badge de ubicación con color según valor ======
function LocationBadge({ location, fallback }) {
  // Si no hay location seteada, mostramos el nombre del box como ubicación por defecto
  const displayValue = location || fallback || 'Sin definir';

  // Mapeo de location → variante visual
  const getVariant = (loc) => {
    if (!loc) return 'neutral';
    const normalized = loc.toLowerCase();
    if (normalized.includes('box')) return 'primary';
    if (normalized.includes('piquete')) return 'success';
    if (normalized.includes('circular')) return 'gold';
    if (normalized.includes('campo')) return 'success';
    return 'neutral';
  };

  return (
    <Badge variant={getVariant(location)}>
      {displayValue}
    </Badge>
  );
}
