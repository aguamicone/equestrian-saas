import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PageHeader, Card, Modal } from '../../components/ui';
import MarkAsPaidModal from '../../components/horses/modals/MarkAsPaidModal';

export default function DebtorsDashboard() {
    const { finances, tenantUsers } = useData();
    const [chargeToPay, setChargeToPay] = useState(null);
    const [bulkPayClient, setBulkPayClient] = useState(null);

    // Filter pending
    const pending = finances.filter(f => f.type === 'income' && (f.status === 'pending' || f.status === 'overdue'));

    // Group by Client
    const debtorsMap = {};
    pending.forEach(tx => {
        if (!debtorsMap[tx.clientId]) {
            debtorsMap[tx.clientId] = { amount: 0, items: [], name: 'Cargos Pendientes' };
        }
        debtorsMap[tx.clientId].amount += tx.amount;
        debtorsMap[tx.clientId].items.push(tx);
    });

    const getUserName = (uid) => {
        const user = tenantUsers.find(u => u.uid === uid);
        return user ? user.displayName : uid.replace('user-', '').toUpperCase();
    };

    return (
        <div className="space-y-6 pb-20">
            <PageHeader 
                kicker="Finanzas"
                title="Reporte de Deudores"
                subtitle="Control de cuentas con saldos deudores y alertas de cobro"
                icon={DollarSign}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
                {Object.keys(debtorsMap).length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white border border-ink-200 rounded-2xl shadow-sm max-w-lg mx-auto flex flex-col items-center justify-center">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-success-600 mb-4" />
                        <h3 className="text-lg font-bold text-ink-900">¡Al día!</h3>
                        <p className="text-ink-500 text-sm mt-1">No hay deudas pendientes en este momento.</p>
                    </div>
                )}

                {Object.entries(debtorsMap).map(([clientId, data]) => {
                    const clientName = getUserName(clientId);
                    return (
                        <Card key={clientId} padding="normal" className="border-ink-200 bg-white shadow-sm relative overflow-hidden transition-all duration-200 hover:border-ink-300 flex flex-col justify-between">
                            <div>
                                <div className="absolute top-0 right-0 p-3 opacity-[0.03] pointer-events-none">
                                    <AlertCircle size={80} className="text-danger-500" />
                                </div>

                                <h3 className="font-bold text-lg text-ink-900 mb-1 leading-snug">{clientName}</h3>
                                <p className="text-ink-450 text-xs font-bold uppercase tracking-wider mb-4">Cliente</p>

                                <div className="mb-6 bg-danger-50/50 border border-danger-100 p-4 rounded-xl">
                                    <div className="text-3xl font-black text-danger-700">${data.amount.toLocaleString()}</div>
                                    <div className="text-[10px] text-danger-600 uppercase font-bold tracking-wider mt-0.5">Deuda Acumulada</div>
                                </div>

                                <div className="space-y-2 border-t border-ink-150 pt-4">
                                    <div className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1">Conceptos Pendientes</div>
                                    {data.items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center text-sm py-1.5 border-b border-ink-50 last:border-0">
                                            <span className="text-ink-600 font-medium truncate pr-2">{item.description}</span>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="text-ink-900 font-semibold font-mono">${item.amount.toLocaleString()}</span>
                                                <button 
                                                    onClick={() => setChargeToPay(item)}
                                                    className="text-xs text-primary-700 hover:text-primary-900 font-bold hover:underline"
                                                >
                                                    Cobrar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-6 pt-2 border-t border-ink-100">
                                <button className="btn-secondary text-xs py-2 font-bold transition-all w-full">
                                    Recordar
                                </button>
                                <button 
                                    onClick={() => setBulkPayClient({ id: clientId, name: clientName, charges: data.items })}
                                    className="btn-primary text-xs py-2 font-bold transition-all w-full flex items-center justify-center gap-1"
                                >
                                    Cobrar Todo
                                </button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Modal para cobrar un cargo individual */}
            {chargeToPay && (
                <MarkAsPaidModal 
                    charge={chargeToPay}
                    onClose={() => setChargeToPay(null)}
                />
            )}

            {/* Modal para cobrar deuda total */}
            {bulkPayClient && (
                <ConfirmBulkPaymentModal 
                    clientName={bulkPayClient.name}
                    charges={bulkPayClient.charges}
                    onClose={() => setBulkPayClient(null)}
                />
            )}
        </div>
    );
}

// ===== SUB-COMPONENTE: MODAL DE CONFIRMACIÓN DE COBRO GRUPAL =====
function ConfirmBulkPaymentModal({ clientName, charges, onClose }) {
    const { settleMultiplePendingCharges } = useData();
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const totalAmount = charges.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const handleConfirm = async () => {
        setSaving(true);
        setError(null);
        try {
            const res = await settleMultiplePendingCharges(charges.map(c => c.id), note);
            if (res.success) {
                onClose();
            } else {
                setError(res.error || 'No se pudieron registrar los pagos.');
            }
        } catch (err) {
            console.error(err);
            setError('Error al registrar cobros.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={saving ? undefined : onClose} title="Cobrar Deuda Total" size="sm">
            <div className="space-y-4 py-2 text-ink-900">
                {error && (
                    <div className="bg-danger-50 border border-danger-200 text-danger-900 px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <div className="bg-ink-50 rounded-xl p-4">
                    <div className="text-xs text-ink-500 mb-0.5">Cliente</div>
                    <div className="text-sm font-semibold text-ink-900 mb-3">{clientName}</div>
                    
                    <div className="text-xs text-ink-500 mb-0.5">Total a cobrar ({charges.length} cargos)</div>
                    <div className="text-2xl font-black text-success-700">${totalAmount.toLocaleString()}</div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-ink-600 uppercase tracking-wider mb-1.5">
                        Nota del pago <span className="text-ink-400 font-normal lowercase tracking-normal">(opcional)</span>
                    </label>
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        className="input-field resize-none text-sm"
                        rows="2"
                        placeholder="Ej: Recibido pago completo por transferencia."
                        disabled={saving}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-ink-100 mt-4 bg-ink-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                <button onClick={onClose} disabled={saving} className="btn-secondary">
                    Cancelar
                </button>
                <button onClick={handleConfirm} disabled={saving} className="btn-primary">
                    {saving ? 'Registrando...' : 'Confirmar Cobro'}
                </button>
            </div>
        </Modal>
    );
}
