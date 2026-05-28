import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Clock, Inbox, User, MapPin } from 'lucide-react';
import { Card, EmptyState } from '../../components/ui';
import TaskCompletionModal from '../../components/staff/modals/TaskCompletionModal';
import DerivarTareaModal from '../../components/staff/modals/DerivarTareaModal';

export default function StaffDashboard() {
    const { requests } = useData();
    const { currentUser } = useAuth();

    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [showDeriveModal, setShowDeriveModal] = useState(false);

    // Initial Filter for Requests
    const myRequests = requests.filter(r => {
        // Solicitudes pending sin asignar: las ven todos los caballerizos
        const isPendingUnassigned = (r.status === 'pending_staff' || r.status === 'pending') && !r.assigneeId;
        // Solicitudes asignadas al caballerizo actual (en cualquier estado activo)
        const isMineActive = r.assigneeId === currentUser?.uid && (r.status === 'pending_staff' || r.status === 'pending' || r.status === 'in_progress');
        return isPendingUnassigned || isMineActive;
    });

    const liveSelectedTask = selectedTaskId ? requests.find(r => r.id === selectedTaskId) : null;
    const selectedTask = liveSelectedTask ? { ...liveSelectedTask, _taskType: 'request' } : null;

    const handleTaskClick = (req) => {
        setSelectedTaskId(req.id);
        setShowDeriveModal(false);
    };

    return (
        <div className="space-y-6 pb-20 max-w-xl mx-auto animate-in fade-in">
            {/* Header Banner - Cielo y Campo Style */}
            <div className="w-full relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary-500 to-sky-500 text-white shadow-md flex flex-col justify-end min-h-[140px] p-6 sm:p-8">
                <div className="absolute inset-0 bg-white/5 mix-blend-overlay"></div>
                <div className="relative z-10 w-full flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm leading-tight">
                            Modo Operativo
                        </h2>
                        <p className="text-xs font-bold text-sky-100 uppercase tracking-widest mt-1">Panel Principal</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-center border border-white/20">
                        <span className="block text-2xl font-black">{myRequests.length}</span>
                        <span className="block text-[9px] uppercase tracking-wider font-bold">Pedidos</span>
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                    <Inbox size={16} className="text-primary-500"/>
                    <h3 className="text-xs font-bold text-ink-500 uppercase tracking-widest">Solicitudes Pendientes</h3>
                </div>

                {myRequests.length === 0 ? (
                    <Card padding="loose" className="text-center bg-white border-ink-150">
                        <EmptyState 
                            icon={Inbox}
                            message="Bandeja Vacía"
                            description="No hay pedidos pendientes en este momento."
                        />
                    </Card>
                ) : (
                    myRequests.map(req => (
                        <Card
                            key={req.id}
                            variant="hover"
                            onClick={() => handleTaskClick(req)}
                            className={`p-4 flex items-center justify-between cursor-pointer relative overflow-hidden ${req.autoApprove ? 'border-danger-200 bg-danger-50/30' : 'bg-white'}`}
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${req.autoApprove ? 'bg-danger-500' : (req.assigneeId ? 'bg-primary-500' : 'bg-ink-300')}`}></div>
                            <div className="flex items-center gap-4 pl-2">
                                <div className={`p-3 rounded-full ${req.autoApprove ? 'bg-danger-100 text-danger-600' : 'bg-primary-50 text-primary-600'}`}>
                                    <Inbox size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-ink-800">{req.type}</h3>
                                        {req.autoApprove && <span className="text-[10px] bg-danger-500 text-white px-1.5 py-0.5 rounded leading-none font-bold animate-pulse">DIRECTO</span>}
                                    </div>
                                    <p className="text-xs text-ink-600 italic mt-0.5">{req.details ? `"${req.details}"` : 'Sin detalles adicionales'}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-ink-500 mt-1.5">
                                        {req.timeRequested && <span className="text-gold-600 font-bold flex items-center gap-1"><Clock size={10}/> Para las {req.timeRequested}</span>}
                                        {req.assigneeId ? <span className="text-primary-600 flex items-center gap-1"><User size={10} /> Asignado a ti</span> : <span>General</span>}
                                        • {req.timestamp ? new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora'}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
            
            <Card padding="normal" className="mt-8 bg-ink-50/30 border border-ink-200 text-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <h4 className="text-ink-900 font-bold mb-2">Sincronización Inteligente</h4>
                <p className="text-xs text-ink-550 font-medium px-4">Todas tus acciones son enviadas al control de administración en tiempo real.</p>
            </Card>

            {selectedTask && (
                <>
                    <TaskCompletionModal
                        isOpen={!!selectedTask && !showDeriveModal}
                        onClose={() => { setSelectedTaskId(null); setShowDeriveModal(false); }}
                        task={selectedTask}
                        onDeriveRequest={() => setShowDeriveModal(true)}
                    />
                    <DerivarTareaModal
                        isOpen={showDeriveModal}
                        onClose={() => setShowDeriveModal(false)}
                        task={selectedTask}
                        onComplete={() => { setSelectedTaskId(null); setShowDeriveModal(false); }}
                    />
                </>
            )}
        </div>
    );
}
