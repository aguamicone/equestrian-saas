// src/components/ui/Card.jsx
// Card básico. Wrapper blanco con borde y radius consistente.
// Variantes: default, hover (con elevation al hover), accent (con barra lateral de color).

export default function Card({
  children,
  className = '',
  variant = 'default',
  accent = null, // 'primary' | 'gold' | 'success' | 'danger' | null
  padding = 'normal', // 'none' | 'tight' | 'normal' | 'loose'
  ...props
}) {
  const base = 'bg-white border border-ink-200 rounded-2xl transition-all duration-200';

  const variants = {
    default: 'shadow-card',
    hover: 'shadow-card hover:shadow-card-hover hover:-translate-y-0.5',
    flat: '',
  };

  const paddings = {
    none: '',
    tight: 'p-3',
    normal: 'p-5',
    loose: 'p-6 lg:p-8',
  };

  const accentColors = {
    primary: 'before:bg-primary-500',
    gold: 'before:bg-gold-400',
    success: 'before:bg-success-500',
    danger: 'before:bg-danger-500',
  };

  const accentClasses = accent
    ? `relative overflow-hidden before:absolute before:left-0 before:top-4 before:bottom-4 before:w-1 before:rounded-r ${accentColors[accent]}`
    : '';

  return (
    <div
      className={`${base} ${variants[variant]} ${paddings[padding]} ${accentClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
