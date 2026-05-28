import { useState, useEffect } from 'react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import Modal from '../../ui/Modal';
import { FileText, Camera, User, Clipboard, Calendar, Clock, Award } from 'lucide-react';

/**
 * TaskCompletionModal - Completar una tarea de routine o request
 *
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   task: object con datos (debe incluir _taskType: 'request' | 'routine', name, type, horseId, clientId)
 *   onDeriveRequest: () => void (callback para abrir modal de Derivar)
 *
 * Bug fix: foto convertida a Base64 con compresion en lugar de URL.createObjectURL
 * (las blob URLs son locales al navegador, no se ven desde otros dispositivos).
 *
 * Compresion: resize a max 1024px + jpeg quality 0.7 (sin manejo EXIF).
 */
export default function TaskCompletionModal({ isOpen, onClose, task, onDeriveRequest }) {
  const { addLog, updateRow, sendNotification, horses, tenantUsers, equipmentItems } = useData();
  const { currentUser } = useAuth();

  const [observation, setObservation] = useState('');
  const [photo, setPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Reset al abrir o cambiar task
  useEffect(() => {
    if (isOpen) {
      setObservation('');
      setPhoto(null);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, task]);

  const handleTakeTask = async () => {
    if (isSubmitting || !task) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const reqRef = doc(db, 'REQUESTS', task.id);
      await updateDoc(reqRef, {
        status: 'in_progress',
        assigneeId: currentUser?.uid,
        takenAt: new Date().toISOString()
      });
    } catch (err) {
      setError(err?.message || 'No se pudo tomar la tarea. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseTask = async () => {
    if (isSubmitting || !task) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const reqRef = doc(db, 'REQUESTS', task.id);
      await updateDoc(reqRef, {
        status: 'pending_staff',
        assigneeId: null,
        takenAt: null
      });
      onClose();
    } catch (err) {
      setError(err?.message || 'No se pudo liberar la tarea. Intenta de nuevo.');
      setIsSubmitting(false);
    }
  };

  /**
   * Comprimir y convertir foto a Base64 antes de setear state.
   * Resize a max 1024px (manteniendo aspect ratio) + JPEG 0.7.
   */
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_DIM) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else if (height >= width && height > MAX_DIM) {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        setPhoto(base64);
      };
      img.onerror = () => {
        setError('No se pudo procesar la imagen. Intenta con otra.');
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      setError('No se pudo leer el archivo. Intenta de nuevo.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (isSubmitting) return;
    if (!task) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const isRequest = task._taskType === 'request';

      await addLog({
        type: isRequest ? 'request_completion' : 'routine_completion',
        details: `${isRequest ? 'Solicitud' : 'Rutina'} completada: ${task.type || task.name}${observation ? `. Nota: ${observation}` : ''}`,
        horseId: task.horseId || null,
        evidence: photo,
      });

      if (isRequest) {
        await updateRow('REQUESTS', task.id, { status: 'completed' });
        await sendNotification(
          task.clientId,
          `Tu solicitud de ${task.type} ya esta lista`,
          'service_completed'
        );
      }

      onClose();
    } catch (err) {
      setError(err?.message || 'No se pudo completar la tarea. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeriveClick = () => {
    if (isSubmitting) return;
    onDeriveRequest();
  };

  const isRequest = task?._taskType === 'request';
  const isUnassigned = isRequest && !task.assigneeId;

  const horse = horses.find(h => h.id === task?.horseId);
  const client = tenantUsers.find(u => u.uid === task?.clientId);
  const horseEquipment = horse ? (equipmentItems || []).filter(item => item.horseId === horse.id) : [];

  if (!task) return null;

  if (isUnassigned) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={task.type || 'Detalles de la solicitud'}
        subtitle="Solicitud sin asignar"
        size="md"
        footer={
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 btn-secondary"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleTakeTask}
              disabled={isSubmitting}
              className="flex-[2] btn-primary"
            >
              {isSubmitting ? 'Tomando Tarea...' : 'Tomar Tarea'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Clipboard className="text-primary-500 w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs kicker text-ink-500">Detalles / Notas</h4>
                <p className="text-sm font-medium text-ink-800 italic mt-0.5">
                  {task.details ? `"${task.details}"` : 'Sin detalles adicionales'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-sky-100">
              <div className="flex items-center gap-3">
                <Award className="text-primary-500 w-5 h-5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs kicker text-ink-500">Caballo</h4>
                  <p className="text-sm font-bold text-ink-800">{horse?.name || 'No especificado'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="text-primary-500 w-5 h-5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs kicker text-ink-500">Cliente</h4>
                  <p className="text-sm font-bold text-ink-800">{client?.displayName || 'No especificado'}</p>
                </div>
              </div>
            </div>

            {horseEquipment.length > 0 && (
              <div className="pt-2 border-t border-sky-100">
                <h4 className="text-xs kicker text-ink-500 mb-2">Set de Equipo del Caballo</h4>
                <div className="flex flex-wrap gap-2">
                  {horseEquipment.map(eq => (
                    <span key={eq.id} className="text-xs bg-white text-ink-700 px-2 py-1 rounded border border-sky-200 shadow-sm">
                      <strong className="text-ink-900">{eq.name}</strong> ({eq.type})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-sky-100">
              <div className="flex items-center gap-3">
                <Clock className="text-primary-500 w-5 h-5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs kicker text-ink-500">Hora Solicitada</h4>
                  <p className="text-sm font-bold text-ink-800">{task.timeRequested || 'Flexible'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="text-primary-500 w-5 h-5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs kicker text-ink-500">Fecha de Creación</h4>
                  <p className="text-sm font-bold text-ink-800">
                    {task.timestamp
                      ? new Date(task.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                      : 'Ahora'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  const footer = (
    <div className="flex gap-2 w-full">
      {isRequest && (
        <>
          <button
            type="button"
            onClick={handleReleaseTask}
            disabled={isSubmitting}
            className="flex-1 btn-danger px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Liberar
          </button>
          <button
            type="button"
            onClick={handleDeriveClick}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
          >
            <User size={16} /> Derivar
          </button>
        </>
      )}
      <button
        type="submit"
        form="task-completion-form"
        disabled={isSubmitting}
        className="flex-[2] btn-primary px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Confirmando...' : 'Confirmar'}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task.name || task.type || 'Completar tarea'}
      subtitle={isRequest ? 'Completar Solicitud' : 'Completar Rutina'}
      size="md"
      footer={footer}
    >
      <form id="task-completion-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {horseEquipment.length > 0 && (
          <div className="pt-2 border-t border-sky-100">
            <h4 className="text-xs kicker text-ink-500 mb-2">Set de Equipo del Caballo</h4>
            <div className="flex flex-wrap gap-2">
              {horseEquipment.map(eq => (
                <span key={eq.id} className="text-xs bg-white text-ink-700 px-2 py-1 rounded border border-sky-200 shadow-sm">
                  <strong className="text-ink-900">{eq.name}</strong> ({eq.type})
                </span>
              ))}
            </div>
          </div>
        )}

        {isRequest && (
          <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-3 text-xs text-ink-600 flex flex-wrap gap-x-4 gap-y-1.5 border border-ink-150">
            <span><strong>Caballo:</strong> {horse?.name || 'No especificado'}</span>
            <span><strong>Cliente:</strong> {client?.displayName || 'No especificado'}</span>
            {task.timeRequested && <span><strong>Hora:</strong> {task.timeRequested}</span>}
            {task.details && (
              <span className="w-full mt-1 border-t border-sky-100/50 pt-1 italic text-ink-700">
                "{task.details}"
              </span>
            )}
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-ink-700 mb-2 flex items-center gap-2">
            <FileText size={16} /> Observaciones
          </label>
          <textarea
            className="input-field"
            rows={3}
            placeholder="Todo en orden..."
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink-700 mb-2 flex items-center gap-2">
            <Camera size={16} /> Foto de Evidencia
          </label>
          <label
            className={`border-2 border-dashed border-ink-200 rounded-xl p-4 flex flex-col items-center justify-center transition-colors bg-ink-50 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary-400'
            }`}
          >
            {photo ? (
              <img src={photo} alt="Evidencia" className="h-32 object-cover rounded-lg" />
            ) : (
              <div className="text-center text-ink-500">
                <Camera size={32} className="mx-auto mb-2" />
                <span className="text-xs">Toca para subir foto</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={isSubmitting}
            />
          </label>
          {photo && (
            <button
              type="button"
              onClick={() => setPhoto(null)}
              disabled={isSubmitting}
              className="text-xs text-ink-500 hover:text-ink-700 mt-2 disabled:opacity-50"
            >
              Quitar foto
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
