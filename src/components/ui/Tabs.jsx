// src/components/ui/Tabs.jsx
// Tabs horizontales con underline. Manejan estado interno o controlado.
// Reemplaza el patrón "Resumen / Pricing" de FinanceOverview, etc.

import { useState } from 'react';

/**
 * Props:
 *   tabs: [{ key, label, icon?, count? }]
 *   value: controlled value (opcional)
 *   defaultValue: initial value si no es controlled
 *   onChange: (key) => void
 */
export default function Tabs({
  tabs,
  value,
  defaultValue,
  onChange,
  className = '',
}) {
  const [internal, setInternal] = useState(defaultValue || tabs[0]?.key);
  const isControlled = value !== undefined;
  const active = isControlled ? value : internal;

  const handleClick = (key) => {
    if (!isControlled) setInternal(key);
    onChange?.(key);
  };

  return (
    <div className={`border-b border-ink-200 flex gap-1 overflow-x-auto ${className}`}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => handleClick(tab.key)}
            className={`
              relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap
              flex items-center gap-2 -mb-px border-b-2
              ${isActive
                ? 'text-primary-600 border-primary-500'
                : 'text-ink-500 border-transparent hover:text-ink-700 hover:border-ink-200'
              }
            `}
          >
            {Icon && <Icon size={15} strokeWidth={1.75} />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`
                text-[10px] font-medium px-1.5 py-0.5 rounded-full
                ${isActive ? 'bg-primary-100 text-primary-700' : 'bg-ink-100 text-ink-600'}
              `}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
