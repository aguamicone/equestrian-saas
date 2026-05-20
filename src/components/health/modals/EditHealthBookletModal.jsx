import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Modal } from '../../ui';
import { useData } from '../../../context/DataContext';

export default function EditHealthBookletModal({ horse, booklet, onClose }) {
  const { upsertHealthBooklet } = useData();
  
  const [formData, setFormData] = useState({
    registryNumber: booklet?.registryNumber || '',
    issuedDate: booklet?.issuedDate ? new Date(booklet.issuedDate).toISOString().split('T')[0] : '',
    expiresAt: booklet?.expiresAt ? new Date(booklet.expiresAt).toISOString().split('T')[0] : '',
    notes: booklet?.notes || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await upsertHealthBooklet(horse.id, {
      registryNumber: formData.registryNumber,
      issuedDate: formData.issuedDate || null,
      expiresAt: formData.expiresAt || null,
      notes: formData.notes
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-medium text-ink-900">
            {booklet ? 'Editar libreta sanitaria' : 'Crear libreta sanitaria'}
          </h2>
          <button onClick={onClose} className="p-2 text-ink-500 hover:bg-ink-50 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Nº de Registro (Oficial)</label>
            <input
              type="text"
              placeholder="Ej: REG-2024-1234"
              value={formData.registryNumber}
              onChange={(e) => setFormData({ ...formData, registryNumber: e.target.value })}
              className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Fecha de emisión</label>
            <input
              type="date"
              value={formData.issuedDate}
              onChange={(e) => setFormData({ ...formData, issuedDate: e.target.value })}
              className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Fecha de vencimiento</label>
            <input
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Notas adicionales</label>
            <textarea
              rows={3}
              placeholder="Observaciones de la libreta..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
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
              {isSubmitting ? 'Guardando...' : 'Guardar libreta'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
