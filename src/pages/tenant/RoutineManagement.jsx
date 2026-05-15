import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Trash2, User } from 'lucide-react';
import { USERS } from '../../services/mockFirebase';

export default function RoutineManagement() {
    const { routines, addRoutine } = useData();
    const [showForm, setShowForm] = useState(false);

    // Form
    const [name, setName] = useState('');
    const [time, setTime] = useState('');
    const [assignedTo, setAssignedTo] = useState('');

    // Filter staff members
    const staffMembers = USERS.filter(u => u.role === 'staff');

    const handleSubmit = (e) => {
        e.preventDefault();
        const assignee = staffMembers.find(s => s.uid === assignedTo);

        addRoutine({
            name,
            time,
            frequency: 'Diario', // Default for now
            assigneeId: assignedTo,
            assigneeName: assignee ? assignee.displayName : 'Sin Asignar'
        });

        setName('');
        setTime('');
        setAssignedTo('');
        setShowForm(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-100">Gestión de Rutinas</h2>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
                    <Plus size={18} /> Nueva Rutina
                </button>
            </div>

            {showForm && (
                <div className="glass-card p-6 rounded-lg border border-slate-700 mb-6 animate-in fade-in zoom-in duration-300">
                    <h3 className="text-lg font-bold text-white mb-4">Crear Tarea Recurrente</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm text-slate-400 mb-1">Nombre de la Tarea</label>
                            <input className="input-field" placeholder="Ej: Limpieza Boxes Fila 1" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Horario Sugerido</label>
                            <input type="time" className="input-field" value={time} onChange={e => setTime(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Asignar a Personal</label>
                            <select
                                className="input-field"
                                value={assignedTo}
                                onChange={e => setAssignedTo(e.target.value)}
                            >
                                <option value="">-- Cualquiera --</option>
                                {staffMembers.map(staff => (
                                    <option key={staff.uid} value={staff.uid}>{staff.displayName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
                            <button type="submit" className="btn-primary">Guardar Rutina</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-700/50 text-slate-400">
                        <tr>
                            <th className="p-4">Rutina</th>
                            <th className="p-4">Frecuencia</th>
                            <th className="p-4">Horario</th>
                            <th className="p-4">Asignado a</th>
                            <th className="p-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700 text-slate-200">
                        {routines.map(r => (
                            <tr key={r.id} className="hover:bg-slate-700/30">
                                <td className="p-4 font-bold">{r.name}</td>
                                <td className="p-4 text-sm bg-slate-800"><span className="px-2 py-1 rounded bg-slate-700 text-xs">Diario</span></td>
                                <td className="p-4 text-sm font-mono">{r.time}</td>
                                <td className="p-4 text-sm text-slate-300">
                                    {r.assigneeName ? (
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-gold-500" /> {r.assigneeName}
                                        </div>
                                    ) : (
                                        <span className="text-slate-500 italic">General</span>
                                    )}
                                </td>
                                <td className="p-4 text-right text-slate-500">
                                    <button className="hover:text-red-400"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                        {routines.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500">No hay rutinas definidas.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
