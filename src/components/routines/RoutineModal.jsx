import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Calendar, Clock, Activity, Repeat } from 'lucide-react';
import Modal from '../ui/Modal';

const ACTIVITY_TYPES = [
    'Noria',
    'Caminador',
    'Pista',
    'Cuerda',
    'Descanso',
    'Herrero',
    'Veterinario',
    'Peluquería',
    'General'
];

const DAYS_OF_WEEK = [
    { id: 1, label: 'L', name: 'Lunes' },
    { id: 2, label: 'M', name: 'Martes' },
    { id: 3, label: 'X', name: 'Miércoles' },
    { id: 4, label: 'J', name: 'Jueves' },
    { id: 5, label: 'V', name: 'Viernes' },
    { id: 6, label: 'S', name: 'Sábado' },
    { id: 7, label: 'D', name: 'Domingo' }
];

export default function RoutineModal({ isOpen, onClose, selectedDate, editingRoutine }) {
    const { horses, tenantUsers, addRoutine, updateRow, deleteRow } = useData();
    const { currentTenant } = useAuth();
    const { notify } = useNotification();
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        horseId: '',
        activityType: 'Noria',
        routineType: 'single', // 'single' | 'recurring'
        date: '',
        daysOfWeek: [],
        time: '08:00',
        assignedStaffId: '',
        description: ''
    });

    useEffect(() => {
        if (editingRoutine) {
            setFormData({
                horseId: editingRoutine.horseId || (editingRoutine.horseName === 'General' ? 'GENERAL' : ''),
                activityType: editingRoutine.activityType || 'Noria',
                routineType: editingRoutine.routineType || 'single',
                date: editingRoutine.date || '',
                daysOfWeek: editingRoutine.daysOfWeek || [],
                time: editingRoutine.time || '08:00',
                assignedStaffId: editingRoutine.assignedStaffId || '',
                description: editingRoutine.description || ''
            });
        } else {
            setFormData({
                horseId: '',
                activityType: 'Noria',
                routineType: 'single',
                date: selectedDate || new Date().toISOString().split('T')[0],
                daysOfWeek: [],
                time: '08:00',
                assignedStaffId: '',
                description: ''
            });
        }
    }, [editingRoutine, selectedDate, isOpen]);

    const activeHorses = horses.filter(h => !h.archived);
    const staffMembers = tenantUsers.filter(u => u.role === 'staff' || u.role === 'tenantAdmin');

    const handleDayToggle = (dayId) => {
        setFormData(prev => {
            if (prev.daysOfWeek.includes(dayId)) {
                return { ...prev, daysOfWeek: prev.daysOfWeek.filter(d => d !== dayId) };
            } else {
                return { ...prev, daysOfWeek: [...prev.daysOfWeek, dayId].sort() };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.horseId) {
            notify('Selecciona un caballo o "General"', 'error');
            return;
        }

        if (formData.routineType === 'recurring' && formData.daysOfWeek.length === 0) {
            notify('Debes seleccionar al menos un día para la rutina repetitiva', 'error');
            return;
        }

        setSaving(true);
        try {
            const isGeneral = formData.horseId === 'GENERAL';
            const horse = isGeneral ? null : horses.find(h => h.id === formData.horseId);
            const dataToSave = {
                ...formData,
                horseId: isGeneral ? '' : formData.horseId,
                horseName: isGeneral ? 'General' : (horse?.name || 'Desconocido'),
                description: isGeneral ? formData.description : '',
                tenantId: currentTenant.id
            };

            // Clean up unused fields
            if (dataToSave.routineType === 'single') {
                delete dataToSave.daysOfWeek;
            } else {
                delete dataToSave.date;
            }

            if (editingRoutine) {
                // If the user clicked on a specific virtual event for a recurring routine,
                // we are editing the WHOLE recurrence rule (editingRoutine.id).
                await updateRow('ROUTINES', editingRoutine.id, dataToSave);
                notify('Rutina actualizada exitosamente', 'success');
            } else {
                await addRoutine(dataToSave);
            }
            onClose();
        } catch (error) {
            console.error(error);
            notify('Error al guardar la rutina', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editingRoutine) return;
        
        const confirmMsg = editingRoutine.routineType === 'recurring' 
            ? `¿Eliminar esta rutina RECURRENTE de ${editingRoutine.horseName}? Esto borrará la rutina de todos los días.`
            : `¿Eliminar esta rutina de ${editingRoutine.horseName}?`;

        if (window.confirm(confirmMsg)) {
            setSaving(true);
            try {
                await deleteRow('ROUTINES', editingRoutine.id);
                notify('Rutina eliminada', 'success');
                onClose();
            } catch (error) {
                console.error(error);
                notify('Error al eliminar', 'error');
            } finally {
                setSaving(false);
            }
        }
    };

    const footer = (
        <div className="flex justify-between w-full">
            <div>
                {editingRoutine && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-bold text-danger-600 hover:bg-danger-50 rounded-xl transition-colors disabled:opacity-50"
                    >
                        Eliminar
                    </button>
                )}
            </div>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="btn-secondary"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    form="routineForm"
                    disabled={saving}
                    className="btn-primary"
                >
                    {saving ? 'Guardando...' : (editingRoutine ? 'Guardar' : 'Agendar')}
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={saving ? undefined : onClose}
            title={editingRoutine ? 'Editar Rutina' : 'Nueva Rutina'}
            size="md"
            footer={footer}
        >
            <form id="routineForm" onSubmit={handleSubmit} className="space-y-5 p-1">

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-ink-800">Caballo</label>
                    <select
                        value={formData.horseId}
                        onChange={(e) => setFormData({ ...formData, horseId: e.target.value, activityType: e.target.value === 'GENERAL' ? 'General' : (formData.activityType === 'General' ? 'Noria' : formData.activityType) })}
                        className="input-field"
                        required
                        disabled={saving}
                    >
                        <option value="">Selecciona un caballo...</option>
                        <option value="GENERAL">⚙️ General</option>
                        {activeHorses.map(h => (
                            <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                    </select>
                </div>

                {formData.horseId === 'GENERAL' && (
                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-ink-800">Descripción</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="input-field"
                            placeholder="Ej: Reunión cross, Visita proveedor, etc."
                            disabled={saving}
                        />
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-ink-800">Tipo de Actividad</label>
                    <select
                        value={formData.activityType}
                        onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                        className="input-field"
                        required
                        disabled={saving}
                    >
                        {ACTIVITY_TYPES.map(act => (
                            <option key={act} value={act}>{act}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-semibold text-ink-800">Frecuencia</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="routineType"
                                value="single"
                                checked={formData.routineType === 'single'}
                                onChange={() => setFormData({ ...formData, routineType: 'single' })}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                disabled={saving}
                            />
                            <span className="text-sm text-ink-700 flex items-center gap-1.5"><Calendar size={14}/> Una sola vez</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="routineType"
                                value="recurring"
                                checked={formData.routineType === 'recurring'}
                                onChange={() => setFormData({ ...formData, routineType: 'recurring' })}
                                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                disabled={saving}
                            />
                            <span className="text-sm text-ink-700 flex items-center gap-1.5"><Repeat size={14}/> Rutina Semanal</span>
                        </label>
                    </div>
                </div>

                {formData.routineType === 'single' ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-ink-800">Fecha</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="input-field"
                                required
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-ink-800">Hora</label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="input-field"
                                required
                                disabled={saving}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 bg-ink-50 p-4 rounded-xl border border-ink-200">
                        <label className="text-sm font-semibold text-ink-800">Días de la semana</label>
                        <div className="flex gap-2 justify-between">
                            {DAYS_OF_WEEK.map(day => {
                                const isSelected = formData.daysOfWeek.includes(day.id);
                                return (
                                    <button
                                        key={day.id}
                                        type="button"
                                        onClick={() => handleDayToggle(day.id)}
                                        disabled={saving}
                                        className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center transition-colors ${
                                            isSelected 
                                                ? 'bg-primary-600 text-white shadow-sm' 
                                                : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-100'
                                        }`}
                                        title={day.name}
                                    >
                                        {day.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="pt-2 mt-2 border-t border-ink-200">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-ink-800">Hora de la actividad</label>
                                <input
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="input-field w-full"
                                    required
                                    disabled={saving}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-ink-800">Responsable (Opcional)</label>
                    <select
                        value={formData.assignedStaffId}
                        onChange={(e) => setFormData({ ...formData, assignedStaffId: e.target.value })}
                        className="input-field"
                        disabled={saving}
                    >
                        <option value="">Cualquiera</option>
                        {staffMembers.map(staff => (
                            <option key={staff.uid} value={staff.uid}>{staff.displayName}</option>
                        ))}
                    </select>
                </div>
                
            </form>
        </Modal>
    );
}
