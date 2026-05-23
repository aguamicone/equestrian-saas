import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, DollarSign, Calendar, CheckCircle } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export default function ClientFinance() {
    const { currentUser } = useAuth();
    const { getPendingChargesForUser, getPaidChargesForUser, horses, pricingPlans } = useData();

    const pendingCharges = getPendingChargesForUser(currentUser.uid);
    const paidCharges = getPaidChargesForUser(currentUser.uid);
    const myHorses = horses.filter(h => h.ownerId === currentUser.uid);

    // Suma real de deuda pendiente
    const amountDue = pendingCharges.reduce((acc, c) => acc + Number(c.amount || 0), 0);

    // Resumen de servicios contratados
    const monthlyFee = myHorses.reduce((acc, horse) => {
        const activePlans = pricingPlans.filter(p => horse.assignedPlanIds?.includes(p.id));
        const horseCost = activePlans.reduce((sum, p) => sum + Number(p.price || 0), 0);
        return acc + horseCost;
    }, 0);

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-6">Mis Finanzas</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Balance Card */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-xl flex flex-col justify-between">
                    <div>
                        <div className="text-slate-400 text-sm mb-1">Deuda Pendiente</div>
                        <div className="text-4xl font-bold text-white">${amountDue.toLocaleString()}</div>
                    </div>
                    {amountDue > 0 ? (
                        <div className="mt-4">
                            <button 
                                disabled={true} 
                                title="Pagos online próximamente. Coordiná pago con el haras." 
                                style={{ opacity: 0.5, cursor: 'not-allowed' }}
                                className="btn-primary w-full flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20"
                            >
                                <CreditCard size={20} /> Pagar Ahora
                            </button>
                        </div>
                    ) : (
                        <div className="mt-4 flex items-center gap-2 text-green-400 font-bold bg-green-500/10 px-4 py-2 rounded-full w-fit">
                            <CheckCircle size={20} /> Al Día
                        </div>
                    )}
                </div>

                {/* Monthly Fee Breakdown */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <div className="text-white font-bold">Resumen de Servicios Contratados</div>
                            <div className="text-xs text-slate-500">Tus servicios mensuales activos</div>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {myHorses.map(horse => {
                            const activePlans = pricingPlans.filter(p => horse.assignedPlanIds?.includes(p.id));
                            if (activePlans.length === 0) return null;
                            const horseTotal = activePlans.reduce((sum, p) => sum + Number(p.price || 0), 0);

                            return (
                                <div key={horse.id} className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2">
                                    <div className="text-slate-300">{horse.name}</div>
                                    <div className="text-right">
                                        <div className="text-white font-medium">${horseTotal.toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-500">
                                            {activePlans.map(p => p.name).join(' + ')}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {myHorses.length === 0 && <div className="text-slate-500 text-sm">No tienes caballos asignados.</div>}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center text-sm">
                        <span className="text-slate-400">Costo mensual de tus servicios</span>
                        <span className="text-gold-400 font-bold font-mono">${monthlyFee.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Mis Cargos Pendientes */}
            {pendingCharges.length > 0 && (
                <div className="glass-card border border-slate-700 overflow-hidden mb-8">
                    <div className="p-4 border-b border-slate-700 font-bold text-slate-200">
                        Mis Cargos Pendientes
                    </div>
                    <div className="divide-y divide-slate-700">
                        {pendingCharges.map(charge => {
                            // Calcular indicador de vencimiento
                            let dueDateLabel = 'Sin vencimiento definido';
                            let dueDateColor = 'text-slate-500';
                            
                            if (charge.dueDate) {
                                const daysUntilDue = differenceInDays(parseISO(charge.dueDate), new Date());
                                if (daysUntilDue < 0) {
                                    const absDays = Math.abs(daysUntilDue);
                                    dueDateLabel = `Vencido hace ${absDays} día${absDays === 1 ? '' : 's'}`;
                                    dueDateColor = 'text-red-400';
                                } else if (daysUntilDue === 0) {
                                    dueDateLabel = 'Vence hoy';
                                    dueDateColor = 'text-amber-400';
                                } else if (daysUntilDue <= 3) {
                                    dueDateLabel = `Vence en ${daysUntilDue} día${daysUntilDue === 1 ? '' : 's'}`;
                                    dueDateColor = 'text-amber-400';
                                } else {
                                    dueDateLabel = `Vence en ${daysUntilDue} días`;
                                    dueDateColor = 'text-slate-400';
                                }
                            }
                            
                            return (
                                <div key={charge.id} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-full">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-200">{charge.description}</div>
                                            <div className={`text-xs ${dueDateColor} flex items-center gap-1`}>
                                                {dueDateLabel}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-slate-200">
                                        ${Number(charge.amount).toLocaleString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* History */}
            <div className="glass-card border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700 font-bold text-slate-200">Historial de Pagos</div>
                <div className="divide-y divide-slate-700">
                    {paidCharges.map(t => (
                        <div key={t.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-green-500/10 text-green-500 rounded-full">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <div className="font-medium text-slate-200">{t.description}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                        <Calendar size={10} /> {new Date(t.date).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div className="font-bold text-slate-200">
                                -${Number(t.amount).toLocaleString()}
                            </div>
                        </div>
                    ))}
                    {paidCharges.length === 0 && <div className="p-6 text-center text-slate-500">No hay pagos registrados.</div>}
                </div>
            </div>
        </div>
    );
}
