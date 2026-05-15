import { Users, DollarSign, Activity, PieChart } from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function TenantAdminDashboard() {
    const { spaces, horses, shifts, tenantUsers } = useData();

    // Stats
    const totalSpaces = spaces.length;
    const occupiedSpaces = spaces.filter(s => s.status === 'occupied').length;
    const occupancyRate = totalSpaces > 0 ? Math.round((occupiedSpaces / totalSpaces) * 100) : 0;

    // Active Staff Calculation
    const now = new Date();
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const currentDay = days[now.getDay()];
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    const activeShifts = shifts.filter(s =>
        s.day === currentDay &&
        s.start <= currentTime &&
        s.end >= currentTime
    );

    // Get unique active staff members
    const activeStaffIds = [...new Set(activeShifts.map(s => s.staffId))];
    const activeStaffMembers = tenantUsers.filter(u => activeStaffIds.includes(u.uid));

    return (
        <div>
            <h2 className="text-3xl font-bold text-slate-100 mb-6">Gestión de Caballeriza</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6 rounded-lg border border-slate-700 shadow flex items-center gap-4">
                    <div className="p-4 rounded-full bg-orange-500/10 text-orange-400">
                        <span className="text-2xl">🐴</span>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{horses.length}</div>
                        <div className="text-sm text-slate-400">Caballos</div>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-lg border border-slate-700 shadow flex items-center gap-4">
                    <div className="p-4 rounded-full bg-teal-500/10 text-teal-400">
                        <Users size={32} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">{activeStaffMembers.length}</div>
                        <div className="text-sm text-slate-400">Staff Activo ({currentDay})</div>
                        <div className="text-xs text-slate-500 mt-1 truncate max-w-[150px]">
                            {activeStaffMembers.length > 0 ? activeStaffMembers.map(s => s.displayName).join(', ') : 'Sin personal'}
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-lg border border-slate-700 shadow flex items-center gap-4">
                    <div className="p-4 rounded-full bg-green-500/10 text-green-400">
                        <DollarSign size={32} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">Bien</div>
                        <div className="text-sm text-slate-400">Estado Financiero</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="font-bold text-lg text-white mb-4">Ocupación</h3>
                    <div className="h-32 bg-slate-700/30 rounded flex items-center justify-center text-slate-500 relative overflow-hidden">
                        {/* Simple Bar Visualization */}
                        <div className="absolute inset-0 flex">
                            <div style={{ width: `${occupancyRate}%` }} className="bg-gold-500/20 h-full transition-all duration-1000"></div>
                        </div>
                        <div className="z-10 text-center">
                            <span className="text-4xl font-bold text-white">{occupancyRate}%</span>
                            <span className="block text-sm text-slate-400">Ocupado</span>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h3 className="font-bold text-lg text-white mb-4">Alertas Recientes</h3>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-2 text-sm text-yellow-500">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                            Visita Vet requerida para "Thunder"
                        </li>
                        <li className="flex items-center gap-2 text-sm text-blue-400">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            Nueva solicitud de pensión
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
