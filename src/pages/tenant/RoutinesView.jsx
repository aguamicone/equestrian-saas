import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { PageHeader } from '../../components/ui';
import { Plus } from 'lucide-react';
import CalendarWidget from '../../components/routines/CalendarWidget';
import RoutineModal from '../../components/routines/RoutineModal';

export default function RoutinesView() {
    const { routines, horses } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Filters
    const [horseFilter, setHorseFilter] = useState('');
    const [activityFilter, setActivityFilter] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [editingRoutine, setEditingRoutine] = useState(null);

    const activeHorses = horses.filter(h => !h.archived);

    // Apply filters
    const filteredRoutines = routines.filter(r => {
        if (horseFilter && r.horseId !== horseFilter) return false;
        if (activityFilter && r.activityType !== activityFilter) return false;
        return true;
    });

    const handleDayClick = (dateStr) => {
        setSelectedDate(dateStr);
        setEditingRoutine(null);
        setIsModalOpen(true);
    };

    const handleEventClick = (event) => {
        setEditingRoutine(event);
        setSelectedDate(event.date);
        setIsModalOpen(true);
    };

    const handleNewRoutineClick = () => {
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setEditingRoutine(null);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-4 flex flex-col h-full min-h-[600px]">
            {/* Cabecera del Tab de Calendario */}
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-lg font-bold text-ink-900">Calendario Visual</h3>
                    <p className="text-sm text-ink-500">Gestión y seguimiento de las actividades de los caballos.</p>
                </div>
                <button onClick={handleNewRoutineClick} className="btn-primary flex items-center gap-2 font-bold h-10">
                    <Plus size={18} /> Nueva Rutina de Caballo
                </button>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-white p-4 rounded-2xl shadow-sm border border-ink-200 shrink-0">
                <div className="w-full sm:w-64">
                    <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Filtrar por Caballo</label>
                    <select 
                        value={horseFilter}
                        onChange={e => setHorseFilter(e.target.value)}
                        className="input-field w-full"
                    >
                        <option value="">Todos los caballos</option>
                        {activeHorses.map(h => (
                            <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                    </select>
                </div>
                <div className="w-full sm:w-64">
                    <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Tipo de Actividad</label>
                    <select 
                        value={activityFilter}
                        onChange={e => setActivityFilter(e.target.value)}
                        className="input-field w-full"
                    >
                        <option value="">Todas las actividades</option>
                        <option value="Noria">Noria</option>
                        <option value="Caminador">Caminador</option>
                        <option value="Pista">Pista</option>
                        <option value="Descanso">Descanso</option>
                        <option value="Herrero">Herrero</option>
                        <option value="Veterinario">Veterinario</option>
                        <option value="Peluquería">Peluquería</option>
                    </select>
                </div>
            </div>

            {/* Calendario */}
            <div className="flex-1 min-h-0">
                <CalendarWidget 
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    events={filteredRoutines}
                    onEventClick={handleEventClick}
                    onDayClick={handleDayClick}
                />
            </div>

            {/* Modal */}
            {isModalOpen && (
                <RoutineModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    selectedDate={selectedDate}
                    editingRoutine={editingRoutine}
                />
            )}
        </div>
    );
}
