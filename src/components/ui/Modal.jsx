// src/components/ui/Modal.jsx
// Modal estándar con backdrop, animación y close por ESC.
// Maneja foco y body scroll.

import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   title: string
 *   subtitle: string opcional
 *   size: 'sm' | 'md' | 'lg' | 'xl' (default 'md')
 *   children: contenido del body
 *   footer: JSX opcional para botones de acción
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle = null,
  size = 'md',
  children,
  footer = null,
}) {
  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(13, 33, 56, 0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className={`w-full ${sizes[size]} bg-white rounded-2xl shadow-2xl border border-ink-200 animate-fade-in-up max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-ink-100 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-medium text-ink-800">{title}</h3>
            {subtitle && (
              <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 transition-colors p-1 rounded-lg hover:bg-ink-100"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer (opcional) */}
        {footer && (
          <div className="px-6 py-4 border-t border-ink-100 bg-ink-50/50 rounded-b-2xl flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
