import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Trash2, User, Clock, Repeat, CalendarDays, Calendar } from 'lucide-react';
import { USERS } from '../../services/mockFirebase';
import { PageHeader, Card, DataTable, Modal, Badge, EmptyState } from '../../components/ui';

// Días de la semana (orden lunes a domingo, como usamos en LATAM)
const WEEK_DAYS = [
    { key: 'lun', label: 'L', full: 'Lunes' },
    { key: 'mar', label: 'M', full: 'Martes' },
    { key: 'mie', label: 'M', full: 'Miércoles' },
    { key: 'jue', label: 'J', full: 'Jueves' },
    { key: 'vie', label: 'V', full: 'Viernes' },
    { key: 'sab', label: 'S', full: 'Sábado' },
    { key: 'dom', label: 'D', full: 'Domingo' },
];

// Configs predefinidas de frecuencia
const FREQ_PRESETS = {
    daily:       { label: 'Diario',        days: ['lun','mar','mie','jue','vie','sab','dom'] },
    weekdays:    { label: 'Lunes a viernes', days: ['lun','mar','mie','jue','vie'] },
    weekends:    { label: 'Fines de semana', days: ['sab','dom'] },
    custom:      { label: 'Personalizada',   days: [] },
};

export default function RoutineManagement() {
    const { routines, addRoutine, deleteRow } = useData();
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [time, setTime] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [freqMode, setFreqMode] = useState('daily'); // 'daily' | 'weekdays' | 'weekends' | 'custom'
    const [customDays, setCustomDays] = useState([]);

    // Confirmación de borrado
    const [routineToDelete, setRoutineToDelete] = useState(null);

    // Solo staff
    const staffMembers = useMemo(() => USERS.filter(u => u.role === 'staff'), []);

    // Días efectivos según el modo seleccionado
    const effectiveDays = freqMode === 'custom' ? customDays : FREQ_PRESETS[freqMode].days;

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

        // Validación: si es custom, debe tener al menos un día seleccionado
        if (freqMode === 'custom' && customDays.length === 0) {
            alert('Seleccioná al menos un día.');
            return;
        }

        const assignee = staffMembers.find(s => s.uid === assignedTo);

        addRoutine({
            name,
            time,
            // Nuevos campos
            frequencyMode: freqMode,
            frequencyDays: effectiveDays,
            frequencyLabel: getFrequencyLabel(freqMode, effectiveDays),
            // Legacy: mantenemos "frequency" como string para compatibilidad
            frequency: getFrequencyLabel(freqMode, effectiveDays),
            assigneeId: assignedTo || null,
            assigneeName: assignee ? assignee.displayName : null,
        });

        resetForm();
    };

    const confirmDelete = () => {
        if (routineToDelete) {
            deleteRow('ROUTINES', routineToDelete.id);
            setRoutineToDelete(null);
        }
    };

    // Definición de columnas para la DataTable
    const columns = [
        {
            key: 'name',
            header: 'Rutina',
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
                    <Badge variant="neutral" size="sm">General</Badge>
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
        <div>
            <PageHeader
                icon={Repeat}
                title="Gestión de rutinas"
                subtitle="Tareas recurrentes asignadas al personal"
                actions={
                    <button onClick={() => setShowForm(true)} className="btn-primary">
                        <Plus size={16} strokeWidth={2} /> Nueva rutina
                    </button>
                }
            />

            <DataTable
                columns={columns}
                data={routines}
                emptyMessage="Aún no hay rutinas definidas"
                emptyIcon={Repeat}
            />

            {/* Modal: nueva rutina */}
            <Modal
                open={showForm}
                onClose={resetForm}
                title="Crear tarea recurrente"
                subtitle="Definí una tarea que se repite con la frecuencia que elijas"
                size="lg"
                footer={
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={resetForm} className="btn-secondary">
                            Cancelar
                        </button>
                        <button type="submit" form="routine-form" className="btn-primary">
                            Guardar rutina
                        </button>
                    </div>
                }
            >
                <form id="routine-form" onSubmit={handleSubmit} className="space-y-5">

                    {/* Nombre */}
                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1.5">
                            Nombre de la tarea
                        </label>
                        <input
                            className="input-field"
                            placeholder="Ej: Limpieza boxes fila 1"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    {/* Frecuencia */}
                    <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1.5">
                            Frecuencia
                        </label>
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

                        {/* Selector de días — visible siempre que NO sea Diario */}
                        {freqMode !== 'daily' && (
                            <div className={`
                                p-3 rounded-lg border bg-sky-50/50 border-sky-200
                                ${freqMode === 'custom' ? '' : 'pointer-events-none opacity-75'}
                            `}>
                                <div className="text-[11px] text-ink-500 mb-2 flex items-center gap-1.5">
                                    <CalendarDays size={12} />
                                    {freqMode === 'custom'
                                        ? 'Seleccioná los días'
                                        : 'Días incluidos (no editable en este modo)'
                                    }
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
                                                title={day.full}
                                                className={`
                                                    w-9 h-9 rounded-lg text-xs font-medium transition-all
                                                    ${isSelected
                                                        ? 'bg-primary-500 text-white shadow-sm'
                                                        : 'bg-white text-ink-500 border border-ink-200 hover:border-primary-300 hover:text-primary-600'
                                                    }
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

                    {/* Horario + Asignación (en 2 columnas) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">
                                Horario sugerido
                            </label>
                            <input
                                type="time"
                                className="input-field"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ink-700 mb-1.5">
                                Asignar a personal
                            </label>
                            <select
                                className="input-field"
                                value={assignedTo}
                                onChange={e => setAssignedTo(e.target.value)}
                            >
                                <option value="">-- Cualquiera --</option>
                                {staffMembers.map(staff => (
                                    <option key={staff.uid} value={staff.uid}>
                                        {staff.displayName}
                                    </option>
                                ))}
                            </select>
                            <p className="text-[11px] text-ink-500 mt-1">
                                Dejá vacío para tarea general
                            </p>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Modal de confirmación de borrado */}
            <Modal
                open={!!routineToDelete}
                onClose={() => setRoutineToDelete(null)}
                title="¿Eliminar rutina?"
                size="sm"
                footer={
                    <div className="flex justify-end gap-2">
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
                    Esta acción no se puede deshacer.
                </p>
            </Modal>
        </div>
    );
}

// ====== Sub-componente: Badge de frecuencia ======
// Muestra la frecuencia de manera legible según el modo
function FrequencyBadge({ routine }) {
    // Compatibilidad con rutinas viejas que solo tenían "frequency: 'Diario'"
    const mode = routine.frequencyMode || 'daily';
    const days = routine.frequencyDays || ['lun','mar','mie','jue','vie','sab','dom'];

    // Caso simple: presets conocidos → badge directo
    if (mode === 'daily') {
        return <Badge variant="primary" size="sm" icon={Repeat}>Diario</Badge>;
    }
    if (mode === 'weekdays') {
        return <Badge variant="sky" size="sm" icon={CalendarDays}>L–V</Badge>;
    }
    if (mode === 'weekends') {
        return <Badge variant="gold" size="sm" icon={CalendarDays}>Fin de semana</Badge>;
    }

    // Custom: mostrar las iniciales de los días
    const labels = WEEK_DAYS
        .filter(d => days.includes(d.key))
        .map(d => d.label)
        .join('·');

    return (
        <Badge variant="neutral" size="sm" icon={Calendar}>
            {labels || '—'}
        </Badge>
    );
}

// ====== Helper: label legible para guardar en DB ======
function getFrequencyLabel(mode, days) {
    if (mode === 'daily') return 'Diario';
    if (mode === 'weekdays') return 'Lun–Vie';
    if (mode === 'weekends') return 'Sáb–Dom';
    // Custom
    const labels = WEEK_DAYS.filter(d => days.includes(d.key)).map(d => d.full);
    return labels.join(', ');
}
