import { useState, useEffect } from 'react';
import { useData } from '../../../context/DataContext';
import Modal from '../../ui/Modal';

/**
 * PricingPlanModal - Crear o editar un Pricing Plan
 *
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   plan: object | null (null para create, objeto plan para edit)
 *
 * Defensive submit: estado isSubmitting + try/catch/finally + error state.
 * Patron form attribute para que Enter en inputs dispare submit aunque
 * el boton viva en el footer del Modal base.
 */
export default function PricingPlanModal({ isOpen, onClose, plan }) {
  const { addPricingPlan, updateRow } = useData();
  const isEdit = !!plan;

  const [name, setName] = useState('');
  const [type, setType] = useState('membership');
  const [frequency, setFrequency] = useState('monthly');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Prefill al abrir o reset al cerrar
  useEffect(() => {
    if (isOpen) {
      if (plan) {
        setName(plan.name || '');
        setType(plan.type || 'membership');
        setFrequency(plan.frequency || 'monthly');
        setPrice(plan.price?.toString() || '');
        setDescription(plan.description || '');
      } else {
        setName('');
        setType('membership');
        setFrequency('monthly');
        setPrice('');
        setDescription('');
      }
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, plan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const planData = {
        name,
        type,
        frequency,
        price: parseInt(price) || 0,
        description,
      };
      if (isEdit) {
        await updateRow('PRICING_PLANS', plan.id, planData);
      } else {
        await addPricingPlan(planData);
      }
      onClose();
    } catch (err) {
      setError(err?.message || 'Error al guardar el plan. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-2">
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
        form="pricing-plan-form"
        disabled={isSubmitting}
        className="btn-primary px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Guardando...' : (isEdit ? 'Guardar Cambios' : 'Crear Plan')}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar Plan' : 'Nuevo Plan de Precios'}
      size="md"
      footer={footer}
    >
      <form id="pricing-plan-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div>
          <label className="block text-ink-700 text-sm font-medium mb-1">
            Nombre del Plan <span className="text-danger-600">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="Ej: Pension Completa, Entrenamiento..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-ink-700 text-sm font-medium mb-1">Tipo</label>
            <select
              className="input-field"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="membership">Membresia</option>
              <option value="service">Servicio</option>
            </select>
          </div>
          <div>
            <label className="block text-ink-700 text-sm font-medium mb-1">Frecuencia</label>
            <select
              className="input-field"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="monthly">Mensual</option>
              <option value="one-time">Pago Unico</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-ink-700 text-sm font-medium mb-1">
            Precio Base ($) <span className="text-danger-600">*</span>
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={isSubmitting}
            required
            min="0"
          />
        </div>

        <div>
          <label className="block text-ink-700 text-sm font-medium mb-1">Descripcion</label>
          <textarea
            className="input-field min-h-[80px]"
            placeholder="Detalles de lo que incluye..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </form>
    </Modal>
  );
}
