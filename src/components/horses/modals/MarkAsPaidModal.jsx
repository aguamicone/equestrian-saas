// src/components/horses/modals/MarkAsPaidModal.jsx
//
// Modal de confirmación para marcar un cargo como pagado.
// Utiliza DataContext.settlePendingCharge para la atomicidad de la transacción.

import { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../../ui';
import { useData } from '../../../context/DataContext';

/**
 * Props:
 *   charge: el cargo (finance) a marcar como pagado
 *   horse: caballo asociado (opcional, se resuelve por context si no se provee)
 *   owner: dueño del caballo (opcional, se resuelve por context si no se provee)
 *   onClose: () => void
 */
export default function MarkAsPaidModal({ charge, horse: initialHorse, owner: initialOwner, onClose }) {
  const { horses, tenantUsers, settlePendingCharge } = useData();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Resolver caballo y dueño dinámicamente si no se proveen como props
  const horse = initialHorse || horses.find(h => h.id === charge?.horseId);
  const owner = initialOwner || tenantUsers.find(u => u.uid === (charge?.clientId || horse?.ownerId));

  const formatCurrency = (n) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(n || 0);

  const handleConfirm = async () => {
    if (!charge) return;
    setSaving(true);
    setError(null);
    try {
      const res = await settlePendingCharge(charge.id, note);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'No se pudo registrar el pago. Intentá de nuevo.');
      }
    } catch (err) {
      console.error('Error marcando como pagado:', err);
      setError('No se pudo registrar el pago. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={saving ? undefined : onClose} size="sm" hideDefaultHeader>
      {/* Header */}
      <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between bg-gradient-to-br from-success-50 to-white">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <CheckCircle2 size={18} className="text-success-700 flex-shrink-0" />
          <div className="font-display text-base font-medium text-ink-900">
            Marcar como pagado
          </div>
        </div>
        <button
          onClick={onClose}
          disabled={saving}
          className="p-1.5 rounded-md hover:bg-white/80 text-ink-500 flex-shrink-0 disabled:opacity-40"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Resumen del cargo */}
        <div className="bg-ink-50 rounded-xl p-3 space-y-1.5">
          <div className="text-xs text-ink-500">Cargo a saldar</div>
          <div className="text-sm font-medium text-ink-900">
            {charge?.description || charge?.category || 'Cargo sin descripción'}
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-ink-500">
              {horse ? horse.name : 'Concepto general'} · {owner?.displayName || 'Sin dueño'}
            </div>
            <div className="text-base font-display font-medium text-ink-900 tabular-nums">
              {formatCurrency(charge?.amount)}
            </div>
          </div>
        </div>

        {/* Nota opcional */}
        <div>
          <label className="block text-xs font-medium text-ink-600 uppercase tracking-wider mb-1.5">
            Nota <span className="text-ink-400 font-normal lowercase tracking-normal">(opcional)</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            className="input-field resize-none text-sm"
            rows="2"
            placeholder="Ej: Pagó en efectivo, transferencia 15/05, etc."
            disabled={saving}
          />
        </div>

        {/* Aclaración de qué va a pasar */}
        <div className="text-[11px] text-ink-500 leading-snug bg-sky-50 border border-sky-100 rounded-lg p-2.5">
          Se va a registrar un pago y el cargo va a quedar marcado como pagado.
          Esta acción queda registrada en la cuenta corriente {horse ? `del caballo ${horse.name}` : 'del cliente'}.
        </div>

        {/* Error si hay */}
        {error && (
          <div className="flex items-start gap-2 text-xs text-danger-700 bg-danger-50 border border-danger-100 rounded-lg p-2.5">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-ink-100 bg-ink-50/50 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
        <button onClick={onClose} className="btn-secondary" disabled={saving}>
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          disabled={saving}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm bg-success-600 text-white hover:bg-success-700 disabled:bg-ink-200 disabled:text-ink-400"
        >
          <CheckCircle2 size={14} />
          {saving ? 'Registrando...' : 'Confirmar pago'}
        </button>
      </div>
    </Modal>
  );
}

