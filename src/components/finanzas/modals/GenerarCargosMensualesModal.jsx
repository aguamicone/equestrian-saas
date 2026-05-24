import { useState, useMemo } from 'react';
import { useData } from '../../../context/DataContext';
import { useNotification } from '../../../context/NotificationContext';
import { Calendar, AlertCircle } from 'lucide-react';
import Modal from '../../ui/Modal';

export default function GenerarCargosMensualesModal({ isOpen, onClose, onSuccess }) {
    const { horses, pricingPlans, finances, generateMonthlyCharges } = useData();
    const { notify } = useNotification();

    const [month, setMonth] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

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

    const { ops, existingKeys } = previewData;

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
        if (isSubmitting) return;
        setError(null);
        
        if (newCount === 0 && existingCount > 0) {
            notify(`0 cargos generados. Ya existen ${existingCount} cargos para ${month}.`, 'info');
            return;
        }

        if (newCount === 0 && existingCount === 0) {
            notify(`No hay caballos con planes mensuales para generar.`, 'info');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await generateMonthlyCharges({ month });
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
                setError(result.error || 'Error desconocido al generar cargos');
            }
        } catch (err) {
            setError(err?.message || 'Error de conexión');
        } finally {
            setIsSubmitting(false);
        }
    };

    const footer = (
        <div className="flex justify-end gap-2 w-full">
            <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Cancelar
            </button>
            <button 
                type="submit" 
                form="generarCargosForm" 
                disabled={isSubmitting || newCount === 0} 
                className="btn-primary px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? 'Generando...' : `Generar ${newCount} cargos`}
            </button>
        </div>
    );

    const modalTitle = (
        <div className="flex items-center gap-2">
            <Calendar className="text-primary-600" size={24} />
            <span>Generar cargos mensuales</span>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={modalTitle}
            size="lg"
            footer={footer}
        >
            {error && (
                <div className="bg-danger-50 border border-danger-200 text-danger-700 p-3 rounded-xl text-sm mb-4 flex gap-2 items-start">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form id="generarCargosForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Sección 1: Selección de mes */}
                <div className="bg-ink-50 p-5 rounded-lg border border-ink-200">
                    <h4 className="font-bold text-ink-900 mb-4 border-b border-ink-200 pb-2">1. Seleccionar mes a facturar</h4>
                    <div>
                        <label className="block text-ink-700 text-sm font-medium mb-1">
                            Mes <span className="text-danger-600">*</span>
                        </label>
                        <input
                            type="month"
                            className="input-field max-w-xs"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            disabled={isSubmitting}
                            required
                        />
                        <p className="text-xs text-ink-500 mt-2">
                            Se generarán cargos pendientes para todos los caballos activos con planes mensuales asignados.
                        </p>
                    </div>
                </div>

                {/* Sección 2: Vista previa */}
                <div className="bg-ink-50 p-5 rounded-lg border border-ink-200">
                    <h4 className="font-bold text-ink-900 mb-4 border-b border-ink-200 pb-2">2. Vista previa</h4>
                    
                    {ops.length === 0 ? (
                        <div className="text-center py-6 text-ink-500">
                            No hay caballos con planes mensuales asignados.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                {ops.map((op, idx) => {
                                    const isDuplicate = existingKeys.has(`${op.horseId}|${op.planId}`);
                                    return (
                                        <div key={idx} className={`flex justify-between items-center p-3 rounded-lg border ${isDuplicate ? 'bg-ink-100 border-ink-200 opacity-60' : 'bg-white border-ink-200'}`}>
                                            <div>
                                                <div className="font-medium text-ink-900">{op.horseName}</div>
                                                <div className="text-xs text-ink-500">{op.planName}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {isDuplicate && (
                                                    <span className="text-xs font-medium px-2 py-1 bg-ink-100 text-ink-500 rounded-full border border-ink-200">
                                                        Ya facturado
                                                    </span>
                                                )}
                                                <span className={`font-mono font-bold ${isDuplicate ? 'text-ink-400' : 'text-primary-700'}`}>
                                                    ${Number(op.planPrice).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            <div className="pt-4 border-t border-ink-200 flex justify-between items-center">
                                <div className="text-ink-700">
                                    <div className="font-medium">Resumen:</div>
                                    <ul className="text-sm text-ink-500 mt-1">
                                        <li>• {ops.length} planes mensuales en total</li>
                                        {existingCount > 0 && <li className="text-amber-600 font-medium mt-1">• {existingCount} cargos ya existen para este mes (se ignorarán)</li>}
                                    </ul>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-ink-500">Total a facturar ahora:</div>
                                    <div className="text-2xl font-bold text-primary-700">
                                        ${ops.filter(op => !existingKeys.has(`${op.horseId}|${op.planId}`)).reduce((acc, curr) => acc + Number(curr.planPrice), 0).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </form>
        </Modal>
    );
}
