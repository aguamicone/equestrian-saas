import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Stethoscope, Apple, Activity, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/ui';

export default function QuickLog() {
    const { horses, addLog } = useData();
    const [selectedHorseId, setSelectedHorseId] = useState('');
    const [logType, setLogType] = useState('');
    const [details, setDetails] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleLog = (type) => {
        setLogType(type);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedHorseId || !logType) return;

        addLog({
            type: logType,
            details: details || logType,
            horseId: selectedHorseId
        });

        setSuccessMsg('¡Registro Guardado!');
        setDetails('');
        setLogType('');
        setTimeout(() => setSuccessMsg(''), 2000);
    };

    const categories = [
        { id: 'feed', label: 'Alimento', icon: <Apple size={24} />, color: 'text-success-600 bg-success-50 border-success-100' },
        { id: 'meds', label: 'Veterinaria', icon: <Stethoscope size={24} />, color: 'text-danger-600 bg-danger-50 border-danger-100' },
        { id: 'exercise', label: 'Ejercicio', icon: <Activity size={24} />, color: 'text-primary-600 bg-primary-50 border-primary-100' },
        { id: 'incident', label: 'Incidente', icon: <AlertTriangle size={24} />, color: 'text-warning-600 bg-warning-50 border-warning-100' },
    ];

    return (
        <div className="max-w-md mx-auto space-y-6 pb-20">
            <div className="text-left">
                <h2 className="text-2xl font-bold text-ink-900">Registro Rápido</h2>
                <p className="text-ink-500 text-sm mt-1">Registra eventos de alimentación, veterinaria, ejercicio o incidentes en caliente.</p>
            </div>

            {successMsg && (
                <div className="p-3 bg-success-50 border border-success-200 text-success-800 font-bold rounded-xl text-center shadow-sm animate-pulse">
                    {successMsg}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border border-ink-200 shadow-sm">
                <div>
                    <label className="text-xs uppercase font-bold text-ink-500 mb-1.5 block">Seleccionar Caballo</label>
                    <select
                        className="input-field p-3 bg-white border-ink-200 text-ink-750 focus:border-primary-500 focus:ring-0"
                        value={selectedHorseId}
                        onChange={(e) => setSelectedHorseId(e.target.value)}
                        required
                    >
                        <option value="">-- Elegir caballo --</option>
                        {horses.map(h => (
                            <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-xs uppercase font-bold text-ink-500 mb-1.5 block">Categoría de Evento</label>
                    <div className="grid grid-cols-2 gap-3">
                        {categories.map(cat => {
                            const isSelected = logType === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => handleLog(cat.id)}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 transition-all shadow-sm ${logType === cat.id
                                            ? 'bg-primary-50 border-primary-400 ring-2 ring-primary-100'
                                            : 'bg-white border-ink-200 hover:bg-ink-50/50'
                                        }`}
                                >
                                    <div className={`p-2.5 rounded-full border ${cat.color}`}>
                                        {cat.icon}
                                    </div>
                                    <span className={`text-sm font-bold ${isSelected ? 'text-primary-700' : 'text-ink-600'}`}>{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {logType && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div>
                            <label className="text-xs uppercase font-bold text-ink-500 mb-1.5 block">Detalles Adicionales (Opcional)</label>
                            <textarea
                                className="input-field bg-white border-ink-200 text-ink-800"
                                placeholder="Ej: Ración de avena incrementada, herradura floja..."
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                rows="3"
                            />
                        </div>
                        <button className="w-full btn-primary py-3 rounded-xl shadow-sm text-base font-bold">
                            Confirmar Registro
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
