import { MapPin, Swords, Medal, ChevronRight, Activity, Calendar } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ClientDashboard() {
    const { tenantSettings, horses, logs } = useData();
    const { currentUser } = useAuth();

    // Data filtering
    const myHorses = horses.filter(h => h.ownerId === currentUser?.uid);
    const myHorseIds = myHorses.map(h => h.id);
    const myLogs = logs.filter(l => myHorseIds.includes(l.horseId));

    // Calculate current week
    const now = new Date();
    const currentDay = now.getDay() || 7; 
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay + 1);
    startOfWeek.setHours(0,0,0,0);

    const thisWeekLogs = myLogs.filter(l => {
        const d = new Date(l.timestamp || l.date);
        return d >= startOfWeek && d <= now;
    });

    const weeklyTrainings = thisWeekLogs.filter(l => l.type === 'training_log').length;
    const weeklyJumps = thisWeekLogs.filter(l => l.type === 'show_jumping_log').length;

    const locColors = {
        box: 'bg-ink-100 text-ink-700 border border-ink-200',
        piquete: 'bg-success-50 text-success-700 border border-success-200',
        circular: 'bg-gold-50 text-gold-700 border border-gold-200'
    };

    return (
        <div className="space-y-6 pb-20">

            {/* Premium Header Banner - Option A (Cielo y Campo) */}
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
                    <div className="bg-white border border-ink-200 rounded-2xl p-4 flex flex-col justify-between shadow-card relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary-100/50 rounded-full blur-xl transition-all"></div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 relative z-10">
                                <Swords size={16}/>
                            </div>
                            <span className="text-xs font-bold text-ink-400 uppercase tracking-wider relative z-10">Entrenos</span>
                        </div>
                        <div className="text-3xl font-black text-ink-800 relative z-10">{weeklyTrainings}</div>
                        <div className="text-[10px] font-medium text-ink-400 mt-1 relative z-10">Registrados esta semana</div>
                    </div>

                    <div className="bg-white border border-ink-200 rounded-2xl p-4 flex flex-col justify-between shadow-card relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-gold-100/50 rounded-full blur-xl transition-all"></div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 relative z-10">
                                <Medal size={16}/>
                            </div>
                            <span className="text-xs font-bold text-ink-400 uppercase tracking-wider relative z-10">Concursos</span>
                        </div>
                        <div className="text-3xl font-black text-ink-800 relative z-10">{weeklyJumps}</div>
                        <div className="text-[10px] font-medium text-ink-400 mt-1 relative z-10">Participaciones recientes</div>
                    </div>
                </div>
            </div>

            {/* Live Horses Radar */}
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
                    <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
                        {myHorses.map(horse => {
                            const loc = horse.location || 'box';
                            return (
                                <Link key={horse.id} to={`/client/horses/${horse.id}`} className="shrink-0 w-[240px] group">
                                    <div className="bg-white rounded-2xl border border-ink-200 p-3 h-full shadow-card relative overflow-hidden hover:border-primary-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                                        
                                        {/* Colored Glow based on location */}
                                        <div className={`absolute -right-10 -bottom-10 w-24 h-24 rounded-full blur-2xl ${loc === 'piquete' ? 'bg-success-200/30' : loc === 'circular' ? 'bg-gold-200/30' : 'bg-ink-200/30'}`}></div>

                                        <div className="flex items-center gap-3 mb-3 relative z-10">
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

                                        <div className={`text-[10px] uppercase font-bold px-2 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors relative z-10 ${locColors[loc]}`}>
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

            {/* Quick Actions or Info block replacing the old large container */}
            <div className="bg-gradient-to-r from-primary-50 to-sky-50 rounded-2xl border border-primary-100 p-5 flex items-center justify-between shadow-card">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                        <Calendar size={20}/>
                    </div>
                    <div>
                        <h4 className="text-ink-800 font-bold text-sm">Reserva de Instalaciones</h4>
                        <p className="text-xs text-ink-500 mt-0.5">Asegurá tu lugar en la pista o caminador.</p>
                    </div>
                </div>
                <Link to="/client/reserve" className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors">
                    <ChevronRight size={16}/>
                </Link>
            </div>

        </div>
    );
}
