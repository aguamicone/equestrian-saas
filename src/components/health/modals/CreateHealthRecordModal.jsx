import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Modal } from '../../ui';
import { useData } from '../../../context/DataContext';

const EVENT_TYPES = [
  { value: 'vacuna', label: 'Vacuna' },
  { value: 'desparasitacion', label: 'Desparasitación' },
  { value: 'control_veterinario', label: 'Control veterinario' },
  { value: 'herrado', label: 'Herrado' },
  { value: 'dental', label: 'Tratamiento dental' },
  { value: 'otros', label: 'Otros' }
];

const VACCINE_SUGGESTIONS = ['Antitetánica', 'Antigripal', 'Encefalomielitis', 'Adenitis Equina'];
const DEWORMER_SUGGESTIONS = ['Ivermectina', 'Moxidectina', 'Prazicuantel'];

export default function CreateHealthRecordModal({ horse, onClose }) {
  const { createHealthRecord } = useData();
  
  const [formData, setFormData] = useState({
    type: 'vacuna',
    subtype: '',
    date: new Date().toISOString().split('T')[0],
    hasDueDate: false,
    nextDueDate: '',
    veterinarianName: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default nextDueDate when hasDueDate changes
  useEffect(() => {
    if (formData.hasDueDate && !formData.nextDueDate) {
      const nextYear = new Date(formData.date);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setFormData(prev => ({ ...prev, nextDueDate: nextYear.toISOString().split('T')[0] }));
    }
  }, [formData.hasDueDate, formData.date, formData.nextDueDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.type || !formData.date) return;

    setIsSubmitting(true);
    await createHealthRecord({
      horseId: horse.id,
      type: formData.type,
      subtype: formData.subtype,
      date: formData.date,
      nextDueDate: formData.hasDueDate ? formData.nextDueDate : null,
      veterinarianName: formData.veterinarianName,
      notes: formData.notes
    });
    setIsSubmitting(false);
    onClose();
  };

  const getSuggestions = () => {
    if (formData.type === 'vacuna') return VACCINE_SUGGESTIONS;
    if (formData.type === 'desparasitacion') return DEWORMER_SUGGESTIONS;
    return [];
  };

  const suggestions = getSuggestions();

  return (
    <Modal isOpen={true} onClose={onClose} size="md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-medium text-ink-900">Registrar evento sanitario</h2>
          <button onClick={onClose} className="p-2 text-ink-500 hover:bg-ink-50 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Caballo</label>
            <input 
              type="text" 
              value={`${horse.name} (${horse.breed || 'S/R'})`}
              disabled 
              className="w-full px-3 py-2 border border-ink-200 rounded-lg bg-ink-50 text-ink-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Tipo de evento *</label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value, subtype: '' })}
              className="input-field"
            >
              {EVENT_TYPES.map(t => (
                <option key={t.value} value={t.value} className="bg-white text-ink-800">{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Detalle / Subtipo</label>
            <input
              type="text"
              placeholder="Ej: Antitetánica, Ivermectina..."
              value={formData.subtype}
              onChange={(e) => setFormData({ ...formData, subtype: e.target.value })}
              className="input-field"
            />
            {suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map(sug => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setFormData({ ...formData, subtype: sug })}
                    className="px-2 py-1 text-xs bg-ink-100 text-ink-700 hover:bg-ink-200 rounded-md transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Fecha del evento *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Vencimiento</label>
              <div className="flex items-center h-10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasDueDate}
                    onChange={(e) => setFormData({ ...formData, hasDueDate: e.target.checked })}
                    className="rounded border-ink-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-ink-700">Tiene vencimiento</span>
                </label>
              </div>
            </div>
          </div>

          {formData.hasDueDate && (
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Próximo vencimiento *</label>
              <input
                type="date"
                required={formData.hasDueDate}
                value={formData.nextDueDate}
                min={formData.date}
                onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                className="input-field"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Veterinario / Profesional</label>
            <input
              type="text"
              placeholder="Nombre del profesional..."
              value={formData.veterinarianName}
              onChange={(e) => setFormData({ ...formData, veterinarianName: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Notas adicionales</label>
            <textarea
              rows={3}
              placeholder="Reacciones, observaciones..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-ink-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {isSubmitting ? 'Guardando...' : 'Guardar registro'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
