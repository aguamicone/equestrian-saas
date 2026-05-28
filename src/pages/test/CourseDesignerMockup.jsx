import { useState, useEffect } from 'react';
import {
  Play, Square, Trash2, LayoutGrid, ListTodo,
  Info, Save, RotateCw, AlertCircle, Trophy, Calendar, Settings,
  MapPin, ClipboardList, Plus, ChevronDown, ChevronUp, Monitor
} from 'lucide-react';

// ─── Obstacle Type metadata ────────────────────────────────────────────────────
const OBSTACLE_TYPES = {
  vertical: { name: 'Vertical', emoji: '🟥', color: 'bg-danger-500', border: 'border-danger-600', code: 'V', desc: '1 barra' },
  oxer: { name: 'Oxer', emoji: '🟦', color: 'bg-primary-500', border: 'border-primary-600', code: 'O', desc: '2 barras' },
  doble: { name: 'Doble', emoji: '🟪', color: 'bg-purple-500', border: 'border-purple-600', code: 'D', desc: 'Combinación 2' },
  triple: { name: 'Triple', emoji: '🟫', color: 'bg-indigo-500', border: 'border-indigo-600', code: 'T', desc: 'Combinación 3' },
  ria: { name: 'Ría', emoji: '🟩', color: 'bg-success-400', border: 'border-success-500', code: 'R', desc: 'Agua' }
};

// ─── Preset tracks ─────────────────────────────────────────────────────────────
const DEFAULT_12_TRACK = [
  { id: '1', number: 1, type: 'vertical', col: 1, row: 6, rotation: 90, exitHand: 'derecha', metersToNext: 24, stridesToNext: 5, status: 'limpio', height: '1.10' },
  { id: '2', number: 2, type: 'vertical', col: 4, row: 6, rotation: 90, exitHand: 'izquierda', metersToNext: 28, stridesToNext: 6, status: 'limpio', height: '1.15' },
  { id: '3', number: 3, type: 'oxer', col: 7, row: 4, rotation: 45, exitHand: 'izquierda', metersToNext: 30, stridesToNext: 7, status: 'limpio', height: '1.15' },
  { id: '4', number: 4, type: 'doble', col: 5, row: 1, rotation: 0, exitHand: 'derecha', metersToNext: 22, stridesToNext: 5, status: 'derribo', height: '1.20' },
  { id: '5', number: 5, type: 'vertical', col: 2, row: 2, rotation: 0, exitHand: 'izquierda', metersToNext: 24, stridesToNext: 5, status: 'limpio', height: '1.15' },
  { id: '6', number: 6, type: 'oxer', col: 2, row: 5, rotation: 90, exitHand: 'derecha', metersToNext: 28, stridesToNext: 6, status: 'limpio', height: '1.20' },
  { id: '7', number: 7, type: 'vertical', col: 5, row: 5, rotation: 90, exitHand: 'izquierda', metersToNext: 24, stridesToNext: 5, status: 'rehuse', height: '1.20' },
  { id: '8', number: 8, type: 'vertical', col: 8, row: 3, rotation: 135, exitHand: 'izquierda', metersToNext: 32, stridesToNext: 7, status: 'limpio', height: '1.20' },
  { id: '9', number: 9, type: 'triple', col: 8, row: 6, rotation: 90, exitHand: 'derecha', metersToNext: 24, stridesToNext: 5, status: 'limpio', height: '1.25' },
  { id: '10', number: 10, type: 'vertical', col: 5, row: 7, rotation: 90, exitHand: 'derecha', metersToNext: 28, stridesToNext: 6, status: 'limpio', height: '1.20' },
  { id: '11', number: 11, type: 'ria', col: 2, row: 7, rotation: 90, exitHand: 'izquierda', metersToNext: 20, stridesToNext: 4, status: 'limpio', height: '0.80' },
  { id: '12', number: 12, type: 'vertical', col: 1, row: 4, rotation: 90, exitHand: 'recto', metersToNext: 0, stridesToNext: 0, status: 'limpio', height: '1.25' }
];

const SHORT_4_TRACK = [
  { id: 's1', number: 1, type: 'vertical', col: 2, row: 5, rotation: 90, exitHand: 'derecha', metersToNext: 24, stridesToNext: 5, status: 'limpio', height: '1.00' },
  { id: 's2', number: 2, type: 'oxer', col: 5, row: 5, rotation: 90, exitHand: 'izquierda', metersToNext: 28, stridesToNext: 6, status: 'limpio', height: '1.05' },
  { id: 's3', number: 3, type: 'vertical', col: 7, row: 3, rotation: 0, exitHand: 'derecha', metersToNext: 24, stridesToNext: 5, status: 'limpio', height: '1.10' },
  { id: 's4', number: 4, type: 'oxer', col: 4, row: 3, rotation: 0, exitHand: 'recto', metersToNext: 0, stridesToNext: 0, status: 'limpio', height: '1.10' }
];

// ─── Audio Synthesis ────────────────────────────────────────────────────────────
const playSynthSound = (type) => {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const play = (oscType, freq, freqEnd, gainVal, dur) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = oscType;
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + dur);
      g.gain.setValueAtTime(gainVal, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur);
    };
    if (type === 'click') play('sine', 600, null, 0.04, 0.08);
    else if (type === 'move') play('triangle', 400, 600, 0.05, 0.12);
    else if (type === 'jump') play('sine', 350, 880, 0.08, 0.22);
    else if (type === 'knockdown') { play('sawtooth', 220, null, 0.12, 0.3); }
    else if (type === 'refusal') {
      const t = (f, time, d) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(f, time); g.gain.setValueAtTime(0.1, time); g.gain.exponentialRampToValueAtTime(0.001, time + d); o.connect(g); g.connect(ctx.destination); o.start(time); o.stop(time + d); };
      t(180, ctx.currentTime, 0.15); t(150, ctx.currentTime + 0.15, 0.2);
    } else if (type === 'success') {
      const t = (f, time, d) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, time); g.gain.setValueAtTime(0.06, time); g.gain.exponentialRampToValueAtTime(0.001, time + d); o.connect(g); g.connect(ctx.destination); o.start(time); o.stop(time + d); };
      t(523.25, ctx.currentTime, 0.1); t(659.25, ctx.currentTime + 0.1, 0.1); t(783.99, ctx.currentTime + 0.2, 0.1); t(1046.50, ctx.currentTime + 0.3, 0.25);
    }
  } catch (e) { /* silent */ }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function CourseDesignerMockup() {
  // ─── Active Tab ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('secuencia'); // 'ficha' | 'secuencia' | 'pista'

  // ─── Course Metadata (NEW) ───────────────────────────────────────────────────
  const [courseName, setCourseName] = useState('Copa San Isidro - Recorrido 3');
  const [courseDate, setCourseDate] = useState(new Date().toISOString().split('T')[0]);
  const [courseLocation, setCourseLocation] = useState('Club Hípico San Isidro');
  const [courseTrackType, setCourseTrackType] = useState('arena'); // 'arena' | 'cesped'
  const [courseHeight, setCourseHeight] = useState('1.20'); // overall course height

  // ─── Existing State ──────────────────────────────────────────────────────────
  const [obstacles, setObstacles] = useState(DEFAULT_12_TRACK);
  const [selectedId, setSelectedId] = useState(null);
  const [horseName, setHorseName] = useState('Queca');
  const [riderName, setRiderName] = useState('Agustin');
  const [roundType, setRoundType] = useState('entrenamiento');
  const [timeLimit, setTimeLimit] = useState(76);
  const [actualTime, setActualTime] = useState(72.5);

  // Grid placement
  const [isCellMenuOpen, setIsCellMenuOpen] = useState(false);
  const [cellMenuCoords, setCellMenuCoords] = useState(null);

  // Simulation
  const [isSimulating, setIsSimulating] = useState(false);
  const [simIndex, setSimIndex] = useState(0);
  const [simProgress, setSimProgress] = useState(0);
  const [horsePos, setHorsePos] = useState({ x: 0, y: 0, angle: 0 });
  const [simStatusText, setSimStatusText] = useState('');
  const [isJumping, setIsJumping] = useState(false);
  const [simLog, setSimLog] = useState([]);

  // Save / Toast
  const [toast, setToast] = useState(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savedRounds, setSavedRounds] = useState([]);

  // Mobile: expanded obstacle in sequence view
  const [expandedObsId, setExpandedObsId] = useState(null);

  // ─── Add new obstacle to sequence ────────────────────────────────────────────
  const [showAddMenu, setShowAddMenu] = useState(false);

  // ─── Auto-calculated ─────────────────────────────────────────────────────────
  const countJumps = obstacles.length;
  const countKnockdowns = obstacles.filter(o => o.status === 'derribo').length;
  const countRefusals = obstacles.filter(o => o.status === 'rehuse').length;
  const timeFaults = Math.max(0, Math.ceil(actualTime - timeLimit));
  const jumpFaults = (countKnockdowns * 4) + (countRefusals * 4);
  const totalFaults = jumpFaults + timeFaults;
  const totalMeters = obstacles.reduce((sum, o) => sum + (o.metersToNext || 0), 0);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const syncNumbers = (list) => list.map((obs, i) => ({ ...obs, number: i + 1 }));

  const loadTemplate = (type) => {
    playSynthSound('click');
    if (type === '12') { setObstacles(DEFAULT_12_TRACK); showToast('Cargado: Recorrido Completo (12 vallas)', 'success'); }
    else if (type === '4') { setObstacles(SHORT_4_TRACK); showToast('Cargado: Calentamiento (4 vallas)', 'success'); }
    else { setObstacles([]); showToast('Lienzo limpiado.', 'info'); }
    setSelectedId(null);
    setExpandedObsId(null);
  };

  const addObstacleToSequence = (type) => {
    playSynthSound('click');
    const newId = 'obs-' + Date.now();
    const lastObs = obstacles.length > 0 ? obstacles[obstacles.length - 1] : null;
    const newObs = {
      id: newId,
      number: obstacles.length + 1,
      type,
      col: lastObs ? Math.min(lastObs.col + 2, 9) : 2,
      row: lastObs ? lastObs.row : 4,
      rotation: 90,
      exitHand: 'derecha',
      metersToNext: 24,
      stridesToNext: 5,
      status: 'limpio',
      height: courseHeight
    };
    setObstacles(syncNumbers([...obstacles, newObs]));
    setExpandedObsId(newId);
    setShowAddMenu(false);
    showToast(`Valla ${newObs.number} (${OBSTACLE_TYPES[type].name}) agregada.`, 'success');
  };

  const deleteObstacle = (id) => {
    playSynthSound('knockdown');
    const updated = syncNumbers(obstacles.filter(o => o.id !== id));
    setObstacles(updated);
    if (selectedId === id) setSelectedId(null);
    if (expandedObsId === id) setExpandedObsId(null);
    showToast('Obstáculo eliminado.', 'info');
  };

  const updateObstacleField = (id, field, value) => {
    setObstacles(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const rotateObstacle = (degrees) => {
    if (!selectedId) return;
    playSynthSound('click');
    setObstacles(prev => prev.map(o =>
      o.id === selectedId ? { ...o, rotation: (o.rotation + degrees) % 360 } : o
    ));
  };

  const handleCellClick = (col, row) => {
    const existing = obstacles.find(o => o.col === col && o.row === row);
    if (existing) { playSynthSound('click'); setSelectedId(existing.id); setIsCellMenuOpen(false); }
    else if (selectedId) { playSynthSound('move'); setObstacles(prev => prev.map(o => o.id === selectedId ? { ...o, col, row } : o)); setIsCellMenuOpen(false); }
    else { playSynthSound('click'); setCellMenuCoords({ col, row }); setIsCellMenuOpen(true); }
  };

  const placeObstacle = (type) => {
    if (!cellMenuCoords) return;
    playSynthSound('click');
    const newId = 'obs-' + Date.now();
    const newObs = { id: newId, number: obstacles.length + 1, type, col: cellMenuCoords.col, row: cellMenuCoords.row, rotation: 90, exitHand: 'derecha', metersToNext: 24, stridesToNext: 5, status: 'limpio', height: courseHeight };
    setObstacles(syncNumbers([...obstacles, newObs]));
    setSelectedId(newId);
    setIsCellMenuOpen(false);
    setCellMenuCoords(null);
  };

  // ─── Simulation Effect ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSimulating) return;
    if (obstacles.length < 2) { setIsSimulating(false); showToast('Necesitas al menos 2 vallas.', 'error'); return; }
    let intervalId;
    let seg = simIndex, pct = simProgress, refStep = 0;
    const sorted = [...obstacles].sort((a, b) => a.number - b.number);

    const tick = () => {
      if (seg >= sorted.length - 1) { setIsSimulating(false); playSynthSound('success'); setSimStatusText('🏁 ¡Recorrido completado!'); setSimLog(prev => [...prev, `[Llegada] Completado en ${actualTime}s. Faltas: ${totalFaults}.`]); return; }
      const from = sorted[seg], to = sorted[seg + 1];
      const x1 = from.col * 100 + 50, y1 = from.row * 100 + 50, x2 = to.col * 100 + 50, y2 = to.row * 100 + 50;

      if (from.status === 'rehuse' && refStep < 3) {
        if (refStep === 0) { if (pct < 60) { pct += 5; setSimStatusText(`🐴 Abordando Valla ${from.number}...`); } else { refStep = 1; playSynthSound('refusal'); setSimStatusText(`⚠️ ¡REHÚSE en Valla ${from.number}!`); setSimLog(prev => [...prev, `[Valla ${from.number}] Rehúse.`]); } }
        else if (refStep === 1) { if (pct > 35) pct -= 5; else { refStep = 2; setSimStatusText('🔄 Retomando...'); } }
        else { refStep = 3; }
      } else { pct += 8; if (pct >= 100) pct = 100; setSimStatusText(`🐴 Galopando entre Valla ${from.number} y ${to.number}...`); }

      const rad = pct / 100;
      setHorsePos({ x: x1 + (x2 - x1) * rad, y: y1 + (y2 - y1) * rad, angle: Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI) + 90 });
      setSimProgress(pct);

      if (pct === 100) {
        setIsJumping(true); setTimeout(() => setIsJumping(false), 300);
        if (to.status === 'derribo') { playSynthSound('knockdown'); setSimStatusText(`❌ ¡DERRIBO Valla ${to.number}! (+4F)`); setSimLog(prev => [...prev, `[Valla ${to.number}] Derribo. 4 faltas.`]); }
        else { playSynthSound('jump'); setSimStatusText(`🟢 Valla ${to.number} limpio.`); setSimLog(prev => [...prev, `[Valla ${to.number}] Limpio.`]); }
        seg += 1; pct = 0; refStep = 0; setSimIndex(seg); setSimProgress(pct);
      }
    };

    if (simIndex === 0 && simProgress === 0) {
      setIsJumping(true); playSynthSound('jump'); setSimStatusText('🚀 ¡Inicia el recorrido!');
      setSimLog([`[Inicio] ${horseName} con ${riderName}.`, `[Valla 1] Limpio.`]);
      setTimeout(() => setIsJumping(false), 350);
      const s0 = sorted[0]; setHorsePos({ x: s0.col * 100 + 50, y: s0.row * 100 + 50, angle: 90 }); setSimProgress(2);
    }
    intervalId = setInterval(tick, 180);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimulating, simIndex, simProgress, obstacles, horseName, riderName]);

  const handleStartSim = () => {
    if (isSimulating) { setIsSimulating(false); setSimStatusText('Simulación cancelada.'); }
    else { setSimIndex(0); setSimProgress(0); setIsSimulating(true); setSimLog([]); }
  };

  const handleSaveRound = () => {
    playSynthSound('success');
    const rec = {
      id: Date.now().toString(), courseName, courseDate, courseLocation, courseTrackType, courseHeight,
      horseName, riderName, roundType, time: actualTime, faults: totalFaults, jumpFaults, timeFaults,
      obstaclesCount: obstacles.length, totalMeters,
      obstaclesSummary: obstacles.map(o => ({ number: o.number, type: o.type, status: o.status, exitHand: o.exitHand, strides: o.stridesToNext, meters: o.metersToNext, height: o.height })),
      date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    };
    setSavedRounds(prev => [rec, ...prev]);
    setSaveModalOpen(false);
    showToast(`¡Recorrido de ${horseName} registrado! (${totalFaults} Faltas)`, 'success');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  const tabs = [
    { key: 'ficha', label: 'Ficha', icon: ClipboardList, mobileLabel: '📝 Ficha' },
    { key: 'secuencia', label: 'Secuencia', icon: ListTodo, mobileLabel: '📋 Secuencia' },
    { key: 'pista', label: 'Pista Visual', icon: LayoutGrid, mobileLabel: '🗺️ Pista' },
  ];

  return (
    <div className="min-h-screen bg-ink-50 font-sans select-none flex flex-col">

      {/* ═══════ HEADER ═══════ */}
      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-3">
        <span className="text-[10px] font-bold tracking-widest text-primary-500 uppercase">MÓDULO DE ENTRENAMIENTO</span>
        <h1 className="text-2xl md:text-3xl font-bold font-display text-ink-900 tracking-tight flex items-center gap-2">
          🐎 Pista Digital
        </h1>
        <p className="text-xs md:text-sm text-ink-500 mt-0.5">
          Registrá recorridos, vallas, trancos y resultados.
        </p>
      </div>

      {/* ═══════ TAB BAR ═══════ */}
      <div className="px-4 md:px-6 border-b border-ink-200 bg-white/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex gap-0 overflow-x-auto -mb-px">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { playSynthSound('click'); setActiveTab(tab.key); }}
              className={`whitespace-nowrap px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-700'
                  : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300'
              }`}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.mobileLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ TOAST ═══════ */}
      {toast && (
        <div className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-fade-in ${
          toast.type === 'error' ? 'bg-danger-50 border-danger-200 text-danger-700' :
          toast.type === 'info' ? 'bg-sky-50 border-sky-200 text-primary-700' :
          'bg-success-50 border-success-200 text-success-700'
        }`}>
          <div className="h-2 w-2 rounded-full bg-current animate-ping" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="flex-1 px-4 md:px-6 py-4 md:py-6 pb-24 md:pb-6">

        {/* ──────────────────────────────────────────────────────────────────────
             TAB 1: FICHA DEL RECORRIDO
        ────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'ficha' && (
          <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">

            {/* Course Info Card */}
            <div className="card p-4 md:p-5 space-y-4">
              <h3 className="text-base md:text-lg font-bold text-ink-900 border-b pb-2 flex items-center gap-2">
                <Settings size={18} className="text-primary-500" />
                Datos del Recorrido
              </h3>

              <div>
                <label className="text-xs font-semibold text-ink-500 uppercase block mb-1">Nombre del Recorrido</label>
                <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)}
                  className="input-field text-sm font-medium" placeholder="Ej: Copa San Isidro - Recorrido 3" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ink-500 uppercase block mb-1">Fecha</label>
                  <input type="date" value={courseDate} onChange={e => setCourseDate(e.target.value)}
                    className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-500 uppercase block mb-1">Ubicación</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input type="text" value={courseLocation} onChange={e => setCourseLocation(e.target.value)}
                      className="input-field text-sm pl-8" placeholder="Club / Cancha" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ink-500 uppercase block mb-1">Tipo de Pista</label>
                  <div className="flex gap-1 bg-ink-50 p-1 border border-ink-200 rounded-lg">
                    <button type="button" onClick={() => { playSynthSound('click'); setCourseTrackType('arena'); }}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all ${courseTrackType === 'arena' ? 'bg-amber-500 text-white shadow-sm' : 'text-ink-600'}`}>
                      🟤 Arena
                    </button>
                    <button type="button" onClick={() => { playSynthSound('click'); setCourseTrackType('cesped'); }}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all ${courseTrackType === 'cesped' ? 'bg-success-500 text-white shadow-sm' : 'text-ink-600'}`}>
                      🟢 Césped
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-500 uppercase block mb-1">Altura del Recorrido</label>
                  <select value={courseHeight} onChange={e => setCourseHeight(e.target.value)}
                    className="input-field text-sm font-bold">
                    <option value="0.80">0.80 m</option>
                    <option value="0.90">0.90 m</option>
                    <option value="1.00">1.00 m</option>
                    <option value="1.10">1.10 m</option>
                    <option value="1.15">1.15 m</option>
                    <option value="1.20">1.20 m</option>
                    <option value="1.25">1.25 m</option>
                    <option value="1.30">1.30 m</option>
                    <option value="1.35">1.35 m</option>
                    <option value="1.40">1.40 m</option>
                    <option value="1.45">1.45 m</option>
                    <option value="1.50">1.50 m</option>
                    <option value="1.60">1.60 m</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Horse / Rider / Round Type Card */}
            <div className="card p-4 md:p-5 space-y-4">
              <h3 className="text-base md:text-lg font-bold text-ink-900 border-b pb-2 flex items-center gap-2">
                🐴 Binomio y Tipo
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ink-500 uppercase block mb-1">Caballo</label>
                  <select value={horseName} onChange={e => setHorseName(e.target.value)} className="input-field text-sm">
                    <option value="Queca">Queca</option>
                    <option value="Irupé">Irupé</option>
                    <option value="Cielo">Cielo</option>
                    <option value="Trueno">Trueno</option>
                    <option value="Santos">Santos</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-500 uppercase block mb-1">Jinete</label>
                  <input type="text" value={riderName} onChange={e => setRiderName(e.target.value)}
                    className="input-field text-sm" placeholder="Nombre" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-ink-500 uppercase block mb-1">Tipo</label>
                  <div className="flex gap-1 bg-ink-50 p-1 border border-ink-200 rounded-lg">
                    <button type="button" onClick={() => { playSynthSound('click'); setRoundType('entrenamiento'); }}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded ${roundType === 'entrenamiento' ? 'bg-primary-500 text-white shadow-sm' : 'text-ink-600'}`}>
                      Entreno
                    </button>
                    <button type="button" onClick={() => { playSynthSound('click'); setRoundType('concurso'); }}
                      className={`flex-1 text-center py-2 text-xs font-bold rounded ${roundType === 'concurso' ? 'bg-primary-500 text-white shadow-sm' : 'text-ink-600'}`}>
                      Concurso
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-500 uppercase block mb-1">Tiempo Límite</label>
                  <div className="flex items-center gap-1.5">
                    <input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))}
                      className="input-field text-sm text-center font-bold" />
                    <span className="text-xs text-ink-400 font-medium">seg</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-ink-500 uppercase">Tiempo Realizado</label>
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
                <label className="text-xs font-semibold text-ink-500 uppercase block mb-2">Cargar Plantilla</label>
                <div className="flex gap-2">
                  <button onClick={() => loadTemplate('12')} className="btn-secondary text-xs flex-1 py-1.5 px-2 bg-sky-50 border-sky-100 text-primary-700 hover:bg-sky-100">12 Vallas</button>
                  <button onClick={() => loadTemplate('4')} className="btn-secondary text-xs flex-1 py-1.5 px-2">4 Vallas</button>
                  <button onClick={() => loadTemplate('0')} className="btn-secondary text-xs text-danger-600 bg-danger-50 border-danger-100 hover:bg-danger-100 py-1.5 px-2">Limpiar</button>
                </div>
              </div>
            </div>

            {/* Scoreboard */}
            <div className="card p-4 md:p-5 bg-gradient-to-br from-ink-900 to-ink-950 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Trophy size={80} /></div>
              <h3 className="text-base font-bold border-b border-ink-800 pb-2 mb-3 flex items-center gap-2">
                <Trophy size={16} className="text-gold-400" /> Tablero de Control
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-ink-800/40 p-2.5 border border-ink-800 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold text-ink-400 block">Vallas</span>
                  <span className="text-xl font-bold font-display">{countJumps}</span>
                </div>
                <div className="bg-ink-800/40 p-2.5 border border-ink-800 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold text-ink-400 block">Distancia</span>
                  <span className="text-xl font-bold font-display">{totalMeters}m</span>
                </div>
                <div className="bg-ink-800/40 p-2.5 border border-ink-800 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold text-ink-400 block">Altura</span>
                  <span className="text-xl font-bold font-display">{courseHeight}m</span>
                </div>
              </div>
              <div className="space-y-1.5 text-sm border-t border-ink-800 pt-2.5 mb-3">
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
              <div className="pt-3 border-t border-ink-800 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-ink-400 block">Total Penalidades</span>
                  <span className={`text-2xl font-extrabold font-display ${totalFaults === 0 ? 'text-success-400' : 'text-danger-400'}`}>{totalFaults} Faltas</span>
                </div>
                {totalFaults === 0
                  ? <span className="text-[10px] px-3 py-1 rounded-lg bg-success-500/20 text-success-400 border border-success-500/30 font-bold">Cero Faltas ✨</span>
                  : <span className="text-[10px] px-3 py-1 rounded-lg bg-danger-500/20 text-danger-400 border border-danger-500/30 font-bold">Con Faltas</span>
                }
              </div>
              <button onClick={() => setSaveModalOpen(true)}
                className="btn-primary w-full bg-gold-500 hover:bg-gold-600 text-ink-950 font-bold py-3 mt-4 flex items-center justify-center gap-2 border-0 shadow-lg transition-transform active:scale-[0.98]">
                <Save size={18} /> Registrar Entrenamiento
              </button>
            </div>

            {/* Saved Rounds History */}
            {savedRounds.length > 0 && (
              <div className="card p-4 md:p-5 space-y-3">
                <h3 className="text-base font-bold text-ink-900 border-b pb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-primary-500" /> Historial (Sesión)
                </h3>
                {savedRounds.map(r => (
                  <div key={r.id} className="border border-ink-200 p-3 rounded-xl bg-white space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-ink-900 text-sm">{r.horseName}</span>
                        <span className="text-[11px] text-ink-500 block">{r.courseName} • {r.date}</span>
                      </div>
                      <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${r.faults === 0 ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'}`}>{r.faults}F</span>
                    </div>
                    <div className="flex gap-1 flex-wrap text-[10px] text-ink-600 pt-1 border-t">
                      {r.obstaclesSummary.map(o => (
                        <span key={o.number} className={`px-1.5 py-0.5 rounded font-medium ${
                          o.status === 'limpio' ? 'bg-success-50 text-success-700 border border-success-100' :
                          o.status === 'derribo' ? 'bg-danger-50 text-danger-700 border border-danger-100' :
                          'bg-gold-50 text-gold-700 border border-gold-100'}`}>
                          {o.number}{OBSTACLE_TYPES[o.type].code}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────────
             TAB 2: SECUENCIA — MOBILE-FIRST
        ────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'secuencia' && (
          <div className="max-w-3xl mx-auto space-y-3 animate-fade-in">

            {/* Course summary banner */}
            <div className={`rounded-xl p-3 border flex flex-wrap items-center justify-between gap-2 text-xs font-semibold ${
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
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md font-bold ${totalFaults === 0 ? 'bg-success-500 text-white' : 'bg-danger-500 text-white'}`}>
                  {totalFaults}F
                </span>
              </div>
            </div>

            {/* Obstacle List — Mobile Optimized Cards */}
            {obstacles.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-ink-200 rounded-2xl text-ink-500 space-y-2">
                <ListTodo size={32} className="mx-auto text-ink-300" />
                <p className="text-sm font-medium">No hay vallas en el recorrido.</p>
                <p className="text-xs">Usá el botón + abajo o cargá una plantilla desde la pestaña Ficha.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {obstacles.sort((a, b) => a.number - b.number).map((obs, idx) => {
                  const def = OBSTACLE_TYPES[obs.type];
                  const hasNext = idx < obstacles.length - 1;
                  const isExpanded = expandedObsId === obs.id;

                  return (
                    <div key={obs.id} className="space-y-0">
                      {/* Main Fence Card */}
                      <div
                        onClick={() => { playSynthSound('click'); setExpandedObsId(isExpanded ? null : obs.id); }}
                        className={`card p-3 cursor-pointer transition-all active:scale-[0.99] ${
                          isExpanded ? 'border-primary-400 ring-2 ring-primary-100 shadow-md' : 'hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* ── BIG NUMBER BADGE ── */}
                          <div className={`h-12 w-12 md:h-10 md:w-10 rounded-xl flex items-center justify-center font-extrabold text-lg md:text-base text-white shadow-sm shrink-0 ${
                            obs.status === 'limpio' ? 'bg-ink-900' :
                            obs.status === 'derribo' ? 'bg-danger-500' :
                            'bg-gold-500'
                          }`}>
                            {obs.number}
                          </div>

                          {/* ── Info ── */}
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

                          {/* ── Expand Icon ── */}
                          <div className="text-ink-400">
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>
                      </div>

                      {/* ── EXPANDED EDIT PANEL ── */}
                      {isExpanded && (
                        <div className="card border-t-0 rounded-t-none p-4 space-y-4 animate-fade-in bg-ink-50/50 border-primary-200">

                          {/* Type + Height */}
                          <div className="grid grid-cols-2 gap-3">
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

                          {/* Status Buttons — Large Touch Targets */}
                          <div>
                            <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1.5">Resultado</label>
                            <div className="flex gap-2">
                              {[
                                { val: 'limpio', label: '✓ Limpio', active: 'bg-success-500 text-white shadow-sm', inactive: 'bg-white border text-ink-600' },
                                { val: 'derribo', label: '✕ Derribo', active: 'bg-danger-500 text-white shadow-sm', inactive: 'bg-white border text-ink-600' },
                                { val: 'rehuse', label: '⚠ Rehúse', active: 'bg-gold-500 text-white shadow-sm', inactive: 'bg-white border text-ink-600' }
                              ].map(s => (
                                <button key={s.val} type="button"
                                  onClick={() => { playSynthSound('click'); updateObstacleField(obs.id, 'status', s.val); }}
                                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${obs.status === s.val ? s.active : s.inactive}`}>
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Exit Hand — Large Toggle */}
                          <div>
                            <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1.5">Mano de Salida</label>
                            <div className="flex gap-2">
                              {[
                                { val: 'izquierda', label: '↩️ Izquierda' },
                                { val: 'recto', label: '➡️ Recto' },
                                { val: 'derecha', label: '↪️ Derecha' }
                              ].map(h => (
                                <button key={h.val} type="button"
                                  onClick={() => { playSynthSound('click'); updateObstacleField(obs.id, 'exitHand', h.val); }}
                                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                                    obs.exitHand === h.val ? 'bg-primary-500 text-white shadow-sm' : 'bg-white border text-ink-600'
                                  }`}>
                                  {h.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Meters + Strides — Finger-Friendly */}
                          {hasNext && (
                            <div className="grid grid-cols-2 gap-3 bg-primary-50/50 p-3 rounded-xl border border-primary-100">
                              <div>
                                <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1.5">
                                  Metros → Valla {obs.number + 1}
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => { playSynthSound('click'); updateObstacleField(obs.id, 'metersToNext', Math.max(1, obs.metersToNext - 1)); }}
                                    className="h-10 w-10 bg-ink-200 rounded-lg flex items-center justify-center text-lg font-bold hover:bg-ink-300 text-ink-800 active:scale-90 shrink-0">−</button>
                                  <input type="number" value={obs.metersToNext}
                                    onChange={e => updateObstacleField(obs.id, 'metersToNext', Number(e.target.value))}
                                    className="flex-1 text-center font-bold text-base bg-white border rounded-lg py-2" />
                                  <button onClick={() => { playSynthSound('click'); updateObstacleField(obs.id, 'metersToNext', obs.metersToNext + 1); }}
                                    className="h-10 w-10 bg-ink-200 rounded-lg flex items-center justify-center text-lg font-bold hover:bg-ink-300 text-ink-800 active:scale-90 shrink-0">+</button>
                                  <span className="text-xs text-ink-500 font-bold shrink-0">m</span>
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1.5">Galopes</label>
                                <div className="flex gap-1 flex-wrap">
                                  {[3, 4, 5, 6, 7, 8].map(g => (
                                    <button key={g} onClick={() => { playSynthSound('click'); updateObstacleField(obs.id, 'stridesToNext', g); }}
                                      className={`h-10 w-10 rounded-lg text-sm font-bold transition-all active:scale-90 ${
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
                              className="text-xs text-danger-600 font-semibold flex items-center gap-1.5 px-3 py-2 rounded-lg bg-danger-50 border border-danger-100 hover:bg-danger-100 active:scale-95 transition-all">
                              <Trash2 size={14} /> Eliminar Valla
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ── Connection Line between fences ── */}
                      {hasNext && !isExpanded && (
                        <div className="flex items-center gap-2 pl-6 py-1">
                          <div className="w-0.5 h-4 bg-primary-300 rounded ml-5" />
                          <span className="text-[10px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                            {obs.metersToNext}m • {obs.stridesToNext} galopes • {obs.exitHand === 'derecha' ? '↪️D' : obs.exitHand === 'izquierda' ? '↩️I' : '➡️R'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Obstacle Button */}
            <div className="relative">
              <button onClick={() => { playSynthSound('click'); setShowAddMenu(!showAddMenu); }}
                className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-md">
                <Plus size={18} /> Agregar Valla al Recorrido
              </button>
              {showAddMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 card p-3 shadow-xl border-primary-200 animate-fade-in z-30">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(OBSTACLE_TYPES).map(([type, def]) => (
                      <button key={type} onClick={() => addObstacleToSequence(type)}
                        className="flex items-center gap-2 p-3 rounded-xl border border-ink-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left active:scale-95">
                        <span className={`w-3 h-3 rounded-full ${def.color}`} />
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

            {/* Simulation Section */}
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <button onClick={handleStartSim}
                  className={`btn-primary px-5 py-2.5 font-bold flex items-center gap-2 shadow ${isSimulating ? 'bg-danger-500 hover:bg-danger-600' : 'bg-success-600 hover:bg-success-700'}`}>
                  {isSimulating ? <><Square size={16} /> Detener</> : <><Play size={16} /> Simular Recorrido</>}
                </button>
                {isSimulating && (
                  <span className="text-xs font-medium text-primary-700 bg-primary-50 border border-primary-100 px-3 py-1.5 rounded-lg animate-pulse">{simStatusText}</span>
                )}
              </div>
              {simLog.length > 0 && (
                <div className="bg-ink-900 text-ink-100 p-3 rounded-lg text-[11px] font-mono max-h-28 overflow-y-auto space-y-0.5">
                  {simLog.map((log, i) => (
                    <div key={i} className="flex gap-2"><span className="text-ink-500">[{i + 1}]</span><span>{log}</span></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────────
             TAB 3: PISTA VISUAL (GRID) — DESKTOP ONLY
        ────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'pista' && (
          <div className="animate-fade-in">

            {/* Mobile Warning */}
            <div className="md:hidden card p-6 text-center space-y-3 max-w-md mx-auto">
              <Monitor size={40} className="mx-auto text-ink-300" />
              <h3 className="font-bold text-ink-900 text-base">Vista de Pista Visual</h3>
              <p className="text-sm text-ink-500">
                La cuadrícula interactiva funciona mejor en una tablet o computadora. Para registrar vallas desde el celular, usá la pestaña <strong className="text-primary-600">📋 Secuencia</strong>.
              </p>
              <button onClick={() => { playSynthSound('click'); setActiveTab('secuencia'); }}
                className="btn-primary py-2.5 px-6 text-sm mx-auto">
                <ListTodo size={16} /> Ir a Secuencia
              </button>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:block max-w-5xl mx-auto space-y-4">

              {/* Course Info Bar */}
              <div className={`rounded-xl p-3 border flex items-center justify-between gap-3 text-sm font-semibold ${
                courseTrackType === 'arena' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-success-50 border-success-200 text-success-800'
              }`}>
                <div className="flex items-center gap-3">
                  <span>{courseTrackType === 'arena' ? '🟤' : '🟢'} {courseName}</span>
                  <span className="text-ink-400">|</span>
                  <span>Altura: {courseHeight}m</span>
                  <span className="text-ink-400">|</span>
                  <span>{countJumps} vallas</span>
                  <span className="text-ink-400">|</span>
                  <span>{totalMeters}m totales</span>
                </div>
                <span className={`px-3 py-1 rounded-lg font-bold text-white ${totalFaults === 0 ? 'bg-success-500' : 'bg-danger-500'}`}>{totalFaults} Faltas</span>
              </div>

              <div className="grid grid-cols-12 gap-5">
                {/* Arena Grid — 8 cols */}
                <div className="col-span-8 card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <LayoutGrid size={16} className="text-primary-500" />
                    <h3 className="font-bold text-ink-900">Pista ({courseTrackType === 'arena' ? 'Arena' : 'Césped'}) — 10×8</h3>
                    <div className="ml-auto text-[10px] text-ink-500 bg-ink-100 px-2 py-1 rounded flex items-center gap-1"><Info size={12} className="text-primary-500" /> Click valla para seleccionar, celda vacía para mover</div>
                  </div>

                  <div className="relative w-full overflow-x-auto select-none rounded-xl border-2 border-ink-300 shadow-inner">
                    <div className="relative min-w-[600px] aspect-[1.25]" style={{
                      backgroundColor: courseTrackType === 'arena' ? '#E6D3B3' : '#a8d5a0',
                      backgroundImage: courseTrackType === 'arena'
                        ? 'radial-gradient(#C2A878 1.5px, transparent 1.5px)'
                        : 'radial-gradient(#8dc484 1.5px, transparent 1.5px)',
                      backgroundSize: '30px 30px', width: '100%'
                    }}>
                      {/* Grid Lines */}
                      <div className="absolute inset-0 grid grid-cols-10 grid-rows-8 pointer-events-none opacity-20">
                        {Array.from({ length: 80 }).map((_, i) => <div key={i} className="border border-ink-900/10" />)}
                      </div>

                      {/* SVG Paths */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                        <defs><marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e293b" /></marker></defs>
                        {obstacles.sort((a, b) => a.number - b.number).map((obs, i, arr) => {
                          if (i === arr.length - 1) return null;
                          const next = arr[i + 1];
                          const x1 = obs.col * 10 + 5, y1 = obs.row * 12.5 + 6.25, x2 = next.col * 10 + 5, y2 = next.row * 12.5 + 6.25;
                          let c = '#10B981'; if (obs.status === 'derribo') c = '#EF4444'; if (obs.status === 'rehuse') c = '#F59E0B';
                          return <line key={`p-${obs.id}`} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} stroke={c} strokeWidth="3.5" strokeDasharray="6 8" markerEnd="url(#arrow)" />;
                        })}
                      </svg>

                      {/* Path Labels */}
                      <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
                        {obstacles.sort((a, b) => a.number - b.number).map((obs, i, arr) => {
                          if (i === arr.length - 1) return null;
                          const next = arr[i + 1];
                          const left = ((obs.col + next.col) / 2 + 0.5) * 10, top = ((obs.row + next.row) / 2 + 0.5) * 12.5;
                          return (
                            <div key={`l-${obs.id}`} className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 bg-white border border-ink-300 px-2 py-0.5 rounded-md text-[10px] font-bold text-ink-800 shadow-md flex items-center gap-1 hover:scale-105 transition-transform"
                              style={{ left: `${left}%`, top: `${top}%` }}>
                              <span>{obs.exitHand === 'derecha' ? '↪️D' : obs.exitHand === 'izquierda' ? '↩️I' : '➡️R'}</span>
                              <span className="w-px h-2.5 bg-ink-200" />
                              <span className="text-primary-600">{obs.metersToNext}m ({obs.stridesToNext}g)</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Grid Cells */}
                      <div className="absolute inset-0 grid grid-cols-10 grid-rows-8">
                        {Array.from({ length: 8 }).map((_, r) =>
                          Array.from({ length: 10 }).map((_, c) => {
                            const obs = obstacles.find(o => o.col === c && o.row === r);
                            const isSel = obs && obs.id === selectedId;
                            return (
                              <div key={`${r}-${c}`} onClick={() => handleCellClick(c, r)}
                                className={`relative w-full h-full flex items-center justify-center cursor-pointer transition-all duration-150 ${!obs && selectedId ? 'hover:bg-primary-500/10' : ''} ${!obs && !selectedId ? 'hover:bg-black/5' : ''}`}>
                                {!obs && <div className="h-1.5 w-1.5 rounded-full bg-ink-400/20" />}
                                {obs && (
                                  <div className={`absolute z-30 flex items-center justify-center p-1 rounded-lg transition-all ${isSel ? 'ring-4 ring-primary-500 ring-offset-2 ring-offset-[#E6D3B3] bg-white/20 scale-105' : 'hover:scale-105'}`}
                                    style={{ width: '85%', height: '85%', transform: `rotate(${obs.rotation}deg)`, transformOrigin: 'center center' }}>
                                    {obs.type === 'vertical' && (
                                      <div className="w-full h-4 relative flex flex-col justify-center"><div className="h-2 w-full bg-white border border-danger-500 rounded-full flex overflow-hidden"><div className="w-1/4 h-full bg-danger-500" /><div className="w-1/4 h-full bg-white" /><div className="w-1/4 h-full bg-danger-500" /><div className="w-1/4 h-full bg-white" /></div><div className="absolute left-0 top-0 bottom-0 w-1.5 bg-ink-800 rounded" /><div className="absolute right-0 top-0 bottom-0 w-1.5 bg-ink-800 rounded" /></div>
                                    )}
                                    {obs.type === 'oxer' && (
                                      <div className="w-full h-7 relative flex flex-col justify-between py-1 bg-sky-500/10 rounded-sm"><div className="h-1.5 w-full bg-white border border-primary-500 rounded-full" /><div className="h-1.5 w-full bg-white border border-primary-500 rounded-full" /><div className="absolute left-0 top-0 bottom-0 w-1.5 bg-ink-900 rounded" /><div className="absolute right-0 top-0 bottom-0 w-1.5 bg-ink-900 rounded" /></div>
                                    )}
                                    {obs.type === 'doble' && (
                                      <div className="w-full h-full border border-dashed border-purple-400 bg-purple-500/10 rounded flex flex-col justify-around p-0.5"><div className="h-1.5 w-full bg-purple-600 rounded-full" /><div className="h-1.5 w-full bg-purple-600 rounded-full" /><span className="text-[7px] text-purple-700 text-center font-bold">2</span></div>
                                    )}
                                    {obs.type === 'triple' && (
                                      <div className="w-full h-full border border-dashed border-indigo-400 bg-indigo-500/10 rounded flex flex-col justify-around p-0.5"><div className="h-1 w-full bg-indigo-600 rounded" /><div className="h-1 w-full bg-indigo-600 rounded" /><div className="h-1 w-full bg-indigo-600 rounded" /></div>
                                    )}
                                    {obs.type === 'ria' && (
                                      <div className="w-full h-full bg-sky-200 border-2 border-white/80 rounded flex items-center justify-center overflow-hidden"><div className="w-full h-full bg-gradient-to-r from-sky-400 to-sky-300 opacity-80" /><span className="absolute text-[8px] text-sky-800 font-extrabold uppercase">AGUA</span></div>
                                    )}
                                    <div className="absolute -top-3.5 -left-3.5 z-40 h-5 w-5 bg-ink-950 text-white rounded-full flex items-center justify-center font-bold text-[10px]" style={{ transform: `rotate(${-obs.rotation}deg)` }}>
                                      {obs.number}
                                      <div className="absolute -bottom-1 -right-1">
                                        {obs.status === 'limpio' && <div className="h-2 w-2 rounded-full bg-success-500 border border-white" />}
                                        {obs.status === 'derribo' && <div className="h-2 w-2 rounded-full bg-danger-500 border border-white" />}
                                        {obs.status === 'rehuse' && <div className="h-2 w-2 rounded-full bg-gold-400 border border-white" />}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Horse Simulation Marker */}
                      {isSimulating && (
                        <div className={`absolute z-50 flex items-center justify-center pointer-events-none transition-all ${isJumping ? 'scale-[1.8] -translate-y-8 duration-200' : 'duration-150'}`}
                          style={{ left: `${horsePos.x - 22}px`, top: `${horsePos.y - 22}px`, width: '44px', height: '44px', transform: `rotate(${horsePos.angle}deg)` }}>
                          <div className="bg-white border-2 border-primary-600 rounded-full w-9 h-9 flex items-center justify-center shadow-lg transform rotate-[-90deg]"><span className="text-xl">🐴</span></div>
                        </div>
                      )}

                      {/* Start/Finish */}
                      {obstacles.length > 0 && (
                        <>
                          <div className="absolute bg-success-600 text-white px-2 py-0.5 rounded text-[8px] font-bold z-20 pointer-events-none shadow"
                            style={{ left: `${obstacles.find(o => o.number === 1)?.col * 10 + 5}%`, top: `${obstacles.find(o => o.number === 1)?.row * 12.5 + 13}%`, transform: 'translateX(-50%)' }}>INICIO</div>
                          <div className="absolute bg-danger-600 text-white px-2 py-0.5 rounded text-[8px] font-bold z-20 pointer-events-none shadow"
                            style={{ left: `${obstacles.find(o => o.number === obstacles.length)?.col * 10 + 5}%`, top: `${obstacles.find(o => o.number === obstacles.length)?.row * 12.5 + 13}%`, transform: 'translateX(-50%)' }}>META</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Cell Placement Menu */}
                  {isCellMenuOpen && cellMenuCoords && (
                    <div className="mt-3 p-3 bg-primary-50 rounded-xl border border-primary-100 flex items-center justify-between flex-wrap gap-2 animate-fade-in">
                      <span className="text-xs font-semibold text-primary-900">Añadir valla (Col {cellMenuCoords.col + 1}, Fila {cellMenuCoords.row + 1}):</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {Object.entries(OBSTACLE_TYPES).map(([t, d]) => (
                          <button key={t} onClick={() => placeObstacle(t)} className="btn-secondary py-1 px-2.5 text-[11px] font-semibold hover:bg-primary-100 text-primary-800 flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${d.color}`} />{d.name}
                          </button>
                        ))}
                        <button onClick={() => { playSynthSound('click'); setIsCellMenuOpen(false); }} className="btn-secondary py-1 px-2.5 text-[11px]">Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Obstacle Editor — 4 cols */}
                <div className="col-span-4 space-y-4">
                  {selectedId && obstacles.find(o => o.id === selectedId) && (() => {
                    const obs = obstacles.find(o => o.id === selectedId);
                    const hasNext = obs.number < obstacles.length;
                    return (
                      <div className="card p-4 border-primary-300 ring-2 ring-primary-100/50 space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center border-b pb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 bg-primary-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">{obs.number}</div>
                            <h4 className="font-bold text-ink-900 text-sm">Editar Valla</h4>
                          </div>
                          <span className="text-[10px] text-ink-500 font-medium bg-ink-100 px-2 py-0.5 rounded">C{obs.col + 1} R{obs.row + 1}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Tipo</label>
                            <select value={obs.type} onChange={e => updateObstacleField(obs.id, 'type', e.target.value)} className="input-field text-sm">
                              {Object.entries(OBSTACLE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                            </select>
                          </div>
                          <div><label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Altura</label>
                            <select value={obs.height} onChange={e => updateObstacleField(obs.id, 'height', e.target.value)} className="input-field text-sm font-bold">
                              {['0.80','0.90','1.00','1.05','1.10','1.15','1.20','1.25','1.30','1.35','1.40','1.45','1.50','1.60'].map(h => <option key={h} value={h}>{h}m</option>)}
                            </select>
                          </div>
                        </div>

                        <div><label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Resultado</label>
                          <div className="flex bg-ink-50 p-1 border rounded-lg">
                            {[{ v: 'limpio', l: 'Limpio', c: 'bg-success-500' }, { v: 'derribo', l: 'Derribo', c: 'bg-danger-500' }, { v: 'rehuse', l: 'Rehúse', c: 'bg-gold-500' }].map(s => (
                              <button key={s.v} onClick={() => { playSynthSound('click'); updateObstacleField(obs.id, 'status', s.v); }}
                                className={`flex-1 text-center py-1.5 text-xs font-bold rounded ${obs.status === s.v ? s.c + ' text-white shadow-sm' : 'text-ink-600'}`}>{s.l}</button>
                            ))}
                          </div>
                        </div>

                        <div><label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Mano de Salida</label>
                          <div className="flex bg-ink-50 p-1 border rounded-lg">
                            {[{ v: 'izquierda', l: 'Izq ↩️' }, { v: 'recto', l: 'Recto ➡️' }, { v: 'derecha', l: 'Der ↪️' }].map(h => (
                              <button key={h.v} onClick={() => { playSynthSound('click'); updateObstacleField(obs.id, 'exitHand', h.v); }}
                                className={`flex-1 text-center py-1.5 text-xs font-semibold rounded ${obs.exitHand === h.v ? 'bg-primary-500 text-white shadow' : 'text-ink-600'}`}>{h.l}</button>
                            ))}
                          </div>
                        </div>

                        {hasNext && (
                          <div className="bg-primary-50/50 p-3 rounded-xl border border-primary-100 space-y-3">
                            <div><label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Metros → Valla {obs.number + 1}</label>
                              <div className="flex items-center gap-2"><input type="number" value={obs.metersToNext} onChange={e => updateObstacleField(obs.id, 'metersToNext', Number(e.target.value))} className="input-field text-sm font-bold" /><span className="text-sm font-semibold text-ink-500">m</span></div>
                            </div>
                            <div><label className="text-[10px] font-semibold text-ink-500 uppercase block mb-1">Galopes</label>
                              <div className="flex items-center gap-2"><input type="number" value={obs.stridesToNext} onChange={e => updateObstacleField(obs.id, 'stridesToNext', Number(e.target.value))} className="input-field text-sm font-bold" /><span className="text-xs text-ink-500 font-semibold">galopes</span></div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 justify-end pt-2 border-t">
                          <button onClick={() => rotateObstacle(45)} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"><RotateCw size={14} /> 45°</button>
                          <button onClick={() => deleteObstacle(obs.id)} className="text-xs text-danger-600 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg bg-danger-50 border border-danger-100 hover:bg-danger-100">
                            <Trash2 size={14} /> Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Sim Controls */}
                  <div className="card p-4 space-y-3">
                    <button onClick={handleStartSim}
                      className={`btn-primary w-full py-2.5 font-bold flex items-center justify-center gap-2 ${isSimulating ? 'bg-danger-500 hover:bg-danger-600' : 'bg-success-600 hover:bg-success-700'}`}>
                      {isSimulating ? <><Square size={16} /> Detener</> : <><Play size={16} /> Simular</>}
                    </button>
                    {isSimulating && <div className="text-xs font-medium text-primary-700 bg-primary-50 border border-primary-100 px-3 py-2 rounded-lg animate-pulse">{simStatusText}</div>}
                    {simLog.length > 0 && (
                      <div className="bg-ink-900 text-ink-100 p-2.5 rounded-lg text-[10px] font-mono max-h-28 overflow-y-auto space-y-0.5">
                        {simLog.map((l, i) => <div key={i}><span className="text-ink-500">[{i + 1}]</span> {l}</div>)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════ STICKY MOBILE SCOREBOARD (only on secuencia tab) ═══════ */}
      {activeTab === 'secuencia' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-ink-900 text-white px-4 py-3 flex items-center justify-between z-40 border-t border-ink-800 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="text-center"><span className="text-[9px] uppercase text-ink-400 block font-bold">Vallas</span><span className="text-base font-bold">{countJumps}</span></div>
            <div className="w-px h-6 bg-ink-700" />
            <div className="text-center"><span className="text-[9px] uppercase text-ink-400 block font-bold">Tiempo</span><span className="text-base font-bold">{actualTime}s</span></div>
            <div className="w-px h-6 bg-ink-700" />
            <div className="text-center">
              <span className="text-[9px] uppercase text-ink-400 block font-bold">Faltas</span>
              <span className={`text-base font-extrabold ${totalFaults === 0 ? 'text-success-400' : 'text-danger-400'}`}>{totalFaults}F</span>
            </div>
          </div>
          <button onClick={() => setSaveModalOpen(true)}
            className="bg-gold-500 text-ink-950 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform">
            <Save size={14} /> Guardar
          </button>
        </div>
      )}

      {/* ═══════ SAVE MODAL ═══════ */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl border border-ink-200 max-w-lg w-full p-5 space-y-4 animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2"><Save className="text-primary-500" /> Registrar Sesión</h3>
                <p className="text-[11px] text-ink-500">{courseName} • {horseName} con {riderName}</p>
              </div>
              <button onClick={() => setSaveModalOpen(false)} className="text-ink-400 hover:text-ink-600 font-bold text-xl leading-none">✕</button>
            </div>

            <div className="bg-ink-50 p-4 rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm border-b pb-2.5">
                <div><span className="text-[10px] text-ink-400 font-semibold block">Recorrido</span><span className="font-bold text-ink-800">{courseName}</span></div>
                <div><span className="text-[10px] text-ink-400 font-semibold block">Fecha</span><span className="font-bold text-ink-800">{courseDate}</span></div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm border-b pb-2.5">
                <div><span className="text-[10px] text-ink-400 font-semibold block">Ubicación</span><span className="font-bold text-ink-800">{courseLocation}</span></div>
                <div><span className="text-[10px] text-ink-400 font-semibold block">Pista</span><span className="font-bold text-ink-800">{courseTrackType === 'arena' ? '🟤 Arena' : '🟢 Césped'}</span></div>
                <div><span className="text-[10px] text-ink-400 font-semibold block">Altura</span><span className="font-bold text-ink-800">{courseHeight}m</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm border-b pb-2.5">
                <div><span className="text-[10px] text-ink-400 font-semibold block">Tiempo</span><span className="font-bold text-ink-800">{actualTime}s (Lím: {timeLimit}s)</span></div>
                <div><span className="text-[10px] text-ink-400 font-semibold block">Penalidades</span><span className={`font-bold ${totalFaults === 0 ? 'text-success-600' : 'text-danger-600'}`}>{totalFaults} Faltas</span></div>
              </div>
              <div className="text-xs space-y-1.5">
                <span className="text-[10px] text-ink-400 font-semibold block">Resumen por Valla</span>
                <div className="flex gap-1.5 flex-wrap">
                  {obstacles.sort((a, b) => a.number - b.number).map(o => (
                    <div key={o.id} className={`px-2 py-1 rounded-md text-[10px] font-semibold border flex items-center gap-1 ${
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

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setSaveModalOpen(false)} className="btn-secondary py-2 px-4 text-sm">Volver</button>
              <button onClick={handleSaveRound} className="btn-primary py-2 px-5 text-sm bg-success-600 hover:bg-success-700">Confirmar y Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
