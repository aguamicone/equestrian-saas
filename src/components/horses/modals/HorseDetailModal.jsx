// src/components/horses/modals/HorseDetailModal.jsx
//
// Modal de detalle del caballo con tabs:
//   Tab 1: Info (datos básicos editables)
//   Tab 2: Plan + Finanzas (plan actual + cuenta corriente del caballo)
//
// Tabs 3-5 (Ubicación, Eventos, Rutinas) vienen en Tanda C.
//
// Decisión arquitectónica: para "Marcar como pagado" usamos el patrón
// double-entry: crear un PAYMENT doc nuevo + actualizar el cargo original.
// Esto da trazabilidad desde el día 1 para el módulo de Finanzas (Sprint 5).

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Save, Pencil, CheckCircle2, Clock, AlertCircle,
  TrendingUp, DollarSign, Package,
  MapPin, ArrowLeftRight, History, Home,
  Activity, Syringe, Stethoscope, Pill, CalendarCheck
} from 'lucide-react';
import { Modal, Badge, Tabs } from '../../ui';
import { useData } from '../../../context/DataContext';
import MarkAsPaidModal from './MarkAsPaidModal';
import GestionarPlanesModal from './GestionarPlanesModal';
import HealthRecordModal from '../../health/modals/HealthRecordModal';
import CreateHealthRecordModal from '../../health/modals/CreateHealthRecordModal';
import RegistrarCargoModal from './RegistrarCargoModal';

/**
 * Props:
 *   horse: documento del caballo
 *   onClose: () => void
 */
export default function HorseDetailModal({ horse, onClose }) {
  const { tenantUsers, finances, pricingPlans, updateRow, spaces, logs, horses } = useData();
  
  // Tanda D2: resolver versión live del caballo desde el context para evitar
  // prop stale (assignedPlanIds reactivo a onSnapshot). Patrón consistente con
  // GestionarPlanesModal. Fallback al prop si el caballo desaparece del context.
  const liveHorse = (horses || []).find(h => h.id === horse.id) || horse;
  
  const [activeTab, setActiveTab] = useState('info');
  const [chargeToMark, setChargeToMark] = useState(null); // cargo seleccionado para marcar pagado
  const [isGestionarPlanesOpen, setIsGestionarPlanesOpen] = useState(false);
  const [showRegistrarCargo, setShowRegistrarCargo] = useState(false);
  
  const [showHealthHistory, setShowHealthHistory] = useState(false);
  const [showCreateHealthRecord, setShowCreateHealthRecord] = useState(false);

  // ===== Resolver datos relacionados =====
  const owner = useMemo(() => {
    return (tenantUsers || []).find(u => (u.uid || u.id) === liveHorse.ownerId);
  }, [tenantUsers, liveHorse.ownerId]);

  const space = useMemo(() => {
    return (spaces || []).find(s => s.horseId === horse.id);
  }, [spaces, horse.id]);

  const currentPlans = useMemo(() => {
    const horsePlanIds = liveHorse.assignedPlanIds || [];
    return (pricingPlans || []).filter(p => horsePlanIds.includes(p.id));
  }, [pricingPlans, liveHorse.assignedPlanIds]);

  // ===== Cargos de este caballo =====
  const horseCharges = useMemo(() => {
    const charges = (finances || []).filter(f => f.horseId === horse.id);
    // Ordenar: pending/overdue primero, después paid; dentro de cada grupo por fecha desc
    return charges.sort((a, b) => {
      const aPending = a.status === 'pending' || a.status === 'overdue';
      const bPending = b.status === 'pending' || b.status === 'overdue';
      if (aPending !== bPending) return aPending ? -1 : 1;
      return (b.date || '').localeCompare(a.date || '');
    });
  }, [finances, horse.id]);

  // ===== Resumen financiero =====
  const financialSummary = useMemo(() => {
    let totalCharged = 0;
    let totalPaid = 0;
    let totalPending = 0;
    horseCharges.forEach(c => {
      const amount = Number(c.amount || 0);
      // Solo contamos los cargos (no los pagos, que también viven en FINANCES)
      // Un cargo es type='charge' o sin type (legacy). Un pago es type='payment'.
      if (c.type === 'payment') return;
      totalCharged += amount;
      if (c.status === 'paid') totalPaid += amount;
      else if (c.status === 'pending' || c.status === 'overdue') totalPending += amount;
    });
    return { totalCharged, totalPaid, totalPending };
  }, [horseCharges]);

  // ===== Tabs definition =====
  const pendingCount = horseCharges.filter(c =>
    (c.status === 'pending' || c.status === 'overdue') && c.type !== 'payment'
  ).length;

  const tabs = [
    { key: 'info', label: 'Info' },
    {
      key: 'finance',
      label: 'Plan y finanzas',
      count: pendingCount > 0 ? pendingCount : undefined
    },
    { key: 'location', label: 'Ubicación' },
    { key: 'sanidad', label: 'Sanidad' },
  ];

  return (
    <>
      <Modal isOpen={true} onClose={onClose} size="lg" hideDefaultHeader>
        {/* ===== Archived Banner ===== */}
        {liveHorse.archived === true && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2.5 text-amber-800 text-xs">
            <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
            <span className="flex-1 font-medium">Este caballo está archivado. Las acciones y la edición están deshabilitadas.</span>
          </div>
        )}

        {/* ===== Header ===== */}
        <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between bg-gradient-to-br from-sky-50 to-white">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-display text-xl font-medium flex-shrink-0">
              {liveHorse.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="font-display text-lg font-medium text-ink-900 truncate">
                  {liveHorse.name}
                </div>
                {liveHorse.status === 'mantenimiento' && (
                  <Badge variant="warning" size="xs">En mantenimiento</Badge>
                )}
                {liveHorse.archived === true && (
                  <Badge variant="neutral" size="xs">Archivado</Badge>
                )}
              </div>
              <div className="text-xs text-ink-500 truncate">
                {liveHorse.breed || 'Raza no especificada'} · {owner?.displayName || 'Sin dueño'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/80 text-ink-500 hover:text-ink-800 flex-shrink-0"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* ===== Tabs ===== */}
        <div className="px-6 pt-3 border-b border-ink-100">
          <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
        </div>

        {/* ===== Body ===== */}
        <div className="max-h-[60vh] overflow-y-auto">
          {activeTab === 'info' && (
            <InfoTab horse={liveHorse} owner={owner} space={space} updateRow={updateRow} isArchived={liveHorse.archived === true} />
          )}
          {activeTab === 'finance' && (
            <FinanceTab
              horse={liveHorse}
              charges={horseCharges}
              currentPlans={currentPlans}
              summary={financialSummary}
              onMarkAsPaid={setChargeToMark}
              isArchived={liveHorse.archived === true}
              onOpenGestionarPlanes={() => setIsGestionarPlanesOpen(true)}
              onOpenRegistrarCargo={() => setShowRegistrarCargo(true)}
            />
          )}
          {activeTab === 'location' && (
            <LocationTab horse={liveHorse} space={space} logs={logs} />
          )}
          {activeTab === 'sanidad' && (
            <SanidadTab 
              horse={liveHorse} 
              onViewFull={() => setShowHealthHistory(true)} 
              onAddRecord={() => setShowCreateHealthRecord(true)} 
              isArchived={liveHorse.archived === true}
            />
          )}
        </div>
      </Modal>

      {/* ===== Sub-modal para marcar pago ===== */}
      {chargeToMark && (
        <MarkAsPaidModal
          charge={chargeToMark}
          horse={liveHorse}
          onClose={() => setChargeToMark(null)}
          onSuccess={() => {
            // Se refresca solo vía snapshot en DataContext
            setChargeToMark(null);
          }}
        />
      )}

      {/* ===== Sub-modales de Sanidad ===== */}
      {showHealthHistory && (
        <HealthRecordModal horse={liveHorse} onClose={() => setShowHealthHistory(false)} />
      )}
      {showCreateHealthRecord && (
        <CreateHealthRecordModal horse={liveHorse} onClose={() => setShowCreateHealthRecord(false)} />
      )}

      {isGestionarPlanesOpen && (
        <GestionarPlanesModal
          isOpen={isGestionarPlanesOpen}
          onClose={() => setIsGestionarPlanesOpen(false)}
          horse={liveHorse}
        />
      )}

      {showRegistrarCargo && (
        <RegistrarCargoModal
          isOpen={showRegistrarCargo}
          onClose={() => setShowRegistrarCargo(false)}
          horse={liveHorse}
        />
      )}
    </>
  );
}

// ============================================================
// Tab 1: Info
// ============================================================
function InfoTab({ horse, owner, space, updateRow, isArchived }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: horse.name || '',
    breed: horse.breed || '',
    age: horse.age || '',
    color: horse.color || '',
    discipline: horse.discipline || '',
    notes: horse.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    // Restaurar valores originales
    setForm({
      name: horse.name || '',
      breed: horse.breed || '',
      age: horse.age || '',
      color: horse.color || '',
      discipline: horse.discipline || '',
      notes: horse.notes || '',
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await updateRow('HORSES', horse.id, {
        name: form.name.trim(),
        breed: form.breed.trim() || null,
        age: form.age === '' ? null : Number(form.age),
        color: form.color.trim() || null,
        discipline: form.discipline.trim() || null,
        notes: form.notes.trim() || null,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error guardando caballo:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-6 py-5">
      {/* Toolbar editar */}
      <div className="flex items-center justify-between mb-5">
        <div className="text-xs uppercase tracking-wider text-ink-500 font-medium">
          Datos del caballo
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            disabled={isArchived}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary-700 hover:bg-primary-50 disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          >
            <Pencil size={13} />
            Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-600 hover:bg-ink-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:bg-ink-200 disabled:text-ink-400"
            >
              <Save size={13} />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      {/* Grilla de campos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <Field
          label="Nombre"
          value={form.name}
          isEditing={isEditing}
          onChange={v => handleChange('name', v)}
          required
        />
        <Field
          label="Raza"
          value={form.breed}
          isEditing={isEditing}
          onChange={v => handleChange('breed', v)}
        />
        <Field
          label="Edad"
          value={form.age}
          isEditing={isEditing}
          onChange={v => handleChange('age', v)}
          type="number"
          suffix={form.age && !isEditing ? ' años' : ''}
        />
        <Field
          label="Color / pelaje"
          value={form.color}
          isEditing={isEditing}
          onChange={v => handleChange('color', v)}
        />
        <Field
          label="Disciplina"
          value={form.discipline}
          isEditing={isEditing}
          onChange={v => handleChange('discipline', v)}
        />
        <div /> {/* spacer */}
        <div className="sm:col-span-2">
          <Field
            label="Notas"
            value={form.notes}
            isEditing={isEditing}
            onChange={v => handleChange('notes', v)}
            multiline
          />
        </div>
      </div>

      {/* Info secundaria (no editable acá) */}
      <div className="mt-6 pt-5 border-t border-ink-100 space-y-3">
        <div className="text-xs uppercase tracking-wider text-ink-500 font-medium">
          Información adicional
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <div className="text-xs text-ink-500 mb-0.5">Dueño</div>
            <div className="text-ink-800">{owner?.displayName || 'Sin dueño'}</div>
          </div>
          <div>
            <div className="text-xs text-ink-500 mb-0.5">Ubicación</div>
            <div className="text-ink-800">{space?.name || 'Sin asignar'}</div>
          </div>
        </div>
        <div className="text-[11px] text-ink-500 italic leading-snug pt-1">
          El dueño y la ubicación se cambian desde otras pantallas (Caballerizas, Acciones del caballo).
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Tab 2: Plan + Finanzas
// ============================================================
function FinanceTab({ horse, charges, currentPlans = [], summary, onMarkAsPaid, isArchived, onOpenGestionarPlanes, onOpenRegistrarCargo }) {
  const formatCurrency = (n) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(n || 0);

  const visibleCharges = charges.filter(c => c.type !== 'payment' && c.category !== 'one-time');

  const oneTimeCharges = useMemo(() =>
    (charges || [])
      .filter(f => f.category === 'one-time')
      .sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [charges]
  );

  return (
    <div className="px-6 py-5 space-y-6">

      {/* ===== Sección Plan ===== */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wider text-ink-500 font-medium">
            Planes asignados
          </div>
          {!isArchived && currentPlans.length > 0 && (
            <button
              onClick={onOpenGestionarPlanes}
              className="text-xs font-medium text-primary-700 hover:text-primary-900"
            >
              Gestionar
            </button>
          )}
        </div>

        {currentPlans.length > 0 ? (
          <div className="space-y-3">
            {currentPlans.map(plan => (
              <div key={plan.id} className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-base font-medium text-primary-900">
                      {plan.name}
                    </div>
                    <div className="text-sm text-primary-700 mt-0.5">
                      {formatCurrency(plan.price)} / mes
                    </div>
                    {Array.isArray(plan.includes) && plan.includes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {plan.includes.map(srv => (
                          <Badge key={srv} variant="primary" size="sm">{srv}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex justify-end items-center text-xs font-medium text-ink-500 pt-1">
              Total mensual:
              <span className="font-mono text-sm text-ink-800 font-semibold ml-1.5">
                {formatCurrency(currentPlans.reduce((sum, p) => sum + (p.price || 0), 0))}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-ink-50 border border-dashed border-ink-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-ink-700">Sin planes asignados</div>
              <div className="text-xs text-ink-500 mt-0.5">
                Sin plan no se generan cargos mensuales automáticos
              </div>
            </div>
            {!isArchived && (
              <button
                onClick={onOpenGestionarPlanes}
                className="btn-secondary text-xs"
              >
                Asignar plan
              </button>
            )}
          </div>
        )}
      </section>

      {/* ===== Cargos únicos ===== */}
      <section>
        <div className="text-xs uppercase tracking-wider text-ink-500 font-medium mb-2">
          Cargos únicos
        </div>
        
        {oneTimeCharges.length === 0 ? (
          <div className="text-center py-6 text-sm text-ink-500 italic bg-ink-50 rounded-xl border border-dashed border-ink-200">
            Aún no se registraron cargos únicos para este caballo
          </div>
        ) : (
          <div className="border border-ink-100 rounded-xl divide-y divide-ink-100 overflow-hidden">
            {oneTimeCharges.slice(0, 5).map(charge => (
              <ChargeRow
                key={charge.id}
                charge={charge}
                onMarkAsPaid={() => onMarkAsPaid(charge)}
                formatCurrency={formatCurrency}
                isArchived={isArchived}
              />
            ))}
            {oneTimeCharges.length > 5 && (
              <div className="px-4 py-2 bg-surface-50 text-center text-[11px] text-ink-500 font-medium border-t border-ink-100">
                Mostrando últimos 5 cargos
              </div>
            )}
          </div>
        )}
      </section>

      {/* ===== Resumen financiero ===== */}
      <section>
        <div className="text-xs uppercase tracking-wider text-ink-500 font-medium mb-2">
          Resumen
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SummaryTile
            label="Total facturado"
            value={formatCurrency(summary.totalCharged)}
            icon={TrendingUp}
            color="ink"
          />
          <SummaryTile
            label="Pagado"
            value={formatCurrency(summary.totalPaid)}
            icon={CheckCircle2}
            color="success"
          />
          <SummaryTile
            label="Pendiente"
            value={formatCurrency(summary.totalPending)}
            icon={AlertCircle}
            color={summary.totalPending > 0 ? 'danger' : 'ink'}
          />
        </div>
      </section>

      {/* ===== Cuenta corriente ===== */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wider text-ink-500 font-medium">
            Cuenta corriente
          </div>
          {!isArchived && (
            <button
              onClick={onOpenRegistrarCargo}
              className="text-xs font-medium text-primary-700 hover:text-primary-900"
            >
              + Cargo
            </button>
          )}
        </div>

        {visibleCharges.length === 0 ? (
          <div className="text-center py-8 text-sm text-ink-500 italic bg-ink-50 rounded-xl">
            Este caballo no tiene movimientos registrados.
          </div>
        ) : (
          <div className="border border-ink-100 rounded-xl divide-y divide-ink-100 overflow-hidden">
            {visibleCharges.map(charge => (
              <ChargeRow
                key={charge.id}
                charge={charge}
                onMarkAsPaid={() => onMarkAsPaid(charge)}
                formatCurrency={formatCurrency}
                isArchived={isArchived}
              />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

// ============================================================
// Sub-componente: fila de cargo
// ============================================================
function ChargeRow({ charge, onMarkAsPaid, formatCurrency, isArchived }) {
  const isPending = charge.status === 'pending' || charge.status === 'overdue';

  const statusBadge = {
    paid: { variant: 'success', label: 'Pagado' },
    pending: { variant: 'gold', label: 'Pendiente' },
    overdue: { variant: 'danger', label: 'Vencido' },
  }[charge.status] || { variant: 'neutral', label: charge.status };

  return (
    <div className="px-4 py-3 flex items-center gap-3 hover:bg-ink-50/50 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="text-sm text-ink-900 font-medium truncate">
          {charge.description || charge.category || 'Cargo sin descripción'}
        </div>
        <div className="text-[11px] text-ink-500 mt-0.5">
          {charge.date || charge.createdAt || 'Sin fecha'}
        </div>
      </div>
      <div className="text-sm text-ink-900 font-medium tabular-nums flex-shrink-0">
        {formatCurrency(charge.amount)}
      </div>
      <Badge variant={statusBadge.variant} size="sm">
        {statusBadge.label}
      </Badge>
      {isPending && !isArchived && (
        <button
          onClick={onMarkAsPaid}
          className="text-xs font-medium text-primary-700 hover:text-primary-900 flex-shrink-0 ml-2"
        >
          Marcar pagado
        </button>
      )}
    </div>
  );
}

// ============================================================
// Sub-componente: campo editable
// ============================================================
function Field({ label, value, isEditing, onChange, type = 'text', multiline = false, required = false, suffix = '' }) {
  return (
    <div>
      <div className="text-xs text-ink-500 mb-1">
        {label} {required && <span className="text-danger-500">*</span>}
      </div>
      {isEditing ? (
        multiline ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            className="input-field resize-none text-sm"
            rows="2"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="input-field text-sm"
          />
        )
      ) : (
        <div className="text-sm text-ink-800">
          {value ? `${value}${suffix}` : <span className="text-ink-400 italic">Sin datos</span>}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sub-componente: KPI compacto del resumen
// ============================================================
function SummaryTile({ label, value, icon: Icon, color = 'ink' }) {
  const colors = {
    ink: 'bg-ink-50 text-ink-700',
    success: 'bg-success-50 text-success-700',
    danger: 'bg-danger-50 text-danger-700',
  }[color] || 'bg-ink-50 text-ink-700';

  return (
    <div className={`${colors} rounded-xl p-3`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-80">
        <Icon size={12} strokeWidth={2} />
        {label}
      </div>
      <div className="text-base font-display font-medium mt-1 tabular-nums">
        {value}
      </div>
    </div>
  );
}

// ============================================================
// Tab 3: Ubicación
// ============================================================
function LocationTab({ horse, space, logs }) {
  const navigate = useNavigate();

  const horseLogs = useMemo(() => {
    return (logs || [])
      .filter(l => l.horseId === horse.id && l.type === 'horse_moved')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, horse.id]);

  const displayLogs = horseLogs.slice(0, 5);

  const getSpaceIcon = (type) => {
    if (type === 'box') return <Package className="w-6 h-6" />;
    if (type === 'piquete' || type === 'corral') return <MapPin className="w-6 h-6" />;
    return <Home className="w-6 h-6" />;
  };

  return (
    <div className="px-6 py-5 space-y-6">
      {/* Current Space Card */}
      <div className="bg-white rounded-xl border border-ink-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 flex items-center justify-between border-b border-ink-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-ink-50 text-ink-600 flex items-center justify-center">
              {space ? getSpaceIcon(space.type) : <MapPin className="w-6 h-6" />}
            </div>
            <div>
              <div className="font-display font-medium text-ink-900 text-lg">
                {space ? space.name : 'Sin ubicación asignada'}
              </div>
              <div className="text-sm text-ink-500">
                {space?.sectorId ? `Sector: ${space.sectorId}` : 'Sector no especificado'}
              </div>
            </div>
          </div>
          {space && (
            <Badge variant={space.status === 'occupied' ? 'info' : 'warning'}>
              1 de {space.capacity || 1} ocupado
            </Badge>
          )}
        </div>
        <div className="px-5 py-3 bg-ink-50 flex justify-end">
          <button
            onClick={() => navigate('/tenant-admin/spaces')}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Ver en grid de espacios →
          </button>
        </div>
      </div>

      {/* Movement History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-ink-900">Últimos movimientos</h4>
          {horseLogs.length > 0 && (
            <span className="text-xs text-ink-500">
              {displayLogs.length} de {horseLogs.length}
            </span>
          )}
        </div>

        {horseLogs.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-ink-200 bg-ink-50/50">
            <History className="w-8 h-8 text-ink-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-ink-900">Sin movimientos registrados aún</p>
            <p className="text-xs text-ink-500 mt-1 max-w-xs mx-auto">
              El historial de cambios de box y piquete aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayLogs.map(log => (
              <MovementLogRow key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MovementLogRow({ log }) {
  const getTimeAgo = (isoString) => {
    if (!isoString) return 'Fecha desconocida';
    const diff = Date.now() - new Date(isoString).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Hace 1 día';
    return `Hace ${days} días`;
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-ink-100 bg-white hover:border-ink-200 transition-colors">
      <div className="w-10 h-10 rounded-full bg-ink-50 flex items-center justify-center text-ink-500 flex-shrink-0">
        <ArrowLeftRight className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink-900 truncate">
          {log.details || 'Movimiento registrado'}
        </div>
        <div className="text-xs text-ink-500 mt-0.5 truncate">
          {log.staffName ? `por ${log.staffName}` : 'Automático'}
        </div>
      </div>
      <div 
        className="text-xs font-medium text-ink-500 flex-shrink-0 whitespace-nowrap cursor-help"
        title={log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
      >
        {getTimeAgo(log.timestamp)}
      </div>
    </div>
  );
}

// ============================================================
// Tab 4: Sanidad
// ============================================================
function SanidadTab({ horse, onViewFull, onAddRecord, isArchived }) {
  const { getHealthRecordsByHorse, getHealthStatusByHorse } = useData();
  const records = getHealthRecordsByHorse(horse.id);
  const status = getHealthStatusByHorse(horse.id);

  const getTypeIcon = (type) => {
    switch(type) {
      case 'vacuna': return <Syringe className="w-5 h-5 text-emerald-500" />;
      case 'desparasitacion': return <Pill className="w-5 h-5 text-rose-500" />;
      case 'control_veterinario': return <Stethoscope className="w-5 h-5 text-sky-500" />;
      default: return <Activity className="w-5 h-5 text-ink-500" />;
    }
  };

  const getStatusBadge = (s) => {
    if (s === 'vencido') return <Badge variant="danger">Vencido</Badge>;
    if (s === 'proximo') return <Badge variant="warning">Próximo</Badge>;
    if (s === 'al_dia') return <Badge variant="success">Al día</Badge>;
    return <Badge variant="neutral">Sin registros</Badge>;
  };

  if (records.length === 0) {
    return (
      <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-6">
          <Activity className="w-10 h-10 text-rose-400" />
        </div>
        <h3 className="font-display text-xl font-medium text-ink-900 mb-2">
          Sin registros sanitarios
        </h3>
        <p className="text-sm text-ink-600 max-w-sm mb-6">
          Este caballo no tiene historial médico o de vacunación.
        </p>
        {!isArchived && (
          <button
            onClick={onAddRecord}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
          >
            Agregar primer registro
          </button>
        )}
      </div>
    );
  }

  const recentRecords = records.slice(0, 5);

  return (
    <div className="px-6 py-5 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-ink-900">Resumen sanitario</h3>
          {getStatusBadge(status)}
        </div>
        <button
          onClick={onViewFull}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Ver historia completa →
        </button>
      </div>

      <div className="space-y-3">
        {recentRecords.map(record => (
          <div key={record.id} className="flex items-center gap-4 p-4 rounded-xl border border-ink-100 bg-white hover:border-ink-200 transition-colors">
            <div className="w-10 h-10 rounded-full bg-ink-50 flex items-center justify-center flex-shrink-0">
              {getTypeIcon(record.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium text-ink-900 truncate capitalize">
                  {record.subtype || record.type.replace('_', ' ')}
                </div>
                <div className="text-xs text-ink-500 flex-shrink-0">
                  {new Date(record.date).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-ink-500 truncate">
                  {record.veterinarianName ? `Por ${record.veterinarianName}` : 'Registro manual'}
                </div>
                {record.nextDueDate && (
                  <div className="text-xs font-medium text-ink-600">
                    Vence: {new Date(record.nextDueDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {records.length > 5 && (
        <div className="text-center pt-2">
          <span className="text-xs text-ink-500">+ {records.length - 5} registros más en la historia completa</span>
        </div>
      )}
    </div>
  );
}
