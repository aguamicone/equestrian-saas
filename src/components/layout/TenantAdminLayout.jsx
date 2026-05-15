import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, LayoutDashboard, Ticket, Users, DollarSign, Settings, ClipboardList, Syringe, Activity, ShoppingBag } from 'lucide-react';
import NotificationBell from '../common/NotificationBell';

export default function TenantAdminLayout() {
    const { logout, currentUser, currentTenant, setTenant } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(15,23,42,1))] bg-slate-900 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800/80 backdrop-blur-md border-r border-slate-700/50 hidden md:flex flex-col shadow-xl z-20">
                <div className="p-6 border-b border-slate-700 flex flex-col items-center">
                    <img src="/logo-app.jpg" alt="Logo" className="h-16 w-16 rounded-full border-2 border-gold-500 mb-2 object-cover shadow-lg" />
                    <h1 className="text-xl font-bold text-white truncate">{currentTenant?.name}</h1>
                    {currentUser?.tenantIds && currentUser.tenantIds.length > 1 && (
                        <select 
                            className="mt-2 bg-slate-800 text-slate-300 text-xs border border-slate-600 rounded px-2 py-1"
                            value={currentTenant?.id}
                            onChange={(e) => setTenant(e.target.value)}
                        >
                            {currentUser.tenantIds.map(tId => (
                                <option key={tId} value={tId}>{tId}</option>
                            ))}
                        </select>
                    )}
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/tenant-admin" className="flex items-center gap-3 px-4 py-2 rounded text-slate-400 hover:bg-slate-750 hover:text-white">
                        <LayoutDashboard size={18} /> Dashboard
                    </Link>
                    <Link to="/tenant-admin/routines" className="flex items-center gap-3 px-4 py-2 rounded text-slate-400 hover:bg-slate-750 hover:text-white">
                        <ClipboardList size={18} /> Rutinas
                    </Link>
                    <Link to="/tenant-admin/spaces" className="flex items-center gap-3 px-4 py-2 rounded text-slate-400 hover:bg-slate-750 hover:text-white">
                        <Ticket size={18} /> Caballerizas
                    </Link>
                    <Link to="/tenant-admin/inventory" className="flex items-center gap-3 px-4 py-2 rounded text-slate-400 hover:bg-slate-750 hover:text-white">
                        <ShoppingBag size={18} /> Inventario & Pedidos
                    </Link>
                    <Link to="/tenant-admin/horses" className="flex items-center gap-3 px-4 py-2 rounded text-slate-400 hover:bg-slate-750 hover:text-white">
                        <Users size={18} /> Caballos
                    </Link>
                    <Link to="/tenant-admin/finance" className="flex items-center gap-3 px-4 py-2 rounded text-slate-400 hover:bg-slate-750 hover:text-white">
                        <DollarSign size={18} /> Finanzas
                    </Link>
                    <Link to="/tenant-admin/finance/debtors" className="flex items-center gap-3 px-4 py-2 rounded text-slate-400 hover:bg-slate-750 hover:text-white ml-6 text-sm">
                        ↳ Deudores
                    </Link>
                    <Link to="/tenant-admin/events" className="flex items-center gap-3 px-4 py-2 rounded text-slate-400 hover:bg-slate-750 hover:text-white">
                        <Ticket size={18} /> Eventos
                    </Link>
                    <Link to="/tenant-admin/sanity" className="flex items-center gap-3 px-4 py-2 rounded text-slate-400 hover:bg-slate-750 hover:text-white">
                        <Syringe size={18} /> Sanidad
                    </Link>
                    <Link to="/tenant-admin/activity" className="flex items-center gap-3 px-4 py-2 rounded text-slate-400 hover:bg-slate-750 hover:text-white">
                        <Activity size={18} /> Actividad
                    </Link>
                    <Link to="/tenant-admin/users" className="flex items-center gap-3 px-4 py-2 rounded text-slate-400 hover:bg-slate-750 hover:text-white">
                        <Users size={18} /> Usuarios
                    </Link>
                    <Link to="/tenant-admin/staff" className="flex items-center gap-3 px-4 py-2 rounded text-slate-400 hover:bg-slate-750 hover:text-white">
                        <ClipboardList size={18} /> Personal
                    </Link>
                    <Link to="/tenant-admin/settings" className="flex items-center gap-3 px-4 py-2 rounded text-slate-400 hover:bg-slate-750 hover:text-white">
                        <Settings size={18} /> Configuración
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-700/50 flex justify-between items-center px-8 shrink-0 z-10 sticky top-0">
                    <div className="text-slate-400 text-sm font-medium">
                        Panel de Administración
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <span className="text-slate-200 text-sm font-medium text-right">
                                {currentUser?.displayName}
                                <span className="block text-xs text-slate-500 font-normal">Administrador</span>
                            </span>
                            <NotificationBell />
                        </div>
                        <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors" title="Cerrar Sesión">
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
