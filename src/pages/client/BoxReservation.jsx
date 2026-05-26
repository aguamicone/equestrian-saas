import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Ticket } from 'lucide-react';
import { PageHeader, Card, Modal } from '../../components/ui';

export default function BoxReservation() {
    const { spaces, requests, addRequest, pricingPlans } = useData();
    const { currentUser, currentTenant } = useAuth();

    // Filter boxes for this tenant
    const boxes = spaces.filter(s => s.tenantId === currentTenant?.id && s.type === 'box');
    const plans = pricingPlans.filter(p => p.type === 'membership');

    const [selectedBox, setSelectedBox] = useState(null);
    const [selectedPlanId, setSelectedPlanId] = useState('');

    const handleReserve = () => {
        if (!selectedPlanId) return alert('Por favor selecciona un plan de pensión.');
        const plan = plans.find(p => p.id === selectedPlanId);

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
        <div className="space-y-6 pb-20 max-w-4xl mx-auto">
            <PageHeader 
                title="Reserva de Boxes"
                subtitle="Solicita una reserva de box con planes de pensión mensuales para tus caballos"
                icon={Ticket}
            />

            <Card padding="normal" className="border-ink-200 bg-white shadow-sm mb-6">
                <div className="flex justify-between items-center mb-5 border-b border-ink-150 pb-2">
                    <h3 className="font-bold text-ink-900 text-lg">{currentTenant?.name || 'Haras San Pablo (Nave 1)'}</h3>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-ink-500 flex gap-4">
                        <span className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 bg-success-500 rounded-full"></div> Libre
                        </span>
                        <span className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 bg-danger-400 rounded-full"></div> Ocupado
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
                    {boxes.map(box => (
                        <div
                            key={box.id}
                            onClick={() => box.status === 'available' && setSelectedBox(box)}
                            className={`
                                aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer relative
                                ${box.status === 'available'
                                    ? 'bg-white border-ink-200 hover:border-primary-400 hover:bg-primary-50/10 text-ink-800 shadow-sm'
                                    : 'bg-danger-50/20 border-danger-100 text-danger-600 opacity-60 cursor-not-allowed'}
                            `}
                        >
                            <span className="font-extrabold text-lg">{box.name.replace('Box ', '')}</span>
                            {box.status === 'available' && <span className="text-[10px] text-success-700 font-bold uppercase tracking-wider mt-1">Libre</span>}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Reservation Modal */}
            <Modal
                open={selectedBox !== null}
                onClose={() => {
                    setSelectedBox(null);
                    setSelectedPlanId('');
                }}
                title={`Reservar ${selectedBox?.name}`}
                footer={
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setSelectedBox(null)} className="flex-1 btn-secondary">Cancelar</button>
                        <button onClick={handleReserve} className="flex-1 btn-primary">Solicitar</button>
                    </div>
                }
            >
                <p className="text-ink-500 text-sm mb-4">Confirma tu solicitud de reserva para este box seleccionando un plan de pensión.</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs uppercase font-bold text-ink-500 mb-2">Selecciona un Plan de Pensión</label>
                        <div className="space-y-2">
                            {plans.map(plan => {
                                const isSelected = selectedPlanId === plan.id;
                                return (
                                    <div
                                        key={plan.id}
                                        onClick={() => setSelectedPlanId(plan.id)}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                                            isSelected
                                            ? 'bg-primary-50 border-primary-400 text-primary-900 shadow-sm'
                                            : 'bg-white border-ink-200 text-ink-700 hover:border-ink-300'
                                        }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className={`font-bold text-sm ${isSelected ? 'text-primary-800' : 'text-ink-800'}`}>{plan.name}</span>
                                            <span className="text-[10px] opacity-70 mt-0.5">{plan.description || 'Sin descripción'}</span>
                                        </div>
                                        <span className="font-extrabold text-primary-600">${plan.price.toLocaleString()}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
