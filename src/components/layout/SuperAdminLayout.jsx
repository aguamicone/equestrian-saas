import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, LayoutDashboard, Building2, ShieldAlert } from 'lucide-react';

export default function SuperAdminLayout() {
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const linkClass = (path) => location.pathname === path
        ? 'text-primary-600 font-bold flex items-center gap-2'
        : 'text-ink-500 hover:text-primary-500 flex items-center gap-2 transition-colors font-medium';

    return (
        <div className="min-h-screen">
            {/* Top Navigation - Light styled navbar */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-ink-150 p-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-8">
                    <span className="font-bold text-primary-600 text-xl flex items-center gap-2">
                        <ShieldAlert size={24} className="text-primary-500 animate-pulse-soft" />
                        Equestrian SuperAdmin
                    </span>
                    <div className="flex gap-5 text-sm">
                        <Link to="/admin" className={linkClass('/admin')}>
                            <LayoutDashboard size={18} /> Overview
                        </Link>
                        <Link to="/admin/tenants" className={linkClass('/admin/tenants')}>
                            <Building2 size={18} /> Tenants
                        </Link>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-ink-500 font-medium">{currentUser?.email}</span>
                    <button 
                        onClick={handleLogout} 
                        className="text-xs text-danger-600 border border-danger-200 px-3 py-1.5 rounded-lg hover:bg-danger-50 transition-all font-semibold"
                    >
                        Salir
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="p-8 max-w-7xl mx-auto">
                <Outlet />
            </main>
        </div>
    );
}
