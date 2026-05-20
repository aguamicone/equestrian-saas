// src/components/spaces/modals/ReleaseHorseModal.jsx
// Modal de "Liberar / Dar de baja" un caballo.
// Muestra info financiera del dueño. Si tiene deuda, ofrece dos caminos:
//   - Perdonar la deuda (marca todos los pagos pendientes como 'forgiven')
//   - Mantener pendiente (la deuda queda viva en cuenta corriente)
// En ambos casos, el caballo se archiva (soft delete) y el box queda libre.

import { useState } from 'react';
import {
  X, AlertTriangle, DollarSign, Calendar,
  Check, UserMinus, FileText
} from 'lucide-react';
import { Modal, Badge } from '../../ui';
import { useData } from '../../../context/DataContext';

/**
 * Props:
 *   space: documento del espacio
 *   horse: documento del caballo a dar de baja
 *   owner: documento del dueño (puede ser null)
 *   pendingPayments: array de pagos pendientes del dueño (status='pending')
 *   onClose: () => void
 *   onReleased: () => void  — callback tras éxito
 */
export default function ReleaseHorseModal({
  space,
  horse,
  owner,
  pendingPayments = [],
  onClose,
  onReleased,
}) {
  const { archiveHorse, updateRow, addLog } = useData();

  const [step, setStep] = useState('confirm'); // 'confirm' | 'processing'
  const [debtAction, setDebtAction] = useState(null); // null | 'forgive' | 'keep'
  const [reason, setReason] = useState('');

  const totalDebt = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const hasDebt = totalDebt > 0;

  const canConfirm = !hasDebt || debtAction !== null;

  const handleRelease = async () => {
    setStep('processing');
    try {
      // 1. Si eligió "perdonar", marcar pagos pendientes como 'forgiven'
      if (hasDebt && debtAction === 'forgive') {
        for (const payment of pendingPayments) {
          await updateRow('FINANCES', payment.id, {
            status: 'forgiven',
            forgivenAt: new Date().toISOString(),
            forgivenReason: `Baja de ${horse.name}`,
          });
        }
        // Log adicional para auditoría
        await addLog?.({
          type: 'debt_forgiven',
          horseId: horse.id,
          ownerId: owner?.uid || owner?.id || horse.ownerId,
          amount: totalDebt,
          paymentsCount: pendingPayments.length,
          reason: reason || `Baja de ${horse.name}`,
        });
      }

      // 2. Archivar el caballo (soft delete + libera el box automáticamente)
      const result = await archiveHorse(horse.id, true, reason || `Liberación del ${space.name}`);
      if (!result?.success) {
        throw new Error(result?.error?.message || 'Error al archivar');
      }

      onReleased?.();
      onClose();
    } catch (err) {
      console.error('Error en release:', err);
      setStep('confirm');
    }
  };

  return (
    <Modal isOpen={true} onClose={step === 'processing' ? undefined : onClose} size="md" hideDefaultHeader>
      {/* Header */}
      <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between bg-gradient-to-br from-danger-50 to-white">
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-medium text-ink-900 flex items-center gap-2">
            <UserMinus size={18} className="text-danger-600" />
            Liberar espacio
          </div>
          <div className="text-xs text-ink-500 mt-0.5">
            Dar de baja a {horse.name} y liberar {space.name}
          </div>
        </div>
        <button
          onClick={onClose}
          disabled={step === 'processing'}
          className="p-1.5 rounded-md hover:bg-white/80 text-ink-500 hover:text-ink-800 flex-shrink-0 disabled:opacity-40"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      </div>

      <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">

        {/* Aviso principal */}
        <div className="bg-gold-50 border border-gold-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-gold-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-ink-700 space-y-1">
            <div className="font-medium text-gold-800">
              Esta acción se puede revertir
            </div>
            <div className="text-xs text-ink-600">
              El caballo no se borra de la base. Se marca como inactivo y queda fuera de los listados. Toda su historia (rutinas, eventos, sanidad) se conserva. Si el caballo vuelve, lo podemos reactivar desde Caballos.
            </div>
          </div>
        </div>

        {/* Resumen del caballo */}
        <div className="bg-white border border-ink-200 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-ink-500 mb-2">
            Caballo a dar de baja
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-display font-medium">
              {horse.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-ink-900 truncate">{horse.name}</div>
              <div className="text-xs text-ink-500 truncate">
                {[horse.breed, horse.age && `${horse.age} años`].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
              </div>
            </div>
          </div>
        </div>

        {/* Sección financiera */}
        <div className={`rounded-xl p-4 border ${hasDebt ? 'bg-danger-50 border-danger-200' : 'bg-success-50 border-success-200'}`}>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider mb-2.5 text-ink-600">
            <DollarSign size={11} strokeWidth={2.5} />
            Estado de cuenta del dueño
          </div>

          {!owner ? (
            <div className="text-sm text-ink-700">
              No se encontró el dueño en el sistema. Procede sin afectar finanzas.
            </div>
          ) : !hasDebt ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-ink-900">{owner.displayName}</div>
                <div className="text-xs text-ink-600">Sin deuda pendiente</div>
              </div>
              <Badge variant="success">Al día</Badge>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-ink-900">{owner.displayName}</div>
                  <div className="text-xs text-ink-600">
                    {pendingPayments.length} {pendingPayments.length === 1 ? 'pago pendiente' : 'pagos pendientes'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-medium text-danger-700">
                    ${totalDebt.toLocaleString('es-AR')}
                  </div>
                </div>
              </div>

              {/* Detalle de pagos pendientes */}
              <details className="mb-3">
                <summary className="text-xs text-ink-600 cursor-pointer hover:text-ink-800 font-medium">
                  Ver detalle de pagos pendientes
                </summary>
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {pendingPayments.map(p => (
                    <div key={p.id} className="flex justify-between items-center text-xs bg-white/60 rounded px-2 py-1.5">
                      <span className="text-ink-700 truncate flex items-center gap-1.5">
                        <FileText size={10} strokeWidth={2} className="text-ink-400 flex-shrink-0" />
                        {p.concept || p.description || 'Sin descripción'}
                      </span>
                      <span className="font-medium text-ink-800 flex-shrink-0 ml-2">
                        ${(p.amount || 0).toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
              </details>

              {/* Decisión sobre la deuda */}
              <div className="mt-3 pt-3 border-t border-danger-200">
                <div className="text-xs font-medium text-ink-700 mb-2">
                  ¿Qué hacés con la deuda?
                </div>
                <div className="space-y-2">
                  <DebtOption
                    selected={debtAction === 'keep'}
                    onClick={() => setDebtAction('keep')}
                    title="Mantener pendiente"
                    description="La deuda sigue activa en cuenta corriente. Si vuelve más adelante, queda registrada."
                  />
                  <DebtOption
                    selected={debtAction === 'forgive'}
                    onClick={() => setDebtAction('forgive')}
                    title="Perdonar la deuda"
                    description="Los pagos pendientes se marcan como condonados. Quedan registrados en historial pero no se cobrarán."
                    variant="forgive"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Motivo (opcional) */}
        <div>
          <label className="block text-xs font-medium text-ink-600 uppercase tracking-wider mb-1.5">
            Motivo <span className="text-ink-400 font-normal lowercase tracking-normal">(opcional)</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="input-field resize-none"
            rows="2"
            placeholder="Ej: Vendido, traslado a otro haras, baja por edad..."
          />
        </div>

      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-ink-100 bg-ink-50/50 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
        <button
          onClick={onClose}
          className="btn-secondary"
          disabled={step === 'processing'}
        >
          Cancelar
        </button>
        <button
          onClick={handleRelease}
          disabled={!canConfirm || step === 'processing'}
          className={`
            inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm
            transition-colors
            ${canConfirm
              ? 'bg-danger-600 text-white hover:bg-danger-700'
              : 'bg-ink-200 text-ink-400 cursor-not-allowed'
            }
          `}
        >
          {step === 'processing' ? (
            <>Procesando...</>
          ) : (
            <>
              <Check size={14} />
              Confirmar baja
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

// ====== Sub-componente: opción de tratamiento de deuda ======
function DebtOption({ selected, onClick, title, description, variant = 'keep' }) {
  const accentColor = variant === 'forgive' ? 'gold' : 'primary';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left px-3 py-2.5 rounded-lg border-2 transition-all
        ${selected
          ? `border-${accentColor}-500 bg-${accentColor}-50`
          : 'border-ink-200 bg-white hover:border-ink-300'
        }
      `}
    >
      <div className="flex items-start gap-2.5">
        <div className={`
          mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
          ${selected ? `border-${accentColor}-500 bg-${accentColor}-500` : 'border-ink-300'}
        `}>
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
        <div className="min-w-0">
          <div className={`text-sm font-medium ${selected ? `text-${accentColor}-800` : 'text-ink-800'}`}>
            {title}
          </div>
          <div className="text-xs text-ink-600 mt-0.5 leading-snug">
            {description}
          </div>
        </div>
      </div>
    </button>
  );
}
