// src/components/spaces/modals/ReserveSpaceModal.jsx
// Modal para marcar un box como reservado.
// Permite (de forma OPCIONAL en ambos):
//   - Seleccionar un cliente existente del dropdown
//   - Escribir una nota libre
// Lo que se guarda en Firestore:
//   - status: 'reserved'
//   - reservedFor: string consolidado de cliente + nota (lo que se ve en la grilla)
//   - reservedForClientId: uid del cliente si se seleccionó (para futuras pantallas)
//   - reservedNote: nota libre cruda (para edición posterior)
//
// Se usa tanto para CREAR una reserva (box available → reserved)
// como para EDITAR una reserva existente (box ya reserved).

import { useState, useMemo, useEffect } from 'react';
import { X, Bookmark, Save, Search } from 'lucide-react';
import { Modal } from '../../ui';
import { useData } from '../../../context/DataContext';

/**
 * Props:
 *   space: documento del espacio
 *   mode: 'create' | 'edit'  — controla copy del botón y precarga
 *   onClose: () => void
 *   onSaved: () => void
 */
export default function ReserveSpaceModal({ space, mode = 'create', onClose, onSaved }) {
  const { tenantUsers, updateRow } = useData();

  // Precargar valores si estamos editando
  const [selectedClientId, setSelectedClientId] = useState(
    mode === 'edit' ? (space.reservedForClientId || '') : ''
  );
  const [note, setNote] = useState(
    mode === 'edit' ? (space.reservedNote || '') : ''
  );
  const [clientSearch, setClientSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Lista de clientes del tenant (solo role=client)
  const clients = useMemo(() => {
    return (tenantUsers || []).filter(u => u.role === 'client');
  }, [tenantUsers]);

  // Filtro de búsqueda en el dropdown
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const q = clientSearch.toLowerCase().trim();
    return clients.filter(c =>
      c.displayName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  }, [clients, clientSearch]);

  // Cliente seleccionado (para mostrar en preview)
  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find(c => (c.uid || c.id) === selectedClientId);
  }, [clients, selectedClientId]);

  // Permitir confirmar si hay AL MENOS uno: cliente o nota
  const canConfirm = !!selectedClientId || !!note.trim();

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setSaving(true);
    try {
      // Construir la cadena visible (reservedFor) que aparece en el grid
      const clientName = selectedClient?.displayName || '';
      let displayString = '';
      if (clientName && note.trim()) {
        displayString = `${clientName} · ${note.trim()}`;
      } else if (clientName) {
        displayString = clientName;
      } else if (note.trim()) {
        displayString = note.trim();
      }

      await updateRow('SPACES', space.id, {
        status: 'reserved',
        reservedFor: displayString,
        reservedForClientId: selectedClientId || null,
        reservedNote: note.trim() || null,
        reservedAt: mode === 'create' ? new Date().toISOString() : space.reservedAt,
      });

      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Error reservando espacio:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={saving ? undefined : onClose} size="md" hideDefaultHeader>
      {/* Header */}
      <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between bg-gradient-to-br from-sky-50 to-white">
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-medium text-ink-900 flex items-center gap-2">
            <Bookmark size={18} className="text-sky-600" fill="currentColor" />
            {mode === 'edit' ? 'Editar reserva' : 'Reservar espacio'}
          </div>
          <div className="text-xs text-ink-500 mt-0.5">
            {space.name} · {space.type}
          </div>
        </div>
        <button
          onClick={onClose}
          disabled={saving}
          className="p-1.5 rounded-md hover:bg-white/80 text-ink-500 hover:text-ink-800 flex-shrink-0 disabled:opacity-40"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      </div>

      <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">

        {/* Cliente (opcional) */}
        <div>
          <label className="block text-xs font-medium text-ink-600 uppercase tracking-wider mb-1.5">
            Cliente <span className="text-ink-400 font-normal lowercase tracking-normal">(opcional)</span>
          </label>

          {/* Buscador del dropdown */}
          {clients.length > 5 && (
            <div className="relative mb-2">
              <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="Buscar cliente por nombre o email..."
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                className="input-field pl-9 text-sm"
              />
            </div>
          )}

          {/* Lista compacta de clientes (selección única tipo radio) */}
          <div className="max-h-48 overflow-y-auto border border-ink-200 rounded-xl bg-white">
            {/* Opción "ninguno" */}
            <ClientOption
              isSelected={selectedClientId === ''}
              onClick={() => setSelectedClientId('')}
              label="Sin cliente específico"
              description="La reserva queda solo con la nota"
              isNone
            />
            {filteredClients.length === 0 ? (
              <div className="px-3 py-3 text-xs text-ink-500 italic text-center">
                No se encontraron clientes
              </div>
            ) : (
              filteredClients.map(c => {
                const cId = c.uid || c.id;
                return (
                  <ClientOption
                    key={cId}
                    isSelected={selectedClientId === cId}
                    onClick={() => setSelectedClientId(cId)}
                    label={c.displayName || c.email || 'Sin nombre'}
                    description={c.email}
                  />
                );
              })
            )}
          </div>
          <div className="text-xs text-ink-500 mt-1.5">
            Si seleccionás un cliente, su nombre aparece en el box.
          </div>
        </div>

        {/* Nota libre */}
        <div>
          <label className="block text-xs font-medium text-ink-600 uppercase tracking-wider mb-1.5">
            Nota <span className="text-ink-400 font-normal lowercase tracking-normal">(opcional si hay cliente)</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            className="input-field resize-none"
            rows="2"
            placeholder="Ej: Llega el lunes 12, pidió box techado..."
          />
        </div>

        {/* Preview de cómo se va a ver en la grilla */}
        {canConfirm && (
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wider text-sky-600 mb-1.5">
              Vista previa en el grid
            </div>
            <div className="flex items-center gap-2">
              <Bookmark size={14} className="text-sky-700" fill="currentColor" />
              <div className="text-xs text-sky-700">
                {selectedClient?.displayName && (
                  <span className="font-medium">{selectedClient.displayName}</span>
                )}
                {selectedClient?.displayName && note.trim() && ' · '}
                {note.trim() && <span className="italic">{note.trim()}</span>}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-ink-100 bg-ink-50/50 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
        <button onClick={onClose} className="btn-secondary" disabled={saving}>
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canConfirm || saving}
          className={`
            inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm
            transition-colors
            ${canConfirm
              ? 'bg-sky-600 text-white hover:bg-sky-700'
              : 'bg-ink-200 text-ink-400 cursor-not-allowed'
            }
          `}
        >
          <Save size={14} />
          {saving ? 'Guardando...' : mode === 'edit' ? 'Guardar cambios' : 'Confirmar reserva'}
        </button>
      </div>
    </Modal>
  );
}

// ====== Sub-componente: opción de cliente en lista ======
function ClientOption({ isSelected, onClick, label, description, isNone = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors
        ${isSelected ? 'bg-sky-50' : 'hover:bg-ink-50'}
        ${!isNone ? 'border-t border-ink-100 first:border-t-0' : ''}
      `}
    >
      <div className={`
        w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
        ${isSelected ? 'border-sky-500 bg-sky-500' : 'border-ink-300'}
      `}>
        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-sm leading-tight truncate ${isSelected ? 'font-medium text-sky-800' : isNone ? 'text-ink-600 italic' : 'text-ink-800'}`}>
          {label}
        </div>
        {description && (
          <div className="text-[11px] text-ink-500 truncate mt-0.5">
            {description}
          </div>
        )}
      </div>
    </button>
  );
}
