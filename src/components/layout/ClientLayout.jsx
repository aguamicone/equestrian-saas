import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Home, Activity, Menu, LogOut, X, PlusCircle, DollarSign, Ticket, Users, Briefcase } from 'lucide-react';
import NotificationBell from '../common/NotificationBell';
import { useState } from 'react';

export default function ClientLayout() {
    const { logout, currentUser, currentTenant } = useAuth();
    const { horses } = useData();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    // Find owned horse for quick link
    const myHorse = horses.find(h => h.ownerId === currentUser.uid);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Helper to determine active route for bottom nav
    const isActive = (path, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen pb-20"> {/* pb-20 for bottom nav */}

            {/* Mobile Header */}
            <header className="bg-white/70 backdrop-blur-md p-4 border-b border-ink-200 flex justify-between items-center sticky top-0 z-50">
                <div>
                    <div className="text-ink-800 font-semibold text-lg leading-tight">{currentTenant?.name}</div>
                    <div className="text-xs text-ink-500">Hola, {currentUser?.displayName}</div>
                </div>
                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <button onClick={() => setMenuOpen(true)} className="text-ink-700 hover:bg-ink-100 p-1.5 rounded-md transition-colors">
                        <Menu size={24} />
                    </button>
                </div>
            </header>

            {/* Slide-out Menu */}
            {menuOpen && (
                <div className="fixed inset-0 bg-ink-900/40 backdrop-blur-sm" style={{ zIndex: 100 }} onClick={() => setMenuOpen(false)}>
                    <div className="absolute right-0 top-0 bottom-0 w-72 bg-white rounded-none p-0 shadow-xl border-l border-ink-200 flex flex-col animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
                        
                        {/* Sidebar Header */}
                        <div className="p-6 border-b border-ink-100 flex justify-between items-start bg-ink-50/50">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <img
                                        src="/logo-app.jpg"
                                        alt="Logo"
                                        className="h-10 w-10 rounded-xl object-cover ring-2 ring-primary-100"
                                    />
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success-500 rounded-full ring-2 ring-white" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-ink-800 text-sm leading-tight">{currentTenant?.name}</h2>
                                    <div className="text-[10px] text-ink-500 tracking-wider uppercase mt-0.5">Equus Fidei</div>
                                </div>
                            </div>
                            <button onClick={() => setMenuOpen(false)} className="p-1 text-ink-400 hover:text-ink-700 hover:bg-ink-100 rounded-md transition-colors -mr-2 mt-1">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Sidebar Menu Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-1">
                            <button onClick={() => { navigate('/client/finance'); setMenuOpen(false); }} className="flex items-center gap-3 text-ink-700 hover:text-primary-700 hover:bg-primary-50 px-3 py-2.5 rounded-lg w-full transition-colors text-sm font-medium">
                                <DollarSign size={18} /> Mis Finanzas
                            </button>
                            <button onClick={() => { navigate('/client/staff'); setMenuOpen(false); }} className="flex items-center gap-3 text-ink-700 hover:text-primary-700 hover:bg-primary-50 px-3 py-2.5 rounded-lg w-full transition-colors text-sm font-medium">
                                <Users size={18} /> Personal de Turno
                            </button>
                            <button onClick={() => { navigate('/client/equipment'); setMenuOpen(false); }} className="flex items-center gap-3 text-ink-700 hover:text-primary-700 hover:bg-primary-50 px-3 py-2.5 rounded-lg w-full transition-colors text-sm font-medium">
                                <Briefcase size={18} /> Equipos
                            </button>
                            <button onClick={() => { navigate('/client/events'); setMenuOpen(false); }} className="flex items-center gap-3 text-ink-700 hover:text-primary-700 hover:bg-primary-50 px-3 py-2.5 rounded-lg w-full transition-colors text-sm font-medium">
                                <Ticket size={18} /> Eventos
                            </button>
                        </div>

                        {/* Sidebar Footer */}
                        <div className="p-4 border-t border-ink-100">
                            <button onClick={handleLogout} className="flex items-center gap-3 text-danger-600 hover:bg-danger-50 px-3 py-2.5 rounded-lg w-full transition-colors text-sm font-medium">
                                <LogOut size={18} /> Cerrar Sesión
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="p-4">
                <Outlet />
            </main>

            {/* Bottom Navigation (Mobile) */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-ink-200 flex justify-around items-stretch z-50 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.05)] h-[64px]">
                <button 
                    onClick={() => navigate('/client')} 
                    className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${isActive('/client', true) ? 'text-primary-600' : 'text-ink-400 hover:text-primary-600'}`}
                >
                    <Home size={22} className={isActive('/client', true) ? 'fill-primary-50 text-primary-600' : ''} />
                    <span className="text-[10px] font-medium">Inicio</span>
                </button>

                <button 
                    onClick={() => navigate('/client/horses')} 
                    className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${isActive('/client/horses') ? 'text-primary-600' : 'text-ink-400 hover:text-primary-600'}`}
                >
                    <Activity size={22} className={isActive('/client/horses') ? 'fill-primary-50 text-primary-600' : ''} />
                    <span className="text-[10px] font-medium">Mis Caballos</span>
                </button>

                <button 
                    onClick={() => navigate('/client/request')} 
                    className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${isActive('/client/request') ? 'text-primary-600' : 'text-ink-400 hover:text-primary-600'}`}
                >
                    <PlusCircle size={22} className={isActive('/client/request') ? 'fill-primary-50 text-primary-600' : ''} />
                    <span className="text-[10px] font-medium">Solicitar</span>
                </button>
            </nav>
        </div>
    );
}
