import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Search, Filter, Activity, User, Calendar } from 'lucide-react';

export default function ActivityLog() {
    const { logs, horses } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    // Helper to get horse name
    const getHorseName = (horseId) => {
        const h = horses.find(h => h.id === horseId);
        return h ? h.name : '-';
    };

    // Filter Logic
    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.staffName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' ? true : log.type.includes(filterType);

        return matchesSearch && matchesType;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return (
        <div className="pb-20">
            <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                <Activity className="text-gold-500" /> Registro de Actividad
            </h2>

            {/* Filters */}
            <div className="glass-card p-4 mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por detalle o usuario..."
                        className="input-field pl-10"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="input-field md:w-48"
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                >
                    <option value="all">Todos los Tipos</option>
                    <option value="routine">Rutinas</option>
                    <option value="request">Solicitudes</option>
                    <option value="finance">Finanzas</option>
                    <option value="system">Sistema</option>
                </select>
            </div>

            {/* Logs List */}
            <div className="glass-card border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-900/50 text-slate-200 uppercase font-bold text-xs">
                            <tr>
                                <th className="p-4">Fecha / Hora</th>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">Acción</th>
                                <th className="p-4">Caballo rel.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-700/50 transition-colors">
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-slate-300">
                                            <Calendar size={14} className="text-slate-500" />
                                            {new Date(log.timestamp).toLocaleDateString()}
                                            <span className="text-xs text-slate-500 ml-1">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-slate-200 font-medium">
                                            <div className="p-1 bg-slate-700 rounded-full"><User size={12} /></div>
                                            {log.staffName}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-slate-300">{log.details}</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{log.type}</div>
                                    </td>
                                    <td className="p-4 text-slate-300">
                                        {log.horseId ? (
                                            <span className="px-2 py-1 bg-slate-700 rounded-md text-xs border border-slate-600">
                                                {getHorseName(log.horseId)}
                                            </span>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-500">
                                        No se encontraron registros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
