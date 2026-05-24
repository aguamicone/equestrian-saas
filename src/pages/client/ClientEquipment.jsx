import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Pencil, Trash2, Box, Link2, GitCommitVertical, Shield, ShieldHalf, HardHat, Disc, CircleDot, Package } from 'lucide-react';
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

export default function ClientEquipment() {
    const { getMyEquipmentItems, deleteEquipmentItem } = useData();
    const items = getMyEquipmentItems();

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
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-100">Mis Equipos</h2>
                <button onClick={handleAdd} className="btn-primary flex items-center gap-2 text-sm">
                    <Plus size={16} /> Agregar Item
                </button>
            </div>

            {items.length === 0 ? (
                <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
                    <Package size={48} className="text-slate-600 mb-4" />
                    <h3 className="text-lg font-bold text-slate-300 mb-2">No tenés items cargados</h3>
                    <p className="text-slate-500 text-sm max-w-sm">
                        Click en Agregar Item para empezar a gestionar tu equipamiento.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map(item => {
                        const Icon = TYPE_ICONS[item.type] || Package;
                        
                        // Condition styling
                        let conditionStyle = "bg-slate-500/20 text-slate-300 border-slate-500/30";
                        if (item.condition === 'nueva') conditionStyle = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                        if (item.condition === 'usada') conditionStyle = "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
                        if (item.condition === 'a_reparar') conditionStyle = "bg-red-500/20 text-red-300 border-red-500/30";

                        // Usage styling
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
                                        <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-600 rounded">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => setItemToDelete(item)} className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded">
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

            <EquipmentItemModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                item={selectedItem}
            />

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
