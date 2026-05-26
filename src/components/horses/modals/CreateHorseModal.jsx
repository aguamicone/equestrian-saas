import { useState, useMemo } from 'react';
import { Modal } from '../../ui';
import { useData } from '../../../context/DataContext';
import { useNotification } from '../../../context/NotificationContext';
import { AlertCircle } from 'lucide-react';

export default function CreateHorseModal({ isOpen, onClose }) {
  const { tenantUsers, addHorse } = useData();
  const { notify } = useNotification();

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');
  const [ownerId, setOwnerId] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Filter clients/owners
  const clients = useMemo(() => {
    return (tenantUsers || []).filter(u => u.role === 'client');
  }, [tenantUsers]);

  const validate = () => {
    if (!name.trim()) return 'Ingresá el nombre del caballo.';
    if (!breed.trim()) return 'Ingresá la raza del caballo.';
    const ageNum = Number(age);
    if (age === '' || isNaN(ageNum) || ageNum < 0) return 'Ingresá una edad válida.';
    if (!ownerId) return 'Seleccioná un dueño para el caballo.';
    return null;
  };

  const validationError = validate();
  const displayError = (submitted && validationError) ? validationError : errorMsg;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setErrorMsg(null);

    const err = validate();
    if (err) return;

    setLoading(true);
    try {
      await addHorse({
        name: name.trim(),
        breed: breed.trim(),
        age: Number(age),
        color: color.trim() || null,
        notes: notes.trim() || null,
        ownerId,
        assignedPlanIds: [],
        location: null,
      });
      // Notification is handled by context. Just close.
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error al registrar el caballo.');
    } finally {
      setLoading(false);
    }
  };

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
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : 'Registrar caballo'}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo caballo"
      subtitle="Registrar un caballo para un dueño existente"
      size="md"
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {clients.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="mt-0.5 leading-snug">
              No hay clientes registrados en el sistema. Primero debés registrar un cliente en la sección de Usuarios.
            </p>
          </div>
        )}

        {displayError && (
          <div className="bg-danger-50 border border-danger-200 text-danger-900 px-4 py-3 rounded-xl text-sm">
            {displayError}
          </div>
        )}

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-ink-900 mb-1.5">
            Nombre del caballo <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setErrorMsg(null); }}
            className="input-field"
            placeholder="Ej: Calito"
            disabled={loading}
            required
          />
        </div>

        {/* Raza y Edad */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">
              Raza <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={breed}
              onChange={e => { setBreed(e.target.value); setErrorMsg(null); }}
              className="input-field"
              placeholder="Ej: Silla Argentino"
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">
              Edad (años) <span className="text-danger-500">*</span>
            </label>
            <input
              type="number"
              value={age}
              onChange={e => { setAge(e.target.value); setErrorMsg(null); }}
              className="input-field"
              placeholder="Ej: 8"
              min="0"
              disabled={loading}
              required
            />
          </div>
        </div>

        {/* Pelaje/Color y Dueño */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">
              Pelaje / Color
            </label>
            <input
              type="text"
              value={color}
              onChange={e => { setColor(e.target.value); setErrorMsg(null); }}
              className="input-field"
              placeholder="Ej: Alazán, Zaino..."
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-900 mb-1.5">
              Dueño / Cliente <span className="text-danger-500">*</span>
            </label>
            <select
              value={ownerId}
              onChange={e => { setOwnerId(e.target.value); setErrorMsg(null); }}
              className="input-field"
              disabled={loading || clients.length === 0}
              required
            >
              <option value="" disabled>Seleccionar dueño...</option>
              {clients.map(client => (
                <option key={client.uid || client.id} value={client.uid || client.id}>
                  {client.displayName} ({client.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-ink-900 mb-1.5">
            Notas adicionales
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="input-field resize-none text-sm"
            placeholder="Ej: Detalles médicos, temperamento..."
            disabled={loading}
            rows="3"
          />
        </div>
      </form>
    </Modal>
  );
}
