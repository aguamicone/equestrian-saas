import { BarChart3, Users, Building } from 'lucide-react';

export default function SuperAdminDashboard() {
    return (
        <div>
            <h2 className="text-3xl font-bold text-slate-100 mb-6">Resumen del Sistema</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6 rounded-lg border border-slate-700 shadow flex items-center gap-4">
                    <div className="p-4 rounded-full bg-blue-500/10 text-blue-400">
                        <Building size={32} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">2</div>
                        <div className="text-sm text-slate-400">Tenants Activos</div>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-lg border border-slate-700 shadow flex items-center gap-4">
                    <div className="p-4 rounded-full bg-green-500/10 text-green-400">
                        <Users size={32} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">125</div>
                        <div className="text-sm text-slate-400">Usuarios Totales</div>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-lg border border-slate-700 shadow flex items-center gap-4">
                    <div className="p-4 rounded-full bg-gold-500/10 text-gold-500">
                        <BarChart3 size={32} />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">$45k</div>
                        <div className="text-sm text-slate-400">MRR</div>
                    </div>
                </div>
            </div>

            <div className="glass-card p-6">
                <h3 className="font-bold text-lg text-white mb-4">Actividad Reciente</h3>
                <div className="text-slate-400">Simulación de log de actividad...</div>
            </div>
        </div>
    );
}
