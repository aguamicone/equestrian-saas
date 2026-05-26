import { useState, useEffect } from 'react';
import { useData } from '../../../context/DataContext';
import { Modal } from '../../ui';

export default function EditChargeModal({ isOpen, onClose, charge }) {
    const { editPendingCharge } = useData();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (charge && isOpen) {
            setAmount(charge.amount || '');
            setDescription(charge.description || '');
            setError(null);
        }
    }, [charge, isOpen]);

    if (!isOpen || !charge) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        if (!amount || Number(amount) <= 0) {
            setError('El importe debe ser mayor a 0.');
            setSaving(false);
            return;
        }

        try {
            const res = await editPendingCharge(charge.id, {
                amount: Number(amount),
                description: description
            });

            if (res.success) {
                onClose();
            } else {
                setError(res.error || 'Error al guardar los cambios.');
            }
        } catch (err) {
            setError('Ocurrió un error inesperado.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={saving ? undefined : onClose} title="Editar Cargo Pendiente" size="sm">
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
                {error && (
                    <div className="bg-danger-50 border border-danger-200 text-danger-900 px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Concepto / Descripción *</label>
                    <input
                        type="text"
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="input-field"
                        placeholder="Ej. Pensión Enero"
                        disabled={saving}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Importe ($) *</label>
                    <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="input-field"
                        placeholder="Ej. 15000"
                        disabled={saving}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-ink-100 mt-6 bg-ink-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                    <button type="button" onClick={onClose} disabled={saving} className="btn-secondary">
                        Cancelar
                    </button>
                    <button type="submit" disabled={saving} className="btn-primary">
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
