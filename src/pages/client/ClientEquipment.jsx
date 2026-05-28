import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Pencil, Trash2, Box, Link2, GitCommitVertical, Shield, ShieldHalf, HardHat, Disc, CircleDot, Package } from 'lucide-react';
import { Card, Badge, EmptyState, PageHeader, ConfirmDeleteModal } from '../../components/ui';
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
    const { getMyEquipmentItems, deleteEquipmentItem, horses } = useData();
    const items = getMyEquipmentItems();

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
        <div>
            <PageHeader 
                title="Mis Equipos" 
                actions={
                    <button onClick={handleAdd} className="btn-primary flex items-center gap-2 text-sm">
                        <Plus size={16} /> Agregar Item
                    </button>
                }
            />

            {items.length === 0 ? (
                <Card padding="loose" className="mt-6">
                    <EmptyState 
                        icon={Package}
                        message="No tenés items cargados"
                        description="Click en Agregar Item para empezar a gestionar tu equipamiento."
                        action={
                            <button onClick={handleAdd} className="btn-primary flex items-center gap-2 text-sm">
                                <Plus size={16} /> Agregar Item
                            </button>
                        }
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                                        <button onClick={() => handleEdit(item)} className="p-1.5 text-ink-400 hover:text-ink-700 bg-white hover:bg-ink-50 rounded transition-colors" title="Editar">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => setItemToDelete(item)} className="p-1.5 text-danger-400 hover:text-danger-700 bg-white hover:bg-danger-50 rounded transition-colors" title="Eliminar">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                {item.horseId && (
                                    <div className="bg-primary-50 text-primary-700 text-xs font-bold px-2 py-1 rounded-md mb-3 flex items-center gap-1 w-max border border-primary-100">
                                        🐴 Para: {(horses || []).find(h => h.id === item.horseId)?.name || 'Caballo Desconocido'}
                                    </div>
                                )}

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

            <EquipmentItemModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                item={selectedItem}
            />

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
