import { useMemo } from 'react';
import { 
    format, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    isSameMonth, 
    isSameDay, 
    addMonths, 
    subMonths
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarWidget({ currentDate, setCurrentDate, events, onEventClick, onDayClick, isClient = false }) {
    
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    // Group events by YYYY-MM-DD including recurring events
    const eventsByDate = useMemo(() => {
        const grouped = {};
        
        const pushEvent = (dateStr, event) => {
            if (!grouped[dateStr]) grouped[dateStr] = [];
            // Prevent duplicates (though shouldn't happen with this logic)
            if (!grouped[dateStr].find(e => e.id === event.id)) {
                grouped[dateStr].push({ ...event, virtualDate: dateStr });
            }
        };

        const DAY_KEYS = { 1:'lun', 2:'mar', 3:'mie', 4:'jue', 5:'vie', 6:'sab', 7:'dom' };

        days.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            // getDay(): 0 = Sun, 1 = Mon ... 6 = Sat
            // Map to 1 = Mon ... 7 = Sun for easier logic
            let dayOfWeek = day.getDay();
            if (dayOfWeek === 0) dayOfWeek = 7; 
            
            events.forEach(event => {
                const isRecurringHorse = event.routineType === 'recurring';
                const isRecurringGeneral = event.routineType === 'recurring_general' || (!event.horseId && event.frequencyDays);
                
                if (isRecurringHorse) {
                    if (event.daysOfWeek && event.daysOfWeek.includes(dayOfWeek)) {
                        pushEvent(dateStr, event);
                    }
                } else if (isRecurringGeneral) {
                    const dayKey = DAY_KEYS[dayOfWeek];
                    if (event.frequencyDays && event.frequencyDays.includes(dayKey)) {
                        pushEvent(dateStr, { ...event, activityType: event.name }); // Map name to activityType for rendering
                    }
                } else {
                    // Single horse routine
                    if (event.date === dateStr && event.horseId) {
                        pushEvent(dateStr, event);
                    }
                }
            });
        });
        
        // Sort events inside each day by time
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
        });
        return grouped;
    }, [events, days]);

    const getActivityColor = (activityType, isGeneral) => {
        if (isGeneral) return 'bg-ink-100 text-ink-800 border-ink-200'; // Neutral for general tasks

        switch (activityType?.toLowerCase()) {
            case 'noria': return 'bg-sky-100 text-sky-800 border-sky-200';
            case 'pista': return 'bg-primary-100 text-primary-800 border-primary-200';
            case 'descanso': return 'bg-ink-100 text-ink-800 border-ink-200';
            case 'veterinario': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'herrero': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'caminador': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            default: return 'bg-primary-50 text-primary-700 border-primary-100';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-card border border-ink-200 overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-ink-200 flex items-center justify-between bg-ink-50/50">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-ink-900 capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </h2>
                    <button 
                        onClick={goToToday}
                        className="px-3 py-1.5 text-xs font-bold bg-white border border-ink-200 rounded-lg text-ink-600 hover:bg-ink-50 transition-colors shadow-sm"
                    >
                        Hoy
                    </button>
                </div>
                <div className="flex items-center gap-1 bg-white border border-ink-200 rounded-xl p-1 shadow-sm">
                    <button onClick={prevMonth} className="p-1.5 text-ink-500 hover:text-ink-900 hover:bg-ink-100 rounded-lg transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextMonth} className="p-1.5 text-ink-500 hover:text-ink-900 hover:bg-ink-100 rounded-lg transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-ink-200 bg-white">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                    <div key={day} className="py-3 text-center text-xs font-bold text-ink-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-ink-100 gap-[1px]">
                {days.map((day, idx) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayEvents = eventsByDate[dateStr] || [];
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                        <div 
                            key={day.toString()} 
                            onClick={() => !isClient && onDayClick && onDayClick(dateStr)}
                            className={`min-h-[120px] bg-white p-2 transition-colors relative group
                                ${isCurrentMonth ? '' : 'bg-ink-50/30'}
                                ${!isClient && 'cursor-pointer hover:bg-primary-50/30'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
                                    ${isToday ? 'bg-primary-600 text-white shadow-sm' : 
                                      isCurrentMonth ? 'text-ink-900' : 'text-ink-400'}`}
                                >
                                    {format(day, 'd')}
                                </span>
                            </div>

                            <div className="space-y-1.5 max-h-[100px] overflow-y-auto custom-scrollbar pr-1">
                                {dayEvents.map(event => (
                                    <div 
                                        key={event.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Sólo las rutinas de caballos abren el modal (tienen horseId)
                                            if (event.horseId) {
                                                onEventClick && onEventClick(event);
                                            }
                                        }}
                                        className={`px-2 py-1.5 text-xs rounded-lg border flex flex-col gap-1 transition-transform shadow-sm ${!isClient && event.horseId ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'} ${getActivityColor(event.activityType, !event.horseId)}`}
                                    >
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="font-bold truncate" title={event.horseName || 'Tarea General'}>
                                                {event.horseName || '⚙️ Tarea General'}
                                            </span>
                                            {event.time && <span className="text-[10px] font-mono opacity-80 shrink-0">{event.time}</span>}
                                        </div>
                                        <div className="truncate opacity-90 capitalize font-medium">
                                            {event.activityType}
                                            {event.routineType?.includes('recurring') && ' 🔁'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
