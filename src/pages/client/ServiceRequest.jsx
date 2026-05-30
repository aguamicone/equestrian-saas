import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Card, EmptyState, PageHeader } from '../../components/ui';
import { Send, Activity, Droplets, Package, Stethoscope, Hammer, Zap, Clock, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';

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

    const myHorses = (horses || []).filter(h => h.ownerId === currentUser?.uid);
    const activeRequests = (getActiveRequestsForClient && currentUser ? getActiveRequestsForClient(currentUser.uid) : []) || [];

    const [selectedHorseId, setSelectedHorseId] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Fix race condition (BUG 1)
    useEffect(() => {
        if (!selectedHorseId && myHorses && myHorses.length > 0) {
            setSelectedHorseId(myHorses[0].id);
        }
    }, [myHorses, selectedHorseId]);

    // Auto-clear successMessage (BUG 3)
    useEffect(() => {
        if (!successMessage) return;
        const timer = setTimeout(() => setSuccessMessage(null), 2500);
        return () => clearTimeout(timer);
    }, [successMessage]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        if (!selectedService || !selectedHorseId) {
            setError('Selecciona un caballo y un servicio antes de continuar.');
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            const result = await createServiceRequest({
                clientId: currentUser?.uid,
                horseId: selectedHorseId,
                serviceName: selectedService.name,
                serviceId: selectedService.id,
                category: selectedService.category,
                details: notes,
                dateRequested: date,
                timeRequested: time,
                price: selectedService.price,
                autoApprove: selectedService.autoApprove
            });

            if (result?.success) {
                setSuccessMessage(`Solicitud de "${selectedService.name}" enviada. El haras la recibirá en instantes.`);
                setSelectedService(null);
                setNotes('');
                setTime('');
            } else {
                setError(result?.error || 'No se pudo enviar la solicitud. Intenta de nuevo.');
            }
        } catch (err) {
            setError(err?.message || 'No se pudo enviar la solicitud. Verifica tu conexión.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const safeServices = servicesCatalog || [];
    const quickActions = safeServices.filter(s => s.category === 'quick_action');
    const upgrades = safeServices.filter(s => s.category === 'upgrade');
    const professionals = safeServices.filter(s => s.category === 'professional');

    const ServiceGrid = ({ title, services }) => (
        <div className="mb-6">
            <h4 className="text-sm font-bold text-ink-500 mb-3 uppercase tracking-wider">{title}</h4>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {services.map(service => {
                    const IconComp = ICON_MAP[service.icon] || Package;
                    const isSelected = selectedService?.id === service.id;
                    return (
                        <Card 
                            key={service.id} 
                            onClick={() => !isSubmitting && setSelectedService(service)}
                            className={`relative p-4 cursor-pointer transition-all flex flex-col items-center justify-center text-center gap-2 ${isSelected ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-md scale-105 select-none' : 'hover:border-primary-400 hover:bg-ink-50 select-none'}`}
                            style={{ opacity: isSubmitting ? 0.5 : 1, pointerEvents: isSubmitting ? 'none' : 'auto' }}
                        >
                            <IconComp size={24} className={isSelected ? 'text-primary-600' : 'text-ink-500'} />
                            <span className={`text-xs font-bold ${isSelected ? 'text-primary-800' : 'text-ink-700'}`}>{service.name}</span>
                            {service.autoApprove && (
                                <span className="absolute top-2 right-2 flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500"></span>
                                </span>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );

    if (myHorses.length === 0) {
        return (
            <div className="pb-20">
                <PageHeader 
                    kicker="Solicitar"
                    title="Servicio"
                    subtitle="Seleccioná un servicio extra para tu caballo"
                />
                <EmptyState 
                    icon={AlertTriangle}
                    title="No tenés caballos asignados"
                    description="Para solicitar un servicio, primero necesitás tener al menos un caballo registrado a tu nombre en el sistema."
                />
            </div>
        );
    }

    return (
        <div className="pb-20">
            <PageHeader 
                kicker="Catálogo"
                title="Solicitar Servicio"
                subtitle="Elige un servicio para tu caballo"
            />

            {successMessage && (
                <div className="bg-success-50 border border-success-200 text-success-700 text-sm rounded-lg px-3 py-2 mb-4 animate-in fade-in duration-300">
                    {successMessage}
                </div>
            )}

            {error && (
                <div className="bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-lg px-3 py-2 mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="p-4">
                    <label className="text-sm font-medium text-ink-700 mb-2 block">¿Para qué caballo es el servicio?</label>
                    <select
                        className="input-field p-3 transition-colors outline-none disabled:opacity-50 disabled:bg-ink-50"
                        value={selectedHorseId || ''}
                        onChange={(e) => setSelectedHorseId(e.target.value)}
                        disabled={isSubmitting}
                    >
                        {myHorses.map(h => (
                            <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                    </select>
                </Card>

                <div className="space-y-2">
                    {quickActions.length > 0 && <ServiceGrid title="⚡ Staff Directo" services={quickActions} />}
                    {upgrades.length > 0 && <ServiceGrid title="🍎 Extras y Nutrición" services={upgrades} />}
                    {professionals.length > 0 && <ServiceGrid title="⚕️ Profesionales" services={professionals} />}
                </div>

                {selectedService && (
                    <Card className="p-5 border-primary-200 shadow-md animate-in slide-in-from-bottom-4 bg-primary-50/30">
                        <h3 className="text-ink-800 font-bold mb-4 border-b border-ink-200 pb-2">{selectedService.name}</h3>
                        
                        {selectedService.category === 'quick_action' && (
                            <div className="mb-4 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-ink-600 mb-2 flex items-center gap-2"><Calendar size={16}/> Fecha</label>
                                    <input 
                                        type="date" 
                                        className="input-field p-3 transition-colors outline-none w-full disabled:opacity-50 disabled:bg-ink-50"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        disabled={isSubmitting}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-ink-600 mb-2 flex items-center gap-2"><Clock size={16}/> Horario (Opcional)</label>
                                    <input 
                                        type="time" 
                                        className="input-field p-3 transition-colors outline-none w-full disabled:opacity-50 disabled:bg-ink-50"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="text-sm text-ink-600 mb-2 block">Notas adicionales</label>
                            <textarea
                                className="input-field p-3 transition-colors outline-none w-full disabled:opacity-50 disabled:bg-ink-50"
                                placeholder="Detalles, ubicación en el club o especificaciones..."
                                rows={2}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting || !selectedService || !selectedHorseId}
                            className="w-full mt-5 btn-primary py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                'Enviando...'
                            ) : (
                                <>
                                    <Send size={18} /> Confirmar Solicitud
                                </>
                            )}
                        </button>
                    </Card>
                )}
            </form>

            {activeRequests.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-bold text-ink-800 mb-4">Mis Solicitudes Activas</h3>
                    <div className="space-y-3">
                        {activeRequests.map(req => {
                            const horse = (horses || []).find(h => h.id === req.horseId);
                            const canCancel = req.status === 'pending_staff' || req.status === 'pending_admin';
                            return (
                                <Card key={req.id} className="p-4 flex items-center justify-between hover:border-primary-300 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-ink-800">{req.type}</span>
                                        <span className="text-xs text-ink-500">
                                            {horse?.name || 'Caballo desconocido'} {req.timeRequested && `• ${req.timeRequested}`}
                                        </span>
                                        <span className="text-xs mt-1">
                                            {req.status === 'in_progress' ? (
                                                <span className="text-gold-600 font-medium">En progreso</span>
                                            ) : (
                                                <span className="text-ink-500">Pendiente</span>
                                            )}
                                        </span>
                                    </div>
                                    {canCancel && (
                                        <button 
                                            onClick={() => cancelServiceRequest(req.id)}
                                            className="text-xs bg-danger-50 text-danger-600 hover:bg-danger-100 px-3 py-1.5 rounded border border-danger-200 transition-colors disabled:opacity-50"
                                            disabled={isSubmitting}
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
