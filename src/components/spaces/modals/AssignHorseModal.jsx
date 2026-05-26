import { useState, useMemo } from 'react';
import { X, Search, CheckCircle2, User } from 'lucide-react';
import { Modal } from '../../ui';
import { useData } from '../../../context/DataContext';

export default function AssignHorseModal({ space, onClose }) {
  const { spaces, horses, assignExistingHorseToSpace } = useData();

  const [selectedHorseId, setSelectedHorseId] = useState(null);
  const [search, setSearch] = useState('');
  const [confirming, setConfirming] = useState(false);

  // 1. Filtrar caballos que no están en ningún box/piquete ocupado
  const availableHorses = useMemo(() => {
    // Todos los IDs de caballos que ocupan algún espacio
    const occupiedHorseIds = new Set(spaces.map(s => s.horseId).filter(Boolean));

    // Filtrar caballos activos (no archivados) que no están en el set de ocupados
    let list = horses.filter(h => !h.archived && !occupiedHorseIds.has(h.id));

    // Filtrar por búsqueda
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(h => h.name.toLowerCase().includes(q) || (h.breed && h.breed.toLowerCase().includes(q)));
    }

    // Ordenar alfabéticamente por nombre
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [spaces, horses, search]);

  const handleConfirm = async () => {
    if (!selectedHorseId || !space) return;
    setConfirming(true);
    try {
      const result = await assignExistingHorseToSpace(space.id, selectedHorseId);
      if (result?.success) {
        onClose();
      }
    } catch (err) {
      console.error('Error asignando caballo:', err);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={confirming ? undefined : onClose} size="md" hideDefaultHeader>
      {/* Header */}
      <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between bg-gradient-to-br from-primary-50 to-white">
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-medium text-ink-900 flex items-center gap-2">
            <User size={18} className="text-primary-600" />
            Asignar caballo a espacio
          </div>
          <div className="text-xs text-ink-500 mt-0.5">
            Espacio seleccionado: <strong className="text-ink-800">{space?.name}</strong> ({space?.type})
          </div>
        </div>
        <button
          onClick={onClose}
          disabled={confirming}
          className="p-1.5 rounded-md hover:bg-white/80 text-ink-500 hover:text-ink-800 flex-shrink-0 disabled:opacity-40"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      </div>

      <div className="px-6 py-4 space-y-3">
        {/* Buscador */}
        <div className="relative">
          <Search size={15} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Buscar caballo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
            autoFocus
            disabled={confirming}
          />
        </div>

        {/* Lista de caballos sin asignar */}
        <div className="max-h-[40vh] overflow-y-auto -mx-2 px-2 space-y-1.5">
          {availableHorses.length === 0 ? (
            <div className="text-center py-8 text-sm text-ink-500">
              No hay caballos disponibles para asignar.
            </div>
          ) : (
            availableHorses.map(h => {
              const isSelected = h.id === selectedHorseId;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedHorseId(h.id)}
                  disabled={confirming}
                  className={`
                    w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all
                    ${isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-ink-200 bg-white hover:border-ink-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Radio circle */}
                    <div className={`
                      w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                      ${isSelected ? 'border-primary-500 bg-primary-500' : 'border-ink-300'}
                    `}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-ink-900 text-sm truncate">
                        {h.name}
                      </div>
                      {h.breed && (
                        <div className="text-xs text-ink-500 truncate">
                          Raza: {h.breed} {h.age ? `· ${h.age} años` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-ink-100 bg-ink-50/50 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
        <button
          onClick={onClose}
          className="btn-secondary"
          disabled={confirming}
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedHorseId || confirming}
          className={`
            inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm
            transition-colors
            ${selectedHorseId
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-ink-200 text-ink-400 cursor-not-allowed'
            }
          `}
        >
          {confirming ? 'Procesando...' : (
            <>
              <CheckCircle2 size={14} />
              Confirmar asignación
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}
