import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { DollarSign, TrendingUp, TrendingDown, Settings, Plus, X, Edit, Trash } from 'lucide-react';

export default function FinanceOverview() {
    const { finances, pricingPlans, updateRow, addPricingPlan } = useData();
    const [activeTab, setActiveTab] = useState('overview');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        type: 'membership', // membership | service
        frequency: 'monthly', // monthly | one-time
        description: ''
    });

    const income = finances.filter(f => f.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expenses = finances.filter(f => f.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    const balance = income - expenses;

    const handleOpenModal = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name,
                price: plan.price,
                type: plan.type,
                frequency: plan.frequency,
                description: plan.description || ''
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: '',
                price: '',
                type: 'membership',
                frequency: 'monthly',
                description: ''
            });
        }
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const planData = {
            ...formData,
            price: parseInt(formData.price) || 0
        };

        if (editingPlan) {
            updateRow('PRICING_PLANS', editingPlan.id, planData);
        } else {
            addPricingPlan(planData);
        }
        setShowModal(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-100">Finanzas</h2>
            </div>

            {/* Tabs */}
            <div className="flex mb-6 border-b border-slate-700">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'overview' ? 'text-gold-500 border-b-2 border-gold-500' : 'text-slate-400 hover:text-white'}`}
                >
                    Resumen
                </button>
                <button
                    onClick={() => setActiveTab('pricing')}
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'pricing' ? 'text-gold-500 border-b-2 border-gold-500' : 'text-slate-400 hover:text-white'}`}
                >
                    Gestión de Planes y Precios
                </button>
            </div>

            {activeTab === 'overview' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="glass-card p-6 rounded-lg border border-slate-700 flex items-center justify-between">
                            <div>
                                <div className="text-sm text-slate-400 mb-1">Ingresos Totales</div>
                                <div className="text-2xl font-bold text-green-400">+${income.toLocaleString()}</div>
                            </div>
                            <div className="p-3 bg-green-500/10 rounded-full text-green-400"><TrendingUp /></div>
                        </div>

                        <div className="glass-card p-6 rounded-lg border border-slate-700 flex items-center justify-between">
                            <div>
                                <div className="text-sm text-slate-400 mb-1">Gastos Totales</div>
                                <div className="text-2xl font-bold text-red-400">-${expenses.toLocaleString()}</div>
                            </div>
                            <div className="p-3 bg-red-500/10 rounded-full text-red-400"><TrendingDown /></div>
                        </div>

                        <div className="glass-card p-6 rounded-lg border border-slate-700 flex items-center justify-between">
                            <div>
                                <div className="text-sm text-slate-400 mb-1">Balance Neto</div>
                                <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                    ${balance.toLocaleString()}
                                </div>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-full text-blue-400"><DollarSign /></div>
                        </div>
                    </div>

                    <div className="glass-card overflow-hidden">
                        <div className="p-4 border-b border-slate-700 font-bold text-lg">Transacciones Recientes</div>
                        <table className="w-full text-left">
                            <thead className="bg-slate-700/50 text-slate-400">
                                <tr>
                                    <th className="p-4">Fecha</th>
                                    <th className="p-4">Descripción</th>
                                    <th className="p-4">Categoría</th>
                                    <th className="p-4 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700 text-slate-200">
                                {finances.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-700/30">
                                        <td className="p-4 text-sm text-slate-400">{item.date}</td>
                                        <td className="p-4 font-medium">{item.description}</td>
                                        <td className="p-4 text-xs font-mono uppercase bg-slate-900/50 rounded inline-block m-2 h-fit">{item.category}</td>
                                        <td className={`p-4 text-right font-bold ${item.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                            {item.type === 'income' ? '+' : '-'}${item.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === 'pricing' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
                            <Plus size={18} /> Crear Nuevo Plan
                        </button>
                    </div>

                    <div className="glass-card overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-700/50 text-slate-400">
                                <tr>
                                    <th className="p-4">Nombre del Plan</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Frecuencia</th>
                                    <th className="p-4">Precio</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700 text-slate-200">
                                {pricingPlans.map(plan => (
                                    <tr key={plan.id} className="hover:bg-slate-700/30">
                                        <td className="p-4">
                                            <div className="font-bold text-white">{plan.name}</div>
                                            <div className="text-xs text-slate-400">{plan.description}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs px-2 py-1 rounded uppercase font-bold tracking-wider ${plan.type === 'membership' ? 'bg-purple-900 text-purple-300' : 'bg-blue-900 text-blue-300'}`}>
                                                {plan.type === 'membership' ? 'Membresía' : 'Servicio'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-300 capitalize">{plan.frequency === 'monthly' ? 'Mensual' : 'Pago Único'}</td>
                                        <td className="p-4 font-mono text-gold-400 font-bold">${plan.price.toLocaleString()}</td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleOpenModal(plan)} className="p-2 hover:bg-slate-600 rounded text-slate-400 hover:text-white transition-colors">
                                                <Edit size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {pricingPlans.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-500">No hay planes configurados. Crea uno nuevo para comenzar.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-lg animate-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">{editingPlan ? 'Editar Plan' : 'Nuevo Plan de Precios'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-slate-400 text-sm mb-1">Nombre del Plan</label>
                                <input
                                    className="input-field"
                                    placeholder="Ej: Pensión Completa, Entrenamiento..."
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 text-sm mb-1">Tipo</label>
                                    <select
                                        className="input-field"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="membership">Membresía</option>
                                        <option value="service">Servicio</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-sm mb-1">Frecuencia</label>
                                    <select
                                        className="input-field"
                                        value={formData.frequency}
                                        onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                                    >
                                        <option value="monthly">Mensual</option>
                                        <option value="one-time">Pago Único</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm mb-1">Precio Base ($)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="0"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm mb-1">Descripción</label>
                                <textarea
                                    className="input-field min-h-[80px]"
                                    placeholder="Detalles de lo que incluye..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">{editingPlan ? 'Guardar Cambios' : 'Crear Plan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
