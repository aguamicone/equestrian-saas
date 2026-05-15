import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, Clock, Camera, FileText, ChevronRight, Inbox, User, MapPin } from 'lucide-react';
import { USERS } from '../../services/mockFirebase';

export default function TaskManager() {
    const { routines, requests, addLog, updateRow, spaces, horses, updateHorseLocation } = useData();
    const { currentUser } = useAuth();
    const [selectedTask, setSelectedTask] = useState(null);
    const [activeTab, setActiveTab] = useState('routines');
    
    // Horses location
    const mySpaces = spaces.filter(s => s.staffId === currentUser.uid);
    const myLoadedHorses = mySpaces.map(s => horses.find(h => h.id === s.horseId)).filter(Boolean);

    // Form State for "Advanced Completion"
    const [observation, setObservation] = useState('');
    const [photo, setPhoto] = useState(null);
    const [showDeriveModal, setShowDeriveModal] = useState(false);

    const handleDerive = (targetStaff) => {
        updateRow('REQUESTS', selectedTask.id, {
            assigneeId: targetStaff.uid,
            status: 'pending'
        });
        addLog({
            type: 'request_derivation',
            details: `Derivó tarea "${selectedTask.type}" a ${targetStaff.displayName}`,
            horseId: selectedTask.horseId,
            timestamp: new Date().toISOString()
        });
        setSelectedTask(null);
        setShowDeriveModal(false);
    };

    // Initial Filter
    const myRequests = requests.filter(r =>
        (r.status === 'pending_staff' || r.status === 'pending') && (!r.assigneeId || r.assigneeId === currentUser.uid)
    );

    const handleTaskClick = (item, type) => {
        setSelectedTask({ ...item, _taskType: type });
        setObservation('');
        setPhoto(null);
        setShowDeriveModal(false);
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPhoto(url);
        }
    };

    const completeTask = () => {
        const isRequest = selectedTask._taskType === 'request';

        // Log the completed action
        addLog({
            type: isRequest ? 'request_completion' : 'routine_completion',
            details: `${isRequest ? 'Solicitud' : 'Rutina'} completada: ${selectedTask.type || selectedTask.name}${observation ? `. Nota: ${observation}` : ''}`,
            horseId: selectedTask.horseId || null,
            evidence: photo
        });

        // Use update action if it's a request (mark as done)
        if (isRequest) {
            // Need to update the request object in 'requests' collection
            // MVP DataContext doesn't have explicit update for Requests yet, but we will add logic or simulate
            // Since we don't have updateRequest in context yet, we'll assume updateRow works if collection matches
            // Actually, let's just assume we log it. In a real app we'd update status to 'completed'.
            // Simulating completion by filtering (in memory it won't vanish without real update, so let's try to update status locally if possible)
            // Ideally: updateRequest(selectedTask.id, { status: 'completed' })
            // For now, we will add an 'update' to dbActions manually or just 'hide' it. 
            // Better: updateRow('REQUESTS', selectedTask.id, { status: 'completed' });
            updateRow('REQUESTS', selectedTask.id, { status: 'completed' });
        }

        setSelectedTask(null);
    };

    return (
        <div>
            <h2 className="text-xl font-bold text-slate-100 mb-4">Gestión de Tareas</h2>

            {/* Tabs */}
            <div className="flex mb-4 bg-slate-800 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('routines')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'routines' ? 'bg-slate-700 text-white shadow' : 'text-slate-400'}`}
                >
                    Rutinas
                </button>
                <button
                    onClick={() => setActiveTab('inbox')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'inbox' ? 'bg-slate-700 text-white shadow' : 'text-slate-400'}`}
                >
                    Solicitudes
                    {myRequests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{myRequests.length}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('horses')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'horses' ? 'bg-slate-700 text-white shadow' : 'text-slate-400'}`}
                >
                    Ubicación
                </button>
            </div>

            {/* Content */}
            <div className="space-y-3">

                {activeTab === 'routines' && (
                    <>
                        {routines.map(routine => (
                            <div
                                key={routine.id}
                                onClick={() => handleTaskClick(routine, 'routine')}
                                className="glass-card p-4 flex items-center justify-between active:scale-95 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-700 rounded-full text-gold-500">
                                        <CheckSquare size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-200">{routine.name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Clock size={12} /> {routine.time || 'Flexible'} • {routine.frequency}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-slate-500" />
                            </div>
                        ))}
                        {routines.length === 0 && <p className="text-slate-500 text-center py-6">No hay rutinas asignadas.</p>}
                    </>
                )}

                {activeTab === 'inbox' && (
                    <>
                        {myRequests.map(req => (
                            <div
                                key={req.id}
                                onClick={() => handleTaskClick(req, 'request')}
                                className={`bg-slate-800 border ${req.autoApprove ? 'border-red-500/50 shadow-lg shadow-red-500/10' : 'border-slate-700'} p-4 rounded-xl flex items-center justify-between active:scale-95 transition-all cursor-pointer relative overflow-hidden`}
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${req.autoApprove ? 'bg-red-500' : (req.assigneeId ? 'bg-blue-500' : 'bg-slate-600')}`}></div>
                                <div className="flex items-center gap-4 pl-2">
                                    <div className={`p-3 rounded-full ${req.autoApprove ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-blue-400'}`}>
                                        <Inbox size={20} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-200">{req.type}</h3>
                                            {req.autoApprove && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded leading-none font-bold animate-pulse">DIRECTO</span>}
                                        </div>
                                        <p className="text-xs text-slate-300 italic">{req.details ? `"${req.details}"` : 'Sin detalles adicionales'}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                                            {req.timeRequested && <span className="text-gold-500 font-bold flex items-center gap-1"><Clock size={10}/> Para las {req.timeRequested}</span>}
                                            {req.assigneeId ? <span className="text-blue-400 flex items-center gap-1"><User size={10} /> Asignado a ti</span> : <span>General</span>}
                                            • {req.timestamp ? new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora'}
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-slate-500" />
                            </div>
                        ))}
                        {myRequests.length === 0 && <p className="text-slate-500 text-center py-6">Bandeja de entrada vacía.</p>}
                    </>
                )}

                {activeTab === 'horses' && (
                    <div className="space-y-4 animate-in fade-in">
                        <p className="text-slate-400 text-sm mb-4">Actualiza dónde están los caballos de tu sector en tiempo real.</p>
                        {myLoadedHorses.map(horse => {
                            const loc = horse.location || 'box';
                            return (
                                <div key={horse.id} className="glass-card p-4 space-y-3">
                                    <div className="flex items-center gap-3 border-b border-slate-700/50 pb-3">
                                        <div className="p-2 bg-slate-700 rounded-lg text-gold-500"><MapPin size={20}/></div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg leading-tight">{horse.name}</h3>
                                            <span className="text-xs text-slate-400">Ubicación actual: <strong className="text-slate-200 capitalize">{loc}</strong></span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button 
                                            onClick={() => updateHorseLocation(horse.id, 'box')}
                                            className={`py-2 text-xs font-bold rounded-lg border transition-all ${loc === 'box' ? 'bg-slate-700 border-slate-500 text-white shadow-inner' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}>
                                            🏠 En Box
                                        </button>
                                        <button 
                                            onClick={() => updateHorseLocation(horse.id, 'piquete')}
                                            className={`py-2 text-xs font-bold rounded-lg border transition-all ${loc === 'piquete' ? 'bg-green-900/40 border-green-500/50 text-green-400 shadow-inner' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}>
                                            🌳 En Piquete
                                        </button>
                                        <button 
                                            onClick={() => updateHorseLocation(horse.id, 'circular')}
                                            className={`py-2 text-xs font-bold rounded-lg border transition-all ${loc === 'circular' ? 'bg-orange-900/40 border-orange-500/50 text-orange-400 shadow-inner' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}>
                                            ⭕ En Circular
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {myLoadedHorses.length === 0 && (
                            <div className="text-center py-10 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                                <MapPin size={32} className="mx-auto text-slate-600 mb-2"/>
                                <p className="text-slate-400">No tienes caballos asignados a tu sector.</p>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Completion Drawer */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
                    <div className="bg-slate-800 w-full max-w-md rounded-t-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1 bg-slate-600 rounded-full mx-auto mb-6"></div>

                        <h3 className="text-2xl font-bold text-white mb-2">{selectedTask.name || selectedTask.type}</h3>
                        <p className="text-slate-400 text-sm mb-6">Completar {selectedTask._taskType === 'request' ? 'Solicitud' : 'Rutina'}</p>

                        <div className="space-y-4">
                            {/* Observation */}
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                    <FileText size={16} /> Observaciones
                                </label>
                                <textarea
                                    className="input-field"
                                    rows={2}
                                    placeholder="Todo en orden..."
                                    value={observation}
                                    onChange={e => setObservation(e.target.value)}
                                />
                            </div>

                            {/* Photo Upload */}
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                    <Camera size={16} /> Foto de Evidencia
                                </label>
                                <label className="border-2 border-dashed border-slate-600 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-gold-500 transition-colors bg-slate-700/30">
                                    {photo ? (
                                        <img src={photo} alt="Preview" className="h-32 object-cover rounded-lg" />
                                    ) : (
                                        <div className="text-center text-slate-500">
                                            <Camera size={32} className="mx-auto mb-2" />
                                            <span className="text-xs">Toca para subir foto</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                </label>
                            </div>

                            <div className="flex gap-3 mt-4">
                                {selectedTask._taskType === 'request' && (
                                    <button
                                        onClick={() => setShowDeriveModal(true)}
                                        className="flex-1 py-4 text-lg border border-slate-600 rounded-xl text-slate-300 hover:bg-slate-700 flex items-center justify-center gap-2"
                                    >
                                        <User size={18} /> Derivar
                                    </button>
                                )}
                                <button onClick={completeTask} className="flex-[2] btn-primary py-4 text-lg shadow-gold-500/20 shadow-lg">
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Derivation Sub-Modal */}
                    {showDeriveModal && (
                        <div className="absolute inset-0 bg-slate-900 z-50 rounded-t-2xl p-6 animate-in slide-in-from-right duration-300">
                            <h3 className="text-xl font-bold text-white mb-4">Derivar Solicitud</h3>
                            <p className="text-sm text-slate-400 mb-4">Selecciona un compañero para asignar esta tarea:</p>

                            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                                {USERS.filter(u => u.role === 'staff' && u.uid !== currentUser.uid).map(staff => (
                                    <button
                                        key={staff.uid}
                                        onClick={() => handleDerive(staff)}
                                        className="w-full text-left p-4 glass-card border border-slate-700 hover:border-gold-500 flex items-center justify-between"
                                    >
                                        <span className="text-slate-200 font-bold">{staff.displayName}</span>
                                        <ChevronRight size={16} className="text-slate-500" />
                                    </button>
                                ))}
                            </div>

                            <button onClick={() => setShowDeriveModal(false)} className="w-full py-3 text-slate-400">Cancelar</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
