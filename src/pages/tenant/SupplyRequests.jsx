import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Search, ShoppingBag, CheckCircle, Clock } from 'lucide-react';

export default function SupplyRequests() {
    const { requests, updateRow, addLog } = useData();
    const [searchTerm, setSearchTerm] = useState('');

    // Filter for supply_order
    const supplyOrders = requests.filter(r =>
        r.type === 'supply_order' &&
        (r.details.toLowerCase().includes(searchTerm.toLowerCase()) || r.status.includes(searchTerm.toLowerCase()))
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const handleStatusChange = (orderId, newStatus) => {
        updateRow('REQUESTS', orderId, { status: newStatus });
        addLog({
            type: 'admin_supply_action',
            details: `Cambió estado de pedido de insumo a: ${newStatus}`,
            timestamp: new Date().toISOString()
        });
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'high': return 'text-red-400 bg-red-900/20 border-red-900/50';
            case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-900/50';
            default: return 'text-blue-400 bg-blue-900/20 border-blue-900/50';
        }
    };

    return (
        <div className="pb-20">
            <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                <ShoppingBag className="text-gold-500" /> Pedidos de Insumos
            </h2>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                <input
                    className="input-field pl-10"
                    placeholder="Buscar pedido..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="glass-card border border-slate-700 overflow-hidden">
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900/50 text-slate-200 uppercase font-bold text-xs">
                        <tr>
                            <th className="p-4">Fecha</th>
                            <th className="p-4">Solicitante</th>
                            <th className="p-4">Detalle</th>
                            <th className="p-4">Urgencia</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {supplyOrders.map(order => (
                            <tr key={order.id} className="hover:bg-slate-700/50 transition-colors">
                                <td className="p-4">
                                    {new Date(order.timestamp).toLocaleDateString()}
                                    <div className="text-xs text-slate-500">{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </td>
                                <td className="p-4 font-medium text-slate-200">
                                    {order.requesterName || 'Staff'}
                                </td>
                                <td className="p-4">
                                    <div className="text-slate-200">{order.details}</div>
                                    <div className="text-xs text-slate-500">Cant: {order.quantity || 1}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs border ${getUrgencyColor(order.urgency)} uppercase font-bold tracking-wider`}>
                                        {order.urgency === 'high' ? 'Alta' : order.urgency === 'medium' ? 'Media' : 'Baja'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs ${order.status === 'completed' ? 'text-green-400 bg-green-900/20' : 'text-slate-300 bg-slate-700'}`}>
                                        {order.status === 'completed' ? 'Recibido' : 'Pendiente'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    {order.status !== 'completed' && (
                                        <button
                                            onClick={() => handleStatusChange(order.id, 'completed')}
                                            className="text-green-400 hover:text-green-300 p-2 hover:bg-green-900/20 rounded-lg transition-all"
                                            title="Marcar como Recibido"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {supplyOrders.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-slate-500">
                                    No hay pedidos pendientes.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
