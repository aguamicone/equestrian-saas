
import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Search, Plus, DollarSign, MapPin } from 'lucide-react';

export default function HorseManagement() {
    const { horses, addHorse, updateRow, finances, pricingPlans } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    // Form State
    const [editingHorse, setEditingHorse] = useState(null);
    const [newName, setNewName] = useState('');
    const [newBreed, setNewBreed] = useState('');
    const [selectedPlanIds, setSelectedPlanIds] = useState([]);

    const filteredHorses = horses.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.breed.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const togglePlan = (planId) => {
        setSelectedPlanIds(prev =>
            prev.includes(planId)
                ? prev.filter(id => id !== planId)
                : [...prev, planId]
        );
    };

    const handleEditClick = (horse) => {
        setEditingHorse(horse);
        setNewName(horse.name);
        setNewBreed(horse.breed);
        setSelectedPlanIds(horse.assignedPlanIds || []);
        setShowAddForm(true);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const horseData = {
            name: newName,
            breed: newBreed,
            assignedPlanIds: selectedPlanIds,
            // Preserve existing data if editing, else defaults
            ownerId: editingHorse?.ownerId || 'user-client-1',
            age: editingHorse?.age || 5,
            color: editingHorse?.color || 'Desconocido',
            photo: editingHorse?.photo
        };

        if (editingHorse) {
            updateRow('HORSES', editingHorse.id, horseData);
        } else {
            addHorse(horseData);
        }

        resetForm();
    };

    const resetForm = () => {
        setNewName('');
        setNewBreed('');
        setSelectedPlanIds([]);
        setEditingHorse(null);
        setShowAddForm(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-100">Gestión de Caballos</h2>
                <button
                    onClick={() => { resetForm(); setShowAddForm(!showAddForm); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={18} /> {showAddForm ? 'Cancelar' : 'Agregar'}
                </button>
            </div>

            {showAddForm && (
                <div className="glass-card p-6 mb-6 animate-in slide-in-from-top-4 duration-300">
                    <h3 className="text-lg font-bold text-white mb-4">{editingHorse ? 'Editar Caballo' : 'Registrar Nuevo Caballo'}</h3>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                className="input-field"
                                placeholder="Nombre del Caballo"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                required
                            />
                            <input
                                className="input-field"
                                placeholder="Raza"
                                value={newBreed}
                                onChange={e => setNewBreed(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-sm mb-2">Membresías y Servicios Asignados</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {pricingPlans.filter(p => p.frequency === 'monthly').map(plan => (
                                    <div key={plan.id} className="flex items-center gap-2 bg-slate-900 p-3 rounded border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => togglePlan(plan.id)}>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedPlanIds.includes(plan.id) ? 'bg-gold-500 border-gold-500 text-black' : 'border-slate-500'}`}>
                                            {selectedPlanIds.includes(plan.id) && <Plus size={14} />}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{plan.name}</div>
                                            <div className="text-xs text-slate-400 font-mono">${plan.price.toLocaleString()} / mes</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>
                            <button type="submit" className="btn-primary">{editingHorse ? 'Guardar Cambios' : 'Registrar'}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                <input
                    className="input-field pl-10"
                    placeholder="Buscar por nombre o raza..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="glass-card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-700/50 text-slate-400">
                        <tr>
                            <th className="p-4">Nombre</th>
                            <th className="p-4">Raza</th>
                            <th className="p-4">Plan Actual</th>
                            <th className="p-4">Costo Mensual</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700 text-slate-200">
                        {filteredHorses.map(horse => {
                            // Calculate Debt
                            const ownerDebt = finances
                                .filter(f => f.clientId === horse.ownerId && f.status === 'pending')
                                .reduce((acc, curr) => acc + curr.amount, 0);

                            // Calculate Monthly Cost
                            const activePlans = pricingPlans.filter(p => horse.assignedPlanIds?.includes(p.id));
                            const monthlyCost = activePlans.reduce((acc, curr) => acc + curr.price, 0);

                            return (
                                <tr key={horse.id} className="hover:bg-slate-700/30">
                                    <td className="p-4">
                                        <div className="font-bold">{horse.name}</div>
                                        <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 mt-1">
                                            <MapPin size={10} className={horse.location === 'piquete' ? 'text-green-400' : horse.location === 'circular' ? 'text-orange-400' : 'text-slate-500'}/>
                                            {(!horse.location || horse.location === 'box') ? 'Box' : horse.location}
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-400">{horse.breed}</td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {activePlans.map(p => (
                                                <span key={p.id} className="text-xs bg-slate-900 px-2 py-1 rounded border border-slate-600">
                                                    {p.name}
                                                </span>
                                            ))}
                                            {activePlans.length === 0 && <span className="text-slate-600 italic text-sm">Sin plan asignado</span>}
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-gold-400">
                                        ${monthlyCost.toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        {ownerDebt > 0 ? (
                                            <span className="inline-flex items-center gap-1 text-red-400 font-bold bg-red-900/30 px-2 py-1 rounded-full text-xs">
                                                <DollarSign size={12} /> Deuda
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-green-400 font-bold bg-green-900/30 px-2 py-1 rounded-full text-xs">
                                                Al Día
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleEditClick(horse)}
                                            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-600 rounded"
                                            title="Editar Caballo y Membresía"
                                        >
                                            <span className="text-xs font-bold underline">Editar</span>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
