import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Ticket, Calendar, AlignLeft, CheckCircle } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui';

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
        <div className="space-y-6 pb-20">
            <PageHeader 
                title="Próximos Eventos"
                subtitle="Calendario de actividades, competencias y eventos sociales del haras"
                icon={Ticket}
            />

            {sortedEvents.length === 0 ? (
                <div className="text-center py-12 bg-white border border-ink-200 rounded-2xl shadow-sm max-w-lg mx-auto flex flex-col items-center justify-center">
                    <Calendar size={48} className="text-ink-300 mb-4" />
                    <h3 className="text-lg font-bold text-ink-900">Sin eventos</h3>
                    <p className="text-ink-500 text-sm mt-1">No hay eventos programados en este momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortedEvents.map(event => {
                        const isAttending = event.attendees?.find(a => a.uid === currentUser.uid);
                        return (
                            <Card key={event.id} padding="normal" className="flex flex-col justify-between hover:border-ink-300 shadow-sm transition-all duration-200">
                                <div>
                                    <h3 className="text-xl font-bold text-ink-900 mb-4">{event.name}</h3>
                                    <div className="space-y-3 mb-6 text-sm">
                                        <div className="flex items-center gap-3 text-primary-700 bg-primary-50 border border-primary-100 p-3 rounded-xl font-medium">
                                            <Calendar size={18} className="text-primary-500" />
                                            {new Date(event.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </div>
                                        <div className="flex items-start gap-3 text-ink-500">
                                            <AlignLeft size={18} className="text-primary-500 shrink-0 mt-0.5" />
                                            <p className="leading-relaxed">{event.description}</p>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => toggleAttendance(event)}
                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                        isAttending 
                                        ? 'btn-secondary' 
                                        : 'btn-primary shadow-sm'
                                    }`}
                                >
                                    {isAttending ? (
                                        <>Cancelar Asistencia</>
                                    ) : (
                                        <><CheckCircle size={20} /> Asisto al evento</>
                                    )}
                                </button>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
