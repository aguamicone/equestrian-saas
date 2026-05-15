import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ChevronLeft, MapPin, Activity, FileText, Syringe, Camera, X, Swords, Medal, Edit3, Clock, Plus } from 'lucide-react';
import { useState } from 'react';

export default function HorseDetails() {
    const { id } = useParams();
    const { horses, logs, requests, addLog } = useData();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('activity');

    // Advanced Logging States
    const [logType, setLogType] = useState('nota'); // 'nota', 'entreno', 'concurso'
    const [logFilter, setLogFilter] = useState('all'); // 'all', 'entreno', 'concurso'
    
    // Concurso event details
    const [eventName, setEventName] = useState('');
    const [eventLoc, setEventLoc] = useState('');
    const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);

    // Entreno details
    const [trainType, setTrainType] = useState('Salto');
    const [trainTime, setTrainTime] = useState('45 min');

    // Track Builder (Diseñador Digital de Pistas)
    const [obstacleCount, setObstacleCount] = useState('');
    const [trackData, setTrackData] = useState([]); // Array: { id, num, type: 'Vertical', derribos: 0, negadas: 0 }

    const handleGenerateTrack = () => {
        const num = parseInt(obstacleCount);
        if(isNaN(num) || num <= 0 || num > 30) return;
        const newTrack = Array.from({length: num}, (_, i) => ({
            id: Date.now() + i,
            num: i + 1,
            type: 'Vertical',
            derribos: 0,
            negadas: 0
        }));
        setTrackData(newTrack);
    };

    const handleFilterChange = (type) => {
        setLogFilter(type);
        if (type !== 'all') {
            setLogType(type); // Auto switch log mode to match viewing mode
        }
    };

    const updateObstacle = (obsId, field, value) => {
        setTrackData(prev => prev.map(obs => obs.id === obsId ? { ...obs, [field]: value } : obs));
    };

    const incrementFault = (obsId, field) => {
        setTrackData(prev => prev.map(obs => obs.id === obsId ? { ...obs, [field]: obs[field] + 1 } : obs));
    };
    
    // Comment State
    const [newComment, setNewComment] = useState('');
    const [newPhoto, setNewPhoto] = useState(null);

    // Document Modal State
    const [selectedDoc, setSelectedDoc] = useState(null);

    const horse = horses.find(h => h.id === id);

    if (!horse) return <div className="p-8 text-white">Caballo no encontrado.</div>;

    const handleAddComment = () => {
        let finalDetails = newComment || '';
        let finalType = 'client_note';
        let storedTrack = null;

        if (logType === 'entreno') {
            finalType = 'training_log';
            finalDetails = `Entrenamiento de ${trainType} (${trainTime}).\n` + finalDetails;
            if (trainType === 'Salto' && trackData.length > 0) {
                storedTrack = trackData;
            }
        } else if (logType === 'concurso') {
            finalType = 'show_jumping_log';
            finalDetails = `Concurso: ${eventName || 'Sin nombre'} | Ubic: ${eventLoc || '-'}\n` + finalDetails;
            if (trackData.length > 0) {
                storedTrack = trackData;
            }
        }

        // Calculate totals dynamically from track
        let totalDerribos = 0;
        let totalNegadas = 0;
        if(storedTrack) {
            totalDerribos = storedTrack.reduce((sum, obs) => sum + obs.derribos, 0);
            totalNegadas = storedTrack.reduce((sum, obs) => sum + obs.negadas, 0);
        }

        // Mensajes customizados para confirmación
        let successMsg = 'Nota guardada exitosamente';
        if (logType === 'entreno') successMsg = 'Nuevo entrenamiento guardado exitosamente';
        if (logType === 'concurso') successMsg = 'Registro de concurso guardado exitosamente';

        addLog({
            type: finalType,
            details: finalDetails,
            horseId: id,
            evidence: newPhoto,
            timestamp: logType === 'concurso' ? new Date(`${eventDate}T12:00:00`).toISOString() : new Date().toISOString(),
            trackData: storedTrack,
            trackTotals: storedTrack ? { derribos: totalDerribos, negadas: totalNegadas } : null
        }, successMsg);
        
        // Reset
        setNewComment('');
        setNewPhoto(null);
        setEventName('');
        setEventLoc('');
        setTrackData([]);
        setObstacleCount('');
        setLogType('nota');
    };

    // Mock Health/Docs Data
    const healthRecords = [
        { id: 1, type: 'vaccine', name: 'Influenza Equina', date: '2024-02-15', vet: 'Dr. House', nextDue: '2024-08-15', status: 'ok' }
    ];

    const docs = [
        { id: 1, name: 'Certificado de Pedigree', type: 'PDF', url: '#' }
    ];

    // Combine Logs and Requests
    const horseRequests = requests.filter(r => r.horseId === id);
    const horseLogs = logs.filter(l => l.horseId === id);

    const timeline = [
        ...horseRequests.map(r => ({ ...r, _source: 'request', date: r.timestamp })),
        ...horseLogs.map(l => ({ ...l, _source: 'log', date: l.timestamp }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filtered Timeline
    const displayedTimeline = timeline.filter(item => {
        if (logFilter === 'all') return true;
        if (logFilter === 'entreno') return item.type === 'training_log';
        if (logFilter === 'concurso') return item.type === 'show_jumping_log';
        return true;
    });

    // Current Loc
    const loc = horse.location || 'box';
    const locColors = {
        box: 'bg-slate-700/80 text-white',
        piquete: 'bg-green-600/90 text-white shadow-green-500/20',
        circular: 'bg-orange-600/90 text-white shadow-orange-500/20'
    };

    return (
        <div className="pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                    <ChevronLeft />
                </button>
                <h2 className="text-2xl font-bold text-slate-100">{horse.name}</h2>
            </div>

            {/* Profile Card */}
            <div className="glass-card mb-6 shadow-lg">
                <div className="h-48 bg-slate-700 relative">
                    {horse.photo ? (
                        <img src={horse.photo} className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-4xl">🐴</div>
                    )}
                    
                    {/* Realtime Badge */}
                    <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold shadow-lg backdrop-blur-sm ${locColors[loc]}`}>
                        <MapPin size={14}/> {loc === 'box' ? 'Descansando en Box' : loc === 'piquete' ? 'Paseando en Piquete' : 'Entrenando en Circular'}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent p-4">
                        <div className="flex gap-2 text-sm text-slate-300">
                            <span className="px-3 py-1 bg-slate-800/80 rounded-full border border-slate-600 font-medium">{horse.breed}</span>
                            <span className="px-3 py-1 bg-slate-800/80 rounded-full border border-slate-600 font-medium">{horse.age} años</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex mb-6 border-b border-slate-700">
                <button onClick={() => setActiveTab('activity')} className={`flex-1 pb-2 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === 'activity' ? 'text-gold-500 border-b-2 border-gold-500' : 'text-slate-400'}`}>
                    <Activity size={16}/> Bitácora
                </button>
                <button onClick={() => setActiveTab('health')} className={`flex-1 pb-2 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === 'health' ? 'text-gold-500 border-b-2 border-gold-500' : 'text-slate-400'}`}>
                    <Syringe size={16}/> Sanidad
                </button>
                <button onClick={() => setActiveTab('docs')} className={`flex-1 pb-2 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === 'docs' ? 'text-gold-500 border-b-2 border-gold-500' : 'text-slate-400'}`}>
                    <FileText size={16}/> Doc.
                </button>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'activity' && (
                    <div className="space-y-4">
                        {/* New Bitacora Input */}
                        <div className="glass-card p-4 shadow-md">
                            <div className="flex gap-2 mb-4 bg-slate-900 rounded-lg p-1">
                                <button onClick={()=>setLogType('nota')} className={`flex-1 py-1.5 text-xs font-bold rounded flex justify-center items-center gap-1 transition-colors ${logType==='nota'?'bg-slate-700 text-white':'text-slate-500'}`}><Edit3 size={14}/> Nota</button>
                                <button onClick={()=>setLogType('entreno')} className={`flex-1 py-1.5 text-xs font-bold rounded flex justify-center items-center gap-1 transition-colors ${logType==='entreno'?'bg-blue-600/20 text-blue-400':'text-slate-500'}`}><Swords size={14}/> Entreno</button>
                                <button onClick={()=>setLogType('concurso')} className={`flex-1 py-1.5 text-xs font-bold rounded flex justify-center items-center gap-1 transition-colors ${logType==='concurso'?'bg-gold-500/20 text-gold-500':'text-slate-500'}`}><Medal size={14}/> Concurso</button>
                            </div>

                            {/* Dynamic Forms based on logType */}
                            {logType === 'entreno' && (
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <select className="input-field text-sm p-2" value={trainType} onChange={e=>setTrainType(e.target.value)}>
                                        <option value="Plano">Trabajo en Plano</option>
                                        <option value="Salto">Día de Salto</option>
                                        <option value="Cuerda">Trabajo a la Cuerda</option>
                                    </select>
                                    <select className="input-field text-sm p-2" value={trainTime} onChange={e=>setTrainTime(e.target.value)}>
                                        <option value="30 min">30 min</option>
                                        <option value="45 min">45 min</option>
                                        <option value="1 hora">1 hora o más</option>
                                    </select>
                                </div>
                            )}

                            {logType === 'concurso' && (
                                <div className="grid grid-cols-1 gap-3 mb-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] text-slate-400 uppercase">Nombre del Evento</label>
                                            <input type="text" className="input-field text-sm p-2" placeholder="Ej: FEI Grand Prix" value={eventName} onChange={e=>setEventName(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400 uppercase">Fecha Evento</label>
                                            <input type="date" className="input-field text-sm p-2" value={eventDate} onChange={e=>setEventDate(e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 uppercase">Ubicación / Club</label>
                                        <input type="text" className="input-field text-sm p-2" placeholder="Ej: Club Hípico Argentino" value={eventLoc} onChange={e=>setEventLoc(e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* Track Builder Area */}
                            {((logType === 'concurso') || (logType === 'entreno' && trainType === 'Salto')) && (
                                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/80 mb-3 mt-3 shadow-inner">
                                    <h4 className="text-sm font-bold text-slate-300 mb-2 flex items-center justify-between">
                                        Diseñador de Pista Digital
                                        {trackData.length > 0 && <button onClick={() => setTrackData([])} className="text-xs text-red-500 hover:text-red-400 bg-red-900/20 px-2 py-0.5 rounded">Reiniciar Pista</button>}
                                    </h4>
                                    
                                    {trackData.length === 0 ? (
                                        <div className="flex gap-2">
                                            <input type="number" placeholder="Ej: 12 vallas" className="input-field py-1 text-sm bg-slate-800 flex-1" value={obstacleCount} onChange={e=>setObstacleCount(e.target.value)}/>
                                            <button onClick={handleGenerateTrack} className="bg-gold-500 text-slate-900 px-4 font-bold rounded hover:bg-gold-400 shadow-lg shadow-gold-500/20">Armar</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                            {trackData.map(obs => (
                                                <div key={obs.id} className="flex flex-col sm:flex-row gap-2 bg-slate-800 p-2 rounded-lg border border-slate-700 items-start sm:items-center shadow-sm">
                                                    <div className="font-bold text-slate-300 w-16 text-center sm:text-left text-sm bg-slate-900 px-2 py-1 rounded">Valla {obs.num}</div>
                                                    <select className="input-field py-1 text-xs w-full sm:w-32 bg-slate-900" value={obs.type} onChange={e=>updateObstacle(obs.id, 'type', e.target.value)}>
                                                        <option>Vertical</option>
                                                        <option>Oxer</option>
                                                        <option>Corral Doble</option>
                                                        <option>Corral Triple</option>
                                                        <option>Ría / Agua</option>
                                                        <option>Muro</option>
                                                    </select>
                                                    <div className="flex gap-2 ml-auto shrink-0 w-full sm:w-auto h-full">
                                                        <button onClick={()=>incrementFault(obs.id, 'derribos')} className={`flex-1 sm:flex-none text-xs font-bold border rounded px-2 py-1 flex items-center justify-center gap-1.5 transition-colors ${obs.derribos > 0 ? 'bg-red-500 text-white border-red-500' : 'bg-red-900/20 text-red-400 border-red-500/50 hover:bg-red-500 hover:text-white'}`}>
                                                            Derribo <span className="bg-black/30 rounded-full w-4 h-4 flex items-center justify-center">{obs.derribos}</span>
                                                        </button>
                                                        <button onClick={()=>incrementFault(obs.id, 'negadas')} className={`flex-1 sm:flex-none text-xs font-bold border rounded px-2 py-1 flex items-center justify-center gap-1.5 transition-colors ${obs.negadas > 0 ? 'bg-orange-500 text-white border-orange-500' : 'bg-orange-900/20 text-orange-400 border-orange-500/50 hover:bg-orange-500 hover:text-white'}`}>
                                                            Negada <span className="bg-black/30 rounded-full w-4 h-4 flex items-center justify-center">{obs.negadas}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <textarea
                                className="input-field mb-3 text-sm focus:border-gold-500 transition-colors"
                                rows={2}
                                placeholder={logType === 'concurso' ? "Comentarios generales sobre la competencia..." : "Escribe una observación detallada del rendimiento..."}
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                            />

                            <div className="flex justify-between items-center border-t border-slate-700/50 pt-3">
                                <label className="text-xs text-slate-400 flex items-center gap-2 cursor-pointer hover:text-white bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-600 hover:border-slate-500 transition-all">
                                    <Camera size={14} />
                                    {newPhoto ? 'Foto Adjunta' : (logType === 'concurso' ? 'Subir Foto de Pista / Entorno' : 'Adjuntar Media')}
                                    <input type="file" className="hidden" accept="image/*" onChange={e => {
                                        if (e.target.files[0]) setNewPhoto(URL.createObjectURL(e.target.files[0]));
                                    }} />
                                </label>
                                <button
                                    onClick={handleAddComment}
                                    disabled={logType === 'nota' && !newComment && !newPhoto}
                                    className="px-6 py-1.5 bg-gold-500 text-slate-900 font-bold rounded-lg text-sm hover:bg-gold-400 disabled:opacity-50 shadow-lg shadow-gold-500/20"
                                >
                                    Guardar Archivo
                                </button>
                            </div>
                            {newPhoto && <div className="mt-3 relative inline-block"><img src={newPhoto} className="h-24 rounded-lg border border-slate-600 object-cover" /><button onClick={()=>setNewPhoto(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X size={12}/></button></div>}
                        </div>

                        {/* Visual Pills Filters */}
                        <div className="flex gap-2 mb-2 pb-2 overflow-x-auto hide-scrollbar border-b border-slate-700/50">
                            <button onClick={() => handleFilterChange('all')} className={`shrink-0 px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${logFilter === 'all' ? 'bg-slate-700 text-white border-slate-500 shadow-inner' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-slate-300'}`}>Todos los Registros</button>
                            <button onClick={() => handleFilterChange('entreno')} className={`shrink-0 px-4 py-1.5 text-xs font-bold rounded-full border transition-all flex items-center gap-1.5 ${logFilter === 'entreno' ? 'bg-blue-900/40 text-blue-400 border-blue-500/50 shadow-inner shadow-blue-500/10' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-slate-300'}`}><Swords size={12}/> Entrenamientos</button>
                            <button onClick={() => handleFilterChange('concurso')} className={`shrink-0 px-4 py-1.5 text-xs font-bold rounded-full border transition-all flex items-center gap-1.5 ${logFilter === 'concurso' ? 'bg-gold-900/40 text-gold-400 border-gold-500/50 shadow-inner shadow-gold-500/10' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-slate-300'}`}><Medal size={12}/> Concursos</button>
                        </div>

                        {displayedTimeline.length === 0 && <div className="text-slate-500 text-center py-8 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">No hay registros para este filtro.</div>}
                        
                        {displayedTimeline.map((item, idx) => {
                            const isReq = item._source === 'request';
                            const isTrain = item.type === 'training_log';
                            const isJump = item.type === 'show_jumping_log';
                            const isSys = isReq || item.type === 'routine_completion';

                            // Safe check string inclusions
                            const safeDetails = item.details || '';

                            return (
                                <div key={`${item._source}-${item.id}-${idx}`} className="flex flex-col p-4 glass-card border border-slate-700 relative overflow-hidden group">
                                    {isJump && <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/5 rounded-bl-full pointer-events-none"></div>}
                                    
                                    <div className="flex gap-4">
                                        <div className="mt-1">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-inner z-10 relative ${
                                                isJump ? 'bg-gold-500/10 text-gold-500 border border-gold-500/20 shadow-gold-500/10' :
                                                isTrain ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-blue-500/10' :
                                                isReq ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-700 text-slate-400 border border-slate-600'
                                            }`}>
                                                {isJump ? <Medal size={18}/> : isTrain ? <Swords size={18}/> : isReq ? <Activity size={18}/> : <FileText size={18}/>}
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`font-bold ${isJump ? 'text-gold-400' : isTrain ? 'text-blue-300' : 'text-slate-200'} leading-snug`}>
                                                    {isReq ? `Solicitud: ${item.type || item.subtype}` : safeDetails.split('\n')[0]}
                                                </h4>
                                            </div>
                                            
                                            {/* Display the note part if it exists */}
                                            {!isReq && safeDetails.split('\n')[1] && (
                                                <p className="text-sm text-slate-300 mt-1.5 font-medium opacity-90 border-l-2 border-slate-600 pl-3">
                                                    "{safeDetails.split('\n')[1]}"
                                                </p>
                                            )}

                                            {item.evidence && (
                                                <img src={item.evidence} className="mt-3 w-full max-h-48 object-cover rounded-lg border border-slate-600 shadow-md" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Embedded Track Builder Analysis */}
                                    {item.trackData && item.trackData.length > 0 && (
                                        <div className="mt-4 bg-slate-900/50 rounded-lg p-3 border border-slate-700/50 shadow-inner relative z-10 w-full overflow-hidden">
                                            <h5 className="text-xs uppercase text-slate-400 font-bold mb-2 flex justify-between items-center">
                                                <span>Análisis de Pista</span>
                                                <span className={`${(item.trackTotals?.derribos > 0 || item.trackTotals?.negadas > 0) ? 'text-red-400' : 'text-green-500'} bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700`}>
                                                    {item.trackTotals?.derribos} Derribos, {item.trackTotals?.negadas} Negadas
                                                </span>
                                            </h5>
                                            <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                                                {item.trackData.map(obs => {
                                                    const isFaulty = obs.derribos > 0 || obs.negadas > 0;
                                                    return (
                                                        <div key={obs.id} className={`shrink-0 flex flex-col items-center justify-center w-[60px] h-[72px] rounded-lg border transition-transform hover:scale-105 shadow-sm ${isFaulty ? 'bg-red-900/20 border-red-500/40 text-red-100' : 'bg-slate-800/80 border-slate-600 text-slate-300'}`}>
                                                            <span className={`text-[10px] font-bold ${isFaulty ? 'text-red-300' : 'text-slate-400'}`}>V{obs.num}</span>
                                                            <span className="text-[10px] leading-tight text-center px-0.5 font-medium truncate w-full">
                                                                {obs.type === 'Corral Doble' ? 'Doble' : obs.type === 'Corral Triple' ? 'Triple' : obs.type.substring(0, 8)}
                                                            </span>
                                                            {isFaulty && (
                                                                <div className="flex gap-1 mt-1 justify-center">
                                                                    {obs.derribos > 0 && <span className="w-3.5 h-3.5 bg-red-500 text-white flex items-center justify-center rounded-sm text-[9px] font-bold shadow-sm" title="Derribos">{obs.derribos}D</span>}
                                                                    {obs.negadas > 0 && <span className="w-3.5 h-3.5 bg-orange-500 text-white flex items-center justify-center rounded-sm text-[9px] font-bold shadow-sm" title="Negadas">{obs.negadas}N</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Metadata Footer */}
                                    <div className="ml-[56px] mt-3 pt-2 text-xs flex flex-wrap items-center justify-between border-t border-slate-700 font-medium uppercase tracking-wider gap-y-2">
                                        <span className="flex items-center gap-1.5 text-slate-400">
                                            <Clock size={12} /> {item.date && isValidDate(item.date) ? `${new Date(item.date).toLocaleDateString()} a las ${new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Fecha desconocida'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] ${isReq ? 'bg-indigo-900/30 text-indigo-400' : (isTrain || isJump) ? 'bg-gold-900/20 text-gold-500' : 'bg-slate-800 text-slate-500'}`}>
                                            {isReq ? 'Gestión Admin' : (isTrain || isJump) ? 'Registro Deportivo' : 'Sistema general'}
                                        </span>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'health' && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="glass-card p-4">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <Syringe size={18} className="text-blue-400" /> Vacunación
                            </h3>
                            <div className="space-y-3">
                                {healthRecords.map(rec => (
                                    <div key={rec.id} className="flex justify-between items-center text-sm border-b border-slate-700 pb-2 last:border-0">
                                        <div>
                                            <div className="text-slate-200 font-medium">{rec.name}</div>
                                            <div className="text-xs text-slate-500">Vet: {rec.vet} • {rec.date}</div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-green-400 font-bold text-xs uppercase tracking-wider">Al Día</span>
                                            <span className="text-xs text-slate-500">Vence: {rec.nextDue}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'docs' && (
                    <div className="space-y-3 animate-in fade-in">
                        {horse.pedigree && (
                            <div className="flex items-center justify-between p-4 glass-card border border-slate-700 hover:border-slate-500 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-700 rounded-lg text-gold-500 shadow-inner">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <div className="text-slate-200 font-bold">Pedigree Oficial</div>
                                        <div className="text-xs text-slate-500">Documento de Registro</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedDoc(horse.pedigree)}
                                    className="px-4 py-1.5 text-xs font-bold bg-gold-500 text-slate-900 rounded-lg shadow-lg shadow-gold-500/20 hover:bg-gold-400"
                                >
                                    Abrir
                                </button>
                            </div>
                        )}
                        {docs.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-4 glass-card border border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-700 rounded-lg text-slate-400">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <div className="text-slate-200 font-bold">{doc.name}</div>
                                        <div className="text-xs text-slate-500">{doc.type}</div>
                                    </div>
                                </div>
                                <button className="px-4 py-1.5 text-xs font-bold bg-slate-700 text-white rounded-lg hover:bg-slate-600">
                                    Abrir
                                </button>
                            </div>
                        ))}
                        <button className="w-full py-4 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:border-gold-500 hover:text-gold-500 transition-colors flex items-center justify-center gap-2 font-bold bg-slate-800/30">
                            <Plus size={18} /> Subir Documento
                        </button>
                    </div>
                )}
            </div>
            
            {/* Modal de Documentos */}
            {selectedDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm" onClick={() => setSelectedDoc(null)}>
                    <button onClick={() => setSelectedDoc(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/50 rounded-full p-2 transition-colors"><X size={32} /></button>
                    <div className="max-w-4xl max-h-[90vh] overflow-auto rounded-xl bg-slate-900 shadow-2xl border border-slate-800" onClick={e => e.stopPropagation()}>
                        <img src={selectedDoc} className="w-full h-auto block" alt="Documento expandido"/>
                    </div>
                </div>
            )}
        </div>
    );
}

// Global scope helper for defensive checking
function isValidDate(d) {
    const timestamp = Date.parse(d);
    return !isNaN(timestamp);
}
