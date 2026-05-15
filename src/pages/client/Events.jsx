import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Ticket, Calendar, AlignLeft, CheckCircle } from 'lucide-react';

export default function Events() {
    const { events, updateRow } = useData();
    const { currentUser } = useAuth();

    const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

    const toggleAttendance = async (event) => {
        const attendees = event.attendees || [];
        const isAttending = attendees.find(a => a.uid === currentUser.uid);
        
        let newAttendees;
        if (isAttending) {
            newAttendees = attendees.filter(a => a.uid !== currentUser.uid);
        } else {
            newAttendees = [...attendees, { uid: currentUser.uid, name: currentUser.displayName }];
        }
        
        await updateRow('EVENTS', event.id, { attendees: newAttendees });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Ticket className="text-gold-500" /> Próximos Eventos
            </h1>

            {sortedEvents.length === 0 ? (
                <div className="glass-panel p-8 text-center text-slate-400">
                    No hay eventos programados en este momento.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortedEvents.map(event => {
                        const isAttending = event.attendees?.find(a => a.uid === currentUser.uid);
                        return (
                            <div key={event.id} className="glass-panel p-6 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-4">{event.name}</h3>
                                    <div className="space-y-3 mb-6 text-sm">
                                        <div className="flex items-center gap-3 text-slate-300 bg-slate-800/50 p-3 rounded">
                                            <Calendar size={18} className="text-gold-500" />
                                            {new Date(event.date).toLocaleString()}
                                        </div>
                                        <div className="flex items-start gap-3 text-slate-400">
                                            <AlignLeft size={18} className="text-gold-500 shrink-0 mt-0.5" />
                                            <p className="leading-relaxed">{event.description}</p>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => toggleAttendance(event)}
                                    className={`w-full py-3 rounded font-bold flex items-center justify-center gap-2 transition-all ${
                                        isAttending 
                                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                                        : 'bg-gold-500 hover:bg-gold-600 text-slate-900 shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                                    }`}
                                >
                                    {isAttending ? (
                                        <>Cancelar Asistencia</>
                                    ) : (
                                        <><CheckCircle size={20} /> Asisto al evento</>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
