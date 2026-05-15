import { useState } from 'react';
import { Square, CheckSquare, Clock, MapPin, Zap } from 'lucide-react';

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
        <div className="space-y-6 pb-20">
            {/* Header Banner - Institutional Premium */}
            <div className="w-full relative rounded-3xl overflow-hidden glass-card">
                <div className="absolute inset-0 bg-gold-500/5 mix-blend-overlay"></div>
                <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-end min-h-[140px]">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md leading-tight">
                        Modo Operativo
                    </h2>
                    <p className="text-sm text-gold-500 font-bold mt-1 uppercase tracking-widest">Resumen de Tu Jornada</p>
                    <div className="mt-4 w-full h-2 glass-card rounded-full overflow-hidden">
                        <div className="h-full bg-gold-500 transition-all duration-1000 ease-out relative" style={{ width: `${progress}%` }}>
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                    <p className="text-[10px] right-8 top-8 absolute font-bold text-slate-400 uppercase tracking-widest">{completedCount} de {tasks.length} cerradas</p>
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                    <Zap size={16} className="text-gold-500"/>
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Cola de Tareas</h3>
                </div>

                {tasks.map(task => (
                    <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`glass-card p-4 cursor-pointer transition-all duration-300 group ${task.completed
                                ? 'grayscale-[50%] opacity-60 bg-slate-900/40 border-slate-800'
                                : 'hover:border-gold-500/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.1)] hover:-translate-y-1'
                            }`}
                    >
                        <div className="flex items-start gap-4 relative z-10">
                            <div className={`mt-0.5 transition-transform duration-300 ${task.completed ? 'text-slate-600 scale-110' : 'text-gold-500 group-hover:scale-110 group-hover:text-gold-400'}`}>
                                {task.completed ? <CheckSquare size={24} /> : <Square size={24} />}
                            </div>
                            <div className="flex-1">
                                <p className={`font-bold text-lg leading-tight mb-2 transition-colors ${task.completed ? 'text-slate-500 line-through' : 'text-slate-100 group-hover:text-white'}`}>
                                    {task.text}
                                </p>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[11px] font-bold flex items-center gap-1 uppercase tracking-wider ${task.completed ? 'text-slate-600' : 'text-slate-400'}`}>
                                        <Clock size={12}/> {task.time}
                                    </span>
                                    {task.loc && (
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider border ${task.completed ? 'bg-slate-800/50 text-slate-600 border-slate-700/50' : task.loc === 'piquete' ? 'bg-green-500/10 text-green-400 border-green-500/30' : task.loc === 'circular' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}>
                                            {task.loc}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-8 p-6 glass-panel border-gold-500/20 text-center relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-1000 group-hover:bg-gold-500/20"></div>
                <h4 className="text-white font-bold mb-2">Sincronización Inteligente</h4>
                <p className="text-xs text-slate-400 font-medium px-4">Todas tus tareas son enviadas al control de administración local en tiempo real.</p>
            </div>
        </div>
    );
}
