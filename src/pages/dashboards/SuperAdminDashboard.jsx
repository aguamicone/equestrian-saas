import { BarChart3, Users, Building } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui';

export default function SuperAdminDashboard() {
    return (
        <div className="space-y-6">
            <PageHeader 
                title="Resumen del Sistema"
                subtitle="Métricas globales del negocio SaaS, cantidad de usuarios e ingresos recurrentes mensuales (MRR)"
                icon={BarChart3}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 stagger-children">
                <Card padding="normal" className="flex items-center gap-4 border-ink-200 bg-white shadow-sm transition-all hover:shadow hover:border-ink-300 duration-200">
                    <div className="p-3 rounded-xl bg-primary-50 text-primary-500 border border-primary-100 shrink-0">
                        <Building size={32} />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-ink-900">2</div>
                        <div className="text-xs text-ink-450 uppercase font-bold tracking-wider mt-0.5">Tenants Activos</div>
                    </div>
                </Card>

                <Card padding="normal" className="flex items-center gap-4 border-ink-200 bg-white shadow-sm transition-all hover:shadow hover:border-ink-300 duration-200">
                    <div className="p-3 rounded-xl bg-success-50 text-success-500 border border-success-100 shrink-0">
                        <Users size={32} />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-ink-900">125</div>
                        <div className="text-xs text-ink-450 uppercase font-bold tracking-wider mt-0.5">Usuarios Totales</div>
                    </div>
                </Card>

                <Card padding="normal" className="flex items-center gap-4 border-ink-200 bg-white shadow-sm transition-all hover:shadow hover:border-ink-300 duration-200">
                    <div className="p-3 rounded-xl bg-gold-50 text-gold-500 border border-gold-100 shrink-0">
                        <BarChart3 size={32} />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-ink-900">$45k</div>
                        <div className="text-xs text-ink-450 uppercase font-bold tracking-wider mt-0.5">MRR</div>
                    </div>
                </Card>
            </div>

            <Card padding="normal" className="border-ink-200 bg-white shadow-sm mt-6">
                <h3 className="font-bold text-lg text-ink-900 mb-4 pb-2 border-b border-ink-150">Actividad Reciente</h3>
                <div className="text-ink-450 italic text-sm">Simulación de log de actividad...</div>
            </Card>
        </div>
    );
}
