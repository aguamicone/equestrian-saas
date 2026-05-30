import { MapPin, Swords, Medal, ChevronRight, Activity, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ClientDashboard() {
    const { tenantSettings, horses, logs, finances, routines, events } = useData();
    const { currentUser } = useAuth();

    // Data filtering
    const myHorses = (horses || []).filter(h => h.ownerId === currentUser?.uid);
    const myHorseIds = myHorses.map(h => h.id);
    const myLogs = (logs || []).filter(l => myHorseIds.includes(l.horseId));

    // Calculate current week
    const now = new Date();
    const currentDay = now.getDay() || 7; 
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay + 1);
    startOfWeek.setHours(0,0,0,0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const thisWeekLogs = myLogs.filter(l => {
        const d = new Date(l.timestamp || l.date);
        return d >= startOfWeek && d <= endOfWeek;
    });

    const weeklyTrainings = thisWeekLogs.filter(l => l.type === 'training_log').length;
    const weeklyJumps = thisWeekLogs.filter(l => l.type === 'show_jumping_log').length;

    const locColors = {
        box: 'bg-ink-100 text-ink-700 border border-ink-200',
        piquete: 'bg-success-50 text-success-700 border border-success-200',
        circular: 'bg-gold-50 text-gold-700 border border-gold-200'
    };

    // Calculate Debt
    const hasDebt = (finances || []).some(f => f.clientId === currentUser?.uid && f.status === 'pending');

    // Calculate Today's Agenda
    const todayStr = new Date().toISOString().split('T')[0];
    const myRoutinesToday = (routines || []).filter(r => myHorseIds.includes(r.horseId) && r.date === todayStr);
    const myEventsToday = (events || []).filter(e => e.date === todayStr);
    const todayAgenda = [...myRoutinesToday, ...myEventsToday].sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

    return (
        <div className="space-y-6 pb-20">

            {/* Premium Header Banner */}
            <div className="w-full relative rounded-3xl overflow-hidden shadow-card border border-ink-100 bg-gradient-to-br from-primary-50 via-white to-sky-50">
                <div className="relative z-10 p-6 sm:p-8 flex flex-col items-start justify-end min-h-[160px]">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 border border-primary-200 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
                        Mí Dashboard
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-ink-800 drop-shadow-sm leading-tight">
                        Hola, {currentUser?.displayName?.split(' ')[0] || 'Jinete'}
                    </h2>
                    <p className="text-sm text-ink-500 mt-1 font-medium">{tenantSettings?.name || 'Club Ecuestre'}</p>
                </div>
            </div>

            {/* Weekly Metrics */}
            <div>
                <div className="flex justify-between items-end mb-3 px-1">
                    <h3 className="text-ink-800 font-bold text-lg flex items-center gap-2">
                        <Activity size={18} className="text-primary-600"/> Resumen Semanal
                    </h3>
                    <span className="text-xs font-bold text-ink-400 uppercase tracking-widest">Lunes a Domingo</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-ink-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-card relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary-100/50 rounded-full blur-xl transition-all"></div>
                        <div className="flex items-center gap-2 mb-2 relative z-10">
                            <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                                <Swords size={14}/>
                            </div>
                            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Entrenos</span>
                        </div>
                        <div className="text-4xl font-black text-ink-800 relative z-10">{weeklyTrainings}</div>
                    </div>

                    <div className="bg-white border border-ink-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-card relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-gold-100/50 rounded-full blur-xl transition-all"></div>
                        <div className="flex items-center gap-2 mb-2 relative z-10">
                            <div className="w-6 h-6 rounded-full bg-gold-100 flex items-center justify-center text-gold-600">
                                <Medal size={14}/>
                            </div>
                            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Concursos</span>
                        </div>
                        <div className="text-4xl font-black text-ink-800 relative z-10">{weeklyJumps}</div>
                    </div>
                </div>
            </div>

            {/* Today's Agenda (Mini Calendar) */}
            <div>
                <div className="flex justify-between items-end mb-3 px-1">
                    <h3 className="text-ink-800 font-bold text-lg flex items-center gap-2">
                        <Calendar size={18} className="text-primary-600"/> Agenda de Hoy
                    </h3>
                    <Link to="/client/calendar" className="text-xs font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest flex items-center">
                        Ver Calendario <ChevronRight size={14}/>
                    </Link>
                </div>
                
                {todayAgenda.length === 0 ? (
                    <div className="bg-white border border-dashed border-ink-200 rounded-2xl p-4 text-center shadow-sm flex flex-col items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-ink-50 text-ink-300 flex items-center justify-center mb-2">
                            <Calendar size={20} />
                        </div>
                        <p className="text-ink-500 text-sm font-medium">No hay actividades programadas para hoy.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {todayAgenda.map(item => {
                            const isEvent = !!item.title;
                            const horse = horses.find(h => h.id === item.horseId);
                            return (
                                <div key={item.id} className="bg-white border border-ink-200 rounded-xl p-3 flex items-center gap-4 shadow-sm hover:border-primary-300 transition-colors">
                                    <div className="w-14 h-14 rounded-lg bg-primary-50 text-primary-700 flex flex-col items-center justify-center shrink-0 border border-primary-100">
                                        <span className="text-[10px] font-bold uppercase">{new Date().toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                        <span className="text-lg font-black leading-none">{new Date().getDate()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-ink-800 font-bold text-sm truncate">{isEvent ? item.title : item.type}</h4>
                                            {item.time && <span className="text-[10px] font-bold text-ink-500 bg-ink-100 px-2 py-0.5 rounded-full shrink-0">{item.time}</span>}
                                        </div>
                                        <p className="text-xs text-ink-500 truncate">{isEvent ? (item.description || 'Evento general') : `Caballo: ${horse?.name || 'No especificado'}`}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Live Horses */}
            <div>
                <div className="flex justify-between items-end mb-3 px-1">
                    <h3 className="text-ink-800 font-bold text-lg flex items-center gap-2">
                        <MapPin size={18} className="text-primary-600"/> Mis Caballos
                    </h3>
                    <Link to="/client/horses" className="text-xs font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest flex items-center">
                        Ver Todos <ChevronRight size={14}/>
                    </Link>
                </div>

                {myHorses.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-ink-200 rounded-2xl p-8 text-center shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-ink-50 text-ink-400 flex items-center justify-center mx-auto mb-3">
                            <MapPin size={24} />
                        </div>
                        <p className="text-ink-500 font-medium">No tienes caballos asignados a tu cuenta.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myHorses.map(horse => {
                            const loc = horse.location || 'box';
                            return (
                                <Link key={horse.id} to={`/client/horses/${horse.id}`} className="block group">
                                    <div className="bg-white rounded-2xl border border-ink-200 p-4 h-full shadow-card relative overflow-hidden hover:border-primary-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover flex flex-col justify-between">
                                        
                                        {/* Colored Glow based on location */}
                                        <div className={`absolute -right-10 -bottom-10 w-24 h-24 rounded-full blur-2xl ${loc === 'piquete' ? 'bg-success-200/30' : loc === 'circular' ? 'bg-gold-200/30' : 'bg-ink-200/30'}`}></div>

                                        <div className="flex items-center justify-between mb-4 relative z-10">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-12 h-12 rounded-xl bg-ink-100 overflow-hidden shadow-inner border border-ink-200 shrink-0">
                                                    {horse.photo ? (
                                                        <img src={horse.photo} alt={horse.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center w-full h-full text-xl group-hover:scale-110 transition-transform">🐴</div>
                                                    )}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <h4 className="text-ink-800 font-bold truncate text-base leading-tight">{horse.name}</h4>
                                                    <p className="text-xs text-ink-500 truncate">{horse.breed}</p>
                                                </div>
                                            </div>
                                            
                                            {/* Finance Tag */}
                                            <div className="shrink-0 ml-2 flex flex-col items-end gap-1">
                                                {hasDebt ? (
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-danger-700 bg-danger-50 px-2 py-1 rounded-md border border-danger-200">
                                                        <AlertCircle size={10} /> Deuda
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-success-700 bg-success-50 px-2 py-1 rounded-md border border-success-200">
                                                        <CheckCircle2 size={10} /> Al Día
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`text-[10px] uppercase font-bold px-2 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors relative z-10 w-full ${locColors[loc]}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${loc === 'piquete' ? 'bg-success-500 animate-pulse' : loc === 'circular' ? 'bg-gold-500 animate-pulse' : 'bg-ink-400'}`}></div>
                                            {loc === 'box' ? 'Descansando en Box' : loc === 'piquete' ? 'Libre en Piquete' : 'En Circular'}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>

        </div>
    );
}
