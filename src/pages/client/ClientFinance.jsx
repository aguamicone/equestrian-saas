import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, DollarSign, Calendar, CheckCircle } from 'lucide-react';

export default function ClientFinance() {
    const { currentUser } = useAuth();
    const { getFinanceForUser, addPayment, horses, pricingPlans } = useData();

    const transactions = getFinanceForUser(currentUser.uid);
    const myHorses = horses.filter(h => h.ownerId === currentUser.uid);

    // Calculate Monthly Fee based on Assigned Plans
    const monthlyFee = myHorses.reduce((acc, horse) => {
        const activePlans = pricingPlans.filter(p => horse.assignedPlanIds?.includes(p.id));
        const horseCost = activePlans.reduce((sum, p) => sum + p.price, 0);
        return acc + horseCost;
    }, 0);

    // Simulation: Amount Due is either the monthly fee (if not paid) or 0
    // Real logic would check if current month invoice is generated and paid.
    // We will assume simply that we owe the monthly fee for "Next Month" for demo purposes.
    const [showPayModal, setShowPayModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    // For demo: Let's assume there is a pending debt equal to monthly fee if not 0, else 0
    const [amountDue, setAmountDue] = useState(monthlyFee > 0 ? monthlyFee : 0);

    const handlePay = () => {
        setProcessing(true);
        setTimeout(() => {
            addPayment({
                amount: amountDue,
                category: 'Pensión',
                description: 'Pago Online - Servicios Mensuales',
                clientId: currentUser.uid,
                type: 'income',
                status: 'paid'
            });
            setAmountDue(0);
            setProcessing(false);
            setShowPayModal(false);
        }, 2000);
    };

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
                            <button onClick={() => setShowPayModal(true)} className="btn-primary w-full flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20">
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
                            <div className="text-white font-bold">Cuota Mensual Estimada</div>
                            <div className="text-xs text-slate-500">Basado en servicios activos</div>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                        {myHorses.map(horse => {
                            const activePlans = pricingPlans.filter(p => horse.assignedPlanIds?.includes(p.id));
                            if (activePlans.length === 0) return null;
                            const horseTotal = activePlans.reduce((sum, p) => sum + p.price, 0);

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
                        <span className="text-slate-400">Total Mensual</span>
                        <span className="text-gold-400 font-bold font-mono">${monthlyFee.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* History */}
            <div className="glass-card border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700 font-bold text-slate-200">Historial de Pagos</div>
                <div className="divide-y divide-slate-700">
                    {transactions.map(t => (
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
                                -${t.amount.toLocaleString()}
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && <div className="p-6 text-center text-slate-500">No hay pagos registrados.</div>}
                </div>
            </div>

            {/* Mock Payment Modal */}
            {showPayModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="glass-panel w-full max-w-sm p-6 animate-in zoom-in duration-300">
                        <h3 className="text-xl font-bold text-white mb-4">Confirmar Pago</h3>
                        <div className="bg-slate-900 p-4 rounded-lg mb-6 flex justify-between items-center">
                            <span className="text-slate-400">Total a Pagar</span>
                            <span className="text-2xl font-bold text-white">${amountDue.toLocaleString()}</span>
                        </div>

                        <p className="text-xs text-slate-500 mb-6 text-center">
                            Pagando con Tarjeta terminada en •••• 4242 <br />
                            (Simulación Segura)
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setShowPayModal(false)} className="py-3 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">Cancelar</button>
                            <button onClick={handlePay} disabled={processing} className="btn-primary flex items-center justify-center">
                                {processing ? <span className="animate-spin">⌛</span> : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
