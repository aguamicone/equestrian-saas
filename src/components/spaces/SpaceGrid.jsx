import { useState } from 'react';
import { LayoutGrid, Star, X, User, Calendar, DollarSign, Plus } from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function SpaceGrid() {

    const [selectedSpace, setSelectedSpace] = useState(null);
    const { spaces, horses, assignHorseToSpace, addHorse, finances, addSpace, pricingPlans } = useData();
    const [showAltaForm, setShowAltaForm] = useState(false);

    // New Space Modal State
    const [showNewSpaceModal, setShowNewSpaceModal] = useState(false);
    const [newSpaceName, setNewSpaceName] = useState('');
    const [newSpaceType, setNewSpaceType] = useState('box');
    const [newSpacePrice, setNewSpacePrice] = useState(150000);

    // Form State for Alta
    const [newHorseName, setNewHorseName] = useState('');
    const [newOwnerName, setNewOwnerName] = useState('');
    const [newOwnerEmail, setNewOwnerEmail] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('');

    const handleCreateSpace = (e) => {
        e.preventDefault();
        addSpace({
            name: newSpaceName,
            type: newSpaceType,
            price: Number(newSpacePrice)
        });
        setShowNewSpaceModal(false);
        setNewSpaceName('');
        setNewSpacePrice(150000);
    };

    const handleSpaceClick = (space) => {
        setSelectedSpace(space);
        if (space.status === 'available') {
            setShowAltaForm(true);
        } else {
            setShowAltaForm(false);
        }
    };

    const handleAltaSubmit = (e) => {
        e.preventDefault();
        // 1. Create Horse (and implicity owner if we were doing real relational DB, here just storing OwnerId as string/mock)
        // For prototype, we'll generate a random Owner ID or use the name.
        const ownerId = `user-${newOwnerName.toLowerCase().replace(/\s+/g, '-')}`;

        const horseData = {
            name: newHorseName,
            breed: 'Desconocida', // Simplified for quick entry
            ownerId: ownerId,
            age: 0,
            color: 'Desconocido',
            assignedPlanIds: selectedPlan ? [selectedPlan] : []
        };

        // We need to add horse first, get ID, then assign. 
        // Since addHorse is sync in mock:
        // We'll trust DataContext to handle it, but we need the ID. 
        // Modified DataContext addHorse doesn't return ID easily without refactor.
        // For now, we'll manually generate ID here to ensure we have it.
        const newHorseId = `h${Date.now()}`;

        addHorse({ ...horseData, id: newHorseId }); // Pass ID explicitly if DataContext supports it or just let it overwrite
        assignHorseToSpace(selectedSpace.id, newHorseId);

        closeModal();
    };

    const closeModal = () => {
        setSelectedSpace(null);
        setShowAltaForm(false);
        setNewHorseName('');
        setNewOwnerName('');
        setNewOwnerEmail('');
        setSelectedPlan('');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'available': return 'bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500/20';
            case 'occupied': return 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20';
            case 'maintenance': return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/20';
            default: return 'bg-slate-700 border-slate-600 text-slate-400';
        }
    };

    const getResidentHorse = (space) => horses.find(h => h.id === space.horseId);

    const getOwnerDebt = (ownerId) => {
        return finances
            .filter(f => f.clientId === ownerId && f.status === 'pending')
            .reduce((acc, curr) => acc + curr.amount, 0);
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
                <LayoutGrid className="text-gold-500" /> Vista de Caballerizas
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {spaces.map(space => {
                    const horse = getResidentHorse(space);
                    return (
                        <div
                            key={space.id}
                            onClick={() => handleSpaceClick(space)}
                            className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center aspect-square ${getStatusColor(space.status)} transition-all hover:scale-105 cursor-pointer relative group`}
                        >
                            <div className="text-xl font-bold mb-1">{space.name}</div>
                            <div className="uppercase text-[10px] font-bold tracking-wider opacity-75">{space.type}</div>

                            {space.status === 'occupied' && horse && (
                                <div className="mt-2 flex flex-col items-center text-center">
                                    <span className="text-2xl mb-1">🐴</span>
                                    <span className="font-bold text-sm leading-tight">{horse.name}</span>
                                </div>
                            )}
                            {space.status === 'available' && (
                                <div className="mt-2 text-xs opacity-50 flex flex-col items-center">
                                    <Plus className="opacity-50 group-hover:opacity-100" />
                                    <span>Disponible</span>
                                </div>
                            )}
                            {space.status === 'maintenance' && (
                                <div className="mt-2 text-xs opacity-50">Reparaciones</div>
                            )}
                        </div>
                    );
                })}

                {/* Create Space Tile */}
                <button
                    onClick={() => setShowNewSpaceModal(true)}
                    className="p-4 rounded-lg border-2 border-dashed border-slate-700 flex flex-col items-center justify-center aspect-square text-slate-500 hover:text-white hover:border-slate-500 transition-colors"
                >
                    <Plus size={32} />
                    <span className="font-bold text-sm mt-2">Crear Espacio</span>
                </button>
            </div>

            {/* MODAL */}
            {selectedSpace && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 fade-in">
                    <div className="glass-card border border-slate-700 w-full max-w-md overflow-hidden shadow-2xl">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="text-gold-500">{selectedSpace.name}</span>
                                <span className="text-sm font-normal text-slate-400">({selectedSpace.status === 'available' ? 'Disponible' : 'Ocupado'})</span>
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content: OCCUPIED */}
                        {selectedSpace.status === 'occupied' && (
                            <div className="p-6 space-y-6">
                                {getResidentHorse(selectedSpace) ? (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center text-4xl border-2 border-slate-600">
                                                🐴
                                            </div>
                                            <div>
                                                <h4 className="text-2xl font-bold text-white">{getResidentHorse(selectedSpace).name}</h4>
                                                <p className="text-slate-400">{getResidentHorse(selectedSpace).breed} • {getResidentHorse(selectedSpace).age} años</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                                            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                                                <span className="text-slate-400 flex items-center gap-2"><User size={16} /> Dueño</span>
                                                <span className="text-slate-200 font-medium">{getResidentHorse(selectedSpace).ownerId}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                                                <span className="text-slate-400 flex items-center gap-2"><Calendar size={16} /> Ingreso</span>
                                                <span className="text-slate-200">01/03/2024</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-slate-400 flex items-center gap-2"><DollarSign size={16} /> Estado</span>
                                                {getOwnerDebt(getResidentHorse(selectedSpace).ownerId) > 0 ? (
                                                    <span className="text-red-400 font-bold bg-red-900/20 px-2 py-1 rounded">
                                                        Deuda: ${getOwnerDebt(getResidentHorse(selectedSpace).ownerId).toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-green-400 font-bold bg-green-900/20 px-2 py-1 rounded">Al Día</span>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center text-slate-500 py-8">
                                        Error: Caballo no encontrado datos.
                                    </div>
                                )}
                                <div className="flex justify-end">
                                    <button className="text-red-400 hover:text-red-300 text-sm">Liberar Espacio (Desasignar)</button>
                                </div>
                            </div>
                        )}

                        {/* Content: AVAILABLE (ALTA) */}
                        {selectedSpace.status === 'available' && (
                            <form onSubmit={handleAltaSubmit} className="p-6 space-y-4">
                                <div className="text-center mb-4">
                                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto mb-2 border border-green-500/30">
                                        <Plus size={32} />
                                    </div>
                                    <h4 className="text-lg font-bold text-white">Dar de Alta Nuevo Ingreso</h4>
                                    <p className="text-sm text-slate-400">Registra un caballo y asígnalo a este box.</p>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Nombre del Caballo</label>
                                    <input
                                        className="input-field"
                                        placeholder="Ej: Trueno"
                                        required
                                        value={newHorseName}
                                        onChange={e => setNewHorseName(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Nombre Dueño (Cliente)</label>
                                        <input
                                            className="input-field"
                                            placeholder="Ej: Mario Lopez"
                                            required
                                            value={newOwnerName}
                                            onChange={e => setNewOwnerName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Email Dueño</label>
                                        <input
                                            type="email"
                                            className="input-field"
                                            placeholder="cliente@email.com"
                                            value={newOwnerEmail}
                                            onChange={e => setNewOwnerEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Plan de Pensión</label>
                                    <select
                                        className="input-field"
                                        value={selectedPlan}
                                        onChange={e => setSelectedPlan(e.target.value)}
                                        required
                                    >
                                        <option value="">Seleccionar Plan...</option>
                                        {pricingPlans
                                            .filter(p => p.type === 'membership')
                                            .map(plan => (
                                                <option key={plan.id} value={plan.id}>
                                                    {plan.name} - ${plan.price.toLocaleString()}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button type="button" onClick={closeModal} className="flex-1 py-3 text-slate-400 hover:text-white font-semibold">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="flex-1 btn-primary py-3">
                                        Confirmar Alta
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* NEW SPACE MODAL */}
            {showNewSpaceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-card border border-slate-700 w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-white">Crear Nuevo Espacio</h3>
                            <button onClick={() => setShowNewSpaceModal(false)}><X className="text-slate-400 hover:text-white" /></button>
                        </div>
                        <form onSubmit={handleCreateSpace} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Nombre / Identificador</label>
                                <input
                                    className="input-field"
                                    placeholder="Ej: Box 12"
                                    required
                                    value={newSpaceName}
                                    onChange={e => setNewSpaceName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Tipo</label>
                                <select className="input-field" value={newSpaceType} onChange={e => setNewSpaceType(e.target.value)}>
                                    <option value="box">Box (Interior)</option>
                                    <option value="corral">Corral (Exterior)</option>
                                    <option value="paddock">Paddock</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Precio Base</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                                    <input
                                        type="number"
                                        className="input-field pl-8"
                                        value={newSpacePrice}
                                        onChange={e => setNewSpacePrice(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowNewSpaceModal(false)} className="btn-secondary flex-1">Cancelar</button>
                                <button type="submit" className="btn-primary flex-1">Crear</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
