import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, LayoutDashboard, Building2, ShieldAlert } from 'lucide-react';

export default function SuperAdminLayout() {
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200">
            <nav className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <span className="font-bold text-gold-500 text-xl flex items-center gap-2">
                        <ShieldAlert size={24} />
                        Equestrian SuperAdmin
                    </span>
                    <div className="flex gap-4">
                        <Link to="/admin" className="hover:text-white flex items-center gap-2 text-slate-400"><LayoutDashboard size={18} /> Overview</Link>
                        <Link to="/admin/tenants" className="hover:text-white flex items-center gap-2 text-slate-400"><Building2 size={18} /> Tenants</Link>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400">{currentUser?.email}</span>
                    <button onClick={handleLogout} className="text-xs text-red-400 border border-slate-600 px-3 py-1 rounded hover:bg-slate-700 transition-colors">
                        Salir
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <main className="p-8">
                <Outlet />
            </main>
        </div>
    );
}
