import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Home, Activity, Menu, LogOut, X, PlusCircle, DollarSign, Ticket, Users, Briefcase } from 'lucide-react';
import NotificationBell from '../common/NotificationBell';
import { useState } from 'react';

export default function ClientLayout() {
    const { logout, currentUser, currentTenant } = useAuth();
    const { horses } = useData();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    // Find owned horse for quick link
    const myHorse = horses.find(h => h.ownerId === currentUser.uid);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(15,23,42,1))] bg-slate-900 pb-20"> {/* pb-20 for bottom nav */}

            {/* Mobile Header */}
            <header className="bg-slate-800/80 backdrop-blur-md p-4 border-b border-slate-700/50 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div>
                    <div className="text-gold-500 font-bold text-lg">{currentTenant?.name}</div>
                    <div className="text-xs text-slate-400">Hola, {currentUser?.displayName}</div>
                </div>
                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <button onClick={() => setMenuOpen(true)} className="text-slate-300">
                        <Menu />
                    </button>
                </div>
            </header>

            {/* Slide-out Menu */}
            {menuOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
                    <div className="absolute right-0 top-0 bottom-0 w-64 glass-panel rounded-none p-6 shadow-2xl border-l border-slate-700/50" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="font-bold text-white">Menú</h2>
                            <button onClick={() => setMenuOpen(false)}><X className="text-slate-400" /></button>
                        </div>
                        <div className="space-y-4">
                            <button onClick={() => navigate('/client/finance')} className="flex items-center gap-3 text-slate-300 hover:text-white w-full">
                                <DollarSign size={18} /> Mis Finanzas
                            </button>
                            <button onClick={() => navigate('/client/staff')} className="flex items-center gap-3 text-slate-300 hover:text-white w-full">
                                <Users size={18} /> Personal de Turno
                            </button>
                            <button onClick={() => { navigate('/client/equipment'); setMenuOpen(false); }} className="flex items-center gap-3 text-slate-300 hover:text-white w-full">
                                <Briefcase size={18} /> Equipos
                            </button>
                            <button onClick={() => navigate('/client/events')} className="flex items-center gap-3 text-slate-300 hover:text-white w-full">
                                <Ticket size={18} /> Eventos
                            </button>
                            <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 w-full">
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
            <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/80 backdrop-blur-md border-t border-slate-700/50 flex justify-around items-start pt-3 z-40 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                <button onClick={() => navigate('/client')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-gold-500 focus:text-gold-500">
                    <Home size={24} />
                    <span className="text-[10px]">Inicio</span>
                </button>

                <button onClick={() => navigate('/client/horses')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-gold-500 focus:text-gold-500">
                    <Activity size={24} />
                    <span className="text-[10px]">Mis Caballos</span>
                </button>

                <button onClick={() => navigate('/client/request')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-gold-500 focus:text-gold-500">
                    <PlusCircle size={24} />
                    <span className="text-[10px]">Solicitar</span>
                </button>
                {/* <button onClick={() => navigate('/client/reserve')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-gold-500 focus:text-gold-500">
                    <Ticket size={24} />
                    <span className="text-[10px]">Reservar</span>
                </button> */}
            </nav>
        </div>
    );
}
