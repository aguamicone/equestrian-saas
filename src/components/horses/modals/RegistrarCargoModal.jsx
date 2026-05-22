import { useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../../ui';
import { useData } from '../../../context/DataContext';
import { useNotification } from '../../../context/NotificationContext';

export default function RegistrarCargoModal({ isOpen, onClose, horse }) {
  const { horses, pricingPlans, tenantUsers, createOneTimeCharge } = useData();
  const { notify } = useNotification();

  const liveHorse = useMemo(() =>
    horses.find(h => h.id === horse?.id) || horse,
  [horses, horse?.id]);

  const owner = useMemo(() => 
    tenantUsers.find(u => (u.uid || u.id) === liveHorse?.ownerId),
  [tenantUsers, liveHorse?.ownerId]);

  const oneTimePlans = useMemo(() => 
    pricingPlans.filter(p => p.frequency === 'one-time'),
  [pricingPlans]);

  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [markAsPaid, setMarkAsPaid] = useState(false);
  
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState(null);

  const selectedPlan = oneTimePlans.find(p => p.id === selectedPlanId);

  // Efecto: pre-llenar monto si elige preset
  const handlePlanChange = (e) => {
    const val = e.target.value;
    setSelectedPlanId(val);
    if (val === '__custom__') {
      setAmount('');
    } else if (val) {
      const plan = oneTimePlans.find(p => p.id === val);
      if (plan) setAmount(plan.price || '');
    } else {
      setAmount('');
    }
  };

  const formatCurrency = (n) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(n || 0);

  const getValidationError = () => {
    if (!selectedPlanId) return 'Seleccioná un concepto para el cargo.';
    const isCustom = selectedPlanId === '__custom__';
    const finalDescription = isCustom ? customDescription.trim() : selectedPlan?.name;
    if (isCustom && !finalDescription) return 'Ingresá la descripción del cargo.';
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return 'Ingresá un importe válido mayor a 0.';
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) return 'Ingresá una fecha válida.';
    const today = new Date().toISOString().slice(0, 10);
    if (date > today) return 'La fecha no puede ser futura.';
    return null;
  };

  const validationError = getValidationError();
  const displayError = (submitted && validationError) ? validationError : backendError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setBackendError(null);

    const err = getValidationError();
    if (err) return;

    setLoading(true);
    
    const isCustom = selectedPlanId === '__custom__';
    const finalPlanId = isCustom ? null : selectedPlanId;
    const finalDescription = isCustom ? customDescription.trim() : selectedPlan?.name;

    const res = await createOneTimeCharge({
      horse: liveHorse,
      amount: Number(amount),
      description: finalDescription,
      planId: finalPlanId,
      date,
      markAsPaid
    });

    setLoading(false);

    if (res.success) {
      notify('Cargo registrado exitosamente', 'success');
      onClose();
    } else {
      setBackendError(res.error || 'Ocurrió un error al registrar el cargo.');
    }
  };

  if (!liveHorse) return null;

  const footer = (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 rounded-lg transition-colors border border-transparent disabled:opacity-50"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="px-4 py-2 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
      >
        {loading ? 'Registrando...' : 'Registrar cargo'}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar cargo único"
      subtitle={`${liveHorse.name} · ${owner?.displayName || 'Sin dueño'}`}
      size="md"
      footer={footer}
    >
      <div className="space-y-4 py-2">
        {!liveHorse.ownerId && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-sm flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="mt-0.5 leading-snug">
              Este caballo no tiene dueño asignado. El cargo quedará sin cliente vinculado.
            </p>
          </div>
        )}

        {displayError && (
          <div className="bg-danger-50 border border-danger-200 text-danger-900 px-4 py-3 rounded-xl text-sm">
            {displayError}
          </div>
        )}

        {/* Concepto */}
        <div>
          <label className="block text-sm font-medium text-ink-900 mb-1.5">
            Concepto del cargo <span className="text-danger-500">*</span>
          </label>
          <select
            value={selectedPlanId}
            onChange={handlePlanChange}
            className="input-field"
            disabled={loading}
          >
            <option value="" disabled>Seleccionar concepto...</option>
            {oneTimePlans.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatCurrency(p.price)}
              </option>
            ))}
            <option value="__custom__">Otro concepto...</option>
          </select>
          {selectedPlan && selectedPlan.description && (
            <p className="mt-1.5 text-xs text-ink-500 italic">
              {selectedPlan.description}
            </p>
          )}
        </div>

        {/* Descripción custom */}
        {selectedPlanId === '__custom__' && (
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">
              Descripción del cargo <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={customDescription}
              onChange={e => { setCustomDescription(e.target.value); setErrorMsg(null); }}
              className="input-field"
              placeholder="Ej: Visita veterinaria, herradura extra..."
              disabled={loading}
            />
          </div>
        )}

        {/* Fecha y Monto */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">
              Monto ($) <span className="text-danger-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => { setAmount(e.target.value); setErrorMsg(null); }}
              className="input-field"
              min="0"
              step="1000"
              placeholder="0"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">
              Fecha <span className="text-danger-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={e => { setDate(e.target.value); setErrorMsg(null); }}
              max={new Date().toISOString().slice(0, 10)}
              className="input-field"
              disabled={loading}
            />
          </div>
        </div>

        {/* Ya cobrado */}
        <div className="pt-2">
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-ink-200 hover:bg-ink-50/50 transition-colors">
            <input
              type="checkbox"
              checked={markAsPaid}
              onChange={e => setMarkAsPaid(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded border-ink-300 focus:ring-primary-500"
              disabled={loading}
            />
            <span className="text-sm font-medium text-ink-900 select-none">
              Marcar este cargo como ya cobrado
            </span>
          </label>
        </div>
      </div>
    </Modal>
  );
}
