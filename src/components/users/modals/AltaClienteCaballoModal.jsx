import { useState } from 'react';
import { Modal } from '../../ui';
import { useData } from '../../../context/DataContext';
import { useNotification } from '../../../context/NotificationContext';
import { Plus, Trash2, Copy } from 'lucide-react';

export default function AltaClienteCaballoModal({ isOpen, onClose, onSuccess }) {
  const { createClientWithHorses } = useData();
  const { notify } = useNotification();

  const initialClient = {
    displayName: '',
    email: '',
    phoneNumber: '',
    password: '',
  };

  const initialHorse = () => ({ id: crypto.randomUUID(), name: '', breed: '', age: '' });

  const [client, setClient] = useState(initialClient);
  const [horses, setHorses] = useState([initialHorse()]);
  
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const updateClient = (field, value) => {
    setClient(prev => ({ ...prev, [field]: value }));
    setBackendError(null);
  };

  const updateHorse = (id, field, value) => {
    setHorses(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h));
    setBackendError(null);
  };

  const addHorse = () => {
    setHorses(prev => [...prev, initialHorse()]);
  };

  const removeHorse = (id) => {
    if (horses.length > 1) {
      setHorses(prev => prev.filter(h => h.id !== id));
    }
  };

  const validate = () => {
    if (!client.displayName.trim()) return 'Ingresá el nombre completo del cliente.';
    if (!client.email.trim() || !client.email.match(/^\S+@\S+\.\S+$/)) return 'Ingresá un email válido.';
    if (!client.phoneNumber.trim()) return 'Ingresá un teléfono de contacto.';
    if (client.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';

    for (let i = 0; i < horses.length; i++) {
      const h = horses[i];
      if (!h.name.trim()) return `Ingresá el nombre del caballo ${i + 1}.`;
      if (!h.breed.trim()) return `Ingresá la raza del caballo ${i + 1}.`;
      const ageNum = Number(h.age);
      if (h.age === '' || isNaN(ageNum) || ageNum < 0) return `Ingresá una edad válida para el caballo ${i + 1}.`;
    }

    return null;
  };

  const validationError = validate();
  const displayError = (submitted && validationError) ? validationError : backendError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setBackendError(null);

    const err = validate();
    if (err) return;

    setLoading(true);

    const res = await createClientWithHorses({ client, horses });

    setLoading(false);

    if (res.success) {
      notify(
        <div className="flex flex-col gap-1.5">
          <span>Cliente creado exitosamente.</span>
          <div className="flex items-center gap-2 bg-green-950/20 p-2 rounded-md border border-green-800/30">
            <span className="font-mono text-xs">{client.email} / {client.password}</span>
            <button
              onClick={() => navigator.clipboard.writeText(`${client.email} / ${client.password}`)}
              className="p-1 hover:bg-green-800/30 rounded text-green-200 transition-colors"
              title="Copiar credenciales"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>,
        'success'
      );
      
      // Reset form
      setClient(initialClient);
      setHorses([initialHorse()]);
      setSubmitted(false);

      if (onSuccess) onSuccess(res);
      onClose();
    } else if (res.error === 'partial-failure') {
      setBackendError(`Cliente creado en Auth pero hubo error en Firestore. Contactá soporte con uid: ${res.authUid}`);
      // As requested, partial failure closes the modal and leaves it to admin to fix.
      onClose();
    } else {
      let msg = res.error;
      if (res.error.includes('email-already-in-use')) msg = 'El email ya está registrado.';
      else if (res.error.includes('weak-password')) msg = 'La contraseña es demasiado débil.';
      setBackendError(msg);
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
        ) : 'Crear cliente y caballos'}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo cliente y caballos"
      size="lg"
      footer={footer}
    >
      <div className="space-y-6 py-2 overflow-y-auto max-h-[70vh]">
        
        {displayError && (
          <div className="bg-danger-50 border border-danger-200 text-danger-900 px-4 py-3 rounded-xl text-sm sticky top-0 z-10">
            {displayError}
          </div>
        )}

        {/* Sección Datos del Cliente */}
        <div>
          <h3 className="font-bold text-ink-900 border-b border-ink-200 pb-2 mb-4">Datos del cliente</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-1.5">
                Nombre completo <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={client.displayName}
                onChange={e => updateClient('displayName', e.target.value)}
                className="input-field"
                placeholder="Ej: Juan Pérez"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-1.5">
                Email <span className="text-danger-500">*</span>
              </label>
              <input
                type="email"
                value={client.email}
                onChange={e => updateClient('email', e.target.value)}
                className="input-field"
                placeholder="usuario@email.com"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-1.5">
                Teléfono <span className="text-danger-500">*</span>
              </label>
              <input
                type="tel"
                value={client.phoneNumber}
                onChange={e => updateClient('phoneNumber', e.target.value)}
                className="input-field"
                placeholder="Ej: 11 1234 5678"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-900 mb-1.5">
                Contraseña temporal <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={client.password}
                onChange={e => updateClient('password', e.target.value)}
                className="input-field"
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
              />
              <p className="mt-1.5 text-xs text-ink-500 italic">
                Compartí esto con el cliente para que se loguee.
              </p>
            </div>
          </div>
        </div>

        {/* Sección Caballos */}
        <div>
          <h3 className="font-bold text-ink-900 border-b border-ink-200 pb-2 mb-4">Caballos asignados</h3>
          
          <div className="space-y-4">
            {horses.map((horse, index) => (
              <div key={horse.id} className="p-4 bg-ink-50 rounded-xl border border-ink-200 relative">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-ink-700 text-sm">Caballo {index + 1}</h4>
                  {horses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHorse(horse.id)}
                      disabled={loading}
                      className="text-danger-500 hover:text-danger-700 p-1 rounded-md hover:bg-danger-50 transition-colors flex items-center gap-1 text-xs font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink-900 mb-1.5">
                      Nombre <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={horse.name}
                      onChange={e => updateHorse(horse.id, 'name', e.target.value)}
                      className="input-field bg-white"
                      placeholder="Ej: Calito"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-900 mb-1.5">
                      Raza <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={horse.breed}
                      onChange={e => updateHorse(horse.id, 'breed', e.target.value)}
                      className="input-field bg-white"
                      placeholder="Ej: Silla Argentino"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-900 mb-1.5">
                      Edad <span className="text-danger-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={horse.age}
                      onChange={e => updateHorse(horse.id, 'age', e.target.value)}
                      className="input-field bg-white"
                      placeholder="Ej: 10"
                      min="0"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={addHorse}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-primary-200 border-dashed w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              Agregar otro caballo
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
}
