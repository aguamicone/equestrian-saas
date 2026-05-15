import { useMemo } from 'react';
import {
  Activity, Users, TrendingUp, TrendingDown,
  Stethoscope, Mail, Package, Sun
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export default function TenantAdminDashboard() {
  const { currentUser, currentTenant } = useAuth();
  const { horses, spaces, alerts, finances, shifts, tenantUsers } = useData();

  // ===== Lógica de negocio conservada del dashboard original =====
  const activeStaffMembers = useMemo(() => {
    if (!shifts || !tenantUsers) return [];
    const now = new Date();
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const currentDay = days[now.getDay()];
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    const activeShifts = shifts.filter(s =>
        s.day === currentDay &&
        s.start <= currentTime &&
        s.end >= currentTime
    );

    const activeStaffIds = [...new Set(activeShifts.map(s => s.staffId))];
    return tenantUsers.filter(u => activeStaffIds.includes(u.uid));
  }, [shifts, tenantUsers]);

  // ===== Cálculos (memoizados, como pide tu nota de Tech Lead) =====
  const stats = useMemo(() => {
    const totalSpaces = spaces?.length ?? 20;
    const occupied = spaces?.filter(s => s.status === 'occupied').length ?? 15;
    const occupancyPct = totalSpaces > 0 ? Math.round((occupied / totalSpaces) * 100) : 0;

    return {
      horsesCount: horses?.length ?? 16,
      horsesCap: totalSpaces,
      newThisWeek: 3,
      staffActive: activeStaffMembers.length,
      totalSpaces,
      occupied,
      occupancyPct,
      // TODO: conectar a DataContext cuando 'finances' y 'alerts' 
      //       estén disponibles. Hoy son datos de ejemplo.
      balance: finances?.balance ?? 1240000,
      monthlyChange: 8.2, // %
    };
  }, [horses, spaces, finances, activeStaffMembers.length]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buen día' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="space-y-6">

      {/* ===== Header de bienvenida ===== */}
      <div className="flex items-end justify-between flex-wrap gap-3 animate-fade-in-up">
        <div>
          <div className="kicker mb-1">Panel de administración</div>
          <h1 className="text-2xl lg:text-3xl font-display font-medium text-ink-800">
            {greeting}, {currentUser?.displayName?.split(' ')[0] ?? 'Admin'}
            <Sun size={22} className="inline-block ml-2 text-gold-400" strokeWidth={1.75} />
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Resumen operativo de <span className="text-primary-600 font-medium">{currentTenant?.name}</span>
          </p>
        </div>


      </div>

      {/* ===== KPIs ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">

        {/* KPI hero: Caballos activos (con gradiente azul) */}
        <div className="card-hover bg-primary-gradient text-white p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -right-3 -bottom-3 w-16 h-16 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-white/85 mb-3">
              <Activity size={12} strokeWidth={2} />
              Caballos activos
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-medium leading-none">
                {stats.horsesCount}
              </span>
              <span className="text-xs text-white/75">/ {stats.horsesCap} cupo</span>
            </div>
            <div className="text-xs text-white/85 mt-2">
              {stats.newThisWeek} altas esta semana
            </div>
          </div>
        </div>

        {/* KPI: Staff activo */}
        <div className={`kpi-card ${stats.staffActive === 0 ? 'kpi-card-gold' : 'kpi-card-primary'}`}>
          <div className="flex items-center gap-1.5 kicker mb-3">
            <Users size={12} strokeWidth={2} className="text-gold-500" />
            Staff activo hoy
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-display text-4xl font-medium text-ink-800 leading-none">
              {stats.staffActive > 0 ? stats.staffActive : ''}
            </span>
            {stats.staffActive === 0 && (
              <span className="badge-gold">Sin cobertura</span>
            )}
          </div>
          <div className="text-xs text-ink-500 mt-2 truncate max-w-full">
            {stats.staffActive > 0 ? (() => {
               const names = activeStaffMembers.map(s => s.displayName);
               if (names.length <= 3) return names.join(', ');
               return `${names.slice(0, 3).join(', ')} y ${names.length - 3} más`;
            })() : ''}
          </div>
        </div>

        {/* KPI: Estado financiero */}
        <div className={`kpi-card ${stats.monthlyChange >= 0 ? 'kpi-card-success' : 'kpi-card-danger'}`}>
          <div className="flex items-center gap-1.5 kicker mb-3">
            {stats.monthlyChange >= 0
              ? <TrendingUp size={12} strokeWidth={2} className="text-success-500" />
              : <TrendingDown size={12} strokeWidth={2} className="text-danger-500" />
            }
            Estado financiero
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-medium text-ink-800 leading-none">
              ${(stats.balance / 1000).toLocaleString('es-AR', { maximumFractionDigits: 0 })}k
            </span>
          </div>
          <div className={`text-xs mt-2 font-medium ${stats.monthlyChange >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            {stats.monthlyChange >= 0 ? '↑' : '↓'} {Math.abs(stats.monthlyChange)}% vs mes anterior
          </div>
        </div>
      </div>

      {/* ===== Ocupación + Alertas ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Ocupación de boxes */}
        <div className="card p-5 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-display text-base font-medium text-ink-800">
                Ocupación de boxes
              </h3>
              <p className="text-xs text-ink-500 mt-0.5">
                {currentTenant?.name} · {stats.totalSpaces} espacios
              </p>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-medium text-primary-600 leading-none">
                {stats.occupancyPct}<span className="text-base text-ink-400">%</span>
              </div>
              <div className="text-[10px] text-ink-500 tracking-wider uppercase mt-1">
                {stats.occupied}/{stats.totalSpaces} ocupados
              </div>
            </div>
          </div>

          {/* Grid de boxes */}
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: stats.totalSpaces }).map((_, i) => {
              const num = i + 1;
              const space = spaces?.[i];
              const empty = space ? space.status !== 'occupied' : true;
              const warning = num === 7;
              const cls = empty
                ? 'box-cell-empty'
                : warning
                  ? 'box-cell-warning animate-pulse-soft'
                  : 'box-cell-occupied';
              return (
                <div key={num} className={cls} title={`Box ${String(num).padStart(2, '0')}`}>
                  {String(num).padStart(2, '0')}
                </div>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-3 mt-4 text-[11px] text-ink-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-primary-400 rounded" />
              Ocupado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-gold-400 rounded" />
              Atención
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 border-2 border-dashed border-ink-300 rounded" />
              Libre
            </span>
          </div>
        </div>

        {/* Alertas recientes */}
        {/* TODO: conectar a DataContext cuando 'finances' y 'alerts' estén disponibles. Hoy son datos de ejemplo. */}
        <div className="card p-5 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-base font-medium text-ink-800">
              Alertas recientes
            </h3>
            <span className="badge-danger animate-pulse-soft">3 nuevas</span>
          </div>

          <div className="space-y-2">
            <AlertRow
              icon={Stethoscope}
              tone="gold"
              title='Visita veterinaria — Thunder'
              subtitle="Box 07 · vence en 2 días"
              tag="Urgente"
            />
            <AlertRow
              icon={Mail}
              tone="primary"
              title="Nueva solicitud de pensión"
              subtitle="Jacquelline · hace 2h"
              tag="Nuevo"
            />
            <AlertRow
              icon={Package}
              tone="neutral"
              title="Stock bajo — Ivermectina"
              subtitle="15 dosis · mínimo 5"
              tag="Aviso"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Sub-componente: fila de alerta =====
function AlertRow({ icon: Icon, tone, title, subtitle, tag }) {
  const tones = {
    gold: {
      bg: 'bg-gold-50 border-gold-100 hover:border-gold-200',
      iconBg: 'bg-gold-400',
      iconColor: 'text-white',
      badge: 'badge-gold',
    },
    primary: {
      bg: 'bg-primary-50 border-primary-100 hover:border-primary-200',
      iconBg: 'bg-primary-500',
      iconColor: 'text-white',
      badge: 'badge-primary',
    },
    success: {
      bg: 'bg-success-50 border-success-100 hover:border-success-200',
      iconBg: 'bg-success-500',
      iconColor: 'text-white',
      badge: 'badge-success',
    },
    danger: {
      bg: 'bg-danger-50 border-danger-100 hover:border-danger-200',
      iconBg: 'bg-danger-500',
      iconColor: 'text-white',
      badge: 'badge-danger',
    },
    neutral: {
      bg: 'bg-ink-50 border-ink-200 hover:border-ink-300',
      iconBg: 'bg-ink-500',
      iconColor: 'text-white',
      badge: 'badge-neutral',
    },
  };
  const t = tones[tone];

  return (
    <div className={`flex items-center gap-3 p-3 border rounded-xl transition-all duration-150 cursor-pointer hover:shadow-sm ${t.bg}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${t.iconBg}`}>
        <Icon size={16} strokeWidth={1.75} className={t.iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink-800 truncate">{title}</div>
        <div className="text-[11px] text-ink-500 mt-0.5">{subtitle}</div>
      </div>
      <span className={`${t.badge} bg-white/80`}>{tag}</span>
    </div>
  );
}
