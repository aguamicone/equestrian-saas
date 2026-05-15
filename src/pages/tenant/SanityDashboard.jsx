import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Syringe, Calendar, Search } from 'lucide-react';

export default function SanityDashboard() {
    const { horses } = useData();
    const [searchTerm, setSearchTerm] = useState('');

    // Mock Sanity Data aggregation (In real app, query 'health_records' collection)
    // We simulate that each horse has a status.
    const sanityData = horses.map(h => ({
        ...h,
        lastVetValues: '2024-02-15',
        nextDue: '2024-08-15',
        status: Math.random() > 0.3 ? 'ok' : 'warning',
        vaccines: ['Influenza', 'Tétanos']
    }));

    const filtered = sanityData.filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                <Syringe className="text-blue-400" /> Control Sanitario
            </h2>

            {/* Search */}
            <div className="relative mb-6 max-w-md">
                <Search className="absolute left-3 top-2.5 text-slate-500" size={20} />
                <input
                    className="input-field pl-10"
                    placeholder="Buscar caballo..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="glass-card border border-slate-700 overflow-hidden">
                <table className="w-full text-left bg-slate-800">
                    <thead className="bg-slate-700/50 text-slate-400">
                        <tr>
                            <th className="p-4">Caballo</th>
                            <th className="p-4 hidden md:table-cell">Última Visita</th>
                            <th className="p-4">Próxima</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {filtered.map(h => (
                            <tr key={h.id} className="hover:bg-slate-700/30">
                                <td className="p-4 font-bold text-slate-200">
                                    {h.name}
                                    <div className="text-xs text-slate-500 font-normal md:hidden">Vence: {h.nextDue}</div>
                                </td>
                                <td className="p-4 text-slate-400 hidden md:table-cell">{h.lastVetValues}</td>
                                <td className="p-4 text-slate-300">{h.nextDue}</td>
                                <td className="p-4">
                                    {h.status === 'ok' ? (
                                        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-bold">Al Día</span>
                                    ) : (
                                        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs font-bold animate-pulse">Vencido</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <button className="text-blue-400 hover:text-white text-sm">Registrar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
