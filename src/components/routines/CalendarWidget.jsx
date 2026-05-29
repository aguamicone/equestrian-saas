import { useState, useMemo, useEffect } from 'react';
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
    subMonths,
    addWeeks,
    subWeeks,
    addDays,
    subDays
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List as ListIcon, LayoutGrid } from 'lucide-react';

export default function CalendarWidget({ currentDate, setCurrentDate, events, onEventClick, onDayClick, isClient = false }) {
    const [viewMode, setViewMode] = useState('month');

    // Auto-detect mobile to default to day view
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setViewMode('day');
            } else {
                setViewMode('month');
            }
        };
        handleResize(); // Initial check
        // We don't attach resize listener to avoid jumping modes while using the app,
        // just set it on mount based on initial screen size.
    }, []);
    
    const nextTime = () => {
        if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
        else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
        else setCurrentDate(addDays(currentDate, 1));
    };

    const prevTime = () => {
        if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
        else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
        else setCurrentDate(subDays(currentDate, 1));
    };

    const goToToday = () => setCurrentDate(new Date());

    const days = useMemo(() => {
        if (viewMode === 'month') {
            const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
            const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
            return eachDayOfInterval({ start, end });
        } else if (viewMode === 'week') {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            const end = endOfWeek(currentDate, { weekStartsOn: 1 });
            return eachDayOfInterval({ start, end });
        } else {
            return [currentDate];
        }
    }, [currentDate, viewMode]);

    // Group events by YYYY-MM-DD including recurring events
    const eventsByDate = useMemo(() => {
        const grouped = {};
        
        const pushEvent = (dateStr, event) => {
            if (!grouped[dateStr]) grouped[dateStr] = [];
            if (!grouped[dateStr].find(e => e.id === event.id)) {
                grouped[dateStr].push({ ...event, virtualDate: dateStr });
            }
        };

        const DAY_KEYS = { 1:'lun', 2:'mar', 3:'mie', 4:'jue', 5:'vie', 6:'sab', 7:'dom' };

        days.forEach(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
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
                        pushEvent(dateStr, { ...event, activityType: event.name }); 
                    }
                } else {
                    if (event.date === dateStr) {
                        pushEvent(dateStr, event);
                    }
                }
            });
        });
        
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
        });
        return grouped;
    }, [events, days]);

    const getActivityColor = (activityType) => {
        switch (activityType?.toLowerCase()) {
            case 'general': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'noria': return 'bg-sky-100 text-sky-800 border-sky-200';
            case 'pista': return 'bg-primary-100 text-primary-800 border-primary-200';
            case 'descanso': return 'bg-ink-100 text-ink-800 border-ink-200';
            case 'veterinario': return 'bg-rose-100 text-rose-800 border-rose-200';
            case 'herrero': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'caminador': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            default: return 'bg-primary-50 text-primary-700 border-primary-100';
        }
    };

    const displayTitle = () => {
        if (viewMode === 'month') return format(currentDate, 'MMMM yyyy', { locale: es });
        if (viewMode === 'week') {
            const start = days[0];
            const end = days[days.length - 1];
            if (isSameMonth(start, end)) return `${format(start, 'd')} al ${format(end, 'd')} de ${format(start, 'MMMM yyyy', { locale: es })}`;
            return `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM yyyy', { locale: es })}`;
        }
        return format(currentDate, "EEEE d 'de' MMMM", { locale: es });
    };

    return (
        <div className="bg-white rounded-2xl shadow-card border border-ink-200 overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-ink-200 bg-ink-50/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-ink-900 capitalize">
                            {displayTitle()}
                        </h2>
                        <button 
                            onClick={goToToday}
                            className="px-3 py-1.5 text-xs font-bold bg-white border border-ink-200 rounded-lg text-ink-600 hover:bg-ink-50 transition-colors shadow-sm shrink-0"
                        >
                            Hoy
                        </button>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                        {/* View Toggles */}
                        <div className="flex bg-ink-100 p-1 rounded-xl">
                            <button 
                                onClick={() => setViewMode('day')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${viewMode === 'day' ? 'bg-white text-primary-700 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}
                            >
                                <ListIcon size={14}/> Día
                            </button>
                            <button 
                                onClick={() => setViewMode('week')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${viewMode === 'week' ? 'bg-white text-primary-700 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}
                            >
                                <LayoutGrid size={14}/> Sem
                            </button>
                            <button 
                                onClick={() => setViewMode('month')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${viewMode === 'month' ? 'bg-white text-primary-700 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}
                            >
                                <CalendarIcon size={14}/> Mes
                            </button>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-1 bg-white border border-ink-200 rounded-xl p-1 shadow-sm">
                            <button onClick={prevTime} className="p-1.5 text-ink-500 hover:text-ink-900 hover:bg-ink-100 rounded-lg transition-colors">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={nextTime} className="p-1.5 text-ink-500 hover:text-ink-900 hover:bg-ink-100 rounded-lg transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {viewMode === 'day' ? (
                // --- DAY VIEW (List Style) ---
                <div className="flex-1 overflow-y-auto bg-ink-50 p-4">
                    {(() => {
                        const dateStr = format(currentDate, 'yyyy-MM-dd');
                        const dayEvents = eventsByDate[dateStr] || [];
                        
                        if (dayEvents.length === 0) {
                            return (
                                <div className="h-full flex flex-col items-center justify-center text-ink-400 p-8 text-center bg-white rounded-2xl border border-dashed border-ink-200">
                                    <CalendarIcon size={32} className="mb-2 opacity-50"/>
                                    <p className="font-medium">No hay actividades programadas para este día.</p>
                                </div>
                            );
                        }

                        return (
                            <div className="space-y-3">
                                {dayEvents.map(event => (
                                    <div 
                                        key={event.id}
                                        onClick={(e) => {
                                            if (!isClient) {
                                                onEventClick && onEventClick(event);
                                            }
                                        }}
                                        className={`bg-white p-4 rounded-xl shadow-sm border border-ink-100 flex items-start gap-4 transition-all ${!isClient ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-primary-200' : 'cursor-default'}`}
                                    >
                                        <div className="shrink-0 w-16 text-center">
                                            <span className="block text-sm font-black text-ink-900">{event.time || 'N/A'}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-ink-800 text-base leading-tight">
                                                    {event.horseId ? event.horseName : (event.description || 'Tarea General')}
                                                </h4>
                                                {!event.horseId && event.description && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500">General</span>
                                                )}
                                                <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${getActivityColor(event.activityType)}`}>
                                                    {event.activityType}
                                                </span>
                                            </div>
                                            {(event.notes || event.description || event.routineType?.includes('recurring')) && (
                                                <div className="mt-2 text-sm text-ink-500 flex items-center gap-2">
                                                    {event.routineType?.includes('recurring') && <span title="Recurrente">🔁</span>}
                                                    <span>{event.description || event.notes || 'Sin detalles extra'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            ) : (
                // --- MONTH & WEEK VIEW (Grid Style) ---
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="grid grid-cols-7 border-b border-ink-200 bg-white shrink-0">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                            <div key={day} className="py-2 sm:py-3 text-center text-[10px] sm:text-xs font-bold text-ink-500 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className={`flex-1 grid grid-cols-7 bg-ink-100 gap-[1px] ${viewMode === 'month' ? 'auto-rows-[minmax(80px,1fr)]' : 'auto-rows-[minmax(200px,1fr)]'}`}>
                        {days.map((day) => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const dayEvents = eventsByDate[dateStr] || [];
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <div 
                                    key={day.toString()} 
                                    onClick={() => !isClient && onDayClick && onDayClick(dateStr)}
                                    className={`bg-white p-1 sm:p-2 transition-colors relative group flex flex-col min-w-0
                                        ${isCurrentMonth || viewMode === 'week' ? '' : 'bg-ink-50/30'}
                                        ${!isClient && 'cursor-pointer hover:bg-primary-50/30'}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-1 sm:mb-2 shrink-0">
                                        <span className={`text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full
                                            ${isToday ? 'bg-primary-600 text-white shadow-sm' : 
                                              (isCurrentMonth || viewMode === 'week') ? 'text-ink-900' : 'text-ink-400'}`}
                                        >
                                            {format(day, 'd')}
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-0.5 space-y-1 min-h-0">
                                        {dayEvents.map(event => (
                                            <div 
                                                key={event.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!isClient) {
                                                        onEventClick && onEventClick(event);
                                                    }
                                                }}
                                                className={`p-1 sm:px-2 sm:py-1.5 text-[9px] sm:text-xs rounded border flex flex-col transition-transform shadow-sm ${!isClient ? 'cursor-pointer hover:scale-[1.02]' : 'cursor-default'} ${getActivityColor(event.activityType)}`}
                                            >
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="font-bold truncate" title={event.horseId ? event.horseName : (event.description || 'Tarea General')}>
                                                        {event.horseId ? event.horseName : (event.description || '⚙')}
                                                    </span>
                                                    {event.time && <span className="hidden sm:inline text-[9px] font-mono opacity-80 shrink-0">{event.time}</span>}
                                                </div>
                                                <div className="truncate opacity-90 capitalize font-medium hidden sm:block">
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
            )}
        </div>
    );
}
