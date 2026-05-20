/**
 * Tanda D2 — Modal de gestión de planes asignados a un caballo.
 * 
 * Comportamiento: cada switch ejecuta apply inmediato contra Firestore
 * (assignPlanToHorse / removePlanFromHorse). NO hay estado intermedio
 * ni botón Guardar. Single source of truth: horse.assignedPlanIds.
 * 
 * Loading state es por-plan (loadingByPlanId), no global, para permitir
 * operaciones simultáneas en distintos planes.
 * 
 * Toasts de éxito/error los dispara DataContext, NO este componente.
 */

import { useState } from 'react';
import { Loader2, Tags } from 'lucide-react';
import { Modal, Badge, EmptyState } from '../../ui';
import { useData } from '../../../context/DataContext';

export default function GestionarPlanesModal({ isOpen, onClose, horse }) {
  const { pricingPlans, assignPlanToHorse, removePlanFromHorse } = useData();
  const [loadingByPlanId, setLoadingByPlanId] = useState({});

  if (!horse) return null;

  const formatCurrency = (n) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(n || 0);

  const handleTogglePlan = async (plan, isCurrentlyAssigned) => {
    setLoadingByPlanId((prev) => ({ ...prev, [plan.id]: true }));
    
    if (isCurrentlyAssigned) {
      await removePlanFromHorse(horse.id, plan.id);
    } else {
      await assignPlanToHorse(horse.id, plan.id);
    }
    
    setLoadingByPlanId((prev) => ({ ...prev, [plan.id]: false }));
  };

  const footer = (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 rounded-lg transition-colors border border-ink-200"
      >
        Cerrar
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Gestionar planes — ${horse.name}`}
      subtitle="Activá o desactivá los planes asignados a este caballo. Los cambios se aplican al instante."
      size="md"
      footer={footer}
    >
      <div className="space-y-4 py-2">
        {(!pricingPlans || pricingPlans.length === 0) ? (
          <EmptyState
            message="Este tenant no tiene planes definidos"
            description="Configurá planes en el módulo de precios antes de asignar."
            icon={Tags}
          />
        ) : (
          <div className="divide-y divide-ink-100 border border-ink-200 rounded-xl overflow-hidden bg-white">
            {pricingPlans.map((plan) => {
              const isAssigned = (horse.assignedPlanIds || []).includes(plan.id);
              const isLoading = !!loadingByPlanId[plan.id];

              return (
                <div
                  key={plan.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-ink-50/50 transition-colors"
                >
                  {/* Left: Switch + Info block */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10">
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
                      ) : (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            disabled={isLoading}
                            onChange={() => handleTogglePlan(plan, isAssigned)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-ink-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-ink-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-display font-medium text-sm text-ink-900 truncate">
                        {plan.name}
                      </p>
                      <p className="text-xs text-ink-600 mt-0.5 font-mono">
                        {formatCurrency(plan.price)}
                      </p>
                    </div>
                  </div>

                  {/* Right: Badges / Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center ml-14 sm:ml-0">
                    <Badge variant={plan.frequency === 'monthly' ? 'sky' : 'neutral'} size="sm">
                      {plan.frequency === 'monthly' ? 'Mensual' : 'Único'}
                    </Badge>
                    <Badge variant={plan.type === 'membership' ? 'gold' : 'success'} size="sm">
                      {plan.type === 'membership' ? 'Membresía' : 'Servicio'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
