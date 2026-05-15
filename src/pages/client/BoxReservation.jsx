import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Ticket, CheckCircle, Info } from 'lucide-react';

export default function BoxReservation() {
    const { spaces, requests, addRequest, pricingPlans } = useData(); // Assuming 'spaces' handles boxes
    const { currentUser, currentTenant } = useAuth();

    // Filter boxes for this tenant
    const boxes = spaces.filter(s => s.tenantId === currentTenant?.id && s.type === 'box');
    const plans = pricingPlans.filter(p => p.type === 'membership');

    const [selectedBox, setSelectedBox] = useState(null);
    const [selectedPlanId, setSelectedPlanId] = useState('');

    const handleReserve = () => {
        if (!selectedPlanId) return alert('Por favor selecciona un plan de pensión.');
        const plan = plans.find(p => p.id === selectedPlanId);

        // In real app, create a 'reservation' object or link horse to box
        // For MVP, we create a 'Service Request' of type 'Reservation'
        addRequest({
            type: 'reservation',
            details: `Solicitud de reserva para ${selectedBox.name} con plan ${plan.name}`,
            boxId: selectedBox.id,
            planId: plan.id,
            price: plan.price,
            status: 'pending',
            clientId: currentUser.uid
        });
        setSelectedBox(null);
        setSelectedPlanId('');
        alert('Solicitud enviada al administrador.');
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                <Ticket className="text-gold-500" /> Reserva de Boxes
            </h2>

            <div className="glass-card p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white text-lg">Haras San Pablo (Nave 1)</h3>
                    <div className="text-xs text-slate-400 flex gap-4">
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Libre</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500/50 rounded-full"></div> Ocupado</span>
                    </div>
                </div>

                <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                    {boxes.map(box => (
                        <div
                            key={box.id}
                            onClick={() => box.status === 'available' && setSelectedBox(box)}
                            className={`
                            aspect-square rounded-lg flex flex-col items-center justify-center border-2 transition-all cursor-pointer relative
                            ${box.status === 'available'
                                    ? 'bg-slate-700 border-slate-600 hover:border-gold-500 hover:bg-slate-700/80 text-white'
                                    : 'bg-red-500/10 border-red-500/20 text-red-500 opacity-70 cursor-not-allowed'}
                        `}
                        >
                            <span className="font-bold text-lg">{box.name.replace('Box ', '')}</span>
                            {box.status === 'available' && <span className="text-[10px] text-green-400 font-bold">Libre</span>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Reservation Modal */}
            {selectedBox && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-sm p-6 animate-in slide-in-from-bottom duration-300">
                        <h3 className="text-xl font-bold text-white mb-2">Reservar {selectedBox.name}</h3>
                        <p className="text-slate-400 text-sm mb-6">Confirma tu solicitud de reserva para este box.</p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Selecciona un Plan de Pensión</label>
                                <div className="space-y-2">
                                    {plans.map(plan => (
                                        <div
                                            key={plan.id}
                                            onClick={() => setSelectedPlanId(plan.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${selectedPlanId === plan.id
                                                ? 'bg-gold-500/20 border-gold-500 text-white'
                                                : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                                                }`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm">{plan.name}</span>
                                                <span className="text-[10px] opacity-70">{plan.description || 'Sin descripción'}</span>
                                            </div>
                                            <span className="font-bold text-gold-500">${plan.price.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setSelectedBox(null)} className="flex-1 py-3 text-slate-400">Cancelar</button>
                            <button onClick={handleReserve} className="flex-1 btn-primary">Solicitar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
