import { useData } from '../../context/DataContext';
import { DollarSign, AlertCircle } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui';

export default function DebtorsDashboard() {
    const { finances, tenantUsers } = useData();

    // Filter pending
    const pending = finances.filter(f => f.type === 'income' && f.status === 'pending');

    // Group by Client
    const debtorsMap = {};
    pending.forEach(tx => {
        if (!debtorsMap[tx.clientId]) {
            debtorsMap[tx.clientId] = { amount: 0, items: [], name: 'Cargos Pendientes' };
        }
        debtorsMap[tx.clientId].amount += tx.amount;
        debtorsMap[tx.clientId].items.push(tx);
    });

    const getUserName = (uid) => {
        const user = tenantUsers.find(u => u.uid === uid);
        return user ? user.displayName : uid.replace('user-', '').toUpperCase();
    };

    return (
        <div className="space-y-6 pb-20">
            <PageHeader 
                kicker="Finanzas"
                title="Reporte de Deudores"
                subtitle="Control de cuentas con saldos deudores y alertas de cobro"
                icon={DollarSign}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                {Object.keys(debtorsMap).length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white border border-ink-200 rounded-2xl shadow-sm max-w-lg mx-auto flex flex-col items-center justify-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-success-600 mb-4" />
                        <h3 className="text-lg font-bold text-ink-900">¡Al día!</h3>
                        <p className="text-ink-500 text-sm mt-1">No hay deudas pendientes en este momento.</p>
                    </div>
                )}

                {Object.entries(debtorsMap).map(([clientId, data]) => (
                    <Card key={clientId} padding="normal" className="border-ink-200 bg-white shadow-sm relative overflow-hidden transition-all duration-200 hover:border-ink-300">
                        <div className="absolute top-0 right-0 p-3 opacity-[0.03] pointer-events-none">
                            <AlertCircle size={80} className="text-danger-500" />
                        </div>

                        <h3 className="font-bold text-lg text-ink-900 mb-1 leading-snug">{getUserName(clientId)}</h3>
                        <p className="text-ink-450 text-xs font-bold uppercase tracking-wider mb-4">Cliente</p>

                        <div className="mb-6 bg-danger-50/50 border border-danger-100 p-4 rounded-xl">
                            <div className="text-3xl font-black text-danger-700">${data.amount.toLocaleString()}</div>
                            <div className="text-[10px] text-danger-600 uppercase font-bold tracking-wider mt-0.5">Deuda Acumulada</div>
                        </div>

                        <div className="space-y-2 border-t border-ink-150 pt-4">
                            <div className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1">Conceptos Pendientes</div>
                            {data.items.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm py-0.5">
                                    <span className="text-ink-600 font-medium">{item.description}</span>
                                    <span className="text-ink-900 font-semibold">${item.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-6 btn-secondary hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 font-bold transition-all">
                            Enviar Recordatorio
                        </button>
                    </Card>
                ))}
            </div>
        </div>
    );
}
