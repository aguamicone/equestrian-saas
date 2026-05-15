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
        box: 'bg-slate-700 text-slate-300',
        piquete: 'bg-green-500/20 text-green-400 border border-green-500/30',
        circular: 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
    };

    return (
        <div className="space-y-6 pb-20">

            {/* Premium Header Banner (Glassmorphism & Gold/Dark Gray) */}
            <div className="w-full relative rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1598974357801-cbca100b6e3f?auto=format&fit=crop&w=1200')] opacity-20 bg-cover bg-center mix-blend-luminosity"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                
                <div className="relative z-10 p-6 sm:p-8 flex flex-col items-start justify-end min-h-[160px]">
                    <span className="px-3 py-1 bg-gold-500/20 text-gold-500 border border-gold-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 backdrop-blur-md">
                        Mí Dashboard
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md leading-tight">
                        Hola, {currentUser?.displayName?.split(' ')[0] || 'Jinete'}
                    </h2>
                    <p className="text-sm text-slate-300 mt-1 font-medium">{tenantSettings?.name || 'Club Ecuestre'}</p>
                </div>
            </div>

            {/* Weekly Metrics */}
            <div>
                <div className="flex justify-between items-end mb-3 px-1">
                    <h3 className="text-slate-100 font-bold text-lg flex items-center gap-2">
                        <Activity size={18} className="text-gold-500"/> Resumen Semanal
                    </h3>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lunes a Domingo</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <Swords size={16}/>
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entrenos</span>
                        </div>
                        <div className="text-3xl font-black text-white">{weeklyTrainings}</div>
                        <div className="text-[10px] font-medium text-slate-500 mt-1">Registrados esta semana</div>
                    </div>

                    <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-gold-500/10 rounded-full blur-xl group-hover:bg-gold-500/20 transition-all"></div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-500">
                                <Medal size={16}/>
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Concursos</span>
                        </div>
                        <div className="text-3xl font-black text-white">{weeklyJumps}</div>
                        <div className="text-[10px] font-medium text-slate-500 mt-1">Participaciones recientes</div>
                    </div>
                </div>
            </div>

            {/* Live Horses Radar */}
            <div>
                <div className="flex justify-between items-end mb-3 px-1">
                    <h3 className="text-slate-100 font-bold text-lg flex items-center gap-2">
                        <MapPin size={18} className="text-gold-500"/> Mis Caballos
                    </h3>
                    <Link to="/client/horses" className="text-xs font-bold text-gold-500 hover:text-gold-400 uppercase tracking-widest flex items-center">
                        Ver Todos <ChevronRight size={14}/>
                    </Link>
                </div>

                {myHorses.length === 0 ? (
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-dashed border-slate-700 text-center">
                        <p className="text-slate-400 font-medium">No tienes caballos asignados a tu cuenta.</p>
                    </div>
                ) : (
                    <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
                        {myHorses.map(horse => {
                            const loc = horse.location || 'box';
                            return (
                                <Link key={horse.id} to={`/client/horses/${horse.id}`} className="shrink-0 w-[240px] group">
                                    <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 p-3 h-full shadow-lg relative overflow-hidden hover:border-gold-500/50 transition-all duration-300 hover:-translate-y-1">
                                        
                                        {/* Colored Glow based on location */}
                                        <div className={`absolute -right-10 -bottom-10 w-24 h-24 rounded-full blur-2xl opacity-20 ${loc === 'piquete' ? 'bg-green-500' : loc === 'circular' ? 'bg-orange-500' : 'bg-slate-500'}`}></div>

                                        <div className="flex items-center gap-3 mb-3 relative z-10">
                                            <div className="w-12 h-12 rounded-xl bg-slate-700 overflow-hidden shadow-inner border border-slate-600 shrink-0">
                                                {horse.photo ? (
                                                    <img src={horse.photo} alt={horse.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center w-full h-full text-xl group-hover:scale-110 transition-transform">🐴</div>
                                                )}
                                            </div>
                                            <div className="overflow-hidden">
                                                <h4 className="text-white font-bold truncate text-base leading-tight">{horse.name}</h4>
                                                <p className="text-xs text-slate-400 truncate">{horse.breed}</p>
                                            </div>
                                        </div>

                                        <div className={`text-[10px] uppercase font-bold px-2 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors relative z-10 ${locColors[loc]}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${loc === 'piquete' ? 'bg-green-400 animate-pulse' : loc === 'circular' ? 'bg-orange-400 animate-pulse' : 'bg-slate-400'}`}></div>
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
            <div className="bg-gradient-to-r from-slate-800 to-slate-800/80 rounded-2xl border border-slate-700 p-5 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Calendar size={20}/>
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm">Reserva de Instalaciones</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Asegurá tu lugar en la pista o caminador.</p>
                    </div>
                </div>
                <Link to="/client/reserve" className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center hover:bg-gold-500 hover:text-slate-900 transition-colors">
                    <ChevronRight size={16}/>
                </Link>
            </div>

        </div>
    );
}
