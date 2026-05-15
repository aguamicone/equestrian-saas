import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, AlertTriangle, Send, Package } from 'lucide-react';

const COMMON_SUPPLIES = [
    'Butametasona',
    'Vendas',
    'Jeringas',
    'Agujas',
    'Barro',
    'Iodo',
    'Gasas',
    'Algodón',
    'Shampoo',
    'Repelente'
];

export default function StaffSupplies() {
    const { addRequest, inventory, logStockUsage } = useData();
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
            const result = logStockUsage(selectedItemId, quantity, reason, currentUser.displayName);

            if (result && result.success) {
                setLastTransaction(result);
                setSubmitted(true);
            } else {
                alert('Error al registrar consumo: Item no encontrado o error de base de datos.');
                return;
            }

        } else {
            // Create Request
            const item = selectedItemId ? inventory.find(i => i.id === selectedItemId)?.name : customItem;
            addRequest({
                clientId: currentUser.uid,
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
        <div>
            <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                <ShoppingBag className="text-gold-500" /> Pedido de Insumos
            </h2>

            {submitted ? (
                <div className="bg-green-500/10 border border-green-500 p-8 rounded-xl flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
                    <Package size={48} className="text-green-500 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">{mode === 'use' ? 'Consumo Registrado' : 'Orden Generada'}</h3>
                    {lastTransaction ? (
                        <div className="text-slate-300 bg-slate-900/50 p-4 rounded-lg mt-2">
                            <p className="font-bold text-gold-500 mb-1">{lastTransaction.itemName}</p>
                            <p className="text-sm">Stock: <span className="text-red-400">{lastTransaction.oldStock}</span> → <span className="text-green-400 font-bold">{lastTransaction.newStock}</span></p>
                        </div>
                    ) : (
                        <p className="text-slate-400">El pedido fue enviado a administración.</p>
                    )}
                </div>
            ) : (
                <div className='max-w-md mx-auto'>
                    {/* Toggle Mode */}
                    <div className="flex bg-slate-800 p-1 rounded-lg mb-6 border border-slate-700">
                        <button
                            onClick={() => setMode('use')}
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'use' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            Registrar Uso
                        </button>
                        <button
                            onClick={() => setMode('request')}
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'request' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            Solicitar Compra
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Item Selection */}
                        <div>
                            <label className="text-sm text-slate-400 mb-2 block">Insumo</label>
                            <select
                                className="input-field p-3"
                                value={selectedItemId}
                                onChange={(e) => setSelectedItemId(e.target.value)}
                                required={mode === 'use'} // Not required for custom request
                            >
                                <option value="">-- Seleccionar del Stock --</option>
                                {inventory.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.stock} {item.unit})
                                    </option>
                                ))}
                                {mode === 'request' && <option value="custom">-- Otro / No en lista --</option>}
                            </select>
                        </div>

                        {mode === 'request' && selectedItemId === 'custom' && (
                            <div>
                                <label className="text-sm text-slate-400 mb-2 block">Especificar Nombre</label>
                                <input
                                    className="input-field"
                                    value={customItem}
                                    onChange={e => setCustomItem(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {/* Quantity */}
                        <div>
                            <label className="text-sm text-slate-400 mb-2 block">Cantidad</label>
                            <div className="flex items-center gap-4">
                                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-lg bg-slate-700 text-white flex items-center justify-center text-xl font-bold">-</button>
                                <input
                                    type="number"
                                    className="input-field text-center w-20"
                                    value={quantity}
                                    onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                                />
                                <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-lg bg-slate-700 text-white flex items-center justify-center text-xl font-bold">+</button>
                            </div>
                        </div>

                        {/* Urgency (Request Only) */}
                        {mode === 'request' && (
                            <div>
                                <label className="text-sm text-slate-400 mb-2 block">Urgencia</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { val: 'baja', label: 'Baja', color: 'bg-green-500' },
                                        { val: 'media', label: 'Media', color: 'bg-yellow-500' },
                                        { val: 'alta', label: 'Alta', color: 'bg-red-500' }
                                    ].map(opt => (
                                        <label key={opt.val} className={`
                                            cursor-pointer border border-slate-700 rounded-lg p-3 text-center transition-all relative overflow-hidden
                                            ${urgency === opt.val ? 'bg-slate-700 border-white' : 'hover:bg-slate-800'}
                                        `}>
                                            <input
                                                type="radio"
                                                name="urgency"
                                                value={opt.val}
                                                checked={urgency === opt.val}
                                                onChange={e => setUrgency(e.target.value)}
                                                className="hidden"
                                            />
                                            <div className={`w-full h-1 absolute bottom-0 left-0 ${opt.color}`}></div>
                                            <span className="text-sm font-bold text-white">{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reason (Use Only) */}
                        {mode === 'use' && (
                            <div>
                                <label className="text-sm text-slate-400 mb-2 block">Motivo / Detalle (Opcional)</label>
                                <input
                                    className="input-field"
                                    placeholder="Ej: Cama Box 5"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                />
                            </div>
                        )}

                        <button className="w-full btn-primary flex items-center justify-center gap-2 py-3 rounded-xl shadow-lg mt-8">
                            <Send size={18} /> {mode === 'use' ? 'Registrar Consumo' : 'Enviar Pedido'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
