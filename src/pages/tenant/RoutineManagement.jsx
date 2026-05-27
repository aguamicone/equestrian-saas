import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Trash2, Clock, Repeat, CalendarDays, Calendar } from 'lucide-react';
import { PageHeader, DataTable, Modal, Badge } from '../../components/ui';
import RoutinesView from './RoutinesView';

const WEEK_DAYS = [
    { key: 'lun', label: 'L', full: 'Lunes' },
    { key: 'mar', label: 'M', full: 'Martes' },
    { key: 'mie', label: 'M', full: 'Miércoles' },
    { key: 'jue', label: 'J', full: 'Jueves' },
    { key: 'vie', label: 'V', full: 'Viernes' },
    { key: 'sab', label: 'S', full: 'Sábado' },
    { key: 'dom', label: 'D', full: 'Domingo' },
];

const FREQ_PRESETS = {
    daily:       { label: 'Diario',        days: ['lun','mar','mie','jue','vie','sab','dom'] },
    weekdays:    { label: 'Lunes a viernes', days: ['lun','mar','mie','jue','vie'] },
    weekends:    { label: 'Fines de semana', days: ['sab','dom'] },
    custom:      { label: 'Personalizada',   days: [] },
};

export default function RoutineManagement() {
    const { routines, addRoutine, deleteRow, tenantUsers } = useData();
    const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'general'

    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [time, setTime] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [freqMode, setFreqMode] = useState('daily'); 
    const [customDays, setCustomDays] = useState([]);
    const [routineToDelete, setRoutineToDelete] = useState(null);

    const staffMembers = useMemo(() => (tenantUsers || []).filter(u => u.role === 'staff'), [tenantUsers]);
    const effectiveDays = freqMode === 'custom' ? customDays : FREQ_PRESETS[freqMode].days;

    // Solo filtramos las rutinas que no tienen horseId para la tabla de tareas generales
    const generalRoutines = routines.filter(r => !r.horseId);

    const resetForm = () => {
        setName('');
        setTime('');
        setAssignedTo('');
        setFreqMode('daily');
        setCustomDays([]);
        setShowForm(false);
    };

    const toggleCustomDay = (dayKey) => {
        setCustomDays(prev =>
            prev.includes(dayKey)
                ? prev.filter(d => d !== dayKey)
                : [...prev, dayKey]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (freqMode === 'custom' && customDays.length === 0) {
            alert('Seleccioná al menos un día.');
            return;
        }

        const assignee = staffMembers.find(s => s.uid === assignedTo);

        addRoutine({
            name,
            time,
            frequencyMode: freqMode,
            frequencyDays: effectiveDays,
            frequencyLabel: getFrequencyLabel(freqMode, effectiveDays),
            frequency: getFrequencyLabel(freqMode, effectiveDays),
            assigneeId: assignedTo || null,
            assigneeName: assignee ? assignee.displayName : null,
            routineType: 'recurring_general' // Flag to identify general recurring tasks
        });

        resetForm();
    };

    const confirmDelete = () => {
        if (routineToDelete) {
            deleteRow('ROUTINES', routineToDelete.id);
            setRoutineToDelete(null);
        }
    };

    const columns = [
        {
            key: 'name',
            header: 'Rutina General',
            render: (r) => (
                <div className="font-medium text-ink-800">{r.name}</div>
            ),
        },
        {
            key: 'frequency',
            header: 'Frecuencia',
            render: (r) => <FrequencyBadge routine={r} />,
        },
        {
            key: 'time',
            header: 'Horario',
            render: (r) => (
                <span className="inline-flex items-center gap-1.5 font-mono text-ink-700">
                    <Clock size={13} strokeWidth={1.75} className="text-ink-400" />
                    {r.time || '—'}
                </span>
            ),
        },
        {
            key: 'assignee',
            header: 'Asignado a',
            render: (r) => (
                r.assigneeName ? (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-medium">
                            {r.assigneeName.charAt(0)}
                        </div>
                        <span className="text-ink-700">{r.assigneeName}</span>
                    </div>
                ) : (
                    <Badge variant="neutral" size="sm">Cualquiera</Badge>
                )
            ),
        },
        {
            key: 'actions',
            header: 'Acciones',
            align: 'right',
            width: '90px',
            render: (r) => (
                <button
                    onClick={(e) => { e.stopPropagation(); setRoutineToDelete(r); }}
                    className="text-ink-400 hover:text-danger-500 hover:bg-danger-50 transition-colors p-1.5 rounded-lg"
                    title="Eliminar rutina"
                >
                    <Trash2 size={15} strokeWidth={1.75} />
                </button>
            ),
        },
    ];

    return (
        <div className="space-y-6 flex flex-col h-full min-h-[600px]">
            <PageHeader
                icon={Calendar}
                title="Centro de Rutinas"
                subtitle="Gestión unificada del calendario y de las tareas generales del establecimiento."
            />

            {/* Pestañas (Tabs) */}
            <div className="flex items-center gap-6 border-b border-ink-200 shrink-0 overflow-x-auto custom-scrollbar">
                <button
                    onClick={() => setActiveTab('calendar')}
                    className={`py-3 px-1 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'calendar' 
                            ? 'border-primary-600 text-primary-700' 
                            : 'border-transparent text-ink-500 hover:text-ink-700'
                    }`}
                >
                    Calendario de Caballos
                </button>
                <button
                    onClick={() => setActiveTab('general')}
                    className={`py-3 px-1 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === 'general' 
                            ? 'border-primary-600 text-primary-700' 
                            : 'border-transparent text-ink-500 hover:text-ink-700'
                    }`}
                >
                    Tareas Generales (Haras)
                </button>
            </div>

            {/* Contenido de los Tabs */}
            <div className="flex-1 min-h-0">
                {activeTab === 'calendar' && (
                    <div className="h-full">
                        <RoutinesView />
                    </div>
                )}

                {activeTab === 'general' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-lg font-bold text-ink-900">Tareas Generales</h3>
                                <p className="text-sm text-ink-500">Mantenimiento, limpieza, alimentación y otros trabajos del personal.</p>
                            </div>
                            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 h-10">
                                <Plus size={16} strokeWidth={2} /> Nueva Tarea General
                            </button>
                        </div>
                        <DataTable
                            columns={columns}
                            data={generalRoutines}
                            emptyMessage="Aún no hay tareas generales definidas"
                            emptyIcon={Repeat}
                        />
                    </div>
                )}
            </div>

            {/* Modal: nueva rutina general */}
            <Modal
                isOpen={showForm}
                onClose={resetForm}
                title="Crear Tarea General Recurrente"
                size="lg"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <button type="button" onClick={resetForm} className="btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" form="general-routine-form" className="btn-primary">
                            Guardar Tarea
                        </button>
                    </div>
                }
            >
                <form id="general-routine-form" onSubmit={handleSubmit} className="space-y-5 p-1">
                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1.5">Nombre de la tarea</label>
                        <input
                            className="input-field"
                            placeholder="Ej: Limpieza general de boxes"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1.5">Frecuencia</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                            {Object.entries(FREQ_PRESETS).map(([key, preset]) => (
                                <button
                                    type="button"
                                    key={key}
                                    onClick={() => setFreqMode(key)}
                                    className={`
                                        px-3 py-2 rounded-lg text-xs font-medium border transition-all
                                        ${freqMode === key
                                            ? 'bg-primary-50 border-primary-400 text-primary-700 ring-2 ring-primary-100'
                                            : 'bg-white border-ink-200 text-ink-600 hover:border-ink-300 hover:bg-ink-50'
                                        }
                                    `}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {freqMode !== 'daily' && (
                            <div className={`
                                p-3 rounded-lg border bg-sky-50/50 border-sky-200
                                ${freqMode === 'custom' ? '' : 'pointer-events-none opacity-75'}
                            `}>
                                <div className="text-[11px] text-ink-500 mb-2 flex items-center gap-1.5">
                                    <CalendarDays size={12} />
                                    {freqMode === 'custom' ? 'Seleccioná los días' : 'Días incluidos'}
                                </div>
                                <div className="flex gap-1.5 flex-wrap">
                                    {WEEK_DAYS.map(day => {
                                        const isSelected = effectiveDays.includes(day.key);
                                        return (
                                            <button
                                                type="button"
                                                key={day.key}
                                                onClick={() => freqMode === 'custom' && toggleCustomDay(day.key)}
                                                disabled={freqMode !== 'custom'}
                                                className={`
                                                    w-9 h-9 rounded-lg text-xs font-medium transition-all
                                                    ${isSelected ? 'bg-primary-500 text-white shadow-sm' : 'bg-white text-ink-500 border border-ink-200 hover:border-primary-300 hover:text-primary-600'}
                                                    ${freqMode !== 'custom' ? 'cursor-default' : 'cursor-pointer'}
                                                `}
                                            >
                                                {day.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Horario sugerido</label>
                            <input
                                type="time"
                                className="input-field"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">Asignar a personal</label>
                            <select
                                className="input-field"
                                value={assignedTo}
                                onChange={e => setAssignedTo(e.target.value)}
                            >
                                <option value="">-- Cualquiera --</option>
                                {staffMembers.map(staff => (
                                    <option key={staff.uid} value={staff.uid}>{staff.displayName}</option>
                                ))}
                            </select>
                            <p className="text-[11px] text-ink-500 mt-1">Dejá vacío para tarea general conjunta</p>
                        </div>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={!!routineToDelete}
                onClose={() => setRoutineToDelete(null)}
                title="¿Eliminar rutina general?"
                size="sm"
                footer={
                    <div className="flex justify-end gap-2 w-full">
                        <button onClick={() => setRoutineToDelete(null)} className="btn-secondary">
                            Cancelar
                        </button>
                        <button onClick={confirmDelete} className="btn-danger">
                            Eliminar
                        </button>
                    </div>
                }
            >
                <p className="text-sm text-ink-700">
                    Vas a eliminar <span className="font-medium text-ink-800">"{routineToDelete?.name}"</span>.
                    Esta acción borrará la tarea del calendario de todos los días.
                </p>
            </Modal>
        </div>
    );
}

function FrequencyBadge({ routine }) {
    const mode = routine.frequencyMode || 'daily';
    const days = routine.frequencyDays || ['lun','mar','mie','jue','vie','sab','dom'];

    if (mode === 'daily') return <Badge variant="primary" size="sm" icon={Repeat}>Diario</Badge>;
    if (mode === 'weekdays') return <Badge variant="sky" size="sm" icon={CalendarDays}>L–V</Badge>;
    if (mode === 'weekends') return <Badge variant="gold" size="sm" icon={CalendarDays}>Fin de semana</Badge>;

    const labels = WEEK_DAYS.filter(d => days.includes(d.key)).map(d => d.label).join('·');
    return <Badge variant="neutral" size="sm" icon={Calendar}>{labels || '—'}</Badge>;
}

function getFrequencyLabel(mode, days) {
    if (mode === 'daily') return 'Diario';
    if (mode === 'weekdays') return 'Lun–Vie';
    if (mode === 'weekends') return 'Sáb–Dom';
    const labels = WEEK_DAYS.filter(d => days.includes(d.key)).map(d => d.full);
    return labels.join(', ');
}
