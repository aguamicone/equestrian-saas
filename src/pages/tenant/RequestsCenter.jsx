import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { ShoppingBag, CheckCircle, XCircle, Clock } from 'lucide-react';

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
        // Si no es reserva, consideramos que necesita pasar a staff o simplemente completarse.
        // Simularemos que todo lo aprobado que no sea reserva pasa a "completado" por ahora.
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
        <div className="pb-20">
            <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                <ShoppingBag className="text-gold-500" /> Centro de Solicitudes
            </h2>

            {pendingRequests.length === 0 ? (
                <div className="text-center py-12 glass-card border border-slate-700">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-medium text-white">¡Todo al día!</h3>
                    <p className="text-slate-400">No hay solicitudes pendientes.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {pendingRequests.map(req => (
                        <div key={req.id} className="glass-card p-6 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded uppercase">
                                        {req.type === 'reservation' ? 'Reserva de Box' : req.type}
                                    </span>
                                    <span className="text-slate-500 text-sm flex items-center gap-1">
                                        <Clock size={14} /> {new Date().toLocaleDateString()} {/* Mock date */}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">
                                    {req.type === 'reservation' ? `Solicitud para ${getBoxName(req.boxId)}` : req.type}
                                </h3>
                                {req.details && <p className="text-slate-300 mb-1 text-sm italic">"{req.details}"</p>}
                                <p className="text-slate-400 text-sm flex gap-2">
                                    <span>Cliente: <span className="text-white">{getUserName(req.clientId)}</span></span>
                                    {req.price > 0 && <span className="text-gold-500 font-bold ml-2">(${req.price.toLocaleString()})</span>}
                                </p>
                                {req.planId && (
                                    <p className="text-gold-500 text-sm font-bold mt-1">
                                        Plan Seleccionado: {pricingPlans.find(p => p.id === req.planId)?.name || 'Desconocido'}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => handleReject(req.id)}
                                    className="flex-1 md:flex-none px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium text-sm"
                                >
                                    Rechazar
                                </button>
                                <button
                                    onClick={() => handleApprove(req)}
                                    className="flex-1 md:flex-none px-6 py-2 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-lg transition-colors text-sm shadow-lg shadow-gold-500/20"
                                >
                                    Aprobar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
