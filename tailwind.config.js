/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ===== MARCA: Azul ecuestre (color principal) =====
        primary: {
          50:  '#eaf3fc',
          100: '#cde0f3',
          200: '#9cc2e7',
          300: '#6ba5db',
          400: '#4a9fdf',  // accent claro
          500: '#2d6fb5',  // PRINCIPAL — botones, links, KPI hero
          600: '#235691',
          700: '#1a426d',
          800: '#142f4f',
          900: '#0d1f37',
        },
        // ===== Celeste de aire / fondos =====
        sky: {
          50:  '#f4f8fc',
          100: '#e8f1fb',
          200: '#d1e3f6',
          300: '#aac8e9',
          400: '#7eaad8',
        },
        // ===== Acento dorado/amarillo cálido =====
        // (NO el yellow-400 saturado anterior — esto es más warm)
        gold: {
          50:  '#fff8e6',
          100: '#ffeab8',
          200: '#ffdc8a',
          300: '#f6c95a',
          400: '#f0b840',  // PRINCIPAL — alertas, badges urgentes, sol
          500: '#d99a1f',
          600: '#b87a0a',
        },
        // ===== Verde semántico (positivo: saldos, ocupación, OK) =====
        success: {
          50:  '#e8f5ee',
          100: '#c4e5d2',
          400: '#5dcaa5',
          500: '#1d9e75',
          600: '#15805d',
          700: '#0f6346',
        },
        // ===== Rojo semántico (negativo: deudas, errores, caídas) =====
        danger: {
          50:  '#fdecec',
          100: '#f9cdcd',
          400: '#ef6b6b',
          500: '#dc3535',
          600: '#b82424',
          700: '#8f1818',
        },
        // ===== Neutros (texto, bordes, fondos) =====
        ink: {
          50:  '#f7fafd',
          100: '#eef3f8',
          200: '#e3ecf5',
          300: '#cdd9e6',
          400: '#aabbcd',
          500: '#7a92ad',  // texto secundario
          600: '#5a7691',
          700: '#3d597a',
          800: '#1f3a5c',  // texto principal
          900: '#0d2138',
        },
      },
      backgroundImage: {
        'sky-field': 'linear-gradient(180deg, #e8f1fb 0%, #f4f8fc 60%, #fdfbf2 100%)',
        'primary-gradient': 'linear-gradient(135deg, #4a9fdf 0%, #2d6fb5 100%)',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(31, 58, 92, 0.04), 0 1px 2px rgba(31, 58, 92, 0.03)',
        'card-hover': '0 10px 30px -10px rgba(45, 111, 181, 0.18), 0 4px 12px rgba(31, 58, 92, 0.06)',
        'focus': '0 0 0 3px rgba(74, 159, 223, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
}
