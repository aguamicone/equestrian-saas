import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut, LayoutDashboard, Ticket, Users, DollarSign, Settings,
  ClipboardList, Syringe, Activity, ShoppingBag, ChevronRight, Briefcase
} from 'lucide-react';
import NotificationBell from '../common/NotificationBell';

export default function TenantAdminLayout() {
  const { logout, currentUser, currentTenant, setTenant } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Helper: determinar si una ruta está activa
  const isActive = (path, exact = false) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  // Definición de navegación agrupada (más limpio que listar 12 Links sueltos)
  const navGroups = [
    {
      label: 'Gestión',
      items: [
        { to: '/tenant-admin',           icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { to: '/tenant-admin/routines',  icon: ClipboardList,   label: 'Rutinas' },
        { to: '/tenant-admin/spaces',    icon: Ticket,          label: 'Caballerizas' },
        { to: '/tenant-admin/inventory', icon: ShoppingBag,     label: 'Inventario' },
        { to: '/tenant-admin/horses',    icon: Users,           label: 'Caballos' },
      ],
    },
    {
      label: 'Operación',
      items: [
        { to: '/tenant-admin/finance',          icon: DollarSign, label: 'Finanzas' },
        { to: '/tenant-admin/finance/debtors',  icon: ChevronRight, label: 'Deudores', sub: true },
        { to: '/tenant-admin/equipment',        icon: Briefcase,  label: 'Inventario Equipos' },
        { to: '/tenant-admin/events',           icon: Ticket,     label: 'Eventos' },
        { to: '/tenant-admin/health',           icon: Syringe,    label: 'Sanidad' },
        { to: '/tenant-admin/activity',         icon: Activity,   label: 'Actividad' },
      ],
    },
    {
      label: 'Configuración',
      items: [
        { to: '/tenant-admin/users',    icon: Users,        label: 'Usuarios' },
        { to: '/tenant-admin/staff',    icon: ClipboardList, label: 'Personal' },
        { to: '/tenant-admin/settings', icon: Settings,     label: 'Configuración' },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* ===== Sidebar ===== */}
      <aside className="w-64 bg-white border-r border-ink-200 hidden md:flex flex-col shadow-sm z-20">

        {/* Logo / Tenant */}
        <div className="p-5 border-b border-ink-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/logo-app.jpg"
                alt="Logo"
                className="h-11 w-11 rounded-xl object-cover ring-2 ring-primary-100"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success-500 rounded-full ring-2 ring-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display font-medium text-ink-800 truncate text-sm">
                {currentTenant?.name}
              </div>
              <div className="text-[10px] text-ink-500 tracking-wider uppercase">
                Equus Fidei
              </div>
            </div>
          </div>

          {currentUser?.tenantIds && currentUser.tenantIds.length > 1 && (
            <select
              className="mt-3 input-field text-xs py-1.5"
              value={currentTenant?.id}
              onChange={(e) => setTenant(e.target.value)}
            >
              {currentUser.tenantIds.map(tId => (
                <option key={tId} value={tId}>{tId}</option>
              ))}
            </select>
          )}
        </div>

        {/* Nav agrupada */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? 'mt-5' : ''}>
              <div className="kicker px-3 mb-2">{group.label}</div>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const active = isActive(item.to, item.exact);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`relative ${active ? 'nav-item-active' : 'nav-item'} ${item.sub ? 'ml-3 text-xs' : ''}`}
                    >
                      <Icon size={item.sub ? 14 : 17} strokeWidth={1.75} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer del sidebar */}
        <div className="p-3 border-t border-ink-100">
          <div className="flex items-center gap-2 text-[10px] text-ink-400 px-3 py-2">
            <div className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse-soft" />
            Sistema operativo
          </div>
        </div>
      </aside>

      {/* ===== Main ===== */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Top Header */}
        <header className="h-16 bg-white/70 backdrop-blur-md border-b border-ink-200 flex justify-between items-center px-6 lg:px-8 shrink-0 z-10 sticky top-0">

          <div className="flex items-center gap-2">
            <div className="kicker">Panel de administración</div>
            <ChevronRight size={14} className="text-ink-300" />
            <div className="text-sm font-medium text-ink-700">
              {/* Aquí podés mostrar el título de la página actual si querés */}
              Dashboard
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />

            <div className="h-7 w-px bg-ink-200" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-ink-800 leading-tight">
                  {currentUser?.displayName}
                </div>
                <div className="text-[10px] text-primary-600 tracking-wider uppercase">
                  Administrador
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary-gradient flex items-center justify-center text-white text-xs font-medium shadow-sm">
                {currentUser?.displayName?.charAt(0) ?? 'A'}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="text-ink-400 hover:text-danger-500 transition-colors p-1.5 rounded-lg hover:bg-danger-50"
              title="Cerrar sesión"
            >
              <LogOut size={18} strokeWidth={1.75} />
            </button>
          </div>
        </header>

        {/* Contenido de la página */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
