import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, DollarSign, Calendar, CheckCircle } from 'lucide-react';
import { differenceInDays, parseISO, isValid } from 'date-fns';
import { Card, EmptyState, PageHeader } from '../../components/ui';

export default function ClientFinance() {
    const { currentUser } = useAuth();
    const { getPendingChargesForUser, getPaidChargesForUser, horses, pricingPlans } = useData();

    // Default arrays to prevent any undefined crashes
    const pendingCharges = (getPendingChargesForUser && currentUser ? getPendingChargesForUser(currentUser.uid) : []) || [];
    const paidCharges = (getPaidChargesForUser && currentUser ? getPaidChargesForUser(currentUser.uid) : []) || [];
    const safeHorses = horses || [];
    const safePricingPlans = pricingPlans || [];

    const myHorses = safeHorses.filter(h => h.ownerId === currentUser?.uid);

    // Suma real de deuda pendiente
    const amountDue = pendingCharges.reduce((acc, c) => acc + Number(c?.amount || 0), 0);

    // Resumen de servicios contratados
    const monthlyFee = myHorses.reduce((acc, horse) => {
        const activePlans = safePricingPlans.filter(p => horse?.assignedPlanIds?.includes(p.id));
        const horseCost = activePlans.reduce((sum, p) => sum + Number(p?.price || 0), 0);
        return acc + horseCost;
    }, 0);

    return (
        <div className="space-y-8">
            <PageHeader 
                title="Mis Finanzas" 
                subtitle="Gestioná tus pagos, servicios mensuales y cargos pendientes." 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Balance Card */}
                <Card variant="default" className="flex flex-col justify-between h-full">
                    <div>
                        <div className="text-ink-500 text-sm font-medium mb-1">Deuda Pendiente</div>
                        <div className="text-4xl font-bold text-ink-900">${amountDue.toLocaleString()}</div>
                    </div>
                    {amountDue > 0 ? (
                        <div className="mt-6">
                            <button 
                                disabled={true} 
                                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CreditCard size={20} /> Pagar Ahora
                            </button>
                            <p className="text-xs text-ink-500 mt-2 text-center">
                                Pagos online próximamente. Coordiná el pago con el haras.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-6 flex items-center gap-2 text-success-700 font-bold bg-success-50 px-4 py-2 rounded-full w-fit border border-success-200">
                            <CheckCircle size={20} /> Al Día
                        </div>
                    )}
                </Card>

                {/* Monthly Fee Breakdown */}
                <Card variant="default">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-primary-50 text-primary-600 rounded-lg border border-primary-100">
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <div className="text-ink-900 font-bold">Resumen de Servicios Contratados</div>
                            <div className="text-xs text-ink-500">Tus servicios mensuales activos</div>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {myHorses.map(horse => {
                            const activePlans = safePricingPlans.filter(p => horse?.assignedPlanIds?.includes(p.id));
                            if (activePlans.length === 0) return null;
                            const horseTotal = activePlans.reduce((sum, p) => sum + Number(p?.price || 0), 0);

                            return (
                                <div key={horse.id} className="flex justify-between items-center text-sm border-b border-ink-100 pb-2">
                                    <div className="text-ink-700 font-medium">{horse.name}</div>
                                    <div className="text-right">
                                        <div className="text-ink-900 font-bold">${horseTotal.toLocaleString()}</div>
                                        <div className="text-[10px] text-ink-500">
                                            {activePlans.map(p => p.name).join(' + ')}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {myHorses.length === 0 && <div className="text-ink-500 text-sm">No tienes caballos asignados.</div>}
                    </div>

                    <div className="mt-3 pt-3 border-t border-ink-200 flex justify-between items-center text-sm">
                        <span className="text-ink-500 font-medium">Costo mensual de tus servicios</span>
                        <span className="text-primary-700 font-bold font-mono text-base">${monthlyFee.toLocaleString()}</span>
                    </div>
                </Card>
            </div>

            {/* Mis Cargos Pendientes */}
            {pendingCharges.length > 0 && (
                <Card padding="none" className="overflow-hidden border-ink-200">
                    <div className="p-4 border-b border-ink-200 font-bold text-ink-900 bg-ink-50">
                        Mis Cargos Pendientes
                    </div>
                    <div className="divide-y divide-ink-100">
                        {pendingCharges.map(charge => {
                            // Calcular indicador de vencimiento
                            let dueDateLabel = 'Sin vencimiento definido';
                            let dueDateColor = 'text-ink-500';
                            
                            if (charge.dueDate) {
                                let parsedDate = null;
                                if (charge.dueDate?.toDate && typeof charge.dueDate.toDate === 'function') {
                                    try { parsedDate = charge.dueDate.toDate(); } catch (e) { /* ignore */ }
                                } else if (charge.dueDate?.seconds) {
                                    parsedDate = new Date(charge.dueDate.seconds * 1000);
                                } else if (typeof charge.dueDate === 'string') {
                                    parsedDate = parseISO(charge.dueDate);
                                } else if (typeof charge.dueDate === 'number') {
                                    parsedDate = new Date(charge.dueDate);
                                }


                                if (isValid(parsedDate)) {
                                    const daysUntilDue = differenceInDays(parsedDate, new Date());
                                    if (daysUntilDue < 0) {
                                        const absDays = Math.abs(daysUntilDue);
                                        dueDateLabel = `Vencido hace ${absDays} día${absDays === 1 ? '' : 's'}`;
                                        dueDateColor = 'text-danger-600 font-medium';
                                    } else if (daysUntilDue === 0) {
                                        dueDateLabel = 'Vence hoy';
                                        dueDateColor = 'text-amber-600 font-medium';
                                    } else if (daysUntilDue <= 3) {
                                        dueDateLabel = `Vence en ${daysUntilDue} día${daysUntilDue === 1 ? '' : 's'}`;
                                        dueDateColor = 'text-amber-600 font-medium';
                                    } else {
                                        dueDateLabel = `Vence en ${daysUntilDue} días`;
                                        dueDateColor = 'text-ink-500';
                                    }
                                }
                            }
                            
                            return (
                                <div key={charge.id} className="p-4 flex items-center justify-between hover:bg-ink-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-full">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-ink-900">{charge.description}</div>
                                            <div className={`text-xs flex items-center gap-1 ${dueDateColor}`}>
                                                {dueDateLabel}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-ink-900 font-mono text-lg">
                                        ${Number(charge.amount || 0).toLocaleString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* History */}
            <Card padding="none" className="overflow-hidden border-ink-200">
                <div className="p-4 border-b border-ink-200 font-bold text-ink-900 bg-ink-50">Historial de Pagos</div>
                
                {paidCharges.length > 0 ? (
                    <div className="divide-y divide-ink-100">
                        {paidCharges.map(t => {
                            let dateObj = null;
                            if (t.date?.toDate && typeof t.date.toDate === 'function') {
                                try { dateObj = t.date.toDate(); } catch (e) { /* ignore */ }
                            } else if (t.date?.seconds) {
                                dateObj = new Date(t.date.seconds * 1000);
                            } else if (typeof t.date === 'string' || typeof t.date === 'number') {
                                dateObj = new Date(t.date);
                            }
                            const safeDateStr = (dateObj && isValid(dateObj)) ? dateObj.toLocaleDateString() : 'Fecha inválida';

                            return (
                                <div key={t.id} className="p-4 flex items-center justify-between hover:bg-ink-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-success-50 text-success-600 border border-success-100 rounded-full">
                                            <DollarSign size={20} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-ink-900">{t.description}</div>
                                            <div className="text-xs text-ink-500 flex items-center gap-1 mt-0.5">
                                                <Calendar size={12} /> {safeDateStr}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-ink-900 font-mono text-lg">
                                        ${Number(t.amount || 0).toLocaleString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-8">
                        <EmptyState 
                            icon={DollarSign}
                            message="No hay pagos registrados"
                            description="Tu historial de pagos aparecerá aquí una vez que realices tu primer pago."
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}
