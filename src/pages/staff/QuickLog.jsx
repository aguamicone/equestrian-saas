import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Stethoscope, Apple, Activity, AlertTriangle } from 'lucide-react';

export default function QuickLog() {
    const { horses, addLog } = useData();
    const [selectedHorseId, setSelectedHorseId] = useState('');
    const [logType, setLogType] = useState('');
    const [details, setDetails] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleLog = (type) => {
        setLogType(type);
        // Auto-focus logic could go here
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
        { id: 'feed', label: 'Alimento', icon: <Apple size={24} />, color: 'text-green-400 bg-green-500/10' },
        { id: 'meds', label: 'Veterinaria', icon: <Stethoscope size={24} />, color: 'text-red-400 bg-red-500/10' },
        { id: 'exercise', label: 'Ejercicio', icon: <Activity size={24} />, color: 'text-blue-400 bg-blue-500/10' },
        { id: 'incident', label: 'Incidente', icon: <AlertTriangle size={24} />, color: 'text-yellow-400 bg-yellow-500/10' },
    ];

    return (
        <div className="px-1">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Registro Rápido</h2>

            {successMsg && <div className="mb-4 p-3 bg-green-500 text-slate-900 font-bold rounded-lg text-center animate-pulse">{successMsg}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label className="text-sm text-slate-400 mb-2 block">Seleccionar Caballo</label>
                    <select
                        className="input-field p-3"
                        value={selectedHorseId}
                        onChange={(e) => setSelectedHorseId(e.target.value)}
                        required
                    >
                        <option value="">-- Elegir --</option>
                        {horses.map(h => (
                            <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleLog(cat.id)}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${logType === cat.id
                                    ? 'bg-slate-700 border-gold-500 ring-1 ring-gold-500'
                                    : 'bg-slate-800 border-slate-700 opacity-80 hover:opacity-100'
                                }`}
                        >
                            <div className={`p-2 rounded-full ${cat.color}`}>
                                {cat.icon}
                            </div>
                            <span className="text-sm font-medium text-slate-200">{cat.label}</span>
                        </button>
                    ))}
                </div>

                {logType && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div>
                            <label className="text-sm text-slate-400 mb-2 block">Detalles Adicionales (Opcional)</label>
                            <textarea
                                className="input-field"
                                placeholder="Detalles específicos..."
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                            />
                        </div>
                        <button className="w-full btn-primary py-3 rounded-xl text-lg shadow-lg shadow-gold-500/20">
                            Confirmar
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
