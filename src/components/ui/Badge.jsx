// src/components/ui/Badge.jsx
// Badge tinted (fondo claro, texto fuerte, borde sutil).
// Reemplaza los badges saturados estilo "STAFF amarillo pleno" del diseño viejo.

/**
 * Props:
 *   children: contenido (texto)
 *   tone: 'primary' | 'gold' | 'success' | 'danger' | 'neutral' (default 'neutral')
 *   size: 'sm' | 'md' (default 'md')
 *   icon: ícono Lucide opcional
 *   pulse: boolean — si true, anima con pulse-soft
 */
export default function Badge({
  children,
  tone = 'neutral',
  size = 'md',
  icon: Icon = null,
  pulse = false,
  className = '',
}) {
  const tones = {
    primary: 'bg-primary-50 text-primary-700 border-primary-100',
    gold:    'bg-gold-50 text-gold-600 border-gold-100',
    success: 'bg-success-50 text-success-700 border-success-100',
    danger:  'bg-danger-50 text-danger-700 border-danger-100',
    neutral: 'bg-ink-100 text-ink-700 border-ink-200',
    sky:     'bg-sky-100 text-primary-700 border-sky-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-[11px]',
  };

  const iconSize = size === 'sm' ? 10 : 12;

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium tracking-wider uppercase border
        ${tones[tone]} ${sizes[size]}
        ${pulse ? 'animate-pulse-soft' : ''}
        ${className}
      `}
    >
      {Icon && <Icon size={iconSize} strokeWidth={2} />}
      {children}
    </span>
  );
}
