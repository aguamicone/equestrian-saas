import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';

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
        }
    }, [isOpen, item, isEdit]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const data = {
            name,
            type,
            brand,
            condition,
            usage,
            notes
        };

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
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="glass-panel w-full max-w-md p-6 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-white mb-4">
                    {isEdit ? 'Editar Equipo' : 'Agregar Equipo'}
                </h3>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-slate-400 mb-1 block">Nombre *</label>
                        <input 
                            className="input-field" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            placeholder="Ej. Montura Hermès"
                            required 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-slate-400 mb-1 block">Tipo *</label>
                            <select 
                                className="input-field" 
                                value={type} 
                                onChange={e => setType(e.target.value)}
                                required
                            >
                                {EQUIPMENT_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-slate-400 mb-1 block">Marca</label>
                            <input 
                                className="input-field" 
                                value={brand} 
                                onChange={e => setBrand(e.target.value)} 
                                placeholder="Opcional"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-slate-400 mb-1 block">Estado *</label>
                            <select 
                                className="input-field" 
                                value={condition} 
                                onChange={e => setCondition(e.target.value)}
                                required
                            >
                                <option value="nueva">Nueva</option>
                                <option value="usada">Usada</option>
                                <option value="a_reparar">A Reparar</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-slate-400 mb-1 block">Uso *</label>
                            <select 
                                className="input-field" 
                                value={usage} 
                                onChange={e => setUsage(e.target.value)}
                                required
                            >
                                <option value="entrenamiento">Entrenamiento</option>
                                <option value="concurso">Concurso</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm text-slate-400 mb-1 block">Notas</label>
                        <textarea 
                            className="input-field" 
                            rows={3}
                            value={notes} 
                            onChange={e => setNotes(e.target.value)} 
                            placeholder="Detalles adicionales..."
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-400 hover:text-slate-200 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-1 btn-primary">
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
