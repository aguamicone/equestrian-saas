import { useState } from 'react';
import { Square, CheckSquare, Clock, Zap } from 'lucide-react';
import { Card } from '../../components/ui';

export default function StaffDashboard() {
    const [tasks, setTasks] = useState([
        { id: 1, text: 'Alimentar Nave A', completed: true, time: '07:00' },
        { id: 2, text: 'Sacar a Paddock - Spirit', completed: true, time: '08:00', loc: 'piquete' },
        { id: 3, text: 'Limpiar Boxes - Fila 1', completed: false, time: '09:00', loc: 'box' },
        { id: 4, text: 'Entreno a la Cuerda', completed: false, time: '10:30', loc: 'circular' },
        { id: 5, text: 'Alimentar Nave B', completed: false, time: '12:00' },
    ]);

    const toggleTask = (id) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const completedCount = tasks.filter(t => t.completed).length;
    const progress = Math.round((completedCount / tasks.length) * 100);

    return (
        <div className="space-y-6 pb-20 max-w-xl mx-auto">
            {/* Header Banner - Cielo y Campo Style */}
            <div className="w-full relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary-500 to-sky-500 text-white shadow-md flex flex-col justify-end min-h-[140px] p-6 sm:p-8">
                <div className="absolute inset-0 bg-white/5 mix-blend-overlay"></div>
                <div className="relative z-10 w-full">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-sm leading-tight">
                        Modo Operativo
                    </h2>
                    <p className="text-xs font-bold text-sky-100 uppercase tracking-widest mt-1">Resumen de Tu Jornada</p>
                    <div className="mt-4 w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white transition-all duration-1000 ease-out relative" style={{ width: `${progress}%` }}>
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-2.5">
                        <span className="text-[10px] font-bold text-sky-100 uppercase tracking-widest">Progreso del día</span>
                        <span className="text-[10px] font-bold text-sky-100 uppercase tracking-widest">{completedCount} de {tasks.length} cerradas ({progress}%)</span>
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                    <Zap size={16} className="text-primary-500"/>
                    <h3 className="text-xs font-bold text-ink-500 uppercase tracking-widest">Cola de Tareas</h3>
                </div>

                {tasks.map(task => (
                    <Card
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        padding="normal"
                        className={`cursor-pointer transition-all duration-200 group border-ink-200 shadow-sm ${task.completed
                                ? 'opacity-60 bg-ink-50/50 border-ink-150 hover:bg-ink-50'
                                : 'hover:border-primary-400 hover:shadow-md hover:-translate-y-0.5 bg-white'
                            }`}
                    >
                        <div className="flex items-start gap-4 relative z-10">
                            <div className={`mt-0.5 transition-transform duration-200 shrink-0 ${task.completed ? 'text-ink-400 scale-100' : 'text-primary-500 group-hover:scale-105 group-hover:text-primary-600'}`}>
                                {task.completed ? <CheckSquare size={24} /> : <Square size={24} />}
                            </div>
                            <div className="flex-1">
                                <p className={`font-bold text-base leading-snug mb-1.5 transition-colors ${task.completed ? 'text-ink-400 line-through' : 'text-ink-800 group-hover:text-primary-700'}`}>
                                    {task.text}
                                </p>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[11px] font-bold flex items-center gap-1 uppercase tracking-wider ${task.completed ? 'text-ink-400' : 'text-ink-500'}`}>
                                        <Clock size={12}/> {task.time}
                                    </span>
                                    {task.loc && (
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider border ${task.completed 
                                            ? 'bg-ink-100 text-ink-500 border-ink-200' 
                                            : task.loc === 'piquete' 
                                                ? 'bg-success-50 text-success-700 border-success-200' 
                                                : task.loc === 'circular' 
                                                    ? 'bg-warning-50 text-warning-700 border-warning-200' 
                                                    : 'bg-primary-50 text-primary-700 border-primary-200'}`}>
                                            {task.loc}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            
            <Card padding="normal" className="mt-8 bg-ink-50/30 border border-ink-200 text-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <h4 className="text-ink-900 font-bold mb-2">Sincronización Inteligente</h4>
                <p className="text-xs text-ink-550 font-medium px-4">Todas tus tareas son enviadas al control de administración en tiempo real.</p>
            </Card>
        </div>
    );
}
