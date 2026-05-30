import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { ChevronLeft, MapPin, Activity, FileText, Syringe, Camera, X, Swords, Medal, Edit3, Clock, Plus, Stethoscope, Heart } from 'lucide-react';
import { useState } from 'react';
import { Card, Badge, Tabs, EmptyState } from '../../components/ui';
import { storage } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function HorseDetails() {
    const { id } = useParams();
    const { horses, logs, requests, addLog, updateRow } = useData();
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
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    // Document Modal State
    const [selectedDoc, setSelectedDoc] = useState(null);

    const horse = horses.find(h => h.id === id);

    if (!horse) return <div className="p-8 text-white">Caballo no encontrado.</div>;

    const handleProfilePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            setIsUploadingPhoto(true);
            const fileRef = ref(storage, `horses/${id}/profile_${Date.now()}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            await updateRow('HORSES', id, { photo: url });
        } catch (err) {
            console.error("Error al subir foto:", err);
            alert("No se pudo subir la foto. Asegurate de tener conexión y el plan Blaze activado.");
        } finally {
            setIsUploadingPhoto(false);
        }
    };

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
        ...horseRequests.map(r => ({ ...r, _source: 'request', date: r.timestamp, _ts: getTimestamp(r) })),
        ...horseLogs.map(l => ({ ...l, _source: 'log', date: l.timestamp, _ts: getTimestamp(l) }))
    ].sort((a, b) => b._ts - a._ts);

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
        box: 'bg-ink-100 text-ink-700 border border-ink-200',
        piquete: 'bg-success-50 text-success-700 border border-success-200',
        circular: 'bg-gold-50 text-gold-700 border border-gold-200'
    };

    return (
        <div className="pb-20">
            {/* Header */}
            <button onClick={() => navigate(-1)} className="text-ink-600 hover:text-primary-600 mb-4 flex items-center gap-2 transition-colors font-medium">
                <ChevronLeft size={20} /> Volver
            </button>

            {/* Profile Card */}
            <Card padding="none" className="mb-6 overflow-hidden">
                <div className="aspect-[16/9] md:aspect-[21/9] max-h-64 bg-ink-100 relative">
                    {horse.photo ? (
                        <img src={horse.photo} className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-4xl">🐴</div>
                    )}
                    
                    {/* Upload Overlay */}
                    <label className="absolute inset-0 z-20 cursor-pointer group/upload">
                        <input type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoUpload} disabled={isUploadingPhoto} />
                        <div className="absolute inset-0 bg-ink-900/0 group-hover/upload:bg-ink-900/30 transition-all flex items-center justify-center">
                            <div className="bg-white/95 backdrop-blur-md text-ink-800 px-4 py-2.5 rounded-full font-bold text-sm shadow-xl opacity-0 group-hover/upload:opacity-100 transition-all flex items-center gap-2 transform translate-y-4 group-hover/upload:translate-y-0">
                                {isUploadingPhoto ? (
                                    <span className="animate-pulse">Subiendo foto...</span>
                                ) : (
                                    <>
                                        <Camera size={18} className="text-primary-600"/>
                                        {horse.photo ? 'Cambiar Foto' : 'Subir Foto'}
                                    </>
                                )}
                            </div>
                        </div>
                    </label>
                    
                    {/* Realtime Badge */}
                    <div className="absolute top-4 right-4">
                        <Badge 
                            variant={loc === 'box' ? 'neutral' : loc === 'piquete' ? 'success' : 'gold'}
                            icon={MapPin}
                            className="shadow-sm backdrop-blur-sm"
                        >
                            {loc === 'box' ? 'Descansando en Box' : loc === 'piquete' ? 'Paseando en Piquete' : 'Entrenando en Circular'}
                        </Badge>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink-900/60 to-transparent p-6">
                        <h2 className="text-3xl font-bold text-white drop-shadow-md mb-2">{horse.name}</h2>
                        <div className="flex gap-2 text-sm text-ink-700">
                            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full border border-white/20 font-medium shadow-sm">{horse.breed}</span>
                            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full border border-white/20 font-medium shadow-sm">{horse.age} años</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Tabs */}
            <Tabs 
                tabs={[
                    { key: 'activity', label: 'Bitácora', icon: Activity },
                    { key: 'health', label: 'Sanidad', icon: Syringe },
                    { key: 'docs', label: 'Doc.', icon: FileText },
                    { key: 'alimentacion', label: 'Alimentación', icon: Heart }
                ]}
                value={activeTab}
                onChange={setActiveTab}
                className="mb-6"
            />

            {/* Tab Content */}
            <div>
                {activeTab === 'activity' && (
                    <div className="space-y-4">
                        {/* New Bitacora Input */}
                        <Card padding="normal" className="mb-6 shadow-sm border border-ink-100">
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                <button onClick={()=>setLogType('nota')} className={`flex flex-col sm:flex-row items-center justify-center gap-2 px-2 py-3 sm:px-4 sm:py-3 rounded-xl transition-all ${logType === 'nota' ? 'bg-primary-50 text-primary-700 border-2 border-primary-300 font-semibold' : 'bg-white text-ink-500 border-2 border-ink-200 hover:bg-ink-50'}`}>
                                    <FileText size={18}/>
                                    <span className="text-sm">Nota</span>
                                </button>
                                <button onClick={()=>setLogType('entreno')} className={`flex flex-col sm:flex-row items-center justify-center gap-2 px-2 py-3 sm:px-4 sm:py-3 rounded-xl transition-all ${logType === 'entreno' ? 'bg-primary-50 text-primary-700 border-2 border-primary-300 font-semibold' : 'bg-white text-ink-500 border-2 border-ink-200 hover:bg-ink-50'}`}>
                                    <Activity size={18}/>
                                    <span className="text-sm">Entreno</span>
                                </button>
                                <button onClick={()=>setLogType('concurso')} className={`flex flex-col sm:flex-row items-center justify-center gap-2 px-2 py-3 sm:px-4 sm:py-3 rounded-xl transition-all ${logType === 'concurso' ? 'bg-primary-50 text-primary-700 border-2 border-primary-300 font-semibold' : 'bg-white text-ink-500 border-2 border-ink-200 hover:bg-ink-50'}`}>
                                    <Medal size={18}/>
                                    <span className="text-sm">Concurso</span>
                                </button>
                            </div>

                            {/* Dynamic Forms based on logType */}
                            {logType === 'entreno' && (
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div>
                                        <label className="text-sm text-ink-700 font-medium block mb-1">Tipo de Trabajo</label>
                                        <select className="input-field text-sm p-2 w-full" value={trainType} onChange={e=>setTrainType(e.target.value)}>
                                            <option value="Plano">Trabajo en Plano</option>
                                            <option value="Salto">Día de Salto</option>
                                            <option value="Cuerda">Trabajo a la Cuerda</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm text-ink-700 font-medium block mb-1">Duración</label>
                                        <select className="input-field text-sm p-2 w-full" value={trainTime} onChange={e=>setTrainTime(e.target.value)}>
                                            <option value="30 min">30 min</option>
                                            <option value="45 min">45 min</option>
                                            <option value="1 hora">1 hora o más</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {logType === 'concurso' && (
                                <div className="grid grid-cols-1 gap-3 mb-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-sm text-ink-700 font-medium block mb-1">Nombre del Evento</label>
                                            <input type="text" className="input-field text-sm p-2 w-full" placeholder="Ej: FEI Grand Prix" value={eventName} onChange={e=>setEventName(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-sm text-ink-700 font-medium block mb-1">Fecha Evento</label>
                                            <input type="date" className="input-field text-sm p-2 w-full" value={eventDate} onChange={e=>setEventDate(e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-ink-700 font-medium block mb-1">Ubicación / Club</label>
                                        <input type="text" className="input-field text-sm p-2 w-full" placeholder="Ej: Club Hípico Argentino" value={eventLoc} onChange={e=>setEventLoc(e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* Track Builder Area */}
                            {((logType === 'concurso') || (logType === 'entreno' && trainType === 'Salto')) && (
                                <div className="bg-ink-50 p-4 rounded-xl border border-ink-200 mb-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="text-ink-800 font-bold text-sm">Diseñador de Pista Digital</h4>
                                            <p className="text-ink-500 text-xs">Registra el recorrido y las faltas</p>
                                        </div>
                                        {trackData.length > 0 && <button onClick={() => setTrackData([])} className="text-xs text-danger-600 hover:bg-danger-50 px-2 py-1 rounded font-medium transition-colors">Reiniciar Pista</button>}
                                    </div>
                                    
                                    {trackData.length === 0 ? (
                                        <div className="flex gap-2 items-end">
                                            <div className="flex-1 max-w-[120px]">
                                                <input type="number" placeholder="Vallas (ej: 12)" className="input-field py-2 text-sm w-full" value={obstacleCount} onChange={e=>setObstacleCount(e.target.value)}/>
                                            </div>
                                            <button onClick={handleGenerateTrack} className="btn-secondary whitespace-nowrap">Armar</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                            {trackData.map(obs => (
                                                <div key={obs.id} className="flex flex-col sm:flex-row gap-2 bg-white p-3 rounded-lg border border-ink-200 items-start sm:items-center shadow-sm">
                                                    <div className="font-bold text-ink-800 w-16 text-center sm:text-left text-sm px-2 py-1">Valla {obs.num}</div>
                                                    <select className="input-field py-1.5 text-sm w-full sm:w-32 bg-white" value={obs.type} onChange={e=>updateObstacle(obs.id, 'type', e.target.value)}>
                                                        <option>Vertical</option>
                                                        <option>Oxer</option>
                                                        <option>Corral Doble</option>
                                                        <option>Corral Triple</option>
                                                        <option>Ría / Agua</option>
                                                        <option>Muro</option>
                                                    </select>
                                                    <div className="flex gap-2 ml-auto shrink-0 w-full sm:w-auto h-full">
                                                        <button onClick={()=>incrementFault(obs.id, 'derribos')} className="flex-1 sm:flex-none text-xs font-medium rounded px-2 py-1.5 flex items-center justify-center gap-1.5 transition-colors bg-danger-50 text-danger-600 hover:bg-danger-100">
                                                            +1 Derribo <span className="text-ink-800 font-semibold ml-1">{obs.derribos}</span>
                                                        </button>
                                                        <button onClick={()=>incrementFault(obs.id, 'negadas')} className="flex-1 sm:flex-none text-xs font-medium rounded px-2 py-1.5 flex items-center justify-center gap-1.5 transition-colors bg-warning-50 text-warning-600 hover:bg-warning-100">
                                                            +1 Negada <span className="text-ink-800 font-semibold ml-1">{obs.negadas}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <label className="text-sm text-ink-700 font-medium block mb-1">Comentarios y Observaciones</label>
                            <textarea
                                className="bg-white border border-ink-200 rounded-lg px-3 py-2 text-ink-800 min-h-[80px] w-full focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-colors mb-3"
                                placeholder={logType === 'concurso' ? "Comentarios generales sobre la competencia..." : "Escribe una observación detallada del rendimiento..."}
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                            />

                            <div className="flex justify-between items-center border-t border-ink-100 pt-4">
                                <label className="text-xs text-ink-600 font-medium flex items-center gap-2 cursor-pointer hover:bg-ink-100 px-3 py-2 rounded-lg transition-colors border border-ink-200">
                                    <Camera size={16} className="text-primary-600" />
                                    <span className="hidden sm:inline">{newPhoto ? 'Foto Adjunta' : (logType === 'concurso' ? 'Subir Foto de Pista' : 'Adjuntar Media')}</span>
                                    <span className="sm:hidden">{newPhoto ? 'Foto' : 'Foto'}</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={e => {
                                        if (e.target.files[0]) setNewPhoto(URL.createObjectURL(e.target.files[0]));
                                    }} />
                                </label>
                                <button
                                    onClick={handleAddComment}
                                    disabled={logType === 'nota' && !newComment && !newPhoto}
                                    className="btn-primary disabled:opacity-50"
                                >
                                    Guardar Archivo
                                </button>
                            </div>
                            {newPhoto && (
                                <div className="mt-3 relative inline-block">
                                    <img src={newPhoto} className="w-20 h-20 rounded-lg border border-ink-200 object-cover" />
                                    <button onClick={()=>setNewPhoto(null)} className="absolute -top-2 -right-2 bg-ink-900/60 text-white hover:bg-danger-600 rounded-full p-1 transition-colors">
                                        <X size={12}/>
                                    </button>
                                </div>
                            )}
                        </Card>

                        {/* Visual Pills Filters */}
                        <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
                            <button onClick={() => handleFilterChange('all')} className={`shrink-0 px-4 py-1.5 text-sm font-semibold rounded-full border transition-all ${logFilter === 'all' ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-ink-500 border-ink-200 hover:bg-ink-50'}`}>Todos</button>
                            <button onClick={() => handleFilterChange('entreno')} className={`shrink-0 px-4 py-1.5 text-sm font-semibold rounded-full border transition-all flex items-center gap-1.5 ${logFilter === 'entreno' ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-ink-500 border-ink-200 hover:bg-ink-50'}`}>Entrenos</button>
                            <button onClick={() => handleFilterChange('concurso')} className={`shrink-0 px-4 py-1.5 text-sm font-semibold rounded-full border transition-all flex items-center gap-1.5 ${logFilter === 'concurso' ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-white text-ink-500 border-ink-200 hover:bg-ink-50'}`}>Concursos</button>
                        </div>

                        {displayedTimeline.length === 0 && (
                            <div className="text-ink-500 text-center py-8 bg-ink-50 rounded-xl border border-dashed border-ink-200">No hay registros para este filtro.</div>
                        )}
                        
                        {displayedTimeline.map((item, idx) => {
                            const isReq = item._source === 'request';
                            const isTrain = item.type === 'training_log';
                            const isJump = item.type === 'show_jumping_log';

                            // Safe check string inclusions
                            const safeDetails = item.details || item.description || '';

                            return (
                                <Card key={`${item._source}-${item.id}-${idx}`} padding="normal" className="mb-3 flex flex-col group border border-ink-100">
                                    <div className="flex gap-3">
                                        <div className="shrink-0 mt-1">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                isJump ? 'bg-gold-50 text-gold-600' :
                                                isTrain ? 'bg-success-50 text-success-600' :
                                                isReq ? 'bg-warning-50 text-warning-600' : 'bg-primary-50 text-primary-600'
                                            }`}>
                                                {isJump ? <Medal size={20}/> : isTrain ? <Activity size={20}/> : isReq ? <Activity size={20}/> : <FileText size={20}/>}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className="font-semibold text-ink-800 leading-snug break-words">
                                                    {isReq ? `Solicitud: ${item.type || item.subtype}` : safeDetails.split('\n')[0]}
                                                </h4>
                                                <span className="text-[10px] whitespace-nowrap px-2 py-0.5 rounded bg-ink-100 text-ink-500 font-medium">
                                                    {isReq ? 'Gestión' : (isTrain || isJump) ? 'Deportivo' : 'Nota'}
                                                </span>
                                            </div>
                                            
                                            {/* Display the note part if it exists */}
                                            {!isReq && safeDetails.split('\n')[1] && (
                                                <p className="text-sm text-ink-600 mt-1">
                                                    {safeDetails.split('\n')[1]}
                                                </p>
                                            )}

                                            {item.evidence && (
                                                <img src={item.evidence} className="mt-3 w-full max-w-xs h-40 object-cover rounded-lg border border-ink-200 shadow-sm" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Embedded Track Builder Analysis */}
                                    {item.trackData && item.trackData.length > 0 && (
                                        <div className="mt-4 bg-ink-50 rounded-lg p-3 border border-ink-100 w-full overflow-hidden">
                                            <h5 className="text-xs font-bold text-ink-600 mb-2 flex justify-between items-center">
                                                <span>Análisis de Pista</span>
                                                <span className={`${(item.trackTotals?.derribos > 0 || item.trackTotals?.negadas > 0) ? 'text-danger-600' : 'text-success-600'} font-semibold bg-white px-2 py-0.5 rounded-full border border-ink-200 shadow-sm`}>
                                                    {item.trackTotals?.derribos} Derribos, {item.trackTotals?.negadas} Negadas
                                                </span>
                                            </h5>
                                            <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
                                                {item.trackData.map(obs => {
                                                    const isFaulty = obs.derribos > 0 || obs.negadas > 0;
                                                    return (
                                                        <div key={obs.id} className={`shrink-0 flex flex-col items-center justify-center w-[64px] h-[72px] rounded-lg border transition-transform hover:scale-105 shadow-sm ${isFaulty ? 'bg-danger-50 border-danger-200 text-danger-700' : 'bg-white border-ink-200 text-ink-700'}`}>
                                                            <span className={`text-[11px] font-bold ${isFaulty ? 'text-danger-600' : 'text-ink-800'}`}>V{obs.num}</span>
                                                            <span className="text-[10px] leading-tight text-center px-0.5 font-medium truncate w-full text-ink-500">
                                                                {obs.type === 'Corral Doble' ? 'Doble' : obs.type === 'Corral Triple' ? 'Triple' : obs.type.substring(0, 8)}
                                                            </span>
                                                            {isFaulty && (
                                                                <div className="flex gap-1 mt-1 justify-center">
                                                                    {obs.derribos > 0 && <span className="w-4 h-4 bg-danger-500 text-white flex items-center justify-center rounded-sm text-[9px] font-bold shadow-sm" title="Derribos">{obs.derribos}D</span>}
                                                                    {obs.negadas > 0 && <span className="w-4 h-4 bg-warning-500 text-white flex items-center justify-center rounded-sm text-[9px] font-bold shadow-sm" title="Negadas">{obs.negadas}N</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Metadata Footer */}
                                    <div className="ml-[52px] mt-3 pt-2 text-xs flex items-center gap-1.5 text-ink-400 border-t border-ink-100">
                                        <Clock size={12} /> {item.date && isValidDate(item.date) ? `${new Date(item.date).toLocaleDateString()} a las ${new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Fecha desconocida'}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'health' && (
                    <div className="space-y-4 animate-in fade-in">
                        {healthRecords.length === 0 ? (
                            <EmptyState
                                icon={Stethoscope}
                                message="Sin registros sanitarios"
                                description="No hay historial médico cargado para este caballo."
                            />
                        ) : (
                            <div className="space-y-3">
                                {healthRecords.map(rec => (
                                    <Card key={rec.id} padding="normal" className="flex items-center gap-4">
                                        <div className="bg-primary-50 text-primary-600 rounded-lg p-2 shrink-0">
                                            <Syringe size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-ink-800 font-semibold truncate">{rec.name}</div>
                                            <div className="text-xs text-ink-500 truncate">Vet: {rec.vet} • {rec.date}</div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            {rec.status === 'ok' ? (
                                                <Badge variant="success" size="sm">Al Día</Badge>
                                            ) : (
                                                <Badge variant="danger" size="sm">Vencido</Badge>
                                            )}
                                            <div className="text-xs text-ink-500 mt-1">Vence: {rec.nextDue}</div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'docs' && (
                    <div className="space-y-3 animate-in fade-in">
                        {horse.pedigree && (
                            <Card padding="none" className="overflow-hidden cursor-pointer group mb-3" onClick={() => setSelectedDoc(horse.pedigree)}>
                                <div className="p-4 flex items-center justify-between border-b border-ink-100 bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <div className="text-ink-800 font-bold text-lg">Pedigree Oficial</div>
                                            <div className="text-xs text-ink-500">Documento de Registro</div>
                                        </div>
                                    </div>
                                    <span className="text-primary-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">Ver</span>
                                </div>
                                <div className="h-40 bg-ink-100 relative">
                                    <img src={horse.pedigree} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Pedigree Preview" />
                                </div>
                            </Card>
                        )}
                        
                        {docs.length === 0 && !horse.pedigree && (
                            <EmptyState
                                icon={FileText}
                                message="Sin documentos"
                                description="No hay documentos adjuntos para este caballo."
                            />
                        )}

                        {docs.map(doc => (
                            <Card key={doc.id} padding="normal" className="flex items-center gap-4">
                                <div className="bg-primary-50 text-primary-600 rounded-lg p-2 shrink-0">
                                    <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-ink-800 font-semibold truncate">{doc.name}</div>
                                    <div className="text-xs text-ink-500 truncate">{doc.type}</div>
                                </div>
                                <button className="text-ink-500 hover:text-primary-600 transition-colors p-2 rounded-full hover:bg-ink-50">
                                    <FileText size={18} />
                                </button>
                            </Card>
                        ))}
                        
                        <button className="w-full py-4 border-2 border-dashed border-ink-200 rounded-xl text-ink-500 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2 font-semibold bg-white mt-4">
                            <Plus size={18} /> Subir Documento
                        </button>
                    </div>
                )}

                {activeTab === 'alimentacion' && (
                    <div className="space-y-4 animate-in fade-in">
                        {horse.diet?.type === 'masiva' || !horse.diet ? (
                            <Card padding="normal" className="text-center bg-ink-50 border-ink-100">
                                <Heart size={32} className="mx-auto text-ink-300 mb-3" />
                                <h3 className="text-lg font-bold text-ink-800 mb-1">Alimentación General</h3>
                                <p className="text-sm text-ink-600">Este caballo recibe la dieta estándar del establecimiento según las indicaciones generales del personal.</p>
                            </Card>
                        ) : (
                            <Card padding="normal" className="border-primary-100 bg-white">
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-ink-100">
                                    <div className="bg-primary-50 text-primary-600 p-2 rounded-lg">
                                        <Heart size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-ink-800 leading-tight">Dieta Específica</h3>
                                        <p className="text-xs text-ink-500">Plan de alimentación personalizado activo</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-ink-500 uppercase tracking-wider font-semibold mb-1">Alimento</p>
                                        <p className="text-sm text-ink-800 font-medium">{horse.diet.feedType || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-ink-500 uppercase tracking-wider font-semibold mb-1">Cantidad</p>
                                        <p className="text-sm text-ink-800 font-medium">{horse.diet.quantity || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-ink-500 uppercase tracking-wider font-semibold mb-1">Frecuencia</p>
                                        <p className="text-sm text-ink-800 font-medium">{horse.diet.frequency || '-'}</p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <p className="text-xs text-ink-500 uppercase tracking-wider font-semibold mb-1">Instrucciones Especiales</p>
                                        <p className="text-sm text-ink-800 font-medium">{horse.diet.instructions || '-'}</p>
                                    </div>
                                    {horse.diet.startDate && (
                                        <div>
                                            <p className="text-xs text-ink-500 uppercase tracking-wider font-semibold mb-1">Fecha Inicio</p>
                                            <p className="text-sm text-ink-800 font-medium">{horse.diet.startDate}</p>
                                        </div>
                                    )}
                                    {horse.diet.endDate && (
                                        <div>
                                            <p className="text-xs text-ink-500 uppercase tracking-wider font-semibold mb-1">Fecha Fin</p>
                                            <p className="text-sm text-ink-800 font-medium">{horse.diet.endDate}</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>
            
            {/* Modal de Documentos */}
            {selectedDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/80 backdrop-blur-sm" onClick={() => setSelectedDoc(null)}>
                    <button onClick={() => setSelectedDoc(null)} className="absolute top-4 right-4 text-white bg-ink-900/40 hover:bg-ink-900/60 rounded-full p-2 transition-colors z-50"><X size={24} /></button>
                    <div className="max-w-[90vw] max-h-[90vh] overflow-auto rounded-xl shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <img src={selectedDoc} className="max-w-full max-h-[90vh] object-contain mx-auto" alt="Documento expandido"/>
                    </div>
                </div>
            )}
        </div>
    );
}

// Global scope helper for defensive checking
function getTimestamp(item) {
    if (!item.timestamp) return Date.now();
    if (item.timestamp.toDate) return item.timestamp.toDate().getTime();
    if (typeof item.timestamp === 'number') return item.timestamp;
    return new Date(item.timestamp).getTime() || Date.now();
}

function isValidDate(d) {
    const timestamp = Date.parse(d);
    return !isNaN(timestamp);
}
