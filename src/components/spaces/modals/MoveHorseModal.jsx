// src/components/spaces/modals/MoveHorseModal.jsx
// Modal para mover un caballo de un box/piquete a otro.
// Lista todos los espacios disponibles agrupados: primero libres, luego ocupados.
// Si el destino está ocupado, se hace un enroque automático.

import { useState, useMemo } from 'react';
import {
  X, ArrowRightLeft, Search, CheckCircle2,
  AlertTriangle, Info
} from 'lucide-react';
import { Modal, Badge } from '../../ui';
import { useData } from '../../../context/DataContext';

/**
 * Props:
 *   fromSpace: documento del espacio actual del caballo (origen)
 *   horse: documento del caballo a mover
 *   onClose: () => void
 *   onMoved: () => void
 */
export default function MoveHorseModal({ fromSpace, horse, onClose, onMoved }) {
  const { spaces, horses, moveHorseToSpace } = useData();

  const [selectedSpaceId, setSelectedSpaceId] = useState(null);
  const [search, setSearch] = useState('');
  const [confirming, setConfirming] = useState(false);

  // Mapa horseId → horse para mostrar nombres en boxes ocupados
  const horsesById = useMemo(() => {
    const map = {};
    horses.forEach(h => { map[h.id] = h; });
    return map;
  }, [horses]);

  // Filtrar espacios candidatos: todos menos el actual, y NO los de mantenimiento
  const candidates = useMemo(() => {
    let result = spaces.filter(s => s.id !== fromSpace.id && s.status !== 'maintenance');

    // Filtrar por búsqueda
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(s => {
        if (s.name.toLowerCase().includes(q)) return true;
        const occupiedHorse = horsesById[s.horseId];
        if (occupiedHorse?.name?.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    // Ordenar: libres primero, después ocupados; dentro de cada grupo por número
    return result.sort((a, b) => {
      // Primero por estado (available antes que occupied)
      if (a.status !== b.status) {
        return a.status === 'available' ? -1 : 1;
      }
      // Después por número en el nombre
      const aNum = parseInt(a.name.match(/\d+/)?.[0] || '999');
      const bNum = parseInt(b.name.match(/\d+/)?.[0] || '999');
      return aNum - bNum;
    });
  }, [spaces, fromSpace.id, search, horsesById]);

  const availableCount = candidates.filter(s => s.status === 'available').length;
  const occupiedCount = candidates.filter(s => s.status === 'occupied').length;

  const selectedSpace = candidates.find(s => s.id === selectedSpaceId);
  const isSwap = selectedSpace?.status === 'occupied';
  const swapHorse = isSwap ? horsesById[selectedSpace.horseId] : null;

  const handleConfirm = async () => {
    if (!selectedSpaceId) return;
    setConfirming(true);
    try {
      const result = await moveHorseToSpace(horse.id, fromSpace.id, selectedSpaceId);
      if (result?.success) {
        onMoved?.();
        onClose();
      }
    } catch (err) {
      console.error('Error moviendo caballo:', err);
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
            <ArrowRightLeft size={18} className="text-primary-600" />
            Mover caballo
          </div>
          <div className="text-xs text-ink-500 mt-0.5">
            {horse.name} · desde {fromSpace.name}
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

        {/* Búsqueda */}
        <div className="relative">
          <Search size={15} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Buscar espacio o caballo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
            autoFocus
          />
        </div>

        {/* Contadores */}
        <div className="text-xs text-ink-500 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={11} className="text-success-600" />
            {availableCount} {availableCount === 1 ? 'libre' : 'libres'}
          </span>
          <span className="flex items-center gap-1">
            <AlertTriangle size={11} className="text-gold-600" />
            {occupiedCount} {occupiedCount === 1 ? 'ocupado' : 'ocupados'} (con enroque)
          </span>
        </div>

        {/* Lista de destinos */}
        <div className="max-h-[40vh] overflow-y-auto -mx-2 px-2 space-y-1.5">
          {candidates.length === 0 ? (
            <div className="text-center py-8 text-sm text-ink-500">
              No hay espacios disponibles para mover.
            </div>
          ) : (
            candidates.map(s => {
              const isSelected = s.id === selectedSpaceId;
              const occupiedHorse = horsesById[s.horseId];
              const isAvail = s.status === 'available';
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSpaceId(s.id)}
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

                    {/* Info del espacio */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink-900 text-sm truncate">
                          {s.name}
                        </span>
                        <span className="text-[9px] tracking-wider uppercase text-ink-500 flex-shrink-0">
                          {s.type}
                        </span>
                      </div>
                      {!isAvail && occupiedHorse && (
                        <div className="text-xs text-ink-600 mt-0.5 truncate">
                          Ocupado por <span className="font-medium">{occupiedHorse.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Badge de estado */}
                    {isAvail ? (
                      <Badge variant="success">Libre</Badge>
                    ) : (
                      <Badge variant="gold">Enroque</Badge>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Aviso de enroque cuando se selecciona un ocupado */}
        {isSwap && swapHorse && (
          <div className="bg-gold-50 border border-gold-200 rounded-xl p-3 flex items-start gap-2.5">
            <Info size={15} className="text-gold-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-ink-700 leading-snug">
              <span className="font-medium">Enroque automático:</span> {' '}
              <span className="text-ink-800">{horse.name}</span> se moverá a {selectedSpace.name},
              y <span className="text-ink-800">{swapHorse.name}</span> volverá a {fromSpace.name}.
              Se notificará a ambos dueños del cambio.
            </div>
          </div>
        )}

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
          disabled={!selectedSpaceId || confirming}
          className={`
            inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm
            transition-colors
            ${selectedSpaceId
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-ink-200 text-ink-400 cursor-not-allowed'
            }
          `}
        >
          {confirming ? (
            'Procesando...'
          ) : isSwap ? (
            <>
              <ArrowRightLeft size={14} />
              Confirmar enroque
            </>
          ) : (
            <>
              <CheckCircle2 size={14} />
              Confirmar movimiento
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}
