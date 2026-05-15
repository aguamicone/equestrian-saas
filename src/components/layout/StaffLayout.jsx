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

    const isActive = (path) => location.pathname === path ? 'text-gold-500' : 'text-slate-400';

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(15,23,42,1))] bg-slate-900 pb-20">
            {/* Mobile Header */}
            <header className="bg-slate-800/80 backdrop-blur-md p-4 border-b border-slate-700/50 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="font-bold text-slate-200">Portal de Staff</div>
                <div className="flex items-center gap-3">
                    <NotificationBell />
                    <button onClick={handleLogout} className="text-xs text-red-400 border border-slate-600 px-2 py-1 rounded">
                        Salir
                    </button>
                </div>
            </header>

            <main className="p-4">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/80 backdrop-blur-md border-t border-slate-700/50 flex justify-around items-start pt-3 z-40 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                <button onClick={() => navigate('/staff')} className={`flex flex-col items-center gap-1 ${isActive('/staff')}`}>
                    <Home size={24} />
                    <span className="text-[10px]">Inicio</span>
                </button>
                <button onClick={() => navigate('/staff/tasks')} className={`flex flex-col items-center gap-1 ${isActive('/staff/tasks')}`}>
                    <ClipboardList size={24} />
                    <span className="text-[10px]">Tareas</span>
                </button>
                <button onClick={() => navigate('/staff/log')} className={`flex flex-col items-center gap-1 ${isActive('/staff/log')}`}>
                    <PenTool size={24} />
                    <span className="text-[10px]">Registro</span>
                </button>
                <button onClick={() => navigate('/staff/supplies')} className={`flex flex-col items-center gap-1 ${isActive('/staff/supplies')}`}>
                    <ShoppingBag size={24} />
                    <span className="text-[10px]">Insumos</span>
                </button>
                <button onClick={() => navigate('/staff/events')} className={`flex flex-col items-center gap-1 ${isActive('/staff/events')}`}>
                    <Ticket size={24} />
                    <span className="text-[10px]">Eventos</span>
                </button>
            </nav>
        </div>
    );
}
