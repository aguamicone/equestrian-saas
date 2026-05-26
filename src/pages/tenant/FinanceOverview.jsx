import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { DollarSign, TrendingUp, TrendingDown, Plus, Edit, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import EditChargeModal from '../../components/finanzas/modals/EditChargeModal';
import { Card, PageHeader, Tabs, Badge, EmptyState, Modal } from '../../components/ui';
import GenerarCargosMensualesModal from '../../components/finanzas/modals/GenerarCargosMensualesModal';
import PricingPlanModal from '../../components/finanzas/modals/PricingPlanModal';
import MarkAsPaidModal from '../../components/horses/modals/MarkAsPaidModal';

export default function FinanceOverview() {
    const { finances, pricingPlans, tenantUsers, deletePendingCharge } = useData();
    const [activeTab, setActiveTab] = useState('overview');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [showGenerarCargos, setShowGenerarCargos] = useState(false);
    const [showRegistrarCobroGlobal, setShowRegistrarCobroGlobal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [chargeToMark, setChargeToMark] = useState(null);
    const [chargeToEdit, setChargeToEdit] = useState(null);

    const handleDeleteCharge = async (charge) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar este cargo pendiente de $${charge.amount}?`)) {
            await deletePendingCharge(charge.id);
        }
    };

    // Calculations
    const income = useMemo(() => 
        finances.filter(f => f.type === 'income')
               .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
    , [finances]);

    const expenses = useMemo(() => 
        finances.filter(f => f.type === 'expense')
               .reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
    , [finances]);

    const balance = income - expenses;

    const handleOpenModal = (plan = null) => {
        setEditingPlan(plan);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPlan(null);
    };

    const tabsConfig = [
        { key: 'overview', label: 'Resumen' },
        { key: 'pricing', label: 'Planes de Precio' }
    ];

    return (
        <div className="space-y-8">
            <PageHeader 
                title="Vista Financiera" 
                subtitle="Gestión de ingresos, egresos y facturación del haras."
                actions={
                    <div className="flex flex-wrap gap-3">
                        <button 
                            onClick={() => setShowRegistrarCobroGlobal(true)}
                            className="btn-secondary flex items-center gap-2 font-bold"
                        >
                            <DollarSign size={18} />
                            Registrar cobro manual
                        </button>
                        <button 
                            onClick={() => setShowGenerarCargos(true)}
                            className="btn-primary flex items-center gap-2 font-bold"
                        >
                            <Calendar size={18} />
                            Generar cargos del mes
                        </button>
                    </div>
                }
            />

            <Tabs 
                tabs={tabsConfig} 
                value={activeTab} 
                onChange={setActiveTab} 
            />

            {activeTab === 'overview' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card variant="default" className="flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-ink-500 mb-1">Ingresos Totales</div>
                                    <div className="text-3xl font-bold text-success-700">+${income.toLocaleString()}</div>
                                </div>
                                <div className="p-3 bg-success-50 rounded-full text-success-600 border border-success-100">
                                    <TrendingUp size={24} />
                                </div>
                            </div>
                        </Card>

                        <Card variant="default" className="flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-ink-500 mb-1">Gastos Totales</div>
                                    <div className="text-3xl font-bold text-danger-700">-${expenses.toLocaleString()}</div>
                                </div>
                                <div className="p-3 bg-danger-50 rounded-full text-danger-600 border border-danger-100">
                                    <TrendingDown size={24} />
                                </div>
                            </div>
                        </Card>

                        <Card variant="default" className="flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-medium text-ink-500 mb-1">Balance Neto</div>
                                    <div className={`text-3xl font-bold ${balance >= 0 ? 'text-primary-700' : 'text-danger-700'}`}>
                                        ${balance.toLocaleString()}
                                    </div>
                                </div>
                                <div className={`p-3 rounded-full border ${balance >= 0 ? 'bg-primary-50 text-primary-600 border-primary-100' : 'bg-danger-50 text-danger-600 border-danger-100'}`}>
                                    <DollarSign size={24} />
                                </div>
                            </div>
                        </Card>
                    </div>


                    <Card padding="none" className="overflow-hidden border-ink-200">
                        <div className="p-4 border-b border-ink-200 font-bold text-lg text-ink-900 bg-ink-50">
                            Transacciones Recientes
                        </div>
                        {finances.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-ink-50 text-ink-500 border-b border-ink-200">
                                        <tr>
                                            <th className="p-4 font-medium text-sm">Fecha</th>
                                            <th className="p-4 font-medium text-sm">Descripción</th>
                                            <th className="p-4 font-medium text-sm">Categoría</th>
                                            <th className="p-4 font-medium text-sm text-right">Monto</th>
                                            <th className="p-4 font-medium text-sm text-center">Estado</th>
                                            <th className="p-4 font-medium text-sm text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ink-100 text-ink-900">
                                        {[...finances].sort((a, b) => b.date.localeCompare(a.date)).map(item => {
                                            const isIncome = item.type === 'income';
                                            const isPayment = item.type === 'payment';
                                            const isPending = item.status === 'pending' || item.status === 'overdue';

                                            let statusBadge = null;
                                            if (isIncome) {
                                                statusBadge = isPending 
                                                    ? <Badge variant="gold">Pendiente</Badge>
                                                    : <Badge variant="success">Cobrado</Badge>;
                                            } else if (isPayment) {
                                                statusBadge = <Badge variant="success">Pago Recibido</Badge>;
                                            } else {
                                                statusBadge = <Badge variant="neutral">Pagado</Badge>;
                                            }

                                            return (
                                                <tr key={item.id} className="hover:bg-ink-50/50 transition-colors">
                                                    <td className="p-4 text-sm text-ink-500">{item.date}</td>
                                                    <td className="p-4 font-medium">{item.description}</td>
                                                    <td className="p-4">
                                                        <Badge variant="neutral">{item.category}</Badge>
                                                    </td>
                                                    <td className={`p-4 text-right font-bold font-mono text-base ${isIncome || isPayment ? 'text-success-700' : 'text-danger-700'}`}>
                                                        {isIncome || isPayment ? '+' : '-'}${item.amount.toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {statusBadge}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {isIncome && isPending ? (
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => setChargeToMark(item)}
                                                                    className="text-xs text-primary-750 font-bold hover:underline bg-primary-50/50 hover:bg-primary-50 px-2.5 py-1.5 rounded-md border border-primary-200 transition-all whitespace-nowrap"
                                                                >
                                                                    Registrar Pago
                                                                </button>
                                                                <button
                                                                    onClick={() => setChargeToEdit(item)}
                                                                    className="p-1.5 text-ink-400 hover:text-ink-700 hover:bg-ink-100 rounded-md transition-colors"
                                                                    title="Editar Cargo"
                                                                >
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteCharge(item)}
                                                                    className="p-1.5 text-ink-400 hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors"
                                                                    title="Eliminar Cargo"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-ink-400 italic">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8">
                                <EmptyState 
                                    icon={<DollarSign size={40} className="text-ink-300" />}
                                    title="No hay transacciones"
                                    description="Aún no hay ingresos ni egresos registrados en el sistema."
                                />
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {activeTab === 'pricing' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
                            <Plus size={18} /> Crear Nuevo Plan
                        </button>
                    </div>

                    <Card padding="none" className="overflow-hidden border-ink-200">
                        {pricingPlans.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-ink-50 text-ink-500 border-b border-ink-200">
                                        <tr>
                                            <th className="p-4 font-medium text-sm">Nombre del Plan</th>
                                            <th className="p-4 font-medium text-sm">Tipo</th>
                                            <th className="p-4 font-medium text-sm">Frecuencia</th>
                                            <th className="p-4 font-medium text-sm">Precio</th>
                                            <th className="p-4 font-medium text-sm text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ink-100 text-ink-900">
                                        {pricingPlans.map(plan => (
                                            <tr key={plan.id} className="hover:bg-ink-50/50 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-ink-900">{plan.name}</div>
                                                    <div className="text-xs text-ink-500">{plan.description}</div>
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant={plan.type === 'membership' ? 'primary' : 'sky'}>
                                                        {plan.type === 'membership' ? 'Membresía' : 'Servicio'}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-sm text-ink-700 capitalize">{plan.frequency === 'monthly' ? 'Mensual' : 'Pago Único'}</td>
                                                <td className="p-4 font-mono text-primary-700 font-bold">${plan.price.toLocaleString()}</td>
                                                <td className="p-4 text-right">
                                                    <button 
                                                        onClick={() => handleOpenModal(plan)} 
                                                        className="p-2 hover:bg-ink-100 rounded-lg text-ink-500 hover:text-ink-900 transition-colors inline-flex items-center justify-center"
                                                        title="Editar Plan"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8">
                                <EmptyState 
                                    icon={<DollarSign size={40} className="text-ink-300" />}
                                    title="No hay planes configurados"
                                    description="Crea tu primer plan de precios para comenzar a facturar servicios y membresías."
                                    action={{
                                        label: 'Crear Plan',
                                        onClick: () => handleOpenModal()
                                    }}
                                />
                            </div>
                        )}
                    </Card>
                </div>
            )}

            <PricingPlanModal 
                isOpen={showModal} 
                onClose={handleCloseModal} 
                plan={editingPlan} 
            />

            <GenerarCargosMensualesModal 
                isOpen={showGenerarCargos} 
                onClose={() => setShowGenerarCargos(false)} 
            />

            <RegistrarCobroGlobalModal 
                isOpen={showRegistrarCobroGlobal} 
                onClose={() => setShowRegistrarCobroGlobal(false)} 
            />

            {chargeToMark && (
                <MarkAsPaidModal 
                    charge={chargeToMark}
                    onClose={() => setChargeToMark(null)}
                />
            )}

            <EditChargeModal
                isOpen={!!chargeToEdit}
                onClose={() => setChargeToEdit(null)}
                charge={chargeToEdit}
            />
        </div>
    );
}

// ===== SUB-COMPONENTE: MODAL GLOBAL DE COBRO =====
function RegistrarCobroGlobalModal({ isOpen, onClose }) {
    const { tenantUsers, finances, settleMultiplePendingCharges } = useData();
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedChargeIds, setSelectedChargeIds] = useState([]);
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Filtrar clientes que tienen deuda pendiente
    const debtors = useMemo(() => {
        const pending = finances.filter(f => f.type === 'income' && (f.status === 'pending' || f.status === 'overdue'));
        const debtorIds = new Set(pending.map(p => p.clientId).filter(Boolean));
        return tenantUsers.filter(u => debtorIds.has(u.uid));
    }, [tenantUsers, finances]);

    const pendingChargesForSelected = useMemo(() => {
        if (!selectedClientId) return [];
        return finances
            .filter(f => f.clientId === selectedClientId && f.type === 'income' && (f.status === 'pending' || f.status === 'overdue'))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [selectedClientId, finances]);

    const handleClientChange = (e) => {
        setSelectedClientId(e.target.value);
        setSelectedChargeIds([]);
        setError(null);
    };

    const toggleCharge = (id) => {
        setSelectedChargeIds(prev => 
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedChargeIds.length === pendingChargesForSelected.length) {
            setSelectedChargeIds([]);
        } else {
            setSelectedChargeIds(pendingChargesForSelected.map(c => c.id));
        }
    };

    const handleConfirm = async () => {
        if (selectedChargeIds.length === 0) return;
        setSaving(true);
        setError(null);
        try {
            const res = await settleMultiplePendingCharges(selectedChargeIds, note);
            if (res.success) {
                onClose();
            } else {
                setError(res.error || 'Ocurrió un error al registrar los cobros.');
            }
        } catch (err) {
            console.error(err);
            setError('Error al registrar cobros.');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (n) =>
        new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
        }).format(n || 0);

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={saving ? undefined : onClose} title="Registrar Cobro Manual" size="md">
            <div className="space-y-4 py-2 text-ink-900">
                {error && (
                    <div className="bg-danger-50 border border-danger-200 text-danger-900 px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                {/* Seleccionar Cliente */}
                <div>
                    <label className="block text-sm font-semibold text-ink-800 mb-1.5">
                        Seleccionar Cliente Deudor
                    </label>
                    <select
                        value={selectedClientId}
                        onChange={handleClientChange}
                        className="input-field"
                        disabled={saving}
                    >
                        <option value="">-- Seleccionar deudor --</option>
                        {debtors.map(client => {
                            const clientDebt = finances
                                .filter(f => f.clientId === client.uid && f.type === 'income' && (f.status === 'pending' || f.status === 'overdue'))
                                .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
                            return (
                                <option key={client.uid} value={client.uid}>
                                    {client.displayName} (Deuda: {formatCurrency(clientDebt)})
                                </option>
                            );
                        })}
                    </select>
                </div>

                {selectedClientId && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs uppercase tracking-wider text-ink-500 font-medium pt-1">
                            <span>Conceptos Pendientes</span>
                            {pendingChargesForSelected.length > 0 && (
                                <button type="button" onClick={selectAll} className="text-primary-750 hover:text-primary-800 font-semibold hover:underline">
                                    {selectedChargeIds.length === pendingChargesForSelected.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                </button>
                            )}
                        </div>

                        {pendingChargesForSelected.length === 0 ? (
                            <div className="text-center py-6 text-sm text-ink-500 italic bg-ink-50 rounded-xl border border-dashed border-ink-200">
                                El cliente no posee deudas pendientes.
                            </div>
                        ) : (
                            <div className="border border-ink-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-ink-100 bg-white">
                                {pendingChargesForSelected.map(charge => {
                                    const isChecked = selectedChargeIds.includes(charge.id);
                                    return (
                                        <label
                                            key={charge.id}
                                            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-ink-50/50 transition-colors ${isChecked ? 'bg-primary-50/20' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => toggleCharge(charge.id)}
                                                className="w-4 h-4 text-primary-600 rounded border-ink-300 focus:ring-primary-500"
                                                disabled={saving}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-medium text-ink-900 truncate">
                                                    {charge.description || charge.category}
                                                </div>
                                                <div className="text-[11px] text-ink-500">
                                                    {charge.date}
                                                </div>
                                            </div>
                                            <div className="text-sm font-bold text-ink-800 tabular-nums">
                                                {formatCurrency(charge.amount)}
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Nota opcional */}
                {selectedChargeIds.length > 0 && (
                    <div>
                        <label className="block text-xs font-semibold text-ink-600 uppercase tracking-wider mb-1.5">
                            Nota del pago <span className="text-ink-400 font-normal lowercase tracking-normal">(opcional)</span>
                        </label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            className="input-field resize-none text-sm"
                            rows="2"
                            placeholder="Ej: Recibido efectivo en administración, transferencia, etc."
                            disabled={saving}
                        />
                      </div>
                  )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-ink-100 mt-4 bg-ink-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                  <button
                      onClick={onClose}
                      disabled={saving}
                      className="btn-secondary"
                  >
                      Cancelar
                  </button>
                  <button
                      onClick={handleConfirm}
                      disabled={saving || selectedChargeIds.length === 0}
                      className="btn-primary"
                  >
                      {saving ? 'Registrando...' : `Confirmar cobro (${selectedChargeIds.length})`}
                  </button>
              </div>
          </Modal>
      );
  }

