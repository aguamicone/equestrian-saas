import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, ClipboardList, PenTool, ShoppingBag, Ticket } from 'lucide-react';
import NotificationBell from '../common/NotificationBell';

export default function StaffLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path 
        ? 'text-primary-600 font-semibold' 
        : 'text-ink-400 hover:text-ink-600';

    return (
        <div className="min-h-screen pb-20">
            {/* Mobile Header - Cielo y Campo light style */}
            <header className="bg-white/80 backdrop-blur-md p-4 border-b border-ink-150 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="font-bold text-ink-900">Portal de Staff</div>
                <div className="flex items-center gap-3">
                    <NotificationBell />
                    <button 
                        onClick={handleLogout} 
                        className="text-xs text-danger-600 border border-danger-200 px-2.5 py-1 rounded-lg hover:bg-danger-50 transition-all font-semibold"
                    >
                        Salir
                    </button>
                </div>
            </header>

            <main className="p-4">
                <Outlet />
            </main>

            {/* Bottom Navigation - Light styled bar */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-ink-150 flex justify-around items-start pt-3 pb-4 z-40 safe-area-bottom shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
                <button onClick={() => navigate('/staff')} className={`flex flex-col items-center gap-1 transition-colors ${isActive('/staff')}`}>
                    <Home size={22} />
                    <span className="text-[10px] tracking-wide mt-0.5">Inicio</span>
                </button>
                <button onClick={() => navigate('/staff/tasks')} className={`flex flex-col items-center gap-1 transition-colors ${isActive('/staff/tasks')}`}>
                    <ClipboardList size={22} />
                    <span className="text-[10px] tracking-wide mt-0.5">Tareas</span>
                </button>
                <button onClick={() => navigate('/staff/log')} className={`flex flex-col items-center gap-1 transition-colors ${isActive('/staff/log')}`}>
                    <PenTool size={22} />
                    <span className="text-[10px] tracking-wide mt-0.5">Registro</span>
                </button>
                <button onClick={() => navigate('/staff/supplies')} className={`flex flex-col items-center gap-1 transition-colors ${isActive('/staff/supplies')}`}>
                    <ShoppingBag size={22} />
                    <span className="text-[10px] tracking-wide mt-0.5">Insumos</span>
                </button>
                <button onClick={() => navigate('/staff/events')} className={`flex flex-col items-center gap-1 transition-colors ${isActive('/staff/events')}`}>
                    <Ticket size={22} />
                    <span className="text-[10px] tracking-wide mt-0.5">Eventos</span>
                </button>
            </nav>
        </div>
    );
}
