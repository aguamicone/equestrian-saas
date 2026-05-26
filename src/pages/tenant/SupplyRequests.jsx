import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Search, ShoppingBag, CheckCircle, Clock } from 'lucide-react';
import { PageHeader, Card, Badge } from '../../components/ui';

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

    const getUrgencyTone = (urgency) => {
        switch (urgency) {
            case 'high': return 'danger';
            case 'medium': return 'gold';
            default: return 'neutral';
        }
    };

    const getUrgencyLabel = (urgency) => {
        switch (urgency) {
            case 'high': return 'Alta';
            case 'medium': return 'Media';
            default: return 'Baja';
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <PageHeader 
                kicker="Control de Stock"
                title="Pedidos de Insumos"
                subtitle="Seguimiento y aprobación de solicitudes de insumos realizadas por el personal"
                icon={ShoppingBag}
            />

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                    className="input-field pl-9 py-2.5 text-sm w-full bg-white border-ink-200 text-ink-700 placeholder-ink-400 focus:border-primary-500 focus:ring-0"
                    placeholder="Buscar pedido..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Card padding="none" className="overflow-hidden border-ink-200 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-ink-600 border-collapse">
                        <thead className="bg-ink-50 text-ink-500 uppercase font-bold text-[11px] tracking-wider border-b border-ink-200">
                            <tr>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Solicitante</th>
                                <th className="p-4">Detalle</th>
                                <th className="p-4">Urgencia</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-100 bg-white">
                            {supplyOrders.map(order => (
                                <tr key={order.id} className="hover:bg-ink-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-semibold text-ink-900">
                                            {new Date(order.timestamp).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-ink-400 flex items-center gap-1 mt-0.5">
                                            <Clock size={12} />
                                            {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-ink-700">
                                        {order.requesterName || 'Staff'}
                                    </td>
                                    <td className="p-4">
                                        <div className="text-ink-900 font-medium">{order.details}</div>
                                        <div className="text-xs text-ink-400 mt-0.5">Cant: {order.quantity || 1}</div>
                                    </td>
                                    <td className="p-4">
                                        <Badge tone={getUrgencyTone(order.urgency)}>
                                            {getUrgencyLabel(order.urgency)}
                                        </Badge>
                                    </td>
                                    <td className="p-4">
                                        <Badge tone={order.status === 'completed' ? 'success' : 'gold'}>
                                            {order.status === 'completed' ? 'Recibido' : 'Pendiente'}
                                        </Badge>
                                    </td>
                                    <td className="p-4 text-right">
                                        {order.status !== 'completed' && (
                                            <button
                                                onClick={() => handleStatusChange(order.id, 'completed')}
                                                className="text-success-600 hover:text-success-700 p-2 hover:bg-success-50 rounded-lg transition-all"
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
                                    <td colSpan="6" className="p-8 text-center text-ink-400 italic bg-ink-50/10">
                                        No hay pedidos registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
