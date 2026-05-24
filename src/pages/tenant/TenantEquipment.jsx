import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, Search, Plus, Pencil, Trash2, Box, Link2, GitCommitVertical, Shield, ShieldHalf, HardHat, Disc, CircleDot, Package, MapPin } from 'lucide-react';
import { Card, Badge, EmptyState, PageHeader, Tabs, ConfirmDeleteModal } from '../../components/ui';
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
    const [isDeleting, setIsDeleting] = useState(false);

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
        setIsDeleting(true);
        try {
            await deleteEquipmentItem(itemToDelete.id);
            setItemToDelete(null);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <PageHeader 
                kicker="PANEL DE ADMINISTRACIÓN"
                title="Inventario de Equipos"
                subtitle="Gestión de equipamiento del haras y de clientes"
            />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card padding="normal" className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 text-primary-500 flex items-center justify-center shrink-0">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-ink-900">{totalItems}</div>
                        <div className="text-sm text-ink-500">Items Totales en el Tenant</div>
                    </div>
                </Card>
                
                <Card padding="normal" className="flex flex-col justify-center">
                    <div className="text-xs text-ink-400 uppercase tracking-wider font-bold mb-2">Resumen por dueño</div>
                    <div className="flex flex-wrap gap-2">
                        {itemsByOwner.length === 0 && <span className="text-sm text-ink-500">Sin items registrados</span>}
                        {itemsByOwner.slice(0, 8).map(owner => (
                            <span key={owner.uid} className="bg-ink-50 text-ink-700 px-2 py-1 rounded text-xs border border-ink-200">
                                <strong className="text-ink-900">{owner.name}:</strong> {owner.count}
                            </span>
                        ))}
                        {itemsByOwner.length > 8 && <span className="text-xs text-ink-500 py-1">+{itemsByOwner.length - 8} más</span>}
                    </div>
                </Card>
            </div>

            {/* Tabs Navigation */}
            <Tabs 
                tabs={[
                    { key: 'todos', label: 'Todos los Equipos', icon: Briefcase, count: totalItems },
                    { key: 'propios', label: 'Ítems Caballeriza', icon: MapPin }
                ]}
                value={activeTab}
                onChange={setActiveTab}
                className="mt-2"
            />

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
            <ConfirmDeleteModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleDeleteConfirm}
                itemName={itemToDelete?.name}
                message="¿Estás seguro de eliminar este item? Esta acción no se puede deshacer."
                isDeleting={isDeleting}
            />
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

    const conditionToVariant = (condition) => {
        switch (condition) {
            case 'nueva': return 'success';
            case 'usada': return 'primary';
            case 'a_reparar': return 'danger';
            default: return 'neutral';
        }
    };

    const usageToVariant = (usage) => {
        switch (usage) {
            case 'entrenamiento': return 'sky';
            case 'concurso': return 'gold';
            default: return 'neutral';
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {/* Filters */}
            <Card padding="tight" className="flex flex-wrap gap-3 items-center">
                <select className="input-field max-w-[180px] text-sm py-2 bg-white border-ink-200 text-ink-700" value={filterOwner} onChange={e=>setFilterOwner(e.target.value)}>
                    <option value="">Dueño: Todos</option>
                    {ownersWithItems.map(o => <option key={o.uid} value={o.uid}>{o.name}</option>)}
                </select>
                <select className="input-field max-w-[150px] text-sm py-2 bg-white border-ink-200 text-ink-700" value={filterType} onChange={e=>setFilterType(e.target.value)}>
                    <option value="">Tipo: Todos</option>
                    {EQUIPMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select className="input-field max-w-[150px] text-sm py-2 bg-white border-ink-200 text-ink-700" value={filterCondition} onChange={e=>setFilterCondition(e.target.value)}>
                    <option value="">Estado: Todos</option>
                    <option value="nueva">Nueva</option>
                    <option value="usada">Usada</option>
                    <option value="a_reparar">A Reparar</option>
                </select>
                <select className="input-field max-w-[150px] text-sm py-2 bg-white border-ink-200 text-ink-700" value={filterUsage} onChange={e=>setFilterUsage(e.target.value)}>
                    <option value="">Uso: Todos</option>
                    <option value="entrenamiento">Entrenamiento</option>
                    <option value="concurso">Concurso</option>
                </select>
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-2.5 text-ink-400"/>
                    <input type="text" placeholder="Buscar por nombre o marca..." className="input-field pl-9 py-2 text-sm w-full bg-white border-ink-200 text-ink-700 placeholder-ink-400" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
                </div>
            </Card>

            {/* Table */}
            <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-ink-50 border-b border-ink-200">
                                <th className="p-4 text-xs font-bold text-ink-500 uppercase tracking-wider">Nombre</th>
                                <th className="p-4 text-xs font-bold text-ink-500 uppercase tracking-wider">Tipo / Marca</th>
                                <th className="p-4 text-xs font-bold text-ink-500 uppercase tracking-wider">Dueño</th>
                                <th className="p-4 text-xs font-bold text-ink-500 uppercase tracking-wider">Estado / Uso</th>
                                <th className="p-4 text-xs font-bold text-ink-500 uppercase tracking-wider">Notas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-100">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8">
                                        <EmptyState 
                                            icon={Search}
                                            message="No se encontraron items"
                                            description="Modificá los filtros para ver más resultados."
                                        />
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map(item => {
                                    const ownerName = tenantUsers.find(u => u.uid === item.ownerId)?.displayName || 'Desconocido';
                                    const Icon = TYPE_ICONS[item.type] || Package;
                                    return (
                                        <tr key={item.id} className="hover:bg-ink-50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-primary-500 bg-sky-50 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                                                        <Icon size={16} strokeWidth={1.5} />
                                                    </div>
                                                    <span className="font-medium text-ink-900">{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-ink-700 capitalize">{item.type}</div>
                                                {item.brand && <div className="text-xs text-ink-500">{item.brand}</div>}
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-ink-700">{ownerName}</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <Badge variant={conditionToVariant(item.condition)}>
                                                        {item.condition.replace('_', ' ')}
                                                    </Badge>
                                                    <Badge variant={usageToVariant(item.usage)}>
                                                        {item.usage}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-xs text-ink-500 max-w-xs truncate" title={item.notes}>
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
            </Card>
        </div>
    );
}

// ==========================================
// PESTAÑA 2: Ítems Caballeriza
// ==========================================
function TabPropios({ items, onAdd, onEdit, onDelete }) {
    const conditionToVariant = (condition) => {
        switch (condition) {
            case 'nueva': return 'success';
            case 'usada': return 'primary';
            case 'a_reparar': return 'danger';
            default: return 'neutral';
        }
    };

    const usageToVariant = (usage) => {
        switch (usage) {
            case 'entrenamiento': return 'sky';
            case 'concurso': return 'gold';
            default: return 'neutral';
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-between items-center bg-white border border-ink-200 rounded-xl p-4 shadow-card">
                <span className="text-ink-700 font-medium">Equipos propiedad del Haras / Tenant.</span>
                <button onClick={onAdd} className="btn-primary flex items-center gap-2 text-sm">
                    <Plus size={16} /> Agregar Item
                </button>
            </div>

            {items.length === 0 ? (
                <Card padding="loose">
                    <EmptyState 
                        icon={Package}
                        message="Sin items de caballeriza"
                        description="Agregá el equipamiento propio del haras para llevar un control."
                        action={
                            <button onClick={onAdd} className="btn-primary flex items-center gap-2 text-sm">
                                <Plus size={16} /> Agregar Item
                            </button>
                        }
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map(item => {
                        const Icon = TYPE_ICONS[item.type] || Package;

                        return (
                            <Card key={item.id} variant="hover" padding="normal" className="relative group flex flex-col h-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-primary-500">
                                            <Icon size={20} strokeWidth={1.5} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-ink-800 text-base leading-tight truncate">{item.name}</h3>
                                            <p className="text-xs text-ink-500 capitalize mt-0.5 truncate">{item.type} {item.brand ? `• ${item.brand}` : ''}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                                        <button onClick={() => onEdit(item)} className="p-1.5 text-ink-400 hover:text-ink-700 bg-white hover:bg-ink-50 border border-transparent hover:border-ink-200 rounded-lg transition-colors" title="Editar">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => onDelete(item)} className="p-1.5 text-danger-400 hover:text-danger-700 bg-white hover:bg-danger-50 border border-transparent hover:border-danger-200 rounded-lg transition-colors" title="Eliminar">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge variant={conditionToVariant(item.condition)}>
                                        {item.condition.replace('_', ' ')}
                                    </Badge>
                                    <Badge variant={usageToVariant(item.usage)}>
                                        {item.usage}
                                    </Badge>
                                </div>

                                {item.notes && (
                                    <p className="text-xs text-ink-500 mt-auto line-clamp-2">
                                        {item.notes}
                                    </p>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
