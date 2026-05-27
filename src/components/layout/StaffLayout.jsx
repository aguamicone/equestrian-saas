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
        <div className="min-h-screen pb-24">
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
            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-ink-200 flex justify-around items-stretch z-50 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.05)] h-[64px]">
                <button 
                    onClick={() => navigate('/staff')} 
                    className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${isActive('/staff', true) ? 'text-primary-600' : 'text-ink-400 hover:text-primary-600'}`}
                >
                    <Home size={22} className={isActive('/staff', true) ? 'fill-primary-50 text-primary-600' : ''} />
                    <span className="text-[10px] font-medium">Inicio</span>
                </button>
                
                <button 
                    onClick={() => navigate('/staff/horses')} 
                    className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${isActive('/staff/horses') ? 'text-primary-600' : 'text-ink-400 hover:text-primary-600'}`}
                >
                    <Activity size={22} className={isActive('/staff/horses') ? 'fill-primary-50 text-primary-600' : ''} />
                    <span className="text-[10px] font-medium">Caballos</span>
                </button>

                <button 
                    onClick={() => navigate('/staff/routines')} 
                    className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${isActive('/staff/routines') ? 'text-primary-600' : 'text-ink-400 hover:text-primary-600'}`}
                >
                    <Calendar size={22} className={isActive('/staff/routines') ? 'fill-primary-50 text-primary-600' : ''} />
                    <span className="text-[10px] font-medium">Rutinas</span>
                </button>

                <button onClick={() => navigate('/staff/log')} className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${location.pathname === '/staff/log' ? 'text-primary-600' : 'text-ink-400'}`}>
                    <PenTool size={22} />
                    <span className={`text-[10px] tracking-wide font-medium ${location.pathname === '/staff/log' ? 'opacity-100' : 'opacity-70'}`}>Registro</span>
                </button>
                <button onClick={() => navigate('/staff/supplies')} className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${location.pathname === '/staff/supplies' ? 'text-primary-600' : 'text-ink-400'}`}>
                    <ShoppingBag size={22} />
                    <span className={`text-[10px] tracking-wide font-medium flex gap-0.5 flex-col xs:flex-row items-center ${location.pathname === '/staff/supplies' ? 'opacity-100' : 'opacity-70'}`}><span>Insumos</span></span>
                </button>
                <button onClick={() => navigate('/staff/events')} className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${isActive('/staff/events')}`}>
                    <Ticket size={22} />
                    <span className={`text-[10px] tracking-wide font-medium ${location.pathname === '/staff/events' ? 'opacity-100' : 'opacity-70'}`}>Eventos</span>
                </button>
            </nav>
        </div>
    );
}
