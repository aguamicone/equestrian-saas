import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, Search, Plus, Pencil, Trash2, Box, Link2, GitCommitVertical, Shield, ShieldHalf, HardHat, Disc, CircleDot, Package, MapPin } from 'lucide-react';
import EquipmentItemModal from '../../components/client/EquipmentItemModal';

const TYPE_ICONS = {
    montura: Box,
    cabezada: Link2,
    riendas: GitCommitVertical,
    pechera: Shield,
    panzera: ShieldHalf,
    cascos: HardHat,
    frenos: Disc,
    estribos: CircleDot,
    otros: Package
};

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

export default function TenantEquipment() {
    const { equipmentItems, tenantUsers, getEquipmentItemsByTenantAdmins, deleteEquipmentItem } = useData();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('todos');

    // Stats
    const totalItems = equipmentItems.length;
    const itemsByOwner = useMemo(() => {
        const counts = {};
        equipmentItems.forEach(item => {
            counts[item.ownerId] = (counts[item.ownerId] || 0) + 1;
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return sorted.map(([uid, count]) => {
            const user = tenantUsers.find(u => u.uid === uid);
            return { uid, name: user?.displayName || 'Desconocido', count };
        });
    }, [equipmentItems, tenantUsers]);

    // Modal state for Sub-tab 2
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const handleAdd = () => {
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;
        await deleteEquipmentItem(itemToDelete.id);
        setItemToDelete(null);
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-100 font-display">Inventario de Equipos</h2>
                    <p className="text-slate-400">Gestión de equipamiento del haras y de clientes</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800 px-6 py-4 rounded-xl border border-slate-700 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{totalItems}</div>
                        <div className="text-sm text-slate-400">Items Totales en el Tenant</div>
                    </div>
                </div>
                
                <div className="bg-slate-800 px-6 py-4 rounded-xl border border-slate-700 flex flex-col justify-center">
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">Resumen por dueño</div>
                    <div className="flex flex-wrap gap-2">
                        {itemsByOwner.length === 0 && <span className="text-sm text-slate-500">Sin items registrados</span>}
                        {itemsByOwner.slice(0, 8).map(owner => (
                            <span key={owner.uid} className="bg-slate-700/50 text-slate-300 px-2 py-1 rounded text-xs border border-slate-600">
                                <strong className="text-white">{owner.name}:</strong> {owner.count}
                            </span>
                        ))}
                        {itemsByOwner.length > 8 && <span className="text-xs text-slate-500 py-1">+{itemsByOwner.length - 8} más</span>}
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2 border-b border-slate-700 overflow-x-auto hide-scrollbar">
                <button
                    onClick={() => setActiveTab('todos')}
                    className={`flex items-center gap-2 px-6 py-3 font-bold rounded-t-xl transition-colors whitespace-nowrap ${activeTab === 'todos' ? 'text-gold-500 border-b-2 border-gold-500 bg-gold-500/5' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <Briefcase size={18}/> Todos los Equipos
                </button>
                <button
                    onClick={() => setActiveTab('propios')}
                    className={`flex items-center gap-2 px-6 py-3 font-bold rounded-t-xl transition-colors whitespace-nowrap ${activeTab === 'propios' ? 'text-gold-500 border-b-2 border-gold-500 bg-gold-500/5' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <MapPin size={18}/> Ítems Caballeriza
                </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'todos' && <TabTodos tenantUsers={tenantUsers} equipmentItems={equipmentItems} />}
            {activeTab === 'propios' && (
                <TabPropios 
                    items={getEquipmentItemsByTenantAdmins()} 
                    onAdd={handleAdd} 
                    onEdit={handleEdit} 
                    onDelete={setItemToDelete} 
                />
            )}

            {/* Modal de Formulario */}
            <EquipmentItemModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                item={selectedItem}
            />

            {/* Modal Confirmación Delete */}
            {itemToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-sm p-6 animate-in zoom-in duration-300">
                        <h3 className="text-lg font-bold text-white mb-2">Eliminar Equipo</h3>
                        <p className="text-sm text-slate-400 mb-6">
                            ¿Estás seguro de eliminar <strong>{itemToDelete.name}</strong>? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setItemToDelete(null)} className="flex-1 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
                                Cancelar
                            </button>
                            <button onClick={handleDeleteConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 text-sm font-bold transition-colors">
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// PESTAÑA 1: Todos los Equipos
// ==========================================
function TabTodos({ tenantUsers, equipmentItems }) {
    const [filterOwner, setFilterOwner] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterCondition, setFilterCondition] = useState('');
    const [filterUsage, setFilterUsage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Owners who have items
    const ownersWithItems = useMemo(() => {
        const uids = [...new Set(equipmentItems.map(i => i.ownerId))];
        return uids.map(uid => {
            const user = tenantUsers.find(u => u.uid === uid);
            return { uid, name: user?.displayName || 'Desconocido' };
        }).sort((a,b) => a.name.localeCompare(b.name));
    }, [equipmentItems, tenantUsers]);

    // Apply filters
    const filteredItems = useMemo(() => {
        return equipmentItems.filter(item => {
            if (filterOwner && item.ownerId !== filterOwner) return false;
            if (filterType && item.type !== filterType) return false;
            if (filterCondition && item.condition !== filterCondition) return false;
            if (filterUsage && item.usage !== filterUsage) return false;
            
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const nameMatch = item.name?.toLowerCase().includes(query);
                const brandMatch = item.brand?.toLowerCase().includes(query);
                if (!nameMatch && !brandMatch) return false;
            }
            return true;
        });
    }, [equipmentItems, filterOwner, filterType, filterCondition, filterUsage, searchQuery]);

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {/* Filters */}
            <div className="glass-card p-4 flex flex-wrap gap-3 items-center border border-slate-700 bg-slate-800/50">
                <select className="input-field max-w-[180px] text-sm py-2" value={filterOwner} onChange={e=>setFilterOwner(e.target.value)}>
                    <option value="">Dueño: Todos</option>
                    {ownersWithItems.map(o => <option key={o.uid} value={o.uid}>{o.name}</option>)}
                </select>
                <select className="input-field max-w-[150px] text-sm py-2" value={filterType} onChange={e=>setFilterType(e.target.value)}>
                    <option value="">Tipo: Todos</option>
                    {EQUIPMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select className="input-field max-w-[150px] text-sm py-2" value={filterCondition} onChange={e=>setFilterCondition(e.target.value)}>
                    <option value="">Estado: Todos</option>
                    <option value="nueva">Nueva</option>
                    <option value="usada">Usada</option>
                    <option value="a_reparar">A Reparar</option>
                </select>
                <select className="input-field max-w-[150px] text-sm py-2" value={filterUsage} onChange={e=>setFilterUsage(e.target.value)}>
                    <option value="">Uso: Todos</option>
                    <option value="entrenamiento">Entrenamiento</option>
                    <option value="concurso">Concurso</option>
                </select>
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-2.5 text-slate-500"/>
                    <input type="text" placeholder="Buscar por nombre o marca..." className="input-field pl-9 py-2 text-sm w-full" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
                </div>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden border border-slate-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-slate-700">
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo / Marca</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Dueño</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado / Uso</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Notas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">
                                        No se encontraron items con estos filtros.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map(item => {
                                    const ownerName = tenantUsers.find(u => u.uid === item.ownerId)?.displayName || 'Desconocido';
                                    const Icon = TYPE_ICONS[item.type] || Package;
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-slate-400"><Icon size={16} /></div>
                                                    <span className="font-bold text-white">{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-slate-300 capitalize">{item.type}</div>
                                                {item.brand && <div className="text-xs text-slate-500">{item.brand}</div>}
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm font-medium text-slate-300">{ownerName}</span>
                                            </td>
                                            <td className="p-4 space-y-1">
                                                <div className="text-[10px] px-2 py-0.5 rounded border inline-block uppercase tracking-wider bg-slate-800 border-slate-600 text-slate-300 mr-2">
                                                    {item.condition.replace('_', ' ')}
                                                </div>
                                                <div className="text-[10px] px-2 py-0.5 rounded border inline-block uppercase tracking-wider bg-slate-800 border-slate-600 text-slate-300">
                                                    {item.usage}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-xs text-slate-500 max-w-xs truncate" title={item.notes}>
                                                    {item.notes || '-'}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// PESTAÑA 2: Ítems Caballeriza
// ==========================================
function TabPropios({ items, onAdd, onEdit, onDelete }) {
    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center glass-card p-4">
                <span className="text-slate-300 font-medium">Equipos propiedad del Haras / Tenant.</span>
                <button onClick={onAdd} className="btn-primary flex items-center gap-2 text-sm">
                    <Plus size={16} /> Agregar Item
                </button>
            </div>

            {items.length === 0 ? (
                <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
                    <Package size={48} className="text-slate-600 mb-4" />
                    <h3 className="text-lg font-bold text-slate-300 mb-2">Sin items de caballeriza</h3>
                    <p className="text-slate-500 text-sm max-w-sm">
                        Agregá el equipamiento propio del haras para llevar un control.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map(item => {
                        const Icon = TYPE_ICONS[item.type] || Package;
                        
                        let conditionStyle = "bg-slate-500/20 text-slate-300 border-slate-500/30";
                        if (item.condition === 'nueva') conditionStyle = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                        if (item.condition === 'usada') conditionStyle = "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
                        if (item.condition === 'a_reparar') conditionStyle = "bg-red-500/20 text-red-300 border-red-500/30";

                        let usageStyle = "bg-slate-500/20 text-slate-300 border-slate-500/30";
                        if (item.usage === 'entrenamiento') usageStyle = "bg-sky-500/20 text-sky-300 border-sky-500/30";
                        if (item.usage === 'concurso') usageStyle = "bg-purple-500/20 text-purple-300 border-purple-500/30";

                        return (
                            <div key={item.id} className="glass-card p-5 relative group flex flex-col">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                                            <Icon size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-base leading-tight">{item.name}</h3>
                                            <p className="text-xs text-slate-400 capitalize mt-0.5">{item.type} {item.brand ? `• ${item.brand}` : ''}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onEdit(item)} className="p-1.5 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-600 rounded">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => onDelete(item)} className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${conditionStyle}`}>
                                        {item.condition.replace('_', ' ')}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${usageStyle}`}>
                                        {item.usage}
                                    </span>
                                </div>

                                {item.notes && (
                                    <p className="text-xs text-slate-500 mt-auto line-clamp-2">
                                        {item.notes}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
