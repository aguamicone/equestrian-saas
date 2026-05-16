// src/components/spaces/modals/EditSpaceModal.jsx
// Modal para editar un espacio existente. Permite cambiar:
//   - Nombre
//   - Precio mensual base
//   - Notas
//
// NO permite cambiar el tipo (box/piquete/corral). Si el usuario se equivocó
// con el tipo, debe borrar y crear de nuevo.

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Modal } from '../../ui';
import { useData } from '../../../context/DataContext';

/**
 * Props:
 *   space: documento del espacio a editar
 *   onClose: () => void
 *   onSaved: () => void
 */
export default function EditSpaceModal({ space, onClose, onSaved }) {
  const { updateRow } = useData();

  const [form, setForm] = useState({
    name: space.name || '',
    price: space.price ?? '',
    notes: space.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await updateRow('SPACES', space.id, {
        name: form.name.trim(),
        price: form.price === '' ? 0 : Number(form.price),
        notes: form.notes.trim() || null,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Error editando espacio:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={saving ? undefined : onClose} size="md" hideDefaultHeader>
      {/* Header */}
      <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
        <div>
          <div className="font-display text-lg font-medium text-ink-900">
            Editar espacio
          </div>
          <div className="text-xs text-ink-500 mt-0.5">
            {space.name} · {space.type}
          </div>
        </div>
        <button
          onClick={onClose}
          disabled={saving}
          className="p-1.5 rounded-md hover:bg-ink-100 text-ink-500 hover:text-ink-800 disabled:opacity-40"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

        {/* Nombre */}
        <div>
          <label className="block text-xs font-medium text-ink-600 uppercase tracking-wider mb-1.5">
            Identificador <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
            className="input-field"
            placeholder="Ej: Box 21"
            required
            autoFocus
          />
        </div>

        {/* Precio */}
        <div>
          <label className="block text-xs font-medium text-ink-600 uppercase tracking-wider mb-1.5">
            Precio mensual base
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 text-sm">$</span>
            <input
              type="number"
              value={form.price}
              onChange={e => handleChange('price', e.target.value)}
              className="input-field pl-7"
              placeholder="0"
              min="0"
              step="1000"
            />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-xs font-medium text-ink-600 uppercase tracking-wider mb-1.5">
            Notas <span className="text-ink-400 font-normal lowercase tracking-normal">(opcional)</span>
          </label>
          <textarea
            value={form.notes}
            onChange={e => handleChange('notes', e.target.value)}
            className="input-field resize-none"
            rows="3"
            placeholder="Ubicación, características, recordatorios..."
          />
        </div>

        {/* Info: por qué no se puede cambiar el tipo */}
        <div className="text-[11px] text-ink-500 leading-snug border-t border-ink-100 pt-3">
          El tipo de espacio (box, piquete, corral) no se puede cambiar acá. Si necesitás
          un tipo distinto, creá un espacio nuevo y mové el caballo (si lo hay) hacia ahí.
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-ink-100 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end -mx-6 -mb-5 px-6 py-4 bg-ink-50/50">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || !form.name.trim()}
          >
            <Save size={14} />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

      </form>
    </Modal>
  );
}
