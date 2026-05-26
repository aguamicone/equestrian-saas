import { useMemo } from 'react';
import {
  Activity, Users, TrendingUp, TrendingDown,
  Stethoscope, Mail, Package, Sun, AlertCircle, DollarSign, Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export default function TenantAdminDashboard() {
  const { currentUser, currentTenant } = useAuth();
  const { horses, spaces, finances, shifts, tenantUsers, logs } = useData();

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
      balance: finances?.filter(f => f.type === 'income' && f.status === 'paid').reduce((a, b) => a + Number(b.amount), 0) - finances?.filter(f => f.type === 'expense').reduce((a, b) => a + Number(b.amount), 0),
      monthlyChange: 8.2, // %
    };
  }, [horses, spaces, finances, activeStaffMembers.length]);

  const debtorsStats = useMemo(() => {
    if (!finances) return { count: 0, total: 0 };
    const pending = finances.filter(f => (f.status === 'pending' || f.status === 'overdue') && f.type === 'income');
    const total = pending.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const uniqueIds = new Set(pending.map(f => f.clientId || f.horseId).filter(Boolean));
    return {
        count: uniqueIds.size,
        total
    };
  }, [finances]);

  const recentLogs = useMemo(() => {
    if (!logs) return [];
    return [...logs].sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
    }).slice(0, 4);
  }, [logs]);

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

        {/* Cuadrante de Deudores */}
        <div className="card p-5 animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-base font-medium text-ink-800">
              Estado de Cobranzas
            </h3>
            {debtorsStats.count > 0 ? (
                <span className="badge-danger">Atención</span>
            ) : (
                <span className="badge-success">Al día</span>
            )}
          </div>

          <div className="flex flex-col items-center justify-center py-6 text-center">
            {debtorsStats.count > 0 ? (
              <>
                <AlertCircle size={48} strokeWidth={1.5} className="text-danger-400 mb-4" />
                <div className="text-3xl font-display font-medium text-ink-900 mb-1">
                  ${debtorsStats.total.toLocaleString()}
                </div>
                <div className="text-sm text-ink-500">
                  Pendiente de cobro de {debtorsStats.count} cliente(s) / caballo(s)
                </div>
              </>
            ) : (
              <>
                <TrendingUp size={48} strokeWidth={1.5} className="text-success-400 mb-4" />
                <div className="text-xl font-medium text-ink-900 mb-1">
                  ¡Todo al día!
                </div>
                <div className="text-sm text-ink-500">
                  No hay pagos atrasados ni pendientes.
                </div>
              </>
            )}
          </div>
        </div>

        {/* Últimas actividades */}
        <div className="card p-5 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-base font-medium text-ink-800">
              Últimas Actividades
            </h3>
          </div>

          <div className="space-y-2">
            {recentLogs.length > 0 ? (
              recentLogs.map(log => {
                 let tone = 'neutral';
                 let icon = Activity;
                 if (log.type.includes('charge') || log.type.includes('payment') || log.type.includes('plan')) {
                     tone = 'gold';
                     icon = DollarSign;
                 } else if (log.type.includes('horse') || log.type.includes('health')) {
                     tone = 'primary';
                     icon = Stethoscope;
                 } else if (log.type.includes('user') || log.type.includes('staff')) {
                     tone = 'success';
                     icon = Users;
                 }

                 const date = log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Reciente';
                 return (
                     <AlertRow
                        key={log.id}
                        icon={icon}
                        tone={tone}
                        title={log.details || log.type}
                        subtitle={`${log.staffName || 'Sistema'} · ${date}`}
                     />
                 );
              })
            ) : (
              <div className="text-sm text-ink-500 text-center py-4">No hay actividades recientes hoy.</div>
            )}
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
      {tag && <span className={`${t.badge} bg-white/80`}>{tag}</span>}
    </div>
  );
}
