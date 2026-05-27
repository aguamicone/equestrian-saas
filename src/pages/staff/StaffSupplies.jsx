import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Send, Package } from 'lucide-react';
import { PageHeader } from '../../components/ui';

export default function StaffSupplies() {
    const { createSupplyRequest, inventory, logStockUsage } = useData();
    const { currentUser } = useAuth();

    const [mode, setMode] = useState('use'); // 'use' (Consume) or 'request' (Order)

    // Form States
    const [selectedItemId, setSelectedItemId] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [customItem, setCustomItem] = useState(''); // Only for request mode
    const [quantity, setQuantity] = useState(1);
    const [urgency, setUrgency] = useState('media');
    const [reason, setReason] = useState(''); // For usage logs
    const [lastTransaction, setLastTransaction] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (mode === 'use') {
            // Log Usage
            if (!selectedItemId) return;
            const result = logStockUsage && currentUser ? logStockUsage(selectedItemId, quantity, reason, currentUser.displayName) : null;

            if (result && result.success) {
                setLastTransaction(result);
                setSubmitted(true);
            } else {
                alert('Error al registrar consumo: Item no encontrado o error de base de datos.');
                return;
            }

        } else {
            // Create Request
            const safeInventory = inventory || [];
            const item = selectedItemId ? safeInventory.find(i => i.id === selectedItemId)?.name : customItem;
            createSupplyRequest({
                clientId: currentUser?.uid,
                type: 'supply_order',
                details: `Pedido de Insumo: ${item} x${quantity}`,
                urgency,
                item,
                itemId: selectedItemId && selectedItemId !== 'custom' ? selectedItemId : null,
                quantity,
                status: 'pending',
                timestamp: new Date().toISOString()
            });
            setLastTransaction(null); // Reset for requests
            setSubmitted(true);
        }

        setTimeout(() => {
            setSubmitted(false);
            setLastTransaction(null);
            setSelectedItemId('');
            setCustomItem('');
            setQuantity(1);
            setReason('');
            setUrgency('media');
        }, 4000); // Increased time to read message
    };

    return (
        <div className="space-y-6 pb-20">
            <PageHeader 
                title="Gestión de Insumos"
                subtitle="Registrar consumo diario de stock o solicitar compras de materiales"
                icon={ShoppingBag}
            />

            {submitted ? (
                <div className="bg-success-50 border border-success-200 p-8 rounded-2xl flex flex-col items-center justify-center text-center animate-in zoom-in duration-300 shadow-sm max-w-md mx-auto">
                    <Package size={48} className="text-success-600 mb-4 animate-bounce" />
                    <h3 className="text-xl font-bold text-success-800 mb-2">
                        {mode === 'use' ? 'Consumo Registrado' : 'Orden Generada'}
                    </h3>
                    {lastTransaction ? (
                        <div className="text-ink-655 bg-white border border-ink-150 p-4 rounded-xl mt-2 w-full shadow-sm">
                            <p className="font-bold text-primary-700 mb-1">{lastTransaction.itemName}</p>
                            <p className="text-sm text-ink-600">Stock: <span className="text-danger-655 font-medium">{lastTransaction.oldStock}</span> → <span className="text-success-700 font-bold">{lastTransaction.newStock}</span></p>
                        </div>
                    ) : (
                        <p className="text-ink-500 text-sm">El pedido fue enviado a administración.</p>
                    )}
                </div>
            ) : (
                <div className="max-w-md mx-auto">
                    {/* Toggle Mode */}
                    <div className="flex bg-ink-100 p-1 rounded-xl mb-6 border border-ink-200 shadow-inner">
                        <button
                            type="button"
                            onClick={() => setMode('use')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                                mode === 'use'
                                    ? 'bg-white text-ink-900 shadow-sm'
                                    : 'text-ink-500 hover:text-ink-700'
                            }`}
                        >
                            Registrar Uso
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('request')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                                mode === 'request'
                                    ? 'bg-white text-ink-900 shadow-sm'
                                    : 'text-ink-500 hover:text-ink-700'
                            }`}
                        >
                            Solicitar Compra
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-2xl border border-ink-200 shadow-sm">
                        {/* Item Selection */}
                        <div>
                            <label className="text-xs uppercase font-bold text-ink-500 mb-1.5 block">Insumo</label>
                            <select
                                className="input-field p-3 bg-white border-ink-200 text-ink-750 focus:border-primary-500 focus:ring-0"
                                value={selectedItemId}
                                onChange={(e) => setSelectedItemId(e.target.value)}
                                required={mode === 'use'} // Not required for custom request
                            >
                                <option value="">-- Seleccionar del Stock --</option>
                                {(inventory || []).map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.stock} {item.unit})
                                    </option>
                                ))}
                                {mode === 'request' && <option value="custom">-- Otro / No en lista --</option>}
                            </select>
                        </div>

                        {mode === 'request' && selectedItemId === 'custom' && (
                            <div>
                                <label className="text-xs uppercase font-bold text-ink-500 mb-1.5 block">Especificar Nombre</label>
                                <input
                                    className="input-field bg-white border-ink-200 text-ink-800"
                                    value={customItem}
                                    onChange={e => setCustomItem(e.target.value)}
                                    required
                                    placeholder="Nombre del insumo"
                                />
                            </div>
                        )}

                        {/* Quantity */}
                        <div>
                            <label className="text-xs uppercase font-bold text-ink-500 mb-1.5 block">Cantidad</label>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-10 rounded-lg bg-ink-100 hover:bg-ink-200 text-ink-700 flex items-center justify-center text-lg font-bold transition-colors border border-ink-200"
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    className="input-field text-center w-20 bg-white border-ink-200 text-ink-850 font-bold"
                                    value={quantity}
                                    onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-10 h-10 rounded-lg bg-ink-100 hover:bg-ink-200 text-ink-700 flex items-center justify-center text-lg font-bold transition-colors border border-ink-200"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Urgency (Request Only) */}
                        {mode === 'request' && (
                            <div>
                                <label className="text-xs uppercase font-bold text-ink-500 mb-1.5 block">Urgencia</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { val: 'baja', label: 'Baja', color: 'bg-success-500', selectedBg: 'bg-success-50/50 border-success-400 text-success-800', defaultBg: 'hover:bg-ink-50 border-ink-200 text-ink-600 bg-white' },
                                        { val: 'media', label: 'Media', color: 'bg-warning-500', selectedBg: 'bg-warning-50/50 border-warning-400 text-warning-800', defaultBg: 'hover:bg-ink-50 border-ink-200 text-ink-600 bg-white' },
                                        { val: 'alta', label: 'Alta', color: 'bg-danger-500', selectedBg: 'bg-danger-50/50 border-danger-400 text-danger-800', defaultBg: 'hover:bg-ink-50 border-ink-200 text-ink-600 bg-white' }
                                    ].map(opt => (
                                        <label key={opt.val} className={`
                                            cursor-pointer border rounded-xl p-3 text-center transition-all relative overflow-hidden flex flex-col items-center justify-center font-bold text-sm
                                            ${urgency === opt.val ? opt.selectedBg : opt.defaultBg}
                                        `}>
                                            <input
                                                type="radio"
                                                name="urgency"
                                                value={opt.val}
                                                checked={urgency === opt.val}
                                                onChange={e => setUrgency(e.target.value)}
                                                className="hidden"
                                            />
                                            <span className="relative z-10">{opt.label}</span>
                                            <div className={`w-full h-1 absolute bottom-0 left-0 ${opt.color}`}></div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reason (Use Only) */}
                        {mode === 'use' && (
                            <div>
                                <label className="text-xs uppercase font-bold text-ink-500 mb-1.5 block">Motivo / Detalle (Opcional)</label>
                                <input
                                    className="input-field bg-white border-ink-200 text-ink-800"
                                    placeholder="Ej: Cama Box 5"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                />
                            </div>
                        )}

                        <button className="w-full btn-primary flex items-center justify-center gap-2 py-3 rounded-xl shadow-sm mt-8">
                            <Send size={18} /> {mode === 'use' ? 'Registrar Consumo' : 'Enviar Pedido'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
