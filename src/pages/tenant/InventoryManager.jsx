import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Package, Plus, History, AlertTriangle, TrendingDown, Search, Edit, ShoppingBag, CheckCircle, Trash2 } from 'lucide-react';

export default function InventoryManager() {
    const { inventory, inventoryLogs, addInventoryItem, updateRow, deleteRow, requests, addLog, updateStock, currentUser } = useData(); // Added updateRow, requests, addLog
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('stock'); // stock | history | requests

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [itemForm, setItemForm] = useState({ id: null, name: '', category: 'Alimentación', stock: 0, unit: 'unidades', minStock: 10 });

    // Filter Logic
    const filteredInventory = inventory.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Requests Filter (Supply Orders)
    const supplyOrders = requests.filter(r =>
        r.type === 'supply_order'
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // --- Handlers ---
    const openAddModal = () => {
        setIsEditing(false);
        setItemForm({ id: null, name: '', category: 'Alimentación', stock: 0, unit: 'unidades', minStock: 10 });
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setIsEditing(true);
        setItemForm({ ...item });
        setShowModal(true);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        // Sacar 'id' del payload — Firestore genera el suyo
        const { id, ...cleanData } = itemForm;
        const data = {
            ...cleanData,
            stock: Number(itemForm.stock),
            minStock: Number(itemForm.minStock)
        };

        if (isEditing) {
            updateRow('INVENTORY', id, data);
        } else {
            addInventoryItem(data);
        }
        setShowModal(false);
    };

    const handleRestock = (itemId, currentStock) => {
        const amount = prompt('Cantidad a agregar al stock actual:');
        if (amount && !isNaN(amount)) {
            updateStock(itemId, currentStock + Number(amount), 'Reposición manual');
        }
    };

    const handleDelete = (itemId) => {
        if (confirm('¿Estás seguro de eliminar este item permanentemente?')) {
            deleteRow('INVENTORY', itemId);
        }
    };

    // Requests Handlers
    const handleRequestStatus = (order, newStatus) => {
        updateRow('REQUESTS', order.id, { status: newStatus });
        
        // If completed and linked to an item, update stock
        if (newStatus === 'completed' && order.itemId) {
            const item = inventory.find(i => i.id === order.itemId);
            if (item) {
                updateStock(item.id, item.stock + (Number(order.quantity) || 0), `Pedido de compra finalizado (#${order.id.slice(0,4)})`);
            }
        }

        addLog({
            type: 'admin_supply_action',
            details: `Cambió estado de pedido (${order.item}) a: ${newStatus}`,
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
                <Package className="text-gold-500" /> Gestión de Inventario
            </h2>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-700 overflow-x-auto">
                {[
                    { id: 'stock', label: 'Control de Stock' },
                    { id: 'requests', label: 'Pedidos / Compras' },
                    { id: 'history', label: 'Historial de Uso' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-2 px-4 font-bold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-gold-500 border-b-2 border-gold-500' : 'text-slate-400 hover:text-white'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* --- TAB: STOCK CONTROL --- */}
            {activeTab === 'stock' && (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                            <input
                                className="input-field pl-10"
                                placeholder="Buscar insumo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
                            <Plus size={18} /> Nuevo Item
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredInventory.map(item => (
                            <div key={item.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700 relative overflow-hidden group hover:border-slate-500 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{item.name}</h3>
                                        <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">{item.category}</span>
                                    </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditModal(item)} className="p-1 text-slate-400 hover:text-white transition-colors">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-500 hover:text-red-400 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                            <div className={`
                                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                                            ${item.stock <= item.minStock ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-green-500/10 text-green-500'}
                                        `}>
                                            {item.stock}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-sm text-slate-400 mb-4">
                                    <span>Min: {item.minStock} {item.unit}</span>
                                    <span>Unidad: {item.unit}</span>
                                </div>

                                <button
                                    onClick={() => handleRestock(item.id, item.stock)}
                                    className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} /> Reponer Stock
                                </button>

                                {item.stock <= item.minStock && (
                                    <div className="absolute top-10 right-2">
                                        <AlertTriangle className="text-red-500" size={16} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* --- TAB: REQUESTS (PEDIDOS) --- */}
            {activeTab === 'requests' && (
                <div className="glass-card border border-slate-700 overflow-hidden">
                    {supplyOrders.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <ShoppingBag className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>No hay pedidos de insumos pendientes.</p>
                        </div>
                    ) : (
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
                                        </td>
                                        <td className="p-4 font-medium text-slate-200">
                                            {/* Ideally fetch user name by ID if not present, assuming context has it or simple mock */}
                                            User {order.clientId ? order.clientId.slice(0, 5) : 'Staff'}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-200">{order.details}</div>
                                            <div className="text-xs text-slate-500">Item: {order.item}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs border ${getUrgencyColor(order.urgency)} uppercase font-bold tracking-wider`}>
                                                {order.urgency}
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
                                                    onClick={() => handleRequestStatus(order, 'completed')}
                                                    className="text-green-400 hover:text-green-300 p-2 hover:bg-green-900/20 rounded-lg transition-all"
                                                    title="Marcar como Recibido"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* --- TAB: HISTORY --- */}
            {activeTab === 'history' && (
                <div className="glass-card border border-slate-700 overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-900/50 text-slate-200">
                            <tr>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Item</th>
                                <th className="p-4">Cantidad</th>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">Motivo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {inventoryLogs.sort((a, b) => new Date(b.date) - new Date(a.date)).map(log => (
                                <tr key={log.id}>
                                    <td className="p-4">{new Date(log.date).toLocaleString()}</td>
                                    <td className="p-4 font-bold text-white">{log.itemName}</td>
                                    <td className={`p-4 font-bold flex items-center gap-1 ${log.type === 'restock' ? 'text-green-400' : 'text-red-400'}`}>
                                        {log.type === 'restock' ? <Plus size={14} /> : <TrendingDown size={14} />} 
                                        {log.type === 'restock' ? '+' : '-'}{log.quantity}
                                    </td>
                                    <td className="p-4">{log.userId}</td>
                                    <td className="p-4 italic">{log.reason || '-'}</td>
                                </tr>
                            ))}
                            {inventoryLogs.length === 0 && (
                                <tr><td colSpan="5" className="p-8 text-center">No hay registros de uso.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal (Add/Edit) */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-card p-6 rounded-xl border border-slate-700 w-full max-w-sm animate-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-white mb-4">{isEditing ? 'Editar Item' : 'Nuevo Item'}</h3>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Nombre</label>
                                <input
                                    className="input-field" placeholder="Nombre (ej: Avena)"
                                    value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Categoría</label>
                                <select
                                    className="input-field"
                                    value={itemForm.category} onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                                >
                                    <option>Alimentación</option>
                                    <option>Cama</option>
                                    <option>Veterinaria</option>
                                    <option>Mantenimiento</option>
                                    <option>Otros</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Stock {isEditing && '(Actual)'}</label>
                                    <input
                                        className="input-field" type="number" placeholder="Stock"
                                        value={itemForm.stock} onChange={e => setItemForm({ ...itemForm, stock: e.target.value })} required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Mínimo</label>
                                    <input
                                        className="input-field" type="number" placeholder="Mínimo"
                                        value={itemForm.minStock} onChange={e => setItemForm({ ...itemForm, minStock: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Unidad de Medida</label>
                                <input
                                    className="input-field" placeholder="Unidad (ej: kg, bolsas)"
                                    value={itemForm.unit} onChange={e => setItemForm({ ...itemForm, unit: e.target.value })} required
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Cancelar</button>
                                <button type="submit" className="flex-1 btn-primary">{isEditing ? 'Guardar Cambios' : 'Crear Item'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
