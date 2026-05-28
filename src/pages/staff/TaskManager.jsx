import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, Clock, Inbox, User, MapPin } from 'lucide-react';
import { db } from '../../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNotification } from '../../context/NotificationContext';
import { Card, PageHeader, EmptyState } from '../../components/ui';
import TaskCompletionModal from '../../components/staff/modals/TaskCompletionModal';
import DerivarTareaModal from '../../components/staff/modals/DerivarTareaModal';

export default function TaskManager() {
    const { routines, requests, addLog, updateRow, spaces, horses, updateHorseLocation, sendNotification, equipmentItems } = useData();
    const { currentUser } = useAuth();
    const { notify } = useNotification();
    
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [selectedTaskType, setSelectedTaskType] = useState(null);
    const location = useLocation();
    
    const [activeTab, setActiveTab] = useState(() => {
        if (location.pathname.includes('/horses')) return 'location';
        return 'routines';
    });

    useEffect(() => {
        if (location.pathname.includes('/horses')) setActiveTab('location');
        else setActiveTab('routines');
    }, [location.pathname]);
    const [showDeriveModal, setShowDeriveModal] = useState(false);
    
    // Horses location
    const mySpaces = (spaces || []).filter(s => s.staffId === currentUser?.uid);
    const myLoadedHorses = mySpaces.map(s => (horses || []).find(h => h.id === s.horseId)).filter(Boolean);

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

    const getHeaderContent = () => {
        switch(activeTab) {
            case 'location': return { title: 'Caballos', subtitle: 'Control de ubicación y equipos' };
            default: return { title: 'Mis Rutinas', subtitle: 'Rutinas de trabajo asignadas' };
        }
    };
    const header = getHeaderContent();

    return (
        <div className="pb-20 animate-in fade-in">
            <PageHeader 
                kicker="Operativa"
                title={header.title}
                subtitle={header.subtitle}
            />

            <div className="space-y-3 mt-4">
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
                                const horseEquipment = (equipmentItems || []).filter(eq => eq.horseId === horse.id);
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
                                        {horseEquipment.length > 0 && (
                                            <div className="pt-3 border-t border-ink-100">
                                                <h4 className="text-[10px] uppercase font-bold text-ink-400 mb-2 tracking-wider">Set de Equipo Asignado</h4>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {horseEquipment.map(eq => (
                                                        <span key={eq.id} className="text-xs bg-sky-50 text-sky-700 px-2 py-1 rounded border border-sky-100">
                                                            <strong>{eq.name}</strong> ({eq.type})
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
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
