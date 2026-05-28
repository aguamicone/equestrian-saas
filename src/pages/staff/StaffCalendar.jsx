import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { PageHeader } from '../../components/ui';
import { Calendar } from 'lucide-react';
import CalendarWidget from '../../components/routines/CalendarWidget';
import RoutineModal from '../../components/routines/RoutineModal';

export default function StaffCalendar() {
    const { routines, horses } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Filters
    const [horseFilter, setHorseFilter] = useState('');
    const [activityFilter, setActivityFilter] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoutine, setEditingRoutine] = useState(null);

    const activeHorses = horses.filter(h => !h.archived);

    // Apply filters
    const filteredRoutines = routines.filter(r => {
        if (horseFilter && r.horseId !== horseFilter) return false;
        if (activityFilter && r.activityType !== activityFilter) return false;
        return true;
    });

    const handleEventClick = (event) => {
        setEditingRoutine(event);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-4 flex flex-col h-full min-h-[600px] bg-white rounded-3xl p-4 shadow-sm border border-ink-100">
            <PageHeader 
                icon={Calendar} 
                title="Calendario de Actividades" 
                subtitle="Visualización general de las rutinas programadas." 
            />

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-ink-50 p-4 rounded-2xl shadow-sm border border-ink-200 shrink-0">
                <div className="w-full sm:w-64">
                    <label className="block text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Filtrar por Caballo</label>
                    <select 
                        value={horseFilter}
                        onChange={e => setHorseFilter(e.target.value)}
                        className="input-field w-full bg-white"
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
                        className="input-field w-full bg-white"
                    >
                        <option value="">Todas las actividades</option>
                        <option value="Noria">Noria</option>
                        <option value="Caminador">Caminador</option>
                        <option value="Pista">Pista</option>
                        <option value="Descanso">Descanso</option>
                        <option value="Herrero">Herrero</option>
                        <option value="Veterinario">Veterinario</option>
                        <option value="Peluquería">Peluquería</option>
                        <option value="feeding">Alimentación</option>
                    </select>
                </div>
            </div>

            {/* Calendario */}
            <div className="flex-1 min-h-0 bg-white rounded-2xl overflow-hidden border border-ink-100">
                <CalendarWidget 
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    events={filteredRoutines}
                    onEventClick={handleEventClick}
                    onDayClick={() => {}} // Read-only for staff
                />
            </div>

            {/* Modal de Solo Lectura */}
            {isModalOpen && editingRoutine && (
                <RoutineModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    selectedDate={editingRoutine.date}
                    editingRoutine={editingRoutine}
                    isReadOnly={true} // Add this prop if supported, otherwise just rely on viewing mode
                />
            )}
        </div>
    );
}
