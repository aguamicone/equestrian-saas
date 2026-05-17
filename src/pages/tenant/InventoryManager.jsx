// src/pages/tenant/InventoryManager.jsx
// Gestión de inventario — migrado a Cielo y Campo.
// Tabs: Control de Stock | Pedidos/Compras | Historial de Uso

import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  Package, Plus, AlertTriangle, Search, Edit, Trash2,
  ShoppingBag, CheckCircle, TrendingDown, Tag, X, Save,
} from 'lucide-react';
import { PageHeader, Card, DataTable, Modal, Badge, EmptyState, Tabs } from '../../components/ui';

// Categorías disponibles
const CATEGORIES = ['Alimentación', 'Cama', 'Veterinaria', 'Mantenimiento', 'Otros'];

// Mapeo categoría → variant del Badge
const CATEGORY_VARIANT = {
  'Alimentación': 'success',
  'Cama': 'gold',
  'Veterinaria': 'primary',
  'Mantenimiento': 'neutral',
  'Otros': 'sky',
};

// Mapeo urgencia → variant del Badge
const URGENCY_VARIANT = {
  high: 'danger',
  medium: 'gold',
  low: 'primary',
};

export default function InventoryManager() {
  const { inventory, inventoryLogs, addInventoryItem, updateRow, deleteRow, requests, addLog, updateStock } = useData();

  const [activeTab, setActiveTab] = useState('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [itemForm, setItemForm] = useState({
    id: null, name: '', category: 'Alimentación', stock: 0, unit: 'unidades', minStock: 10,
  });

  // ====== Datos memoizados ======

  const lowStockCount = useMemo(() =>
    inventory.filter(i => i.stock < i.minStock).length,
    [inventory]
  );

  const uniqueCategories = useMemo(() =>
    [...new Set(inventory.map(i => i.category))],
    [inventory]
  );

  const supplyOrders = useMemo(() =>
    (requests || [])
      .filter(r => r.type === 'supply_order')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [requests]
  );

  const pendingOrdersCount = useMemo(() =>
    supplyOrders.filter(o => o.status !== 'completed').length,
    [supplyOrders]
  );

  const sortedLogs = useMemo(() =>
    [...(inventoryLogs || [])].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [inventoryLogs]
  );

  // Filtrado de inventario
  const filteredInventory = useMemo(() => {
    let items = inventory;
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'low') {
        items = items.filter(i => i.stock < i.minStock);
      } else {
        items = items.filter(i => i.category === categoryFilter);
      }
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [inventory, categoryFilter, searchTerm]);

  // ====== Handlers ======

  const openAddModal = () => {
    setIsEditing(false);
    setItemForm({ id: null, name: '', category: 'Alimentación', stock: 0, unit: 'unidades', minStock: 10 });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setIsEditing(true);
    setItemForm({ ...item });
    setShowModal(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Sacar 'id' del payload — Firestore genera el suyo
    const { id, ...cleanData } = itemForm;
    const data = {
      ...cleanData,
      stock: Number(itemForm.stock),
      minStock: Number(itemForm.minStock),
    };

    if (isEditing) {
      updateRow('INVENTORY', id, data);
    } else {
      addInventoryItem(data);
    }
    setShowModal(false);
  };

  const handleRestock = (itemId, currentStock) => {
    const amount = prompt('Cantidad a agregar al stock actual:');
    if (amount && !isNaN(amount)) {
      updateStock(itemId, currentStock + Number(amount), 'Reposición manual');
    }
  };

  const handleDelete = (itemId) => {
    if (confirm('¿Estás seguro de eliminar este item permanentemente?')) {
      deleteRow('INVENTORY', itemId);
    }
  };

  const handleRequestStatus = (order, newStatus) => {
    updateRow('REQUESTS', order.id, { status: newStatus });

    // If completed and linked to an item, update stock
    if (newStatus === 'completed' && order.itemId) {
      const item = inventory.find(i => i.id === order.itemId);
      if (item) {
        updateStock(item.id, item.stock + (Number(order.quantity) || 0), `Pedido de compra finalizado (#${order.id.slice(0, 4)})`);
      }
    }

    addLog({
      type: 'admin_supply_action',
      details: `Cambió estado de pedido (${order.item}) a: ${newStatus}`,
      timestamp: new Date().toISOString(),
    });
  };

  // ====== Tab definitions ======

  const tabDefs = [
    { key: 'stock', label: 'Control de Stock', count: inventory.length },
    { key: 'requests', label: 'Pedidos / Compras', count: pendingOrdersCount || undefined },
    { key: 'history', label: 'Historial de Uso' },
  ];

  // ====== Filter chips para Stock tab ======
  const filterChips = [
    { key: 'all', label: 'Todos', count: inventory.length },
    { key: 'low', label: 'Stock bajo', count: lowStockCount },
    ...uniqueCategories.map(cat => ({
      key: cat,
      label: cat,
      count: inventory.filter(i => i.category === cat).length,
    })),
  ];

  // ====== Columnas para Pedidos/Compras ======
  const requestColumns = [
    {
      key: 'date', header: 'Fecha',
      render: (row) => new Date(row.timestamp).toLocaleDateString(),
    },
    {
      key: 'requester', header: 'Solicitante',
      render: (row) => (
        <span className="font-medium text-ink-800">
          {row.clientId ? `User ${row.clientId.slice(0, 5)}` : 'Staff'}
        </span>
      ),
    },
    {
      key: 'details', header: 'Detalle',
      render: (row) => (
        <div>
          <div className="text-ink-800">{row.details}</div>
          <div className="text-xs text-ink-500">Item: {row.item}</div>
        </div>
      ),
    },
    {
      key: 'urgency', header: 'Urgencia',
      render: (row) => (
        <Badge variant={URGENCY_VARIANT[row.urgency] || 'neutral'}>
          {row.urgency || 'normal'}
        </Badge>
      ),
    },
    {
      key: 'status', header: 'Estado',
      render: (row) => (
        <Badge variant={row.status === 'completed' ? 'success' : 'neutral'}>
          {row.status === 'completed' ? 'Recibido' : 'Pendiente'}
        </Badge>
      ),
    },
    {
      key: 'action', header: '', align: 'right',
      render: (row) =>
        row.status !== 'completed' ? (
          <button
            onClick={() => handleRequestStatus(row, 'completed')}
            className="p-1.5 rounded-lg text-success-600 hover:bg-success-50 transition-colors"
            title="Marcar como Recibido"
          >
            <CheckCircle size={18} />
          </button>
        ) : null,
    },
  ];

  // ====== Columnas para Historial ======
  const historyColumns = [
    {
      key: 'date', header: 'Fecha',
      render: (row) => new Date(row.date).toLocaleString(),
    },
    {
      key: 'itemName', header: 'Item',
      render: (row) => <span className="font-medium text-ink-800">{row.itemName}</span>,
    },
    {
      key: 'quantity', header: 'Cantidad',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 font-medium ${row.type === 'restock' ? 'text-success-600' : 'text-danger-600'}`}>
          {row.type === 'restock' ? <Plus size={14} /> : <TrendingDown size={14} />}
          {row.type === 'restock' ? '+' : '-'}{row.quantity}
        </span>
      ),
    },
    { key: 'userId', header: 'Usuario' },
    {
      key: 'reason', header: 'Motivo',
      render: (row) => <span className="italic text-ink-500">{row.reason || '-'}</span>,
    },
  ];

  return (
    <div className="pb-20">
      {/* Header */}
      <PageHeader
        kicker="Gestión"
        title="Inventario"
        icon={Package}
        subtitle="Control de stock, compras y movimientos"
        actions={
          <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Nuevo Item
          </button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card padding="normal">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Package size={20} className="text-primary-500" />
            </div>
            <div>
              <div className="text-2xl font-display font-medium text-ink-800">{inventory.length}</div>
              <div className="text-xs text-ink-500 uppercase tracking-wider">Total ítems</div>
            </div>
          </div>
        </Card>

        <Card padding="normal">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-danger-50' : 'bg-success-50'}`}>
              <AlertTriangle size={20} className={lowStockCount > 0 ? 'text-danger-500' : 'text-success-500'} />
            </div>
            <div>
              <div className={`text-2xl font-display font-medium ${lowStockCount > 0 ? 'text-danger-600' : 'text-ink-800'}`}>
                {lowStockCount}
              </div>
              <div className="text-xs text-ink-500 uppercase tracking-wider">Stock bajo</div>
            </div>
          </div>
        </Card>

        <Card padding="normal">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
              <Tag size={20} className="text-sky-600" />
            </div>
            <div>
              <div className="text-2xl font-display font-medium text-ink-800">{uniqueCategories.length}</div>
              <div className="text-xs text-ink-500 uppercase tracking-wider">Categorías</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabDefs}
        value={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {/* ===== TAB: STOCK CONTROL ===== */}
      {activeTab === 'stock' && (
        <>
          {/* Search + Category filter chips */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                className="input-field pl-9 text-sm"
                placeholder="Buscar insumo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {filterChips.map(chip => (
                <button
                  key={chip.key}
                  onClick={() => setCategoryFilter(chip.key)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-colors border
                    ${categoryFilter === chip.key
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-ink-600 border-ink-200 hover:border-primary-300 hover:text-primary-600'
                    }
                  `}
                >
                  {chip.label}
                  {chip.count !== undefined && (
                    <span className={`ml-1.5 ${categoryFilter === chip.key ? 'text-primary-100' : 'text-ink-400'}`}>
                      {chip.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Cards grid */}
          {filteredInventory.length === 0 ? (
            <EmptyState
              icon={Package}
              message="Sin ítems en el inventario"
              description="Agregá tu primer insumo para comenzar el control de stock"
              action={
                <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
                  <Plus size={16} /> Nuevo Item
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.map(item => {
                const isLow = item.stock < item.minStock;
                const isMedium = item.stock >= item.minStock && item.stock < item.minStock * 1.5;

                let stockBadgeClass = 'bg-success-50 text-success-600 border-2 border-success-200';
                if (isLow) {
                  stockBadgeClass = 'bg-danger-50 text-danger-600 border-2 border-danger-200 animate-pulse';
                } else if (isMedium) {
                  stockBadgeClass = 'bg-gold-50 text-gold-600 border-2 border-gold-200';
                }

                return (
                  <Card key={item.id} variant="hover" padding="none" className="overflow-hidden">
                    <div className="p-5">
                      {/* Header: name + badge + stock circle */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display font-medium text-ink-800 text-base truncate">
                            {item.name}
                          </h3>
                          <Badge variant={CATEGORY_VARIANT[item.category] || 'neutral'} size="sm" className="mt-1">
                            {item.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-md text-ink-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Editar"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-md text-ink-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-medium text-sm ${stockBadgeClass}`}>
                            {item.stock}
                          </div>
                        </div>
                      </div>

                      {/* Info row */}
                      <div className="flex justify-between items-center text-xs text-ink-500 mb-4">
                        <span>Mín: {item.minStock} {item.unit}</span>
                        <span>Unidad: {item.unit}</span>
                      </div>

                      {/* Restock button */}
                      <button
                        onClick={() => handleRestock(item.id, item.stock)}
                        className="w-full py-2 bg-sky-50 hover:bg-sky-100 text-primary-700 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium border border-sky-200"
                      >
                        <Plus size={15} /> Reponer Stock
                      </button>
                    </div>

                    {/* Low stock indicator bar */}
                    {isLow && (
                      <div className="px-5 py-2 bg-danger-50 border-t border-danger-100 flex items-center gap-2">
                        <AlertTriangle size={13} className="text-danger-500" />
                        <span className="text-[11px] font-medium text-danger-600">Stock por debajo del mínimo</span>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===== TAB: REQUESTS (PEDIDOS) ===== */}
      {activeTab === 'requests' && (
        <DataTable
          columns={requestColumns}
          data={supplyOrders}
          emptyMessage="No hay pedidos de insumos"
          emptyIcon={ShoppingBag}
        />
      )}

      {/* ===== TAB: HISTORY ===== */}
      {activeTab === 'history' && (
        <DataTable
          columns={historyColumns}
          data={sortedLogs}
          emptyMessage="No hay registros de uso"
          emptyIcon={Package}
        />
      )}

      {/* ===== Modal Crear/Editar ===== */}
      {showModal && (
        <Modal isOpen={true} onClose={() => setShowModal(false)} size="md" hideDefaultHeader>
          {/* Header */}
          <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
            <div>
              <div className="font-display text-lg font-medium text-ink-900 flex items-center gap-2">
                <Package size={18} className="text-primary-500" />
                {isEditing ? 'Editar Item' : 'Nuevo Item'}
              </div>
              {isEditing && (
                <div className="text-xs text-ink-500 mt-0.5">{itemForm.name}</div>
              )}
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="p-1.5 rounded-md hover:bg-ink-100 text-ink-500 hover:text-ink-800"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="px-6 py-5 space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-medium text-ink-600 uppercase tracking-wider mb-1.5">
                Nombre <span className="text-danger-500">*</span>
              </label>
              <input
                className="input-field"
                placeholder="Nombre (ej: Avena)"
                value={itemForm.name}
                onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                required
                autoFocus
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-medium text-ink-600 uppercase tracking-wider mb-1.5">
                Categoría
              </label>
              <select
                className="input-field"
                value={itemForm.category}
                onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Stock + Mínimo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-600 uppercase tracking-wider mb-1.5">
                  Stock {isEditing && <span className="text-ink-400 font-normal lowercase tracking-normal">(actual)</span>}
                </label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="Stock"
                  value={itemForm.stock}
                  onChange={e => setItemForm({ ...itemForm, stock: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-600 uppercase tracking-wider mb-1.5">
                  Mínimo
                </label>
                <input
                  className="input-field"
                  type="number"
                  placeholder="Mínimo"
                  value={itemForm.minStock}
                  onChange={e => setItemForm({ ...itemForm, minStock: e.target.value })}
                />
              </div>
            </div>

            {/* Unidad */}
            <div>
              <label className="block text-xs font-medium text-ink-600 uppercase tracking-wider mb-1.5">
                Unidad de medida
              </label>
              <input
                className="input-field"
                placeholder="Unidad (ej: kg, bolsas)"
                value={itemForm.unit}
                onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                required
              />
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-ink-100 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end -mx-6 -mb-5 px-6 py-4 bg-ink-50/50">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                <Save size={14} />
                {isEditing ? 'Guardar Cambios' : 'Crear Item'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
