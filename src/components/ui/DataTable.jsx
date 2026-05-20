// src/components/ui/DataTable.jsx
// Tabla estándar para todas las pantallas administrativas.
// Recibe columns (definición) y data (filas). Maneja vacío automáticamente.

import EmptyState from './EmptyState';

/**
 * Props:
 *   columns: [{ key, header, render?, align?, width? }]
 *     - key: identificador único de columna
 *     - header: texto del header
 *     - render: (row) => JSX, opcional. Si no se pasa, muestra row[key]
 *     - align: 'left' | 'center' | 'right' (default 'left')
 *     - width: string CSS opcional ej '120px'
 *   data: array de objetos
 *   onRowClick: (row) => void opcional
 *   emptyMessage: texto a mostrar si data está vacío
 *   emptyIcon: ícono Lucide opcional para vacío
 *   getRowKey: (row) => string. Por defecto usa row.id
 */
export default function DataTable({
  columns,
  data = [],
  onRowClick = null,
  getRowClassName = null,
  emptyMessage = 'No hay datos para mostrar',
  emptyIcon = null,
  getRowKey = (row) => row.id,
  className = '',
}) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-ink-200 rounded-2xl shadow-card">
        <EmptyState message={emptyMessage} icon={emptyIcon} />
      </div>
    );
  }

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className={`bg-white border border-ink-200 rounded-2xl shadow-card overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-sky-50 border-b border-ink-200">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-600 ${alignClass[col.align || 'left']}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {data.map(row => (
              <tr
                key={getRowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-sky-50/50' : ''} ${getRowClassName ? getRowClassName(row) : ''}`}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-sm text-ink-700 ${alignClass[col.align || 'left']}`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
