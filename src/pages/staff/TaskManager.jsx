import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, Clock, Inbox, User, MapPin } from 'lucide-react';
import { db } from '../../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNotification } from '../../context/NotificationContext';
import { Card, PageHeader, Tabs, EmptyState } from '../../components/ui';
import TaskCompletionModal from '../../components/staff/modals/TaskCompletionModal';
import DerivarTareaModal from '../../components/staff/modals/DerivarTareaModal';

export default function TaskManager() {
    const { routines, requests, addLog, updateRow, spaces, horses, updateHorseLocation, sendNotification } = useData();
    const { currentUser } = useAuth();
    const { notify } = useNotification();
    
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [selectedTaskType, setSelectedTaskType] = useState(null);
    const [activeTab, setActiveTab] = useState('routines');
    const [showDeriveModal, setShowDeriveModal] = useState(false);
    
    // Horses location
    const mySpaces = spaces.filter(s => s.staffId === currentUser.uid);
    const myLoadedHorses = mySpaces.map(s => horses.find(h => h.id === s.horseId)).filter(Boolean);

    // Initial Filter
    const myRequests = requests.filter(r => {
        // Solicitudes pending sin asignar: las ven todos los caballerizos
        const isPendingUnassigned = (r.status === 'pending_staff' || r.status === 'pending') && !r.assigneeId;
        // Solicitudes asignadas al caballerizo actual (en cualquier estado activo)
        const isMineActive = r.assigneeId === currentUser.uid && (r.status === 'pending_staff' || r.status === 'pending' || r.status === 'in_progress');
        return isPendingUnassigned || isMineActive;
    });

    const liveSelectedTask = selectedTaskId
        ? (selectedTaskType === 'request'
            ? requests.find(r => r.id === selectedTaskId)
            : routines.find(r => r.id === selectedTaskId))
        : null;

    const selectedTask = liveSelectedTask ? { ...liveSelectedTask, _taskType: selectedTaskType } : null;

    const handleTaskClick = (item, type) => {
        setSelectedTaskId(item.id);
        setSelectedTaskType(type);
        setShowDeriveModal(false);
    };

    const tabs = [
        { key: 'routines', label: 'Rutinas' },
        { key: 'requests', label: 'Solicitudes' },
        { key: 'location', label: 'Ubicación' }
    ];

    return (
        <div className="pb-20">
            <PageHeader 
                kicker="Operativa"
                title="Mis Tareas"
                subtitle="Gestiona rutinas, solicitudes y ubicaciones"
            />

            <div className="mb-6">
                <Tabs 
                    tabs={tabs}
                    value={activeTab}
                    onChange={setActiveTab}
                />
            </div>

            <div className="space-y-3">
                {activeTab === 'routines' && (
                    <>
                        {routines.length === 0 ? (
                            <EmptyState 
                                icon={CheckSquare}
                                title="No hay rutinas asignadas"
                                description="No tienes rutinas pendientes en este momento."
                            />
                        ) : (
                            routines.map(routine => (
                                <Card
                                    key={routine.id}
                                    variant="hover"
                                    onClick={() => handleTaskClick(routine, 'routine')}
                                    className="p-4 flex items-center justify-between cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary-50 rounded-full text-primary-600">
                                            <CheckSquare size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-ink-800">{routine.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-ink-500 mt-1">
                                                <Clock size={12} /> {routine.time || 'Flexible'} • {routine.frequency}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </>
                )}

                {activeTab === 'requests' && (
                    <>
                        {myRequests.length === 0 ? (
                            <EmptyState 
                                icon={Inbox}
                                title="Bandeja de entrada vacía"
                                description="No tienes solicitudes pendientes por el momento."
                            />
                        ) : (
                            myRequests.map(req => (
                                <Card
                                    key={req.id}
                                    variant="hover"
                                    onClick={() => handleTaskClick(req, 'request')}
                                    className={`p-4 flex items-center justify-between cursor-pointer relative overflow-hidden ${req.autoApprove ? 'border-danger-200 bg-danger-50/30' : ''}`}
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
                    </>
                )}

                {activeTab === 'location' && (
                    <div className="space-y-4 animate-in fade-in">
                        <p className="text-ink-600 text-sm mb-4 bg-ink-50 p-3 rounded-lg border border-ink-200">
                            Actualiza dónde están los caballos de tu sector en tiempo real.
                        </p>
                        
                        {myLoadedHorses.length === 0 ? (
                            <EmptyState 
                                icon={MapPin}
                                title="No tienes caballos asignados"
                                description="No hay caballos asignados a tu sector para controlar su ubicación."
                            />
                        ) : (
                            myLoadedHorses.map(horse => {
                                const loc = horse.location || 'box';
                                return (
                                    <Card key={horse.id} className="p-4 space-y-4 border-ink-200">
                                        <div className="flex items-center gap-3 border-b border-ink-100 pb-3">
                                            <div className="p-2 bg-primary-50 rounded-lg text-primary-600"><MapPin size={20}/></div>
                                            <div>
                                                <h3 className="font-bold text-ink-800 text-lg leading-tight">{horse.name}</h3>
                                                <span className="text-xs text-ink-500">Ubicación actual: <strong className="text-ink-700 capitalize">{loc}</strong></span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button 
                                                onClick={() => updateHorseLocation(horse.id, 'box')}
                                                className={`py-2 text-xs font-bold rounded-lg border transition-all ${loc === 'box' ? 'bg-ink-100 border-ink-300 text-ink-800 shadow-sm' : 'bg-white border-ink-200 text-ink-500 hover:text-ink-700 hover:bg-ink-50'}`}>
                                                🏠 En Box
                                            </button>
                                            <button 
                                                onClick={() => updateHorseLocation(horse.id, 'piquete')}
                                                className={`py-2 text-xs font-bold rounded-lg border transition-all ${loc === 'piquete' ? 'bg-success-50 border-success-300 text-success-700 shadow-sm' : 'bg-white border-ink-200 text-ink-500 hover:text-ink-700 hover:bg-ink-50'}`}>
                                                🌳 En Piquete
                                            </button>
                                            <button 
                                                onClick={() => updateHorseLocation(horse.id, 'circular')}
                                                className={`py-2 text-xs font-bold rounded-lg border transition-all ${loc === 'circular' ? 'bg-gold-50 border-gold-300 text-gold-700 shadow-sm' : 'bg-white border-ink-200 text-ink-500 hover:text-ink-700 hover:bg-ink-50'}`}>
                                                ⭕ En Circular
                                            </button>
                                        </div>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {selectedTask && (
                <>
                    <TaskCompletionModal
                        isOpen={!!selectedTask && !showDeriveModal}
                        onClose={() => { setSelectedTaskId(null); setSelectedTaskType(null); setShowDeriveModal(false); }}
                        task={selectedTask}
                        onDeriveRequest={() => setShowDeriveModal(true)}
                    />
                    <DerivarTareaModal
                        isOpen={showDeriveModal}
                        onClose={() => setShowDeriveModal(false)}
                        task={selectedTask}
                        onComplete={() => { setSelectedTaskId(null); setSelectedTaskType(null); setShowDeriveModal(false); }}
                    />
                </>
            )}
        </div>
    );
}
