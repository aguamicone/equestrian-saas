import { useState, useMemo } from 'react';
import { useData } from '../../../context/DataContext';
import { useNotification } from '../../../context/NotificationContext';
import { X, Calendar, AlertCircle } from 'lucide-react';

export default function GenerarCargosMensualesModal({ isOpen, onClose, onSuccess }) {
    const { horses, pricingPlans, finances, generateMonthlyCharges } = useData();
    const { notify } = useNotification();

    const [month, setMonth] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });

    const [loading, setLoading] = useState(false);
    const [backendError, setBackendError] = useState(null);

    // Calcular vista previa
    const previewData = useMemo(() => {
        if (!month) return { ops: [], totalAmount: 0, existingKeys: new Set() };

        const dateString = `${month}-01`;
        const activeHorses = horses.filter(h => !h.archived && h.assignedPlanIds?.length > 0);
        
        const monthlyPlanMap = {};
        pricingPlans.forEach(p => {
            if (p.frequency === 'monthly' && !p.archived) {
                monthlyPlanMap[p.id] = p;
            }
        });

        const ops = [];
        let totalAmount = 0;

        activeHorses.forEach(horse => {
            horse.assignedPlanIds.forEach(planId => {
                const plan = monthlyPlanMap[planId];
                if (plan) {
                    ops.push({
                        horseId: horse.id,
                        horseName: horse.name,
                        planId: plan.id,
                        planName: plan.name,
                        planPrice: plan.price
                    });
                    totalAmount += Number(plan.price);
                }
            });
        });

        // Detectar duplicados
        const existingCharges = finances.filter(f => f.date === dateString && f.category === 'plan');
        const existingKeys = new Set(existingCharges.map(f => `${f.horseId}|${f.planId}`));

        return { ops, totalAmount, existingKeys };
    }, [horses, pricingPlans, finances, month]);

    const { ops, totalAmount, existingKeys } = previewData;

    let newCount = 0;
    let existingCount = 0;
    ops.forEach(op => {
        if (existingKeys.has(`${op.horseId}|${op.planId}`)) {
            existingCount++;
        } else {
            newCount++;
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setBackendError(null);
        
        if (newCount === 0 && existingCount > 0) {
            notify(`0 cargos generados. Ya existen ${existingCount} cargos para ${month}.`, 'info');
            return;
        }

        if (newCount === 0 && existingCount === 0) {
            notify(`No hay caballos con planes mensuales para generar.`, 'info');
            return;
        }

        setLoading(true);
        const result = await generateMonthlyCharges({ month });
        setLoading(false);

        if (result.success) {
            if (result.chargeCount > 0) {
                notify(`${result.chargeCount} cargos generados exitosamente para ${month}.${result.skippedCount > 0 ? ` (${result.skippedCount} ya existían)` : ''}`, 'success');
                if (onSuccess) onSuccess(result);
                onClose();
            } else {
                notify(`0 cargos generados. Ya existen ${result.skippedCount} cargos para ${month}.`, 'info');
                // No se cierra el modal si no generó nuevos, para permitir elegir otro mes
            }
        } else {
            setBackendError(result.error || 'Error desconocido al generar cargos');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="glass-panel w-full max-w-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-xl">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar className="text-primary-400" size={24} />
                        Generar cargos mensuales
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {backendError && (
                    <div className="bg-danger-50 border-b border-danger-200 p-4">
                        <div className="flex gap-2 items-center text-danger-900 font-medium">
                            <AlertCircle size={20} />
                            <span>Error del servidor:</span>
                        </div>
                        <p className="text-danger-800 text-sm mt-1 ml-7">{backendError}</p>
                    </div>
                )}

                <form id="generarCargosForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Sección 1: Selección de mes */}
                    <div className="bg-slate-800/30 p-5 rounded-lg border border-slate-700">
                        <h4 className="font-bold text-slate-200 mb-4 border-b border-slate-700 pb-2">1. Seleccionar mes a facturar</h4>
                        <div>
                            <label className="block text-slate-400 text-sm font-medium mb-1">
                                Mes <span className="text-danger-400">*</span>
                            </label>
                            <input
                                type="month"
                                className="input-field max-w-xs"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                required
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                Se generarán cargos pendientes para todos los caballos activos con planes mensuales asignados.
                            </p>
                        </div>
                    </div>

                    {/* Sección 2: Vista previa */}
                    <div className="bg-slate-800/30 p-5 rounded-lg border border-slate-700">
                        <h4 className="font-bold text-slate-200 mb-4 border-b border-slate-700 pb-2">2. Vista previa</h4>
                        
                        {ops.length === 0 ? (
                            <div className="text-center py-6 text-slate-500">
                                No hay caballos con planes mensuales asignados.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                    {ops.map((op, idx) => {
                                        const isDuplicate = existingKeys.has(`${op.horseId}|${op.planId}`);
                                        return (
                                            <div key={idx} className={`flex justify-between items-center p-3 rounded border ${isDuplicate ? 'bg-slate-800/50 border-slate-700 opacity-60' : 'bg-slate-700/30 border-slate-600'}`}>
                                                <div>
                                                    <div className="font-medium text-slate-200">{op.horseName}</div>
                                                    <div className="text-xs text-slate-400">{op.planName}</div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {isDuplicate && (
                                                        <span className="text-xs font-medium px-2 py-1 bg-slate-800 text-slate-400 rounded-full border border-slate-700">
                                                            Ya facturado
                                                        </span>
                                                    )}
                                                    <span className={`font-mono font-bold ${isDuplicate ? 'text-slate-500' : 'text-gold-400'}`}>
                                                        ${Number(op.planPrice).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                                    <div className="text-slate-300">
                                        <div className="font-medium">Resumen:</div>
                                        <ul className="text-sm text-slate-400 mt-1">
                                            <li>• {ops.length} planes mensuales en total</li>
                                            {existingCount > 0 && <li className="text-amber-400">• {existingCount} cargos ya existen para este mes (se ignorarán)</li>}
                                        </ul>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-slate-400">Total a facturar ahora:</div>
                                        <div className="text-2xl font-bold text-primary-400">
                                            ${ops.filter(op => !existingKeys.has(`${op.horseId}|${op.planId}`)).reduce((acc, curr) => acc + Number(curr.planPrice), 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </form>

                <div className="p-6 border-t border-slate-700 bg-slate-800/50 rounded-b-xl flex justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} disabled={loading} className="btn-secondary">
                        Cancelar
                    </button>
                    <button 
                        type="submit" 
                        form="generarCargosForm" 
                        disabled={loading || newCount === 0} 
                        className="btn-primary"
                    >
                        {loading ? 'Generando...' : `Generar ${newCount} cargos`}
                    </button>
                </div>
            </div>
        </div>
    );
}
