import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Search, Plus, MoreVertical, LayoutList } from 'lucide-react';
import { PageHeader, Card, DataTable, Badge, EmptyState } from '../../components/ui';
import HorseDetailModal from '../../components/horses/modals/HorseDetailModal';
import HorseActionsMenu from '../../components/horses/modals/HorseActionsMenu';
import GestionarPlanesModal from '../../components/horses/modals/GestionarPlanesModal';
import AltaClienteCaballoModal from '../../components/users/modals/AltaClienteCaballoModal';

export default function HorseManagement() {
    const { horses, finances, pricingPlans, spaces, tenantUsers, archiveHorse, updateHorseStatus } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBy, setFilterBy] = useState('active'); // 'active' | 'all' | 'archived' | 'no-plan' | 'debt'
    const [selectedHorse, setSelectedHorse] = useState(null);
    const [showAltaClienteCaballo, setShowAltaClienteCaballo] = useState(false);

    // States for contextual menu positioning and target horse
    const [anchorRect, setAnchorRect] = useState(null);
    const [menuHorse, setMenuHorse] = useState(null);
    
    // Tanda D2: integración del GestionarPlanesModal
    const [gestionarPlanesHorse, setGestionarPlanesHorse] = useState(null);

    // O(1) Maps
    const usersById = useMemo(() => {
        const map = {};
        (tenantUsers || []).forEach(u => {
            map[u.uid || u.id] = u;
        });
        return map;
    }, [tenantUsers]);

    const horseDebtMap = useMemo(() => {
        const map = {};
        (finances || []).forEach(f => {
            if ((f.status === 'pending' || f.status === 'overdue') && f.horseId) {
                map[f.horseId] = true;
            }
        });
        return map;
    }, [finances]);

    const spaceByHorseId = useMemo(() => {
        const map = {};
        (spaces || []).forEach(s => {
            if (s.horseId) map[s.horseId] = s;
        });
        return map;
    }, [spaces]);

    // Derived lists and stats
    const stats = useMemo(() => {
        let total = 0;
        let active = 0;
        let archived = 0;
        let noPlan = 0;
        let withDebt = 0;

        horses.forEach(horse => {
            total++;
            const isArchived = horse.archived === true;
            if (isArchived) archived++; else active++;
            if (!isArchived) {
                if (!horse.assignedPlanIds || horse.assignedPlanIds.length === 0) noPlan++;
                if (horseDebtMap[horse.id]) withDebt++;
            }
        });

        return { total, active, archived, noPlan, withDebt };
    }, [horses, horseDebtMap]);

    // Filtering
    const filteredHorses = useMemo(() => {
        let result = horses;

        // 1. Chip filter
        if (filterBy === 'active') result = result.filter(h => h.archived !== true);
        else if (filterBy === 'archived') result = result.filter(h => h.archived === true);
        else if (filterBy === 'no-plan') result = result.filter(h => h.archived !== true && (!h.assignedPlanIds || h.assignedPlanIds.length === 0));
        else if (filterBy === 'debt') result = result.filter(h => h.archived !== true && horseDebtMap[h.id]);

        // 2. Search
        if (searchTerm.trim()) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(h => {
                const nameMatch = h.name.toLowerCase().includes(lowerSearch);
                const ownerName = usersById[h.ownerId]?.displayName || '';
                const ownerMatch = ownerName.toLowerCase().includes(lowerSearch);
                return nameMatch || ownerMatch;
            });
        }

        return result;
    }, [horses, filterBy, searchTerm, usersById, horseDebtMap]);

    // Action handlers
    const handleAddHorse = () => setShowAltaClienteCaballo(true);
    
    const handleMenuClick = (e, horse) => {
        e.stopPropagation();
        if (e.currentTarget) {
            setAnchorRect(e.currentTarget.getBoundingClientRect());
            setMenuHorse(horse);
        }
    };

    const handleCloseMenu = () => {
        setAnchorRect(null);
        setMenuHorse(null);
    };

    const handleSelectArchive = async () => {
        const horse = menuHorse;
        handleCloseMenu();
        if (!horse) return;
        if (window.confirm(`¿Seguro querés archivar a ${horse.name}?`)) {
            await archiveHorse(horse.id, true);
        }
    };

    const handleSelectUnarchive = async () => {
        const horse = menuHorse;
        handleCloseMenu();
        if (!horse) return;
        await archiveHorse(horse.id, false);
    };

    const handleSelectMaintenance = async () => {
        const horse = menuHorse;
        handleCloseMenu();
        if (!horse) return;
        await updateHorseStatus(horse.id, 'mantenimiento');
    };

    const handleSelectActive = async () => {
        const horse = menuHorse;
        handleCloseMenu();
        if (!horse) return;
        await updateHorseStatus(horse.id, 'activo');
    };

    const handleRowClick = (horse) => setSelectedHorse(horse);

    // Columns
    const columns = [
        {
            key: 'horse',
            header: 'Caballo',
            render: (horse) => (
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-ink-800">{horse.name}</span>
                        {horse.status === 'mantenimiento' && (
                            <Badge variant="warning" size="xs">Mantenimiento</Badge>
                        )}
                    </div>
                    {horse.breed && <div className="text-xs text-ink-500 mt-0.5">{horse.breed}</div>}
                </div>
            )
        },
        {
            key: 'owner',
            header: 'Dueño',
            render: (horse) => {
                const owner = usersById[horse.ownerId];
                return owner 
                    ? <span className="text-ink-700">{owner.displayName}</span>
                    : <span className="text-ink-400 italic">Sin dueño</span>;
            }
        },
        {
            key: 'location',
            header: 'Ubicación',
            render: (horse) => {
                const space = spaceByHorseId[horse.id];
                return space 
                    ? <span className="text-ink-700">{space.name}</span>
                    : <span className="text-ink-400 italic">Sin asignar</span>;
            }
        },
        {
            key: 'plan',
            header: 'Plan',
            render: (horse) => {
                const horsePlanIds = horse.assignedPlanIds || [];
                if (horsePlanIds.length === 0) {
                    return <Badge variant="neutral" size="sm">Sin plan</Badge>;
                }
                const activePlans = pricingPlans.filter(p => horsePlanIds.includes(p.id));
                if (activePlans.length === 0) {
                    return <Badge variant="neutral" size="sm">Sin plan</Badge>;
                }
                const totalCost = activePlans.reduce((sum, p) => sum + Number(p.price || 0), 0);
                
                return (
                    <div className="flex flex-col gap-0.5 items-start">
                        {activePlans.map(p => (
                            <span key={p.id} className="text-sm text-ink-700 font-medium">{p.name}</span>
                        ))}
                        <span className="text-xs font-mono text-ink-500">${totalCost.toLocaleString()}</span>
                    </div>
                );
            }
        },
        {
            key: 'payment',
            header: 'Estado pago',
            render: (horse) => {
                const hasDebt = horseDebtMap[horse.id];
                return hasDebt 
                    ? <Badge variant="danger" size="sm">Con deuda</Badge>
                    : <Badge variant="success" size="sm">Al día</Badge>;
            }
        },
        {
            key: 'status',
            header: 'Estado',
            render: (horse) => {
                if (horse.archived === true) {
                    return <Badge variant="neutral" size="sm">Archivado</Badge>;
                }
                if (horse.status === 'mantenimiento') {
                    return <Badge variant="warning" size="sm">Mantenimiento</Badge>;
                }
                return <Badge variant="success" size="sm">Activo</Badge>;
            }
        },
        {
            key: 'actions',
            header: '',
            align: 'right',
            render: (horse) => (
                <div className="flex justify-end">
                    <button 
                        onClick={(e) => handleMenuClick(e, horse)}
                        className="p-1.5 rounded-md text-ink-400 hover:text-ink-600 hover:bg-surface-200 transition-colors"
                        title="Opciones"
                    >
                        <MoreVertical size={16} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <>
        <div className="space-y-6">
            <PageHeader 
                kicker="Gestión"
                title="Caballos"
                subtitle={`${stats.total} caballos · ${stats.active} activos`}
                action={{
                    label: "Nuevo caballo",
                    icon: Plus,
                    onClick: handleAddHorse
                }}
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card variant="default" padding="sm" className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-primary-600 uppercase tracking-wider">Total</span>
                    <span className="text-2xl font-display font-medium text-ink-900">{stats.total}</span>
                </Card>
                <Card variant="default" padding="sm" className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-success-600 uppercase tracking-wider">Activos</span>
                    <span className="text-2xl font-display font-medium text-ink-900">{stats.active}</span>
                </Card>
                <Card variant="default" padding="sm" className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-ink-500 uppercase tracking-wider">Sin plan</span>
                    <span className="text-2xl font-display font-medium text-ink-900">{stats.noPlan}</span>
                </Card>
                <Card variant="default" padding="sm" className="flex flex-col gap-1">
                    <span className={`text-xs font-medium uppercase tracking-wider ${stats.withDebt > 0 ? 'text-danger-600' : 'text-ink-500'}`}>Con deuda</span>
                    <span className={`text-2xl font-display font-medium ${stats.withDebt > 0 ? 'text-danger-600' : 'text-ink-900'}`}>{stats.withDebt}</span>
                </Card>
            </div>

            {/* Tabs / Filters & Search */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <button 
                        onClick={() => setFilterBy('all')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterBy === 'all' ? 'bg-primary-600 text-white' : 'bg-surface-200 text-ink-600 hover:bg-surface-300'}`}
                    >
                        Todos <span className="opacity-70 ml-1">{stats.total}</span>
                    </button>
                    <button 
                        onClick={() => setFilterBy('active')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterBy === 'active' ? 'bg-primary-600 text-white' : 'bg-surface-200 text-ink-600 hover:bg-surface-300'}`}
                    >
                        Activos <span className="opacity-70 ml-1">{stats.active}</span>
                    </button>
                    <button 
                        onClick={() => setFilterBy('archived')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterBy === 'archived' ? 'bg-primary-600 text-white' : 'bg-surface-200 text-ink-600 hover:bg-surface-300'}`}
                    >
                        Archivados <span className="opacity-70 ml-1">{stats.archived}</span>
                    </button>
                    <button 
                        onClick={() => setFilterBy('no-plan')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterBy === 'no-plan' ? 'bg-primary-600 text-white' : 'bg-surface-200 text-ink-600 hover:bg-surface-300'}`}
                    >
                        Sin plan <span className="opacity-70 ml-1">{stats.noPlan}</span>
                    </button>
                    <button 
                        onClick={() => setFilterBy('debt')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filterBy === 'debt' ? 'bg-primary-600 text-white' : 'bg-surface-200 text-ink-600 hover:bg-surface-300'}`}
                    >
                        Con deuda <span className="opacity-70 ml-1">{stats.withDebt}</span>
                    </button>
                </div>

                <div className="relative w-full lg:w-72">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input 
                        type="text"
                        placeholder="Buscar caballo o dueño..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-surface-300 rounded-lg text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-shadow"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            {filteredHorses.length > 0 ? (
                <div className="bg-white border border-surface-200 rounded-xl overflow-hidden shadow-sm">
                    <DataTable 
                        data={filteredHorses}
                        columns={columns}
                        onRowClick={handleRowClick}
                        getRowClassName={(row) => row.archived ? 'opacity-60 bg-surface-50' : ''}
                        className="w-full"
                    />
                </div>
            ) : (
                <EmptyState 
                    icon={LayoutList}
                    title="No se encontraron caballos"
                    description={
                        searchTerm 
                            ? "No hay resultados para la búsqueda actual."
                            : "No hay caballos que coincidan con este filtro."
                    }
                />
            )}
        </div>

            {/* Modal de detalle del caballo */}
            {selectedHorse && (
                <HorseDetailModal
                    horse={selectedHorse}
                    onClose={() => setSelectedHorse(null)}
                />
            )}

            {/* Menú de acciones contextuales */}
            {anchorRect && menuHorse && (
                <HorseActionsMenu
                    horse={menuHorse}
                    anchorRect={anchorRect}
                    onClose={handleCloseMenu}
                    onSelectArchive={handleSelectArchive}
                    onSelectUnarchive={handleSelectUnarchive}
                    onSelectMaintenance={handleSelectMaintenance}
                    onSelectActive={handleSelectActive}
                    onOpenGestionarPlanes={(horse) => {
                        handleCloseMenu();
                        setGestionarPlanesHorse(horse);
                    }}
                />
            )}

            {gestionarPlanesHorse && (
                <GestionarPlanesModal
                    isOpen={!!gestionarPlanesHorse}
                    onClose={() => setGestionarPlanesHorse(null)}
                    horse={gestionarPlanesHorse}
                />
            )}

            {/* Nuevo Cliente + Caballos Modal */}
            {showAltaClienteCaballo && (
                <AltaClienteCaballoModal
                    isOpen={showAltaClienteCaballo}
                    onClose={() => setShowAltaClienteCaballo(false)}
                />
            )}
        </>
    );
}
