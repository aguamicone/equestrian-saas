// src/components/spaces/modals/EditHorseSubModal.jsx
// Sub-modal de edición de los datos básicos del caballo.
// Se abre desde SpaceDetailModal al clickear "Editar caballo".
// Edita: nombre, raza, edad, color. No toca ownerId ni assignedPlanIds (eso
// es responsabilidad de otras pantallas/modales).

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Modal } from '../../ui';
import { useData } from '../../../context/DataContext';

/**
 * Props:
 *   horse: documento del caballo a editar
 *   onClose: () => void
 *   onSaved?: () => void — callback opcional tras guardar OK
 */
export default function EditHorseSubModal({ horse, onClose, onSaved }) {
  const { updateRow } = useData();

  const [form, setForm] = useState({
    name: horse.name || '',
    breed: horse.breed || '',
    age: horse.age ?? '',
    color: horse.color || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      // Validación mínima — nombre obligatorio
      return;
    }
    setSaving(true);
    try {
      await updateRow('HORSES', horse.id, {
        name: form.name.trim(),
        breed: form.breed.trim() || null,
        age: form.age === '' ? null : Number(form.age),
        color: form.color.trim() || null,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Error guardando caballo:', err);
      // El updateRow ya muestra un toast de error, no hace falta más
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="md" hideDefaultHeader>
      {/* Header */}
      <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
        <div>
          <div className="font-display text-lg font-medium text-ink-900">
            Editar caballo
          </div>
          <div className="text-xs text-ink-500 mt-0.5">
            {horse.name}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-ink-100 text-ink-500 hover:text-ink-800"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

        {/* Nombre */}
        <div>
          <label className="block text-xs font-medium text-ink-600 uppercase tracking-wider mb-1.5">
            Nombre <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
            className="input-field"
            placeholder="Ej: Spirit"
            required
            autoFocus
          />
        </div>

        {/* Raza */}
        <div>
          <label className="block text-xs font-medium text-ink-600 uppercase tracking-wider mb-1.5">
            Raza
          </label>
          <input
            type="text"
            value={form.breed}
            onChange={e => handleChange('breed', e.target.value)}
            className="input-field"
            placeholder="Ej: Criollo, Pura Sangre, Árabe..."
          />
        </div>

        {/* Edad + Color en fila */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-600 uppercase tracking-wider mb-1.5">
              Edad
            </label>
            <input
              type="number"
              value={form.age}
              onChange={e => handleChange('age', e.target.value)}
              className="input-field"
              placeholder="Años"
              min="0"
              max="50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 uppercase tracking-wider mb-1.5">
              Pelaje
            </label>
            <input
              type="text"
              value={form.color}
              onChange={e => handleChange('color', e.target.value)}
              className="input-field"
              placeholder="Ej: Tordillo, Bayo..."
            />
          </div>
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
