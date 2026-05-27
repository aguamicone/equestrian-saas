import { useState } from 'react';
import { X, Save, Phone, MapPin, Briefcase, User, Info } from 'lucide-react';
import { Modal } from '../ui';
import { useData } from '../../context/DataContext';
import { useNotification } from '../../context/NotificationContext';

const CATEGORIES = [
  { id: 'veterinario', label: 'Veterinario' },
  { id: 'herrero', label: 'Herrero' },
  { id: 'clinica', label: 'Clínica / Centro' }
];

export default function DirectoryModal({ contact = null, onClose }) {
    const { createContact, updateContact } = useData();
    const { notify } = useNotification();
    const isEdit = !!contact;

    const [formData, setFormData] = useState({
        category: contact?.category || 'veterinario',
        name: contact?.name || '',
        specialty: contact?.specialty || '',
        phone: contact?.phone || '',
        location: contact?.location || '',
        notes: contact?.notes || ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (isEdit) {
                await updateContact(contact.id, formData);
                notify('Contacto actualizado', 'success');
            } else {
                await createContact(formData);
                notify('Contacto creado', 'success');
            }
            onClose();
        } catch (error) {
            notify('Error al guardar contacto', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
    return (
        <Modal 
            isOpen={true} 
            onClose={onClose} 
            size="md"
            title={isEdit ? 'Editar Contacto' : 'Nuevo Contacto'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">Categoría</label>
                        <div className="grid grid-cols-3 gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: cat.id })}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                        formData.category === cat.id 
                                            ? 'bg-primary-50 border-primary-200 text-primary-700' 
                                            : 'bg-white border-ink-200 text-ink-600 hover:bg-ink-50'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">Nombre *</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-4 w-4 text-ink-400" />
                            </div>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Dr. Juan Pérez"
                                className="block w-full pl-9 pr-3 py-2 border border-ink-200 rounded-lg text-sm text-ink-900 bg-white placeholder-ink-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">Especialidad</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Briefcase className="h-4 w-4 text-ink-400" />
                            </div>
                            <input
                                type="text"
                                value={formData.specialty}
                                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                placeholder="Ej: Odontología equina, Herrado correctivo"
                                className="block w-full pl-9 pr-3 py-2 border border-ink-200 rounded-lg text-sm text-ink-900 bg-white placeholder-ink-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1">Teléfono *</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-4 w-4 text-ink-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+54 9 11..."
                                    className="block w-full pl-9 pr-3 py-2 border border-ink-200 rounded-lg text-sm text-ink-900 bg-white placeholder-ink-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1">Ubicación / Zona</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin className="h-4 w-4 text-ink-400" />
                                </div>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Ej: Pilar, GBA Norte"
                                    className="block w-full pl-9 pr-3 py-2 border border-ink-200 rounded-lg text-sm text-ink-900 bg-white placeholder-ink-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1">Adicional (Opcional)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 pt-2.5 pointer-events-none">
                                <Info className="h-4 w-4 text-ink-400" />
                            </div>
                            <textarea
                                rows={2}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Ej: Atiende emergencias 24hs..."
                                className="block w-full pl-9 pr-3 py-2 border border-ink-200 rounded-lg text-sm text-ink-900 bg-white placeholder-ink-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow resize-none"
                            />
                        </div>
                    </div>

                    <div className="mt-6 pt-4 flex justify-end gap-3 border-t border-ink-100">
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
                            {isSubmitting ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
        </Modal>
    );
}
