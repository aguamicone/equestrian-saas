import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { ShoppingBag, CheckCircle, Clock } from 'lucide-react';
import { PageHeader, Card, Badge } from '../../components/ui';

export default function RequestsCenter() {
    const { requests, tenantUsers, spaces, updateRow, addHorse, assignHorseToSpace, pricingPlans, sendNotification } = useData();

    const pendingRequests = requests.filter(r => r.status === 'pending_admin' || r.status === 'pending');

    const getUserName = (uid) => {
        const user = tenantUsers.find(u => u.uid === uid);
        return user ? user.displayName : 'Usuario Desconocido';
    };

    const getBoxName = (boxId) => {
        const space = spaces.find(s => s.id === boxId);
        return space ? space.name : 'Box Desconocido';
    };

    const handleApprove = (request) => {
        if (request.type === 'reservation') {
            // 1. Create Placeholder Horse
            const newHorseId = `h${Date.now()}`;
            const placeholderHorse = {
                id: newHorseId,
                name: 'Reservado',
                breed: 'Pendiente',
                ownerId: request.clientId,
                age: 0,
                color: '-',
                assignedPlanIds: request.planId ? [request.planId] : []
            };

            // 2. Add Horse and Assign to Space
            addHorse(placeholderHorse);
            assignHorseToSpace(request.boxId, newHorseId);
        }

        // 3. Update Request Status
        updateRow('REQUESTS', request.id, { status: request.type === 'reservation' ? 'approved' : 'completed' });

        // 4. Notify Client
        const notifMsg = request.type === 'reservation' 
            ? `Tu solicitud de reserva para ${getBoxName(request.boxId)} ha sido aprobada.`
            : `Tu solicitud de ${request.type} ha sido aprobada.`;
        sendNotification(request.clientId, notifMsg, 'success');
    };

    const handleReject = (requestId) => {
        const req = requests.find(r => r.id === requestId);
        updateRow('REQUESTS', requestId, { status: 'rejected' });
        if (req) sendNotification(req.clientId, `Tu solicitud de reserva ha sido rechazada.`, 'warning');
    };

    return (
        <div className="space-y-6 pb-20">
            <PageHeader 
                kicker="Administración"
                title="Centro de Solicitudes"
                subtitle="Aprobación y control de reservas de boxes y pedidos especiales de clientes"
                icon={ShoppingBag}
            />

            {pendingRequests.length === 0 ? (
                <div className="text-center py-12 bg-white border border-ink-200 rounded-2xl shadow-sm max-w-lg mx-auto flex flex-col items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-success-600 mb-4" />
                    <h3 className="text-lg font-bold text-ink-900">¡Todo al día!</h3>
                    <p className="text-ink-500 text-sm mt-1">No hay solicitudes pendientes en este momento.</p>
                </div>
            ) : (
                <div className="grid gap-4 stagger-children">
                    {pendingRequests.map(req => (
                        <Card 
                            key={req.id} 
                            padding="normal" 
                            className="border-ink-200 bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-250 hover:border-ink-300"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge tone="primary">
                                        {req.type === 'reservation' ? 'Reserva de Box' : req.type}
                                    </Badge>
                                    <span className="text-ink-400 text-xs flex items-center gap-1">
                                        <Clock size={12} /> {new Date().toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-ink-900 leading-tight">
                                    {req.type === 'reservation' ? `Solicitud para ${getBoxName(req.boxId)}` : req.type}
                                </h3>
                                {req.details && (
                                    <p className="text-ink-600 text-sm italic bg-ink-50 p-2.5 rounded-lg border border-ink-150">
                                        "{req.details}"
                                    </p>
                                )}
                                <div className="text-ink-500 text-sm flex items-center gap-4 flex-wrap mt-1">
                                    <div>
                                        Cliente: <span className="text-ink-800 font-semibold">{getUserName(req.clientId)}</span>
                                    </div>
                                    {req.price > 0 && (
                                        <div className="text-gold-600 font-bold bg-gold-50 px-2 py-0.5 rounded-md border border-gold-100">
                                            ${req.price.toLocaleString()}
                                        </div>
                                    )}
                                </div>
                                {req.planId && (
                                    <div className="text-xs font-bold text-primary-600 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-md inline-block uppercase tracking-wider">
                                        Plan: {pricingPlans.find(p => p.id === req.planId)?.name || 'Desconocido'}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 w-full md:w-auto shrink-0 pt-2 md:pt-0">
                                <button
                                    onClick={() => handleReject(req.id)}
                                    className="flex-1 md:flex-none btn-secondary text-danger-600 hover:bg-danger-50 hover:border-danger-200"
                                >
                                    Rechazar
                                </button>
                                <button
                                    onClick={() => handleApprove(req)}
                                    className="flex-1 md:flex-none btn-primary px-6"
                                >
                                    Aprobar
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
