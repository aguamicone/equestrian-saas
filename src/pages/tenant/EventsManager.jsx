import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Ticket, Plus, Calendar, AlignLeft, X } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui';

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
        <div className="space-y-6 pb-20">
            <PageHeader 
                title="Eventos"
                subtitle="Organiza eventos, maneja confirmaciones de asistencia y publica actividades para los clientes"
                icon={Ticket}
                actions={
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="btn-primary flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={18} /> Crear Evento
                    </button>
                }
            />

            {isAdding && (
                <Card padding="normal" className="border-ink-200 bg-white shadow-sm mb-6 animate-in slide-in-from-top-4 duration-250">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-ink-150">
                        <h2 className="text-lg font-bold text-ink-900">Nuevo Evento</h2>
                        <button 
                            type="button" 
                            onClick={() => setIsAdding(false)} 
                            className="text-ink-400 hover:text-ink-600 p-1 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-ink-500 mb-1.5">Nombre del Evento</label>
                                <input 
                                    required 
                                    type="text" 
                                    value={newEvent.name} 
                                    onChange={e => setNewEvent({...newEvent, name: e.target.value})} 
                                    className="input-field" 
                                    placeholder="Ej: Clínica de Salto" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-ink-500 mb-1.5">Fecha y Hora</label>
                                <input 
                                    required 
                                    type="datetime-local" 
                                    value={newEvent.date} 
                                    onChange={e => setNewEvent({...newEvent, date: e.target.value})} 
                                    className="input-field" 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-ink-500 mb-1.5">Descripción</label>
                            <textarea 
                                required 
                                value={newEvent.description} 
                                onChange={e => setNewEvent({...newEvent, description: e.target.value})} 
                                className="input-field" 
                                rows="3" 
                                placeholder="Detalles del evento..."
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button 
                                type="button" 
                                onClick={() => setIsAdding(false)} 
                                className="btn-secondary"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="btn-primary px-6 shadow-sm"
                            >
                                Guardar Evento
                            </button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                {sortedEvents.map(event => (
                    <Card key={event.id} padding="normal" className="flex flex-col justify-between hover:border-ink-300 shadow-sm border-ink-200 transition-all duration-200 bg-white">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-bold text-ink-900 leading-tight pr-4">{event.name}</h3>
                                <button 
                                    onClick={() => deleteRow('EVENTS', event.id)} 
                                    className="text-danger-600 hover:text-danger-700 p-1.5 hover:bg-danger-50 rounded-lg transition-colors shrink-0"
                                    title="Eliminar evento"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="space-y-2 mb-4 text-sm">
                                <div className="flex items-center gap-2 text-ink-700 bg-ink-50 border border-ink-150 px-2.5 py-1.5 rounded-lg">
                                    <Calendar size={16} className="text-primary-500" />
                                    <span className="font-semibold">
                                        {new Date(event.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                </div>
                                <div className="flex items-start gap-2 text-ink-550 p-1">
                                    <AlignLeft size={16} className="text-primary-500 mt-1 shrink-0" />
                                    <p className="leading-relaxed">{event.description}</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-ink-150">
                            <h4 className="text-xs font-bold uppercase text-ink-500 mb-1.5">Asistentes ({event.attendees?.length || 0})</h4>
                            <div className="text-xs text-ink-600 leading-relaxed font-semibold">
                                {event.attendees?.length ? event.attendees.map(a => a.name).join(', ') : 'Aún no hay confirmados'}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
