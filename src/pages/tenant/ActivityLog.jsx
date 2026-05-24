import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Search, Activity, User, Calendar, List } from 'lucide-react';
import { Card, EmptyState, PageHeader, Badge } from '../../components/ui';

export default function ActivityLog() {
    const { logs, horses } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    // Helper to get horse name
    const getHorseName = (horseId) => {
        const h = horses.find(h => h.id === horseId);
        return h ? h.name : '-';
    };

    const logTypeToVariant = (type) => {
        const t = (type || '').toLowerCase();
        if (t.includes('request')) return 'success';
        if (t.includes('routine')) return 'primary';
        if (t.includes('finance')) return 'gold';
        return 'default'; // 'system' or others
    };

    const logTypeToLabel = (type) => {
        const t = (type || '').toLowerCase();
        if (t.includes('request_completion')) return 'Solicitud Completada';
        if (t.includes('request_derivation')) return 'Solicitud Derivada';
        if (t.includes('request')) return 'Solicitud';
        if (t.includes('routine')) return 'Rutina';
        if (t.includes('finance')) return 'Finanzas';
        if (t.includes('system')) return 'Sistema';
        return type || 'General';
    };

    // Filter Logic
    const filteredLogs = logs.filter(log => {
        const details = log.details || '';
        const staffName = log.staffName || log.userName || 'Sistema';
        const type = log.type || '';
        
        const matchesSearch = details.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staffName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' ? true : type.includes(filterType);
        
        return matchesSearch && matchesType;
    }).sort((a, b) => {
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp || 0);
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp || 0);
        return dateB - dateA;
    });

    return (
        <div className="pb-20">
            <PageHeader 
                kicker="Administración"
                title="Registro de Actividad"
                subtitle="Auditoría y trazabilidad del sistema"
            />

            {/* Filters */}
            <Card className="p-4 mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3.5 text-ink-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por detalle o usuario..."
                        className="w-full pl-10 pr-4 py-3 bg-ink-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="w-full md:w-64 px-4 py-3 bg-ink-50 border border-ink-200 rounded-xl text-sm font-medium text-ink-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer"
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                >
                    <option value="all">Todos los Tipos</option>
                    <option value="routine">Rutinas</option>
                    <option value="request">Solicitudes</option>
                    <option value="finance">Finanzas</option>
                    <option value="system">Sistema</option>
                </select>
            </Card>

            {/* Logs List */}
            <Card className="overflow-hidden border-ink-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-ink-600">
                        <thead className="bg-ink-50 text-ink-500 uppercase font-bold text-[11px] tracking-wider border-b border-ink-200">
                            <tr>
                                <th className="p-4 whitespace-nowrap">Fecha / Hora</th>
                                <th className="p-4 whitespace-nowrap">Usuario</th>
                                <th className="p-4">Acción</th>
                                <th className="p-4 whitespace-nowrap">Caballo rel.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-100">
                            {filteredLogs.map(log => {
                                const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp || Date.now());
                                return (
                                <tr key={log.id} className="hover:bg-ink-50/50 transition-colors">
                                    <td className="p-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-ink-700">
                                            <Calendar size={14} className="text-ink-400" />
                                            {logDate.toLocaleDateString()}
                                            <span className="text-[11px] text-ink-500 ml-1 font-medium bg-ink-100 px-1.5 py-0.5 rounded">
                                                {logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-ink-800 font-medium">
                                            <div className="p-1.5 bg-ink-100 rounded-full text-ink-500"><User size={12} /></div>
                                            {log.staffName || log.userName || 'Sistema'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-ink-800 font-medium mb-1.5 leading-snug">{log.details || '-'}</div>
                                        <Badge variant={logTypeToVariant(log.type)} size="sm">
                                            {logTypeToLabel(log.type)}
                                        </Badge>
                                    </td>
                                    <td className="p-4">
                                        {log.horseId ? (
                                            <span className="inline-flex items-center px-2.5 py-1 bg-white border border-ink-200 rounded-lg text-xs font-semibold text-ink-700 shadow-sm">
                                                {getHorseName(log.horseId)}
                                            </span>
                                        ) : (
                                            <span className="text-ink-300">-</span>
                                        )}
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                {filteredLogs.length === 0 && (
                    <div className="p-8">
                        <EmptyState 
                            icon={List}
                            title="Sin resultados"
                            description="No se encontraron registros de actividad con los filtros actuales."
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}
