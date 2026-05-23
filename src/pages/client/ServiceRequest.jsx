import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Send, CheckCircle2, Activity, Droplets, Package, Stethoscope, Hammer, Zap, Clock } from 'lucide-react';

const ICON_MAP = {
    saddle: Zap,
    droplets: Droplets,
    activity: Activity,
    wheat: Package,
    carrot: Package,
    stethoscope: Stethoscope,
    hammer: Hammer
};

export default function ServiceRequest() {
    const { currentUser } = useAuth();
    const { horses, servicesCatalog, createServiceRequest, getActiveRequestsForClient, cancelServiceRequest } = useData();

    const myHorses = horses.filter(h => h.ownerId === currentUser.uid);
    const activeRequests = getActiveRequestsForClient(currentUser.uid);

    const [selectedHorseId, setSelectedHorseId] = useState(myHorses[0]?.id || '');
    const [selectedService, setSelectedService] = useState(null);
    const [notes, setNotes] = useState('');
    const [time, setTime] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedService || !selectedHorseId) return;

        createServiceRequest({
            clientId: currentUser.uid,
            horseId: selectedHorseId,
            serviceName: selectedService.name,
            serviceId: selectedService.id,
            category: selectedService.category,
            details: notes,
            timeRequested: time,
            price: selectedService.price,
            autoApprove: selectedService.autoApprove
        });
        
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setSelectedService(null);
            setNotes('');
            setTime('');
        }, 3000);
    };

    if (!selectedHorseId && myHorses.length === 0) return <div className="text-white p-4">No tienes caballos asignados.</div>;

    const quickActions = servicesCatalog.filter(s => s.category === 'quick_action');
    const upgrades = servicesCatalog.filter(s => s.category === 'upgrade');
    const professionals = servicesCatalog.filter(s => s.category === 'professional');

    const ServiceGrid = ({ title, services }) => (
        <div className="mb-6">
            <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">{title}</h4>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {services.map(service => {
                    const IconComp = ICON_MAP[service.icon] || Package;
                    const isSelected = selectedService?.id === service.id;
                    return (
                        <div 
                            key={service.id} 
                            onClick={() => setSelectedService(service)}
                            className={`relative p-4 rounded-xl border cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2 ${isSelected ? 'bg-gold-500/10 border-gold-500 text-gold-500 shadow-lg shadow-gold-500/10 scale-105 select-none' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-700 select-none'}`}
                        >
                            <IconComp size={24} />
                            <span className="text-xs font-bold">{service.name}</span>
                            {/* Ocultamos el precio visualmente por decisión D7 */}
                            {service.autoApprove && (
                                <span className="absolute top-2 right-2 flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="pb-20">
            <h2 className="text-2xl font-bold text-slate-100 mb-6 font-display">Solicitar Servicio</h2>

            {submitted ? (
                <div className="bg-green-500/10 border border-green-500 p-8 rounded-2xl flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
                    <CheckCircle2 size={48} className="text-green-500 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">¡Solicitud Procesada!</h3>
                    <p className="text-slate-400 max-w-sm mx-auto">
                        {selectedService?.autoApprove 
                            ? 'El equipo de caballerizos ha sido notificado al instante y ya lo tienen en pendientes.' 
                            : 'La solicitud ha sido enviada a administración para su rápida revisión.'}
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Seleccion de Caballo */}
                    <div className="glass-card p-4">
                        <label className="text-sm font-medium text-slate-400 mb-2 block">¿Para qué caballo es el servicio?</label>
                        <select
                            className="input-field p-3 transition-colors outline-none"
                            value={selectedHorseId}
                            onChange={(e) => setSelectedHorseId(e.target.value)}
                        >
                            {myHorses.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        {quickActions.length > 0 && <ServiceGrid title="⚡ Staff Directo" services={quickActions} />}
                        {upgrades.length > 0 && <ServiceGrid title="🍎 Extras y Nutrición" services={upgrades} />}
                        {professionals.length > 0 && <ServiceGrid title="⚕️ Profesionales" services={professionals} />}
                    </div>

                    {selectedService && (
                        <div className="glass-card p-5 border-gold-500/30 shadow-lg shadow-gold-500/5 animate-in slide-in-from-bottom-4">
                            <h3 className="text-white font-bold mb-4 border-b border-slate-700 pb-2">{selectedService.name}</h3>
                            
                            {selectedService.category === 'quick_action' && (
                                <div className="mb-4">
                                    <label className="text-sm text-slate-400 mb-2 flex items-center gap-2"><Clock size={16}/> Horario (Opcional)</label>
                                    <input 
                                        type="time" 
                                        className="input-field p-3 transition-colors outline-none"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1">Podés dejarlo en blanco para que se haga a la brevedad.</p>
                                </div>
                            )}

                            <div>
                                <label className="text-sm text-slate-400 mb-2 block">Notas adicionales</label>
                                <textarea
                                    className="input-field p-3 transition-colors outline-none"
                                    placeholder="Detalles, ubicación en el club o especificaciones..."
                                    rows={2}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <button type="submit" className="w-full mt-5 bg-gold-500 hover:bg-gold-400 text-slate-900 font-bold flex items-center justify-center gap-2 py-3.5 rounded-xl shadow-xl hover:shadow-gold-500/20 transition-all active:scale-95">
                                <Send size={18} /> Confirmar Solicitud
                            </button>
                        </div>
                    )}
                </form>
            )}

            {activeRequests.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-bold text-slate-100 mb-4">Mis Solicitudes Activas</h3>
                    <div className="space-y-3">
                        {activeRequests.map(req => {
                            const horse = horses.find(h => h.id === req.horseId);
                            const canCancel = req.status === 'pending_staff' || req.status === 'pending_admin';
                            return (
                                <div key={req.id} className="glass-card p-4 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-200">{req.type}</span>
                                        <span className="text-xs text-slate-400">
                                            {horse?.name || 'Caballo desconocido'} {req.timeRequested && `• ${req.timeRequested}`}
                                        </span>
                                        <span className="text-xs mt-1">
                                            {req.status === 'in_progress' ? (
                                                <span className="text-gold-400">En progreso</span>
                                            ) : (
                                                <span className="text-slate-400">Pendiente</span>
                                            )}
                                        </span>
                                    </div>
                                    {canCancel && (
                                        <button 
                                            onClick={() => cancelServiceRequest(req.id)}
                                            className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded border border-red-500/20 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
