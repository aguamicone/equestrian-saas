import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

/**
 * ConfirmDeleteModal - Confirmacion de eliminacion reutilizable
 *
 * Apoyado en Modal base. Diseñado para el patron mas comun del proyecto:
 * "Estas seguro de eliminar X?" -> [Cancelar] [Eliminar]
 *
 * Props:
 *   isOpen: boolean - controla visibilidad
 *   onClose: () => void - callback al cancelar o cerrar
 *   onConfirm: () => void | Promise - callback al confirmar eliminacion
 *   title: string - titulo del modal (default: "Confirmar eliminacion")
 *   message: string - pregunta principal
 *   description: string opcional - detalle adicional debajo de message
 *   itemName: string opcional - nombre del item a eliminar (se renderiza destacado)
 *   confirmLabel: string - texto del boton confirmar (default: "Eliminar")
 *   cancelLabel: string - texto del boton cancelar (default: "Cancelar")
 *   isDeleting: boolean - estado de loading (deshabilita botones)
 */
export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar eliminacion',
  message,
  description = null,
  itemName = null,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  isDeleting = false,
}) {
  const handleConfirm = async () => {
    if (isDeleting) return;
    await onConfirm();
  };

  const footer = (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        disabled={isDeleting}
        className="px-4 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isDeleting}
        className="px-4 py-2 text-sm font-medium text-white bg-danger-600 rounded-lg hover:bg-danger-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
      >
        {isDeleting ? 'Eliminando...' : confirmLabel}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={footer}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-danger-50 flex items-center justify-center">
          <AlertTriangle size={20} className="text-danger-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ink-800">{message}</p>
          {itemName && (
            <p className="text-sm font-medium text-ink-900 mt-1 truncate">
              {itemName}
            </p>
          )}
          {description && (
            <p className="text-xs text-ink-500 mt-2">{description}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
