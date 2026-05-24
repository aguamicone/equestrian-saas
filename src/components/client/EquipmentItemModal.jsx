import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import Modal from '../ui/Modal';

const EQUIPMENT_TYPES = [
    { value: 'montura', label: 'Montura' },
    { value: 'cabezada', label: 'Cabezada' },
    { value: 'riendas', label: 'Riendas' },
    { value: 'pechera', label: 'Pechera' },
    { value: 'panzera', label: 'Panzera' },
    { value: 'cascos', label: 'Cascos' },
    { value: 'frenos', label: 'Frenos' },
    { value: 'estribos', label: 'Estribos' },
    { value: 'otros', label: 'Otros' }
];

export default function EquipmentItemModal({ isOpen, onClose, item }) {
    const { createEquipmentItem, updateEquipmentItem } = useData();

    const isEdit = !!item;

    const [name, setName] = useState('');
    const [type, setType] = useState(EQUIPMENT_TYPES[0].value);
    const [brand, setBrand] = useState('');
    const [condition, setCondition] = useState('nueva');
    const [usage, setUsage] = useState('entrenamiento');
    const [notes, setNotes] = useState('');

    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (isEdit) {
                setName(item.name || '');
                setType(item.type || EQUIPMENT_TYPES[0].value);
                setBrand(item.brand || '');
                setCondition(item.condition || 'nueva');
                setUsage(item.usage || 'entrenamiento');
                setNotes(item.notes || '');
            } else {
                setName('');
                setType(EQUIPMENT_TYPES[0].value);
                setBrand('');
                setCondition('nueva');
                setUsage('entrenamiento');
                setNotes('');
            }
            setError(null);
            setIsSubmitting(false);
        }
    }, [isOpen, item, isEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setError(null);
        setIsSubmitting(true);

        const data = {
            name,
            type,
            brand,
            condition,
            usage,
            notes
        };

        try {
            let result;
            if (isEdit) {
                result = await updateEquipmentItem(item.id, data);
            } else {
                result = await createEquipmentItem(data);
            }

            if (result.success) {
                onClose();
            } else {
                setError(result.error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const footer = (
        <div className="flex gap-3 w-full">
            <button 
                type="button" 
                onClick={onClose} 
                disabled={isSubmitting}
                className="flex-1 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 disabled:opacity-50 transition-colors"
            >
                Cancelar
            </button>
            <button 
                type="submit" 
                form="equipment-form"
                disabled={isSubmitting} 
                className="flex-1 btn-primary py-2 text-sm font-medium rounded-lg"
            >
                {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'Editar Equipo' : 'Agregar Equipo'}
            size="md"
            footer={footer}
        >
            {error && (
                <div className="bg-danger-50 border border-danger-200 text-danger-700 p-3 rounded-xl text-sm mb-4">
                    {error}
                </div>
            )}

            <form id="equipment-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-ink-600 mb-1 block">Nombre *</label>
                    <input 
                        className="input-field" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder="Ej. Montura Hermès"
                        required 
                        disabled={isSubmitting}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-ink-600 mb-1 block">Tipo *</label>
                        <select 
                            className="input-field" 
                            value={type} 
                            onChange={e => setType(e.target.value)}
                            required
                            disabled={isSubmitting}
                        >
                            {EQUIPMENT_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-ink-600 mb-1 block">Marca</label>
                        <input 
                            className="input-field" 
                            value={brand} 
                            onChange={e => setBrand(e.target.value)} 
                            placeholder="Opcional"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-ink-600 mb-1 block">Estado *</label>
                        <select 
                            className="input-field" 
                            value={condition} 
                            onChange={e => setCondition(e.target.value)}
                            required
                            disabled={isSubmitting}
                        >
                            <option value="nueva">Nueva</option>
                            <option value="usada">Usada</option>
                            <option value="a_reparar">A Reparar</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-ink-600 mb-1 block">Uso *</label>
                        <select 
                            className="input-field" 
                            value={usage} 
                            onChange={e => setUsage(e.target.value)}
                            required
                            disabled={isSubmitting}
                        >
                            <option value="entrenamiento">Entrenamiento</option>
                            <option value="concurso">Concurso</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-ink-600 mb-1 block">Notas</label>
                    <textarea 
                        className="input-field" 
                        rows={3}
                        value={notes} 
                        onChange={e => setNotes(e.target.value)} 
                        placeholder="Detalles adicionales..."
                        disabled={isSubmitting}
                    />
                </div>
            </form>
        </Modal>
    );
}
