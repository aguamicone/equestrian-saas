// src/components/ui/PageHeader.jsx
// Header estándar para todas las páginas internas.
// Trae kicker, título, subtítulo, y slot para acciones del lado derecho.

export default function PageHeader({
  kicker = 'Panel de administración',
  title,
  subtitle = null,
  icon: Icon = null,
  actions = null, // JSX para botones u otros controles
  className = '',
}) {
  return (
    <div className={`flex items-end justify-between flex-wrap gap-3 mb-6 animate-fade-in-up ${className}`}>
      <div className="min-w-0 flex-1">
        {kicker && <div className="kicker mb-1">{kicker}</div>}
        <h1 className="text-2xl lg:text-3xl font-display font-medium text-ink-800 flex items-center gap-2.5">
          {Icon && <Icon size={28} strokeWidth={1.75} className="text-primary-500" />}
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-ink-500 mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
