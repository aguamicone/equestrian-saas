import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Card, PageHeader, EmptyState } from '../../components/ui';
import {
  Trash2, ListTodo, Save, AlertCircle, Trophy, Calendar, Settings,
  MapPin, ClipboardList, Plus, ChevronDown, ChevronUp, Target
} from 'lucide-react';

// ─── Obstacle Type metadata ────────────────────────────────────────────────────
const OBSTACLE_TYPES = {
  vertical: { name: 'Vertical', emoji: '🟥', color: 'bg-danger-500', code: 'V', desc: '1 barra' },
  oxer:     { name: 'Oxer',     emoji: '🟦', color: 'bg-primary-500', code: 'O', desc: '2 barras' },
  doble:    { name: 'Doble',    emoji: '🟪', color: 'bg-purple-500',  code: 'D', desc: 'Combinación 2' },
  triple:   { name: 'Triple',   emoji: '🟫', color: 'bg-indigo-500',  code: 'T', desc: 'Combinación 3' },
  ria:      { name: 'Ría',      emoji: '🟩', color: 'bg-success-400', code: 'R', desc: 'Agua' }
};

// ─── Preset template generator ─────────────────────────────────────────────────
const generateTemplate = (count, height) => {
  const configs = {
    4: [
      { type: 'vertical', exitHand: 'derecha',   metersToNext: 24, stridesToNext: 5 },
      { type: 'oxer',     exitHand: 'izquierda',  metersToNext: 28, stridesToNext: 6 },
      { type: 'vertical', exitHand: 'derecha',   metersToNext: 24, stridesToNext: 5 },
      { type: 'oxer',     exitHand: 'recto',     metersToNext: 0,  stridesToNext: 0 },
    ],
    6: [
      { type: 'vertical', exitHand: 'derecha',   metersToNext: 24, stridesToNext: 5 },
      { type: 'oxer',     exitHand: 'izquierda',  metersToNext: 28, stridesToNext: 6 },
      { type: 'vertical', exitHand: 'derecha',   metersToNext: 26, stridesToNext: 6 },
      { type: 'oxer',     exitHand: 'izquierda',  metersToNext: 24, stridesToNext: 5 },
      { type: 'vertical', exitHand: 'derecha',   metersToNext: 22, stridesToNext: 5 },
      { type: 'oxer',     exitHand: 'recto',     metersToNext: 0,  stridesToNext: 0 },
    ],
    8: [
      { type: 'vertical', exitHand: 'derecha',   metersToNext: 24, stridesToNext: 5 },
      { type: 'vertical', exitHand: 'izquierda',  metersToNext: 28, stridesToNext: 6 },
      { type: 'oxer',     exitHand: 'izquierda',  metersToNext: 30, stridesToNext: 7 },
      { type: 'doble',    exitHand: 'derecha',   metersToNext: 22, stridesToNext: 5 },
      { type: 'vertical', exitHand: 'izquierda',  metersToNext: 24, stridesToNext: 5 },
      { type: 'oxer',     exitHand: 'derecha',   metersToNext: 28, stridesToNext: 6 },
      { type: 'vertical', exitHand: 'izquierda',  metersToNext: 24, stridesToNext: 5 },
      { type: 'vertical', exitHand: 'recto',     metersToNext: 0,  stridesToNext: 0 },
    ],
    10: [
      { type: 'vertical', exitHand: 'derecha',   metersToNext: 24, stridesToNext: 5 },
      { type: 'vertical', exitHand: 'izquierda',  metersToNext: 28, stridesToNext: 6 },
      { type: 'oxer',     exitHand: 'izquierda',  metersToNext: 30, stridesToNext: 7 },
      { type: 'doble',    exitHand: 'derecha',   metersToNext: 22, stridesToNext: 5 },
      { type: 'vertical', exitHand: 'izquierda',  metersToNext: 24, stridesToNext: 5 },
      { type: 'oxer',     exitHand: 'derecha',   metersToNext: 28, stridesToNext: 6 },
      { type: 'vertical', exitHand: 'izquierda',  metersToNext: 24, stridesToNext: 5 },
      { type: 'vertical', exitHand: 'derecha',   metersToNext: 32, stridesToNext: 7 },
      { type: 'oxer',     exitHand: 'izquierda',  metersToNext: 24, stridesToNext: 5 },
      { type: 'vertical', exitHand: 'recto',     metersToNext: 0,  stridesToNext: 0 },
    ],
    12: [
      { type: 'vertical', exitHand: 'derecha',   metersToNext: 24, stridesToNext: 5 },
      { type: 'vertical', exitHand: 'izquierda',  metersToNext: 28, stridesToNext: 6 },
      { type: 'oxer',     exitHand: 'izquierda',  metersToNext: 30, stridesToNext: 7 },
      { type: 'doble',    exitHand: 'derecha',   metersToNext: 22, stridesToNext: 5 },
      { type: 'vertical', exitHand: 'izquierda',  metersToNext: 24, stridesToNext: 5 },
      { type: 'oxer',     exitHand: 'derecha',   metersToNext: 28, stridesToNext: 6 },
      { type: 'vertical', exitHand: 'izquierda',  metersToNext: 24, stridesToNext: 5 },
      { type: 'vertical', exitHand: 'derecha',   metersToNext: 32, stridesToNext: 7 },
      { type: 'triple',   exitHand: 'derecha',   metersToNext: 24, stridesToNext: 5 },
      { type: 'vertical', exitHand: 'derecha',   metersToNext: 28, stridesToNext: 6 },
      { type: 'ria',      exitHand: 'izquierda',  metersToNext: 20, stridesToNext: 4 },
      { type: 'vertical', exitHand: 'recto',     metersToNext: 0,  stridesToNext: 0 },
    ],
  };

  return (configs[count] || []).map((c, i) => ({
    id: `t${count}-${i + 1}`,
    number: i + 1,
    type: c.type,
    exitHand: c.exitHand,
    metersToNext: c.metersToNext,
    stridesToNext: c.stridesToNext,
    status: 'limpio',
    height: height
  }));
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function TrainingCourse() {
  const { currentUser } = useAuth();
  const { horses, trainingRounds, saveTrainingRound, deleteTrainingRound } = useData();

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('secuencia');

  // ─── Course Metadata ──────────────────────────────────────────────────────
  const [courseName, setCourseName] = useState('');
  const [courseDate, setCourseDate] = useState(new Date().toISOString().split('T')[0]);
  const [courseLocation, setCourseLocation] = useState('');
  const [courseTrackType, setCourseTrackType] = useState('arena');
  const [courseHeight, setCourseHeight] = useState('1.20');

  // ─── Obstacles ────────────────────────────────────────────────────────────
  const [obstacles, setObstacles] = useState([]);
  const [expandedObsId, setExpandedObsId] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // ─── Binomio ──────────────────────────────────────────────────────────────
  const myHorses = (horses || []).filter(h => h.ownerId === currentUser?.uid);
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const [riderName, setRiderName] = useState(currentUser?.displayName || '');
  const [roundType, setRoundType] = useState('entrenamiento');
  const [timeLimit, setTimeLimit] = useState(76);
  const [actualTime, setActualTime] = useState(72);

  // ─── Save Modal ───────────────────────────────────────────────────────────
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-select first horse
  useEffect(() => {
    if (!selectedHorseId && myHorses.length > 0) {
      setSelectedHorseId(myHorses[0].id);
    }
  }, [myHorses, selectedHorseId]);

  // ─── Computed ─────────────────────────────────────────────────────────────
  const countJumps = obstacles.length;
  const countKnockdowns = obstacles.filter(o => o.status === 'derribo').length;
  const countRefusals = obstacles.filter(o => o.status === 'rehuse').length;
  const timeFaults = Math.max(0, Math.ceil(actualTime - timeLimit));
  const jumpFaults = (countKnockdowns * 4) + (countRefusals * 4);
  const totalFaults = jumpFaults + timeFaults;
  const totalMeters = obstacles.reduce((sum, o) => sum + (o.metersToNext || 0), 0);
  const selectedHorse = myHorses.find(h => h.id === selectedHorseId);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const syncNumbers = (list) => list.map((obs, i) => ({ ...obs, number: i + 1 }));

  const loadTemplate = (count) => {
    const tpl = generateTemplate(count, courseHeight);
    setObstacles(tpl);
    setExpandedObsId(null);
  };

  const addObstacleToSequence = (type) => {
    const newId = 'obs-' + Date.now();
    const newObs = {
      id: newId, number: obstacles.length + 1, type,
      exitHand: 'derecha', metersToNext: 24, stridesToNext: 5,
      status: 'limpio', height: courseHeight
    };
    setObstacles(syncNumbers([...obstacles, newObs]));
    setExpandedObsId(newId);
    setShowAddMenu(false);
  };

  const deleteObstacle = (id) => {
    setObstacles(syncNumbers(obstacles.filter(o => o.id !== id)));
    if (expandedObsId === id) setExpandedObsId(null);
  };

  const updateObstacleField = (id, field, value) => {
    setObstacles(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const handleSaveRound = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const result = await saveTrainingRound({
      courseName, courseDate, courseLocation, courseTrackType, courseHeight,
      horseName: selectedHorse?.name || 'Sin caballo',
      horseId: selectedHorseId,
      riderName, roundType, time: actualTime, timeLimit,
      faults: totalFaults, jumpFaults, timeFaults,
      obstaclesCount: obstacles.length, totalMeters,
      obstacles: obstacles.map(o => ({
        number: o.number, type: o.type, status: o.status,
        exitHand: o.exitHand, stridesToNext: o.stridesToNext,
        metersToNext: o.metersToNext, height: o.height
      }))
    });
    setIsSaving(false);
    if (result?.success) setSaveModalOpen(false);
  };

  // ─── Tab definitions ──────────────────────────────────────────────────────
  const tabs = [
    { key: 'ficha', label: 'Ficha', icon: ClipboardList, mobileLabel: '📝 Ficha' },
    { key: 'secuencia', label: 'Secuencia', icon: ListTodo, mobileLabel: '📋 Secuencia' },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen select-none flex flex-col -mx-4 -mt-4">

      {/* ═══════ HEADER ═══════ */}
      <div className="px-4 pt-4 pb-2">
        <span className="text-[10px] font-bold tracking-widest text-primary-500 uppercase">Módulo de Entrenamiento</span>
        <h1 className="text-xl font-bold font-display text-ink-900 tracking-tight flex items-center gap-2">
          <Target size={22} className="text-primary-500" /> Pista Digital
        </h1>
        <p className="text-xs text-ink-500 mt-0.5">
          Registrá recorridos, vallas, trancos y resultados.
        </p>
      </div>

      {/* ═══════ TAB BAR ═══════ */}
      <div className="px-4 border-b border-ink-200 bg-white/60 backdrop-blur-sm sticky top-[65px] z-30">
        <div className="flex gap-0 -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-700'
                  : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300'
              }`}
            >
              <tab.icon size={15} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.mobileLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="flex-1 px-4 py-3 pb-24">

        {/* ─── TAB 1: FICHA ─── */}
        {activeTab === 'ficha' && (
          <div className="max-w-2xl mx-auto space-y-3 animate-fade-in">

            {/* Course Info */}
            <Card className="p-3 space-y-3">
              <h3 className="text-sm font-bold text-ink-900 border-b pb-1.5 flex items-center gap-2">
                <Settings size={15} className="text-primary-500" /> Datos del Recorrido
              </h3>
              <div>
                <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Nombre del Recorrido</label>
                <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)}
                  className="input-field text-sm" placeholder="Ej: Copa San Isidro - Recorrido 3" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Fecha</label>
                  <input type="date" value={courseDate} onChange={e => setCourseDate(e.target.value)} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Ubicación</label>
                  <div className="relative">
                    <MapPin size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input type="text" value={courseLocation} onChange={e => setCourseLocation(e.target.value)}
                      className="input-field text-sm pl-8" placeholder="Club / Cancha" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Tipo de Pista</label>
                  <div className="flex gap-1 bg-ink-50 p-0.5 border border-ink-200 rounded-lg">
                    <button type="button" onClick={() => setCourseTrackType('arena')}
                      className={`flex-1 text-center py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 transition-all ${courseTrackType === 'arena' ? 'bg-amber-500 text-white shadow-sm' : 'text-ink-600'}`}>
                      🟤 Arena
                    </button>
                    <button type="button" onClick={() => setCourseTrackType('cesped')}
                      className={`flex-1 text-center py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 transition-all ${courseTrackType === 'cesped' ? 'bg-success-500 text-white shadow-sm' : 'text-ink-600'}`}>
                      🟢 Césped
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Altura del Recorrido</label>
                  <select value={courseHeight} onChange={e => setCourseHeight(e.target.value)} className="input-field text-sm font-bold">
                    {['0.80','0.90','1.00','1.10','1.15','1.20','1.25','1.30','1.35','1.40','1.45','1.50','1.60'].map(h => (
                      <option key={h} value={h}>{h} m</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Binomio */}
            <Card className="p-3 space-y-3">
              <h3 className="text-sm font-bold text-ink-900 border-b pb-1.5 flex items-center gap-2">
                🐴 Binomio y Tipo
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Caballo</label>
                  <select value={selectedHorseId} onChange={e => setSelectedHorseId(e.target.value)} className="input-field text-sm">
                    {myHorses.length === 0 && <option value="">Sin caballos</option>}
                    {myHorses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Jinete</label>
                  <input type="text" value={riderName} onChange={e => setRiderName(e.target.value)}
                    className="input-field text-sm" placeholder="Nombre" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Tipo</label>
                  <div className="flex gap-1 bg-ink-50 p-0.5 border border-ink-200 rounded-lg">
                    <button type="button" onClick={() => setRoundType('entrenamiento')}
                      className={`flex-1 text-center py-1.5 text-xs font-bold rounded ${roundType === 'entrenamiento' ? 'bg-primary-500 text-white shadow-sm' : 'text-ink-600'}`}>
                      Entreno
                    </button>
                    <button type="button" onClick={() => setRoundType('concurso')}
                      className={`flex-1 text-center py-1.5 text-xs font-bold rounded ${roundType === 'concurso' ? 'bg-primary-500 text-white shadow-sm' : 'text-ink-600'}`}>
                      Concurso
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Tiempo Límite</label>
                  <div className="flex items-center gap-1">
                    <input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))}
                      className="input-field text-sm text-center font-bold" />
                    <span className="text-xs text-ink-400 font-medium">seg</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-semibold text-ink-500 uppercase">Tiempo Realizado</label>
                  <span className="text-sm font-bold text-primary-600">{actualTime} s</span>
                </div>
                <input type="range" min="40" max="120" step="0.5" value={actualTime}
                  onChange={e => setActualTime(parseFloat(e.target.value))}
                  className="w-full h-2 bg-ink-200 rounded-lg appearance-none cursor-pointer accent-primary-500" />
                {actualTime > timeLimit && (
                  <p className="text-[11px] text-danger-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> Exceso: +{timeFaults} falta(s) por tiempo.
                  </p>
                )}
              </div>

              {/* Templates */}
              <div className="pt-2 border-t border-ink-100">
                <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1.5">Cargar Vallas</label>
                <div className="flex gap-1.5 flex-wrap">
                  {[4, 6, 8, 10, 12].map(n => (
                    <button key={n} onClick={() => loadTemplate(n)}
                      className="btn-secondary text-xs py-1.5 px-3 bg-sky-50 border-sky-100 text-primary-700 hover:bg-sky-100 font-bold">
                      {n} Vallas
                    </button>
                  ))}
                  <button onClick={() => { setObstacles([]); setExpandedObsId(null); }}
                    className="btn-secondary text-xs text-danger-600 bg-danger-50 border-danger-100 hover:bg-danger-100 py-1.5 px-3">
                    Limpiar
                  </button>
                </div>
              </div>
            </Card>

            {/* Scoreboard */}
            <Card padding="none" className="bg-gradient-to-br from-ink-900 to-ink-950 text-white relative overflow-hidden p-3">
              <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none"><Trophy size={60} /></div>
              <h3 className="text-sm font-bold border-b border-ink-800 pb-1.5 mb-2 flex items-center gap-2">
                <Trophy size={14} className="text-gold-400" /> Tablero de Control
              </h3>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="bg-ink-800/40 p-2 border border-ink-800 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold text-ink-400 block">Vallas</span>
                  <span className="text-lg font-bold font-display">{countJumps}</span>
                </div>
                <div className="bg-ink-800/40 p-2 border border-ink-800 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold text-ink-400 block">Distancia</span>
                  <span className="text-lg font-bold font-display">{totalMeters}m</span>
                </div>
                <div className="bg-ink-800/40 p-2 border border-ink-800 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold text-ink-400 block">Altura</span>
                  <span className="text-lg font-bold font-display">{courseHeight}m</span>
                </div>
              </div>
              <div className="space-y-1 text-sm border-t border-ink-800 pt-2 mb-2">
                <div className="flex justify-between"><span className="text-ink-400">Resultados:</span>
                  <span className="flex gap-1.5 font-semibold">
                    <span className="text-success-400">🟢{obstacles.filter(o => o.status === 'limpio').length}</span>
                    <span className="text-danger-400">🔴{countKnockdowns}</span>
                    <span className="text-gold-400">🟡{countRefusals}</span>
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-ink-400">Faltas Salto:</span><span className="font-semibold text-danger-300">{jumpFaults}F</span></div>
                <div className="flex justify-between"><span className="text-ink-400">Faltas Tiempo:</span><span className="font-semibold text-gold-400">{timeFaults}F</span></div>
              </div>
              <div className="pt-2 border-t border-ink-800 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-ink-400 block">Total Penalidades</span>
                  <span className={`text-xl font-extrabold font-display ${totalFaults === 0 ? 'text-success-400' : 'text-danger-400'}`}>{totalFaults} Faltas</span>
                </div>
                {totalFaults === 0
                  ? <span className="text-[10px] px-2.5 py-1 rounded-lg bg-success-500/20 text-success-400 border border-success-500/30 font-bold">Cero Faltas ✨</span>
                  : <span className="text-[10px] px-2.5 py-1 rounded-lg bg-danger-500/20 text-danger-400 border border-danger-500/30 font-bold">Con Faltas</span>
                }
              </div>
              <button onClick={() => setSaveModalOpen(true)} disabled={obstacles.length === 0}
                className="btn-primary w-full bg-gold-500 hover:bg-gold-600 text-ink-950 font-bold py-2.5 mt-3 flex items-center justify-center gap-2 border-0 shadow-lg transition-transform active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">
                <Save size={16} /> Registrar Entrenamiento
              </button>
            </Card>

            {/* History from Firestore */}
            {(trainingRounds || []).length > 0 && (
              <Card className="p-3 space-y-2">
                <h3 className="text-sm font-bold text-ink-900 border-b pb-1.5 flex items-center gap-2">
                  <Calendar size={14} className="text-primary-500" /> Historial de Entrenamientos
                </h3>
                {trainingRounds.map(r => (
                  <div key={r.id} className="border border-ink-200 p-2.5 rounded-xl bg-white space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-ink-900 text-sm">{r.horseName}</span>
                        <span className="text-[11px] text-ink-500 block">{r.courseName || 'Sin nombre'} • {r.courseDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${r.faults === 0 ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'}`}>{r.faults}F</span>
                        <button onClick={() => deleteTrainingRound(r.id)}
                          className="text-ink-400 hover:text-danger-500 p-1 rounded transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap text-[10px] text-ink-600 pt-1 border-t">
                      {(r.obstacles || []).map(o => (
                        <span key={o.number} className={`px-1.5 py-0.5 rounded font-medium ${
                          o.status === 'limpio' ? 'bg-success-50 text-success-700 border border-success-100' :
                          o.status === 'derribo' ? 'bg-danger-50 text-danger-700 border border-danger-100' :
                          'bg-gold-50 text-gold-700 border border-gold-100'}`}>
                          {o.number}{OBSTACLE_TYPES[o.type]?.code || '?'}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}

        {/* ─── TAB 2: SECUENCIA ─── */}
        {activeTab === 'secuencia' && (
          <div className="max-w-2xl mx-auto space-y-2 animate-fade-in">

            {/* Course summary banner */}
            <div className={`rounded-xl p-2.5 border flex flex-wrap items-center justify-between gap-2 text-xs font-semibold ${
              courseTrackType === 'arena' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-success-50 border-success-200 text-success-800'
            }`}>
              <div className="flex items-center gap-2">
                <span>{courseTrackType === 'arena' ? '🟤' : '🟢'}</span>
                <span className="font-bold">{courseName || 'Sin nombre'}</span>
                <span className="text-ink-400">•</span>
                <span>{courseHeight}m</span>
                <span className="text-ink-400">•</span>
                <span>{countJumps} vallas</span>
              </div>
              <span className={`px-2 py-0.5 rounded-md font-bold text-white ${totalFaults === 0 ? 'bg-success-500' : 'bg-danger-500'}`}>
                {totalFaults}F
              </span>
            </div>

            {/* Obstacle List */}
            {obstacles.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-ink-200 rounded-2xl text-ink-500 space-y-2">
                <ListTodo size={28} className="mx-auto text-ink-300" />
                <p className="text-sm font-medium">No hay vallas en el recorrido.</p>
                <p className="text-xs">Usá el botón + abajo o cargá una plantilla desde la pestaña Ficha.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {obstacles.sort((a, b) => a.number - b.number).map((obs, idx) => {
                  const def = OBSTACLE_TYPES[obs.type];
                  const hasNext = idx < obstacles.length - 1;
                  const isExpanded = expandedObsId === obs.id;

                  return (
                    <div key={obs.id} className="space-y-0">
                      {/* Main Fence Card */}
                      <div
                        onClick={() => setExpandedObsId(isExpanded ? null : obs.id)}
                        className={`bg-white border rounded-xl p-2.5 cursor-pointer transition-all active:scale-[0.99] ${
                          isExpanded ? 'border-primary-400 ring-2 ring-primary-100 shadow-md' : 'border-ink-200 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-extrabold text-base text-white shadow-sm shrink-0 ${
                            obs.status === 'limpio' ? 'bg-ink-900' :
                            obs.status === 'derribo' ? 'bg-danger-500' :
                            'bg-gold-500'
                          }`}>
                            {obs.number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-ink-900 text-sm">{def.name}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                obs.status === 'limpio' ? 'bg-success-100 text-success-700' :
                                obs.status === 'derribo' ? 'bg-danger-100 text-danger-700' :
                                'bg-gold-100 text-gold-700'
                              }`}>
                                {obs.status === 'limpio' ? '✓ Limpio' : obs.status === 'derribo' ? '✕ Derribo' : '⚠ Rehúse'}
                              </span>
                              <span className="text-[10px] text-ink-400 font-medium">{obs.height}m</span>
                            </div>
                            <div className="text-[11px] text-ink-500 mt-0.5 flex gap-2 items-center">
                              <span>Salida: <strong className="text-primary-600">{obs.exitHand === 'derecha' ? '↪️ Der' : obs.exitHand === 'izquierda' ? '↩️ Izq' : '➡️ Recto'}</strong></span>
                              {hasNext && <span>• {obs.metersToNext}m • {obs.stridesToNext}g</span>}
                            </div>
                          </div>
                          <div className="text-ink-400">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Edit Panel */}
                      {isExpanded && (
                        <div className="bg-ink-50/50 border border-t-0 border-primary-200 rounded-b-xl p-3 space-y-3 animate-fade-in">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Tipo Valla</label>
                              <select value={obs.type} onChange={e => updateObstacleField(obs.id, 'type', e.target.value)}
                                className="input-field text-sm font-semibold">
                                {Object.entries(OBSTACLE_TYPES).map(([k, v]) => (
                                  <option key={k} value={k}>{v.emoji} {v.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Altura Valla</label>
                              <select value={obs.height} onChange={e => updateObstacleField(obs.id, 'height', e.target.value)}
                                className="input-field text-sm font-bold">
                                {['0.80','0.90','1.00','1.05','1.10','1.15','1.20','1.25','1.30','1.35','1.40','1.45','1.50','1.60'].map(h => (
                                  <option key={h} value={h}>{h} m</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Status */}
                          <div>
                            <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Resultado</label>
                            <div className="flex gap-1.5">
                              {[
                                { val: 'limpio',  label: '✓ Limpio',  active: 'bg-success-500 text-white shadow-sm', inactive: 'bg-white border text-ink-600' },
                                { val: 'derribo', label: '✕ Derribo', active: 'bg-danger-500 text-white shadow-sm',  inactive: 'bg-white border text-ink-600' },
                                { val: 'rehuse',  label: '⚠ Rehúse',  active: 'bg-gold-500 text-white shadow-sm',    inactive: 'bg-white border text-ink-600' }
                              ].map(s => (
                                <button key={s.val} type="button"
                                  onClick={() => updateObstacleField(obs.id, 'status', s.val)}
                                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${obs.status === s.val ? s.active : s.inactive}`}>
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Exit Hand */}
                          <div>
                            <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Mano de Salida</label>
                            <div className="flex gap-1.5">
                              {[
                                { val: 'izquierda', label: '↩️ Izquierda' },
                                { val: 'recto',     label: '➡️ Recto' },
                                { val: 'derecha',   label: '↪️ Derecha' }
                              ].map(h => (
                                <button key={h.val} type="button"
                                  onClick={() => updateObstacleField(obs.id, 'exitHand', h.val)}
                                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                                    obs.exitHand === h.val ? 'bg-primary-500 text-white shadow-sm' : 'bg-white border text-ink-600'
                                  }`}>
                                  {h.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Meters + Strides */}
                          {hasNext && (
                            <div className="grid grid-cols-2 gap-2 bg-primary-50/50 p-2.5 rounded-xl border border-primary-100">
                              <div>
                                <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">
                                  Metros → Valla {obs.number + 1}
                                </label>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => updateObstacleField(obs.id, 'metersToNext', Math.max(1, obs.metersToNext - 1))}
                                    className="h-9 w-9 bg-ink-200 rounded-lg flex items-center justify-center text-lg font-bold hover:bg-ink-300 text-ink-800 active:scale-90 shrink-0">−</button>
                                  <input type="number" value={obs.metersToNext}
                                    onChange={e => updateObstacleField(obs.id, 'metersToNext', Number(e.target.value))}
                                    className="flex-1 text-center font-bold text-sm bg-white border rounded-lg py-1.5" />
                                  <button onClick={() => updateObstacleField(obs.id, 'metersToNext', obs.metersToNext + 1)}
                                    className="h-9 w-9 bg-ink-200 rounded-lg flex items-center justify-center text-lg font-bold hover:bg-ink-300 text-ink-800 active:scale-90 shrink-0">+</button>
                                  <span className="text-xs text-ink-500 font-bold shrink-0">m</span>
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Galopes</label>
                                <div className="flex gap-1 flex-wrap">
                                  {[3, 4, 5, 6, 7, 8].map(g => (
                                    <button key={g} onClick={() => updateObstacleField(obs.id, 'stridesToNext', g)}
                                      className={`h-9 w-9 rounded-lg text-sm font-bold transition-all active:scale-90 ${
                                        obs.stridesToNext === g ? 'bg-primary-600 text-white shadow' : 'bg-white border text-ink-700 hover:bg-ink-100'
                                      }`}>
                                      {g}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Delete */}
                          <div className="flex justify-end pt-1">
                            <button onClick={() => deleteObstacle(obs.id)}
                              className="text-xs text-danger-600 font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-danger-50 border border-danger-100 hover:bg-danger-100 active:scale-95 transition-all">
                              <Trash2 size={13} /> Eliminar Valla
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Connection Line */}
                      {hasNext && !isExpanded && (
                        <div className="flex items-center gap-2 pl-5 py-0.5">
                          <div className="w-0.5 h-3 bg-primary-300 rounded ml-4" />
                          <span className="text-[10px] font-semibold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                            {obs.metersToNext}m • {obs.stridesToNext} galopes • {obs.exitHand === 'derecha' ? '↪️D' : obs.exitHand === 'izquierda' ? '↩️I' : '➡️R'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Obstacle */}
            <div className="relative">
              <button onClick={() => setShowAddMenu(!showAddMenu)}
                className="btn-primary w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2 shadow-md">
                <Plus size={16} /> Agregar Valla al Recorrido
              </button>
              {showAddMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-primary-200 rounded-xl p-2.5 shadow-xl animate-fade-in z-30">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {Object.entries(OBSTACLE_TYPES).map(([type, def]) => (
                      <button key={type} onClick={() => addObstacleToSequence(type)}
                        className="flex items-center gap-2 p-2.5 rounded-xl border border-ink-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left active:scale-95">
                        <span className={`w-2.5 h-2.5 rounded-full ${def.color}`} />
                        <div>
                          <span className="text-sm font-bold text-ink-900 block">{def.name}</span>
                          <span className="text-[10px] text-ink-500">{def.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══════ STICKY MOBILE SCOREBOARD (secuencia tab) ═══════ */}
      {activeTab === 'secuencia' && (
        <div className="fixed bottom-[64px] left-0 right-0 bg-ink-900 text-white px-4 py-2.5 flex items-center justify-between z-30 border-t border-ink-800 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="text-center"><span className="text-[9px] uppercase text-ink-400 block font-bold">Vallas</span><span className="text-sm font-bold">{countJumps}</span></div>
            <div className="w-px h-5 bg-ink-700" />
            <div className="text-center"><span className="text-[9px] uppercase text-ink-400 block font-bold">Tiempo</span><span className="text-sm font-bold">{actualTime}s</span></div>
            <div className="w-px h-5 bg-ink-700" />
            <div className="text-center">
              <span className="text-[9px] uppercase text-ink-400 block font-bold">Faltas</span>
              <span className={`text-sm font-extrabold ${totalFaults === 0 ? 'text-success-400' : 'text-danger-400'}`}>{totalFaults}F</span>
            </div>
          </div>
          <button onClick={() => setSaveModalOpen(true)} disabled={obstacles.length === 0}
            className="bg-gold-500 text-ink-950 font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform disabled:opacity-40">
            <Save size={13} /> Guardar
          </button>
        </div>
      )}

      {/* ═══════ SAVE MODAL ═══════ */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl border border-ink-200 max-w-lg w-full p-4 space-y-3 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-2">
              <div>
                <h3 className="text-base font-bold text-ink-900 flex items-center gap-2"><Save className="text-primary-500" size={18} /> Registrar Sesión</h3>
                <p className="text-[11px] text-ink-500">{courseName || 'Sin nombre'} • {selectedHorse?.name || '-'} con {riderName}</p>
              </div>
              <button onClick={() => setSaveModalOpen(false)} className="text-ink-400 hover:text-ink-600 font-bold text-xl leading-none">✕</button>
            </div>

            <div className="bg-ink-50 p-3 rounded-xl space-y-2.5">
              <div className="grid grid-cols-2 gap-2 text-sm border-b pb-2">
                <div><span className="text-[10px] text-ink-400 font-semibold block">Recorrido</span><span className="font-bold text-ink-800">{courseName || 'Sin nombre'}</span></div>
                <div><span className="text-[10px] text-ink-400 font-semibold block">Fecha</span><span className="font-bold text-ink-800">{courseDate}</span></div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                <div><span className="text-[10px] text-ink-400 font-semibold block">Ubicación</span><span className="font-bold text-ink-800">{courseLocation || '-'}</span></div>
                <div><span className="text-[10px] text-ink-400 font-semibold block">Pista</span><span className="font-bold text-ink-800">{courseTrackType === 'arena' ? '🟤 Arena' : '🟢 Césped'}</span></div>
                <div><span className="text-[10px] text-ink-400 font-semibold block">Altura</span><span className="font-bold text-ink-800">{courseHeight}m</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm border-b pb-2">
                <div><span className="text-[10px] text-ink-400 font-semibold block">Tiempo</span><span className="font-bold text-ink-800">{actualTime}s (Lím: {timeLimit}s)</span></div>
                <div><span className="text-[10px] text-ink-400 font-semibold block">Penalidades</span><span className={`font-bold ${totalFaults === 0 ? 'text-success-600' : 'text-danger-600'}`}>{totalFaults} Faltas</span></div>
              </div>
              <div className="text-xs space-y-1">
                <span className="text-[10px] text-ink-400 font-semibold block">Resumen por Valla</span>
                <div className="flex gap-1 flex-wrap">
                  {obstacles.sort((a, b) => a.number - b.number).map(o => (
                    <div key={o.id} className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 ${
                      o.status === 'limpio' ? 'bg-success-50 text-success-800 border-success-200' :
                      o.status === 'derribo' ? 'bg-danger-50 text-danger-800 border-danger-200' :
                      'bg-gold-50 text-gold-800 border-gold-200'
                    }`}>
                      <span className="font-bold">{o.number}({OBSTACLE_TYPES[o.type].code})</span>
                      <span>{o.height}m</span>
                      <span className="text-ink-400">{o.exitHand === 'derecha' ? 'D' : o.exitHand === 'izquierda' ? 'I' : 'R'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setSaveModalOpen(false)} className="btn-secondary py-2 px-4 text-sm">Volver</button>
              <button onClick={handleSaveRound} disabled={isSaving}
                className="btn-primary py-2 px-5 text-sm bg-success-600 hover:bg-success-700 disabled:opacity-50">
                {isSaving ? 'Guardando...' : 'Confirmar y Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
