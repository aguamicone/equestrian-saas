import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { DollarSign, TrendingUp, TrendingDown, Plus, Edit, Calendar } from 'lucide-react';
import { Card, PageHeader, Tabs, Badge, EmptyState } from '../../components/ui';
import GenerarCargosMensualesModal from '../../components/finanzas/modals/GenerarCargosMensualesModal';
import PricingPlanModal from '../../components/finanzas/modals/PricingPlanModal';

export default function FinanceOverview() {
    const { finances, pricingPlans } = useData();
    const [activeTab, setActiveTab] = useState('overview');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [showGenerarCargos, setShowGenerarCargos] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);

    const income = finances.filter(f => f.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expenses = finances.filter(f => f.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
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
                    <button 
                        onClick={() => setShowGenerarCargos(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Calendar size={18} />
                        Generar cargos del mes
                    </button>
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
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ink-100 text-ink-900">
                                        {finances.map(item => (
                                            <tr key={item.id} className="hover:bg-ink-50/50 transition-colors">
                                                <td className="p-4 text-sm text-ink-500">{item.date}</td>
                                                <td className="p-4 font-medium">{item.description}</td>
                                                <td className="p-4">
                                                    <Badge 
                                                        variant="neutral" 
                                                    >
                                                        {item.category}
                                                    </Badge>
                                                </td>
                                                <td className={`p-4 text-right font-bold font-mono text-base ${item.type === 'income' ? 'text-success-700' : 'text-danger-700'}`}>
                                                    {item.type === 'income' ? '+' : '-'}${item.amount.toLocaleString()}
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
        </div>
    );
}
