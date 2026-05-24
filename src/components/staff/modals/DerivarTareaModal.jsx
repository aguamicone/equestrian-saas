import { useState, useEffect } from 'react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import Modal from '../../ui/Modal';
import { ChevronRight, UserX } from 'lucide-react';

/**
 * DerivarTareaModal - Reasignar una tarea/solicitud a otro caballerizo
 *
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   task: object con datos (debe incluir id, type, horseId)
 *   onComplete: () => void (callback para que el padre cierre tambien TaskCompletionModal si lo tiene abierto)
 *
 * Cambios respecto al legacy:
 * - Usa tenantUsers del DataContext (no mock USERS hardcodeado)
 * - Filtra por role === 'staff' y excluye al currentUser
 * - Defensive submit: isSubmitting + try/catch/finally + error state
 * - EmptyState si no hay otros caballerizos disponibles
 */
export default function DerivarTareaModal({ isOpen, onClose, task, onComplete }) {
  const { tenantUsers, updateRow, addLog } = useData();
  const { currentUser } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setError(null);
    }
  }, [isOpen, task]);

  const availableStaff = (tenantUsers || []).filter(
    (u) => u.role === 'staff' && u.uid !== currentUser?.uid
  );

  const handleDerive = async (targetStaff) => {
    if (isSubmitting) return;
    if (!task) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await updateRow('REQUESTS', task.id, {
        assigneeId: targetStaff.uid,
        status: 'pending',
      });

      await addLog({
        type: 'request_derivation',
        details: `Derivo tarea "${task.type || task.name}" a ${targetStaff.displayName}`,
        horseId: task.horseId || null,
        timestamp: new Date().toISOString(),
      });

      onComplete();
    } catch (err) {
      setError(err?.message || 'No se pudo derivar la tarea. Intenta de nuevo.');
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Derivar Solicitud"
      subtitle={`Reasignar: ${task.type || task.name || 'tarea'}`}
      size="sm"
    >
      <div className="space-y-3">
        {error && (
          <div className="bg-danger-50 border border-danger-200 text-danger-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {availableStaff.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-ink-100 flex items-center justify-center mx-auto mb-3">
              <UserX size={20} className="text-ink-500" />
            </div>
            <p className="text-sm text-ink-700 font-medium mb-1">
              No hay otros caballerizos disponibles
            </p>
            <p className="text-xs text-ink-500">
              Solo vos podes tomar esta tarea por ahora.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-600">
              Selecciona un companero para asignar esta tarea:
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {availableStaff.map((staff) => (
                <button
                  key={staff.uid}
                  type="button"
                  onClick={() => handleDerive(staff)}
                  disabled={isSubmitting}
                  className="w-full text-left p-3 bg-white border border-ink-200 rounded-lg hover:border-primary-400 hover:bg-ink-50 flex items-center justify-between transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-800 truncate">
                      {staff.displayName || 'Sin nombre'}
                    </p>
                    {staff.email && (
                      <p className="text-xs text-ink-500 truncate">{staff.email}</p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-ink-400 flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </>
        )}

        <div className="pt-2 border-t border-ink-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full px-4 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Derivando...' : 'Cancelar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
