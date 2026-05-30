import { useState, useMemo } from 'react';
import { Card, EmptyState } from '../ui';
import { BarChart3, PieChart, TrendingDown, TrendingUp, Calendar as CalendarIcon, Filter } from 'lucide-react';

export default function FinanceReports({ finances }) {
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    
    const [monthFilter, setMonthFilter] = useState(currentMonthStr);
    const [typeFilter, setTypeFilter] = useState('all'); // all, income, expense

    // Get unique months from finances for the dropdown
    const availableMonths = useMemo(() => {
        const months = new Set();
        finances.forEach(f => {
            if (f.date) {
                months.add(f.date.substring(0, 7)); // Extract YYYY-MM
            }
        });
        months.add(currentMonthStr); // Always include current month
        return Array.from(months).sort().reverse(); // Newest first
    }, [finances, currentMonthStr]);

    // Format YYYY-MM to readable text
    const formatMonth = (yyyy_mm) => {
        if (!yyyy_mm) return '';
        const [year, month] = yyyy_mm.split('-');
        const date = new Date(year, parseInt(month) - 1, 1);
        return new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(date);
    };

    const formatCurrency = (n) => 
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n || 0);

    // Filter finances based on selections
    const filteredFinances = useMemo(() => {
        return finances.filter(f => {
            const matchesMonth = monthFilter === 'all' || (f.date && f.date.startsWith(monthFilter));
            const matchesType = typeFilter === 'all' || f.type === typeFilter;
            // Solo contamos pagos/cobros efectivos o deudas para reporte?
            // Generalmente en reportes de erogación se cuenta todo lo devengado, pero depende del usuario.
            // Contaremos todo (paid y pending) para mostrar el gasto comprometido vs real.
            return matchesMonth && matchesType;
        });
    }, [finances, monthFilter, typeFilter]);

    // Aggregate by category
    const categoryTotals = useMemo(() => {
        const totals = {};
        filteredFinances.forEach(f => {
            const cat = f.category || 'Sin Categoría';
            if (!totals[cat]) {
                totals[cat] = { amount: 0, count: 0, type: f.type };
            }
            totals[cat].amount += Number(f.amount || 0);
            totals[cat].count += 1;
        });
        
        // Convert to array and sort by amount descending
        return Object.entries(totals)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.amount - a.amount);
    }, [filteredFinances]);

    // Totals for the top cards
    const totalIncome = filteredFinances.filter(f => f.type === 'income').reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const totalExpense = filteredFinances.filter(f => f.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const netBalance = totalIncome - totalExpense;

    return (
        <div className="space-y-6">
            {/* Filtros */}
            <Card padding="sm" className="bg-white border-ink-200">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="w-full sm:w-1/3">
                        <label className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <CalendarIcon size={14} /> Mes de Análisis
                        </label>
                        <select 
                            value={monthFilter} 
                            onChange={(e) => setMonthFilter(e.target.value)}
                            className="input-field py-2.5 w-full capitalize"
                        >
                            <option value="all">Histórico (Todos los meses)</option>
                            {availableMonths.map(m => (
                                <option key={m} value={m}>{formatMonth(m)}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="w-full sm:w-1/3">
                        <label className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Filter size={14} /> Tipo de Flujo
                        </label>
                        <select 
                            value={typeFilter} 
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="input-field py-2.5 w-full"
                        >
                            <option value="all">Ingresos y Gastos</option>
                            <option value="income">Solo Ingresos</option>
                            <option value="expense">Solo Gastos</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {(typeFilter === 'all' || typeFilter === 'income') && (
                    <Card variant="default" className="border-t-4 border-t-success-500">
                        <div className="text-sm font-medium text-ink-500 mb-1 flex items-center gap-2">
                            <TrendingUp size={16} className="text-success-600"/> Ingresos Totales
                        </div>
                        <div className="text-2xl font-bold text-success-700">{formatCurrency(totalIncome)}</div>
                    </Card>
                )}
                
                {(typeFilter === 'all' || typeFilter === 'expense') && (
                    <Card variant="default" className="border-t-4 border-t-danger-500">
                        <div className="text-sm font-medium text-ink-500 mb-1 flex items-center gap-2">
                            <TrendingDown size={16} className="text-danger-600"/> Gastos Totales
                        </div>
                        <div className="text-2xl font-bold text-danger-700">{formatCurrency(totalExpense)}</div>
                    </Card>
                )}

                {typeFilter === 'all' && (
                    <Card variant="default" className={`border-t-4 ${netBalance >= 0 ? 'border-t-primary-500' : 'border-t-danger-500'}`}>
                        <div className="text-sm font-medium text-ink-500 mb-1">Balance del Período</div>
                        <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-primary-700' : 'text-danger-700'}`}>
                            {formatCurrency(netBalance)}
                        </div>
                    </Card>
                )}
            </div>

            {/* Resumen por Categoría */}
            <Card padding="none" className="overflow-hidden border-ink-200">
                <div className="p-4 border-b border-ink-200 bg-ink-50 flex items-center gap-2 text-ink-900 font-bold">
                    <PieChart size={18} className="text-primary-600"/>
                    Desglose por Categoría
                </div>
                
                {categoryTotals.length === 0 ? (
                    <div className="p-8">
                        <EmptyState 
                            icon={BarChart3}
                            title="Sin datos"
                            description="No hay transacciones registradas para los filtros seleccionados."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-ink-50 text-ink-500 border-b border-ink-200">
                                <tr>
                                    <th className="p-4 font-medium text-sm">Categoría</th>
                                    <th className="p-4 font-medium text-sm">Tipo</th>
                                    <th className="p-4 font-medium text-sm text-center">Transacciones</th>
                                    <th className="p-4 font-medium text-sm text-right">Monto Acumulado</th>
                                    <th className="p-4 font-medium text-sm text-right">% del Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-100 text-ink-900">
                                {categoryTotals.map(cat => {
                                    const isExpense = cat.type === 'expense' || cat.type === 'payment'; // Assuming payments are expenses or income? 'payment' is outcome? No, payment in system usually means client paid us, which is income. Wait.
                                    // Let's rely on totalIncome or totalExpense for the % base
                                    const isIncomeType = cat.type === 'income' || cat.type === 'payment';
                                    const baseTotal = isIncomeType ? totalIncome : totalExpense;
                                    const percentage = baseTotal > 0 ? Math.round((cat.amount / baseTotal) * 100) : 0;
                                    
                                    return (
                                        <tr key={cat.name} className="hover:bg-ink-50/50 transition-colors">
                                            <td className="p-4 font-bold">{cat.name}</td>
                                            <td className="p-4">
                                                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${isIncomeType ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>
                                                    {isIncomeType ? 'Ingreso' : 'Gasto'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center font-medium text-ink-600">{cat.count}</td>
                                            <td className={`p-4 text-right font-bold font-mono text-base ${isIncomeType ? 'text-success-700' : 'text-danger-700'}`}>
                                                {formatCurrency(cat.amount)}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-sm font-bold text-ink-700 w-8">{percentage}%</span>
                                                    <div className="w-24 h-2 bg-ink-100 rounded-full overflow-hidden flex justify-end">
                                                        <div 
                                                            className={`h-full rounded-full ${isIncomeType ? 'bg-success-400' : 'bg-danger-400'}`} 
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
