import { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { Modal } from '../../ui';

const CATEGORIAS_GASTO = [
    'Alimentación',
    'Veterinaria',
    'Mantenimiento',
    'Limpieza',
    'Proveedores',
    'Personal',
    'Servicios (Luz, Agua, etc)',
    'Otros'
];

export default function RegistrarGastoModal({ isOpen, onClose }) {
    const { addExpense } = useData();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        category: CATEGORIAS_GASTO[0],
        description: '',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        status: 'paid',
        provider: '',
        quantity: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
            setError('Por favor, ingresa un monto válido.');
            return;
        }
        if (!formData.description.trim()) {
            setError('Por favor, ingresa una descripción para el gasto.');
            return;
        }

        setSaving(true);
        try {
            const res = await addExpense(formData);
            if (res.success) {
                setFormData({
                    category: CATEGORIAS_GASTO[0],
                    description: '',
                    amount: '',
                    date: new Date().toISOString().slice(0, 10),
                    status: 'paid',
                    provider: '',
                    quantity: ''
                });
                onClose();
            } else {
                setError(res.error || 'Ocurrió un error al registrar el gasto.');
            }
        } catch (err) {
            setError('Error de conexión.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={saving ? undefined : onClose} title="Registrar Gasto" size="md">
            <form onSubmit={handleSubmit} className="space-y-4 py-2 text-ink-900">
                {error && (
                    <div className="bg-danger-50 border border-danger-200 text-danger-900 px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-ink-800 mb-1.5">
                            Fecha del Gasto *
                        </label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="input-field"
                            required
                            disabled={saving}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-ink-800 mb-1.5">
                            Monto ($) *
                        </label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            className="input-field font-mono"
                            placeholder="Ej: 50000"
                            min="1"
                            step="0.01"
                            required
                            disabled={saving}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-ink-800 mb-1.5">
                        Categoría *
                    </label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="input-field"
                        disabled={saving}
                    >
                        {CATEGORIAS_GASTO.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-ink-800 mb-1.5">
                        Descripción *
                    </label>
                    <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Ej: Compra de 50 fardos de alfalfa"
                        required
                        disabled={saving}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-ink-800 mb-1.5">
                            Proveedor <span className="text-ink-400 font-normal">(opcional)</span>
                        </label>
                        <input
                            type="text"
                            name="provider"
                            value={formData.provider}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Ej: Forrajería San José"
                            disabled={saving}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-ink-800 mb-1.5">
                            Cantidad/Detalle <span className="text-ink-400 font-normal">(opcional)</span>
                        </label>
                        <input
                            type="text"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Ej: 50 unidades, 1 viaje..."
                            disabled={saving}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-ink-800 mb-1.5">
                        Estado de Pago
                    </label>
                    <div className="flex bg-ink-50 p-1 rounded-xl w-fit border border-ink-100">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, status: 'paid' }))}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                formData.status === 'paid' 
                                    ? 'bg-white text-ink-900 shadow-sm border border-ink-200' 
                                    : 'text-ink-500 hover:text-ink-700'
                            }`}
                            disabled={saving}
                        >
                            Ya Pagado
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, status: 'pending' }))}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                formData.status === 'pending' 
                                    ? 'bg-white text-ink-900 shadow-sm border border-ink-200' 
                                    : 'text-ink-500 hover:text-ink-700'
                            }`}
                            disabled={saving}
                        >
                            A Pagar (Deuda)
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-ink-100 mt-6 bg-ink-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="btn-secondary"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary"
                    >
                        {saving ? 'Registrando...' : 'Guardar Gasto'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
