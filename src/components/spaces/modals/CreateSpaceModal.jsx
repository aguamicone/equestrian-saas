// src/components/spaces/modals/CreateSpaceModal.jsx
// Modal para crear un nuevo espacio (box / piquete / corral).
// Se abre desde el botón "Nuevo espacio" del header de Caballerizas.

import { useState } from 'react';
import { X, Save, Boxes, Trees, Circle } from 'lucide-react';
import { Modal } from '../../ui';
import { useData } from '../../../context/DataContext';

const SPACE_TYPES = [
  { value: 'box',     label: 'Box',     description: 'Espacio techado fijo',     icon: Boxes },
  { value: 'piquete', label: 'Piquete', description: 'Aire libre, asignación variable', icon: Trees },
  { value: 'corral',  label: 'Corral',  description: 'Espacio cerrado al aire libre',   icon: Circle },
];

export default function CreateSpaceModal({ onClose, onCreated }) {
  const { addSpace } = useData();

  const [form, setForm] = useState({
    name: '',
    type: 'box',
    price: '',
    notes: '',
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
      await addSpace({
        name: form.name.trim(),
        type: form.type,
        price: form.price === '' ? 0 : Number(form.price),
        notes: form.notes.trim() || null,
      });
      onCreated?.();
      onClose();
    } catch (err) {
      console.error('Error creando espacio:', err);
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
            Nuevo espacio
          </div>
          <div className="text-xs text-ink-500 mt-0.5">
            Box, piquete o corral
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

        {/* Tipo - selector visual de 3 opciones */}
        <div>
          <label className="block text-xs font-medium text-ink-600 uppercase tracking-wider mb-2">
            Tipo de espacio
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SPACE_TYPES.map(t => {
              const Icon = t.icon;
              const isSelected = form.type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleChange('type', t.value)}
                  className={`
                    px-3 py-3 rounded-xl border-2 text-left transition-all
                    ${isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-ink-200 hover:border-ink-300 bg-white'
                    }
                  `}
                >
                  <Icon
                    size={18}
                    strokeWidth={1.5}
                    className={isSelected ? 'text-primary-600' : 'text-ink-500'}
                  />
                  <div className={`text-sm font-medium mt-1.5 ${isSelected ? 'text-primary-700' : 'text-ink-800'}`}>
                    {t.label}
                  </div>
                  <div className="text-[10px] text-ink-500 mt-0.5 leading-tight">
                    {t.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

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
            placeholder={form.type === 'box' ? 'Ej: Box 21' : form.type === 'piquete' ? 'Ej: Piquete 3' : 'Ej: Corral A'}
            required
            autoFocus
          />
          <div className="text-xs text-ink-500 mt-1">
            Un nombre corto que identifique el espacio en el grid.
          </div>
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
          <div className="text-xs text-ink-500 mt-1">
            Costo base del espacio. Los planes de pensión pueden modificar esto.
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
            placeholder="Ej: Ubicación, características especiales, recordatorios..."
          />
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
            {saving ? 'Creando...' : 'Crear espacio'}
          </button>
        </div>

      </form>
    </Modal>
  );
}
