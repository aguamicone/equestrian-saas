import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Ticket, Plus, Calendar, AlignLeft, X } from 'lucide-react';

export default function EventsManager() {
    const { events, addEvent, deleteRow } = useData();
    const [isAdding, setIsAdding] = useState(false);
    const [newEvent, setNewEvent] = useState({ name: '', date: '', description: '' });

    const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

    const handleCreate = async (e) => {
        e.preventDefault();
        await addEvent({ ...newEvent, attendees: [] });
        setIsAdding(false);
        setNewEvent({ name: '', date: '', description: '' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Ticket className="text-gold-500" /> Eventos
                </h1>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-gold-500 hover:bg-gold-600 text-slate-900 px-4 py-2 rounded font-bold flex items-center gap-2"
                >
                    <Plus size={20} /> Crear Evento
                </button>
            </div>

            {isAdding && (
                <div className="glass-panel p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Nuevo Evento</h2>
                        <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Nombre del Evento</label>
                                <input required type="text" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} className="w-full bg-slate-800 text-white border border-slate-700 rounded p-2" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Fecha y Hora</label>
                                <input required type="datetime-local" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full bg-slate-800 text-white border border-slate-700 rounded p-2" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Descripción</label>
                            <textarea required value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full bg-slate-800 text-white border border-slate-700 rounded p-2" rows="3"></textarea>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" className="bg-gold-500 hover:bg-gold-600 text-slate-900 px-6 py-2 rounded font-bold">
                                Guardar Evento
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedEvents.map(event => (
                    <div key={event.id} className="glass-panel p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-white">{event.name}</h3>
                                <button onClick={() => deleteRow('EVENTS', event.id)} className="text-red-400 hover:text-red-300">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="space-y-2 mb-4 text-sm">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <Calendar size={16} className="text-gold-500" />
                                    {new Date(event.date).toLocaleString()}
                                </div>
                                <div className="flex items-start gap-2 text-slate-400">
                                    <AlignLeft size={16} className="text-gold-500 mt-1 shrink-0" />
                                    <p>{event.description}</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                            <h4 className="text-sm font-medium text-slate-300 mb-2">Asistentes ({event.attendees?.length || 0}):</h4>
                            <div className="text-xs text-slate-400">
                                {event.attendees?.length ? event.attendees.map(a => a.name).join(', ') : 'Aún no hay confirmados'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
