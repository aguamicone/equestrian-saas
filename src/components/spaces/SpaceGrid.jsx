// src/components/spaces/SpaceGrid.jsx
// Componente principal de Caballerizas.
// Modo lectura por default. Toggle "Modo edición" para mover/liberar.
//
// NOTA 1.3b-i: Los modales todavía no están conectados.
//              Los clicks solo cambian estado interno, no abren nada.
//              Eso se completa en 1.3b-ii.

import { useState, useMemo } from 'react';
import {
  Plus, Pencil, X as XIcon, Sparkles, Boxes,
  Search, AlertCircle, CheckCircle2, Wrench
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { PageHeader, Card, Badge, EmptyState } from '../ui';
import BoxCell from './BoxCell';
import SpaceDetailModal from './modals/SpaceDetailModal';
import CreateSpaceModal from './modals/CreateSpaceModal';

// ====== Filtros disponibles ======
const FILTERS = [
  { key: 'all',         label: 'Todos' },
  { key: 'occupied',    label: 'Ocupados' },
  { key: 'available',   label: 'Libres' },
  { key: 'alert',       label: 'Atención' },
  { key: 'maintenance', label: 'Mantenimiento' },
];

export default function SpaceGrid() {
  const { spaces, horses, finances, tenantUsers, pricingPlans } = useData();

  const [editMode, setEditMode] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Estado para modales
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [modalType, setModalType] = useState(null); // 'detail' | 'assign' | 'move' | 'release' | 'create'

  // ====== Cálculos memoizados ======

  // Mapa horseId → horse para lookup rápido
  const horsesById = useMemo(() => {
    const map = {};
    horses.forEach(h => { map[h.id] = h; });
    return map;
  }, [horses]);

  // Mapa userId → user para lookup rápido del dueño
  const usersById = useMemo(() => {
    const map = {};
    (tenantUsers || []).forEach(u => {
      if (u.id) map[u.id] = u;
      if (u.uid) map[u.uid] = u;
    });
    return map;
  }, [tenantUsers]);

  // Mapa ownerId → debt
  const debtsByOwner = useMemo(() => {
    const map = {};
    finances.forEach(f => {
      if (f.status === 'pending' && f.clientId) {
        map[f.clientId] = (map[f.clientId] || 0) + f.amount;
      }
    });
    return map;
  }, [finances]);

  // Helper: determinar si un box tiene alerta
  // Por ahora: alerta = caballo con deuda. Más adelante puede incluir
  // vencimientos veterinarios, eventos especiales, etc.
  const getHasAlert = (space) => {
    if (space.status !== 'occupied' || !space.horseId) return false;
    const horse = horsesById[space.horseId];
    if (!horse) return false;
    return (debtsByOwner[horse.ownerId] || 0) > 0;
  };

  // KPIs
  const stats = useMemo(() => {
    const total = spaces.length;
    const occupied = spaces.filter(s => s.status === 'occupied').length;
    const available = spaces.filter(s => s.status === 'available').length;
    const maintenance = spaces.filter(s => s.status === 'maintenance').length;
    const alerts = spaces.filter(s => getHasAlert(s)).length;
    const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return { total, occupied, available, maintenance, alerts, pct };
  }, [spaces, horsesById, debtsByOwner]);

  // Spaces filtrados según filtro activo + búsqueda
  const filteredSpaces = useMemo(() => {
    let result = [...spaces];

    // Filtro por estado
    if (filter === 'occupied') {
      result = result.filter(s => s.status === 'occupied');
    } else if (filter === 'available') {
      result = result.filter(s => s.status === 'available');
    } else if (filter === 'maintenance') {
      result = result.filter(s => s.status === 'maintenance');
    } else if (filter === 'alert') {
      result = result.filter(s => getHasAlert(s));
    }

    // Búsqueda por nombre de box o caballo
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(s => {
        if (s.name.toLowerCase().includes(q)) return true;
        const horse = horsesById[s.horseId];
        if (horse && horse.name.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    // Ordenar por nombre (sortable: "Box 1" antes que "Box 10")
    result.sort((a, b) => {
      // Extraer número si existe, sino ordenar alfabético
      const aMatch = a.name.match(/(\d+)/);
      const bMatch = b.name.match(/(\d+)/);
      if (aMatch && bMatch) {
        return parseInt(aMatch[1]) - parseInt(bMatch[1]);
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [spaces, filter, search, horsesById]);

  // ====== Handlers ======

  const handleBoxClick = (space) => {
    if (editMode) {
      // En edit mode, click directo no hace nada (los 3 puntos abren acciones)
      return;
    }
    setSelectedSpace(space);
    if (space.status === 'occupied') {
      setModalType('detail');
    } else if (space.status === 'available') {
      setModalType('assign');
    }
    // 1.3b-ii conectará los modales reales
  };

  const handleBoxActionsClick = (space, event) => {
    // 1.3b-ii: acá va a abrir el menú de "Mover / Liberar / Mantenimiento"
    setSelectedSpace(space);
    setModalType('actions');
  };

  const handleCreateSpace = () => {
    setModalType('create');
  };

  // ====== Render ======

  return (
    <div>
      <PageHeader
        icon={Boxes}
        title="Caballerizas"
        subtitle={`${stats.total} espacios · ${stats.occupied} ocupados`}
        actions={
          <>
            <button
              onClick={() => setEditMode(!editMode)}
              className={editMode ? 'btn-primary' : 'btn-secondary'}
            >
              {editMode ? <XIcon size={16} /> : <Pencil size={16} />}
              {editMode ? 'Salir de edición' : 'Editar disposición'}
            </button>
            <button onClick={handleCreateSpace} className="btn-primary">
              <Plus size={16} /> Nuevo espacio
            </button>
          </>
        }
      />

      {/* ===== Banner de modo edición ===== */}
      {editMode && (
        <div className="mb-4 bg-gold-50 border border-gold-200 rounded-xl px-4 py-3 flex items-center gap-3 animate-fade-in">
          <Sparkles size={18} className="text-gold-600 flex-shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-medium text-gold-700">Modo edición activo.</span>
            <span className="text-ink-600 ml-1">
              Tocá el menú (⋮) de cada box ocupado para mover, liberar o cambiar a mantenimiento.
            </span>
          </div>
        </div>
      )}

      {/* ===== KPIs ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <KpiTile
          label="Ocupación"
          value={`${stats.pct}%`}
          accent="primary"
          subtitle={`${stats.occupied}/${stats.total}`}
        />
        <KpiTile
          label="Libres"
          value={stats.available}
          accent="success"
          subtitle={stats.available === 1 ? 'espacio disponible' : 'espacios disponibles'}
          icon={CheckCircle2}
        />
        <KpiTile
          label="Atención"
          value={stats.alerts}
          accent={stats.alerts > 0 ? 'gold' : 'neutral'}
          subtitle={stats.alerts === 1 ? 'box con alerta' : 'boxes con alerta'}
          icon={AlertCircle}
        />
        <KpiTile
          label="Mantenimiento"
          value={stats.maintenance}
          accent="neutral"
          subtitle="fuera de servicio"
          icon={Wrench}
        />
      </div>

      {/* ===== Toolbar: búsqueda + filtros ===== */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Búsqueda */}
        <div className="relative sm:max-w-xs flex-1">
          <Search size={15} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Buscar box o caballo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>

        {/* Filtros tipo chips */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => {
            const count = getCountForFilter(f.key, stats);
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                  flex items-center gap-1.5
                  ${isActive
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300 hover:bg-ink-50'
                  }
                `}
              >
                {f.label}
                <span className={`
                  text-[10px] px-1.5 rounded-full
                  ${isActive ? 'bg-white/25 text-white' : 'bg-ink-100 text-ink-600'}
                `}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== Grid de boxes ===== */}
      {filteredSpaces.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Boxes}
            message={
              search
                ? 'No se encontraron espacios'
                : filter === 'all'
                  ? 'Todavía no hay espacios creados'
                  : 'No hay espacios en esta categoría'
            }
            description={
              !search && filter === 'all'
                ? 'Creá el primer box para empezar a asignar caballos.'
                : null
            }
            action={
              !search && filter === 'all' ? (
                <button onClick={handleCreateSpace} className="btn-primary">
                  <Plus size={16} /> Nuevo espacio
                </button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredSpaces.map(space => {
            const horse = horsesById[space.horseId];
            const owner = horse?.ownerId ? usersById[horse.ownerId] : null;
            return (
              <BoxCell
                key={space.id}
                space={space}
                horse={horse}
                owner={owner}
                ownerDebt={
                  horse?.ownerId
                    ? debtsByOwner[horse.ownerId] || 0
                    : 0
                }
                editMode={editMode}
                hasAlert={getHasAlert(space)}
                onClick={() => handleBoxClick(space)}
                onActionsClick={(e) => handleBoxActionsClick(space, e)}
              />
            );
          })}
        </div>
      )}

      {/* ===== Modales del SpaceGrid ===== */}
      {modalType === 'detail' && selectedSpace && (
        (() => {
          const horse = horsesById[selectedSpace.horseId];
          const owner = horse?.ownerId ? usersById[horse.ownerId] : null;
          const ownerDebt = horse?.ownerId ? (debtsByOwner[horse.ownerId] || 0) : 0;
          // El caballo puede tener varios planes asignados; tomamos el primero
          // como "plan activo". Más adelante, si querés, agregamos lógica de
          // "plan principal" o "plan más reciente".
          const planId = horse?.assignedPlanIds?.[0];
          const pricingPlan = planId
            ? (pricingPlans || []).find(p => p.id === planId)
            : null;

          return (
            <SpaceDetailModal
              space={selectedSpace}
              horse={horse}
              owner={owner}
              ownerDebt={ownerDebt}
              pricingPlan={pricingPlan}
              onClose={() => {
                setSelectedSpace(null);
                setModalType(null);
              }}
            />
          );
        })()
      )}

      {modalType === 'create' && (
        <CreateSpaceModal
          onClose={() => {
            setSelectedSpace(null);
            setModalType(null);
          }}
          onCreated={() => {
            // El onSnapshot del DataContext va a refrescar la grilla automáticamente
          }}
        />
      )}
    </div>
  );
}

// ====== Sub-componente: KPI tile compacto ======
function KpiTile({ label, value, subtitle, accent = 'neutral', icon: Icon }) {
  const accentColors = {
    primary: 'bg-primary-50 border-primary-100 text-primary-700',
    success: 'bg-success-50 border-success-100 text-success-700',
    gold:    'bg-gold-50 border-gold-100 text-gold-700',
    danger:  'bg-danger-50 border-danger-100 text-danger-700',
    neutral: 'bg-ink-50 border-ink-100 text-ink-700',
  };

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${accentColors[accent]}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-80 mb-1">
        {Icon && <Icon size={11} strokeWidth={2} />}
        {label}
      </div>
      <div className="font-display text-xl font-medium leading-none">{value}</div>
      {subtitle && (
        <div className="text-[10px] opacity-70 mt-1 truncate">{subtitle}</div>
      )}
    </div>
  );
}

// ====== Helper: count para cada filtro chip ======
function getCountForFilter(key, stats) {
  switch (key) {
    case 'all':         return stats.total;
    case 'occupied':    return stats.occupied;
    case 'available':   return stats.available;
    case 'alert':       return stats.alerts;
    case 'maintenance': return stats.maintenance;
    default:            return 0;
  }
}
