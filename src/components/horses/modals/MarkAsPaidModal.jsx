// src/components/horses/modals/MarkAsPaidModal.jsx
//
// Modal de confirmación para marcar un cargo como pagado.
// Implementa el patrón "double-entry":
//   1. Crear un PAYMENT doc nuevo en FINANCES con type='payment', status='paid'
//   2. Actualizar el cargo original a status='paid' + paidAt + paidByPaymentId
//
// Esto deja trazabilidad para el módulo de Finanzas que viene en Sprint 5.

import { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../../ui';
import { 
  doc, 
  collection, 
  writeBatch, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../services/firebase';

/**
 * Props:
 *   charge: el cargo (finance) a marcar como pagado
 *   horse: caballo asociado (para descripciones)
 *   owner: dueño del caballo (puede ser null si está huérfano)
 *   onClose: () => void
 */
export default function MarkAsPaidModal({ charge, horse, owner, onClose }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const formatCurrency = (n) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(n || 0);

  // NOTA ARQUITECTÓNICA:
  // 1) Usamos Firestore batch directamente en lugar de 
  //    DataContext.addPayment porque necesitamos atomicidad 
  //    entre crear el PAYMENT y actualizar el cargo. Cuando se 
  //    refactorice DataContext para soportar transacciones 
  //    (Sprint 5), volver al patrón estándar de Context.
  //
  // 2) Mezclamos timestamps (paidAt como ISO string vs createdAt 
  //    con serverTimestamp). En Sprint 5 unificar a 
  //    serverTimestamp para todos los campos de auditoría 
  //    financiera (paidAt, createdAt, paymentDate, etc.) por 
  //    razones de confiabilidad (no depender del reloj del cliente).
  const handleConfirm = async () => {
    if (!charge || !horse) return;
    setSaving(true);
    setError(null);
    try {
      const nowIso = new Date().toISOString();
      const batch = writeBatch(db);

      // 1. Crear referencia para el nuevo PAYMENT (genera ID antes de escribir)
      const newPaymentRef = doc(collection(db, 'FINANCES'));
      const newPaymentId = newPaymentRef.id;

      // 2. SET del PAYMENT en el batch
      batch.set(newPaymentRef, {
        type: 'payment',
        status: 'paid',
        amount: Number(charge.amount || 0),
        clientId: charge.clientId || owner?.uid || owner?.id || null,
        horseId: charge.horseId || horse.id,
        relatedChargeId: charge.id,
        description: `Pago: ${charge.description || charge.category || 'Cargo'}`,
        category: 'Pago',
        date: nowIso.slice(0, 10),
        paidAt: nowIso,
        note: note.trim() || null,
        tenantId: horse.tenantId,  // ← importante: heredar el tenantId del caballo
        createdAt: serverTimestamp(),
      });

      // 3. UPDATE del cargo original en el mismo batch
      const chargeRef = doc(db, 'FINANCES', charge.id);
      batch.update(chargeRef, {
        status: 'paid',
        paidAt: nowIso,
        paidByPaymentId: newPaymentId,
      });

      // 4. COMMIT atómico (all-or-nothing)
      await batch.commit();

      onClose();
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
            {charge.description || charge.category || 'Cargo sin descripción'}
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-ink-500">
              {horse.name} · {owner?.displayName || 'Sin dueño'}
            </div>
            <div className="text-base font-display font-medium text-ink-900 tabular-nums">
              {formatCurrency(charge.amount)}
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
          Esta acción queda registrada en la cuenta corriente del caballo.
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
