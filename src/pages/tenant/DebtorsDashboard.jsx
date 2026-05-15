import { useData } from '../../context/DataContext';
import { DollarSign, AlertCircle } from 'lucide-react';

export default function DebtorsDashboard() {
    const { finances, USERS } = useData();

    // Filter pending
    const pending = finances.filter(f => f.type === 'income' && f.status === 'pending');

    // Group by Client
    const debtorsMap = {};
    pending.forEach(tx => {
        if (!debtorsMap[tx.clientId]) {
            debtorsMap[tx.clientId] = { amount: 0, items: [], name: 'Unknown' };
        }
        debtorsMap[tx.clientId].amount += tx.amount;
        debtorsMap[tx.clientId].items.push(tx);
    });

    // Enrich with Names (In a real app, users would be a collection)
    // For prototype, we'll try to find name from mock USERS array if imported or just show ID

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                <DollarSign className="text-gold-500" /> Deudores
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.keys(debtorsMap).length === 0 && <p className="text-slate-500 col-span-3">No hay deudas pendientes.</p>}

                {Object.entries(debtorsMap).map(([clientId, data]) => (
                    <div key={clientId} className="glass-card p-6 rounded-xl border border-slate-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <AlertCircle size={64} className="text-red-500" />
                        </div>

                        <h3 className="font-bold text-xl text-white mb-1">{clientId.replace('user-', '').toUpperCase()}</h3>
                        <p className="text-slate-400 text-sm mb-4">Cliente</p>

                        <div className="mb-6">
                            <div className="text-3xl font-bold text-red-400">${data.amount.toLocaleString()}</div>
                            <div className="text-xs text-red-500/80 uppercase font-bold tracking-wider">Deuda Total</div>
                        </div>

                        <div className="space-y-2 border-t border-slate-700 pt-4">
                            {data.items.map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-slate-400">{item.description}</span>
                                    <span className="text-slate-200 font-medium">${item.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                            Enviar Recordatorio
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
