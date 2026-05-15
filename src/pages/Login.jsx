import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTenants } from '../services/mockFirebase';
import { Layout, Building2, User } from 'lucide-react';

export default function Login() {
    const { login, currentUser, currentTenant, setTenant } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedTenantId, setSelectedTenantId] = useState('');

    // Auto-redirect if already logged in
    useEffect(() => {
        if (currentUser) {
            if (currentUser.role === 'superAdmin') navigate('/admin');
            else if (currentUser.role === 'tenantAdmin') navigate('/tenant-admin');
            else if (currentUser.role === 'client') navigate('/client');
            else if (currentUser.role === 'staff') navigate('/staff');
        }
    }, [currentUser, navigate]);

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            await login(email, password);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="glass-panel p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <img src="/logo-app.jpg" alt="Logo" className="w-24 h-24 rounded-full border-4 border-gold-500 mx-auto mb-4 shadow-xl object-cover" />
                    <h2 className="text-3xl font-bold text-slate-100">Equestrian SaaS</h2>
                    <p className="text-slate-400 mt-2">Acceso a la Plataforma</p>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Correo Electrónico</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                            <input
                                type="email"
                                required
                                className="input-field pl-10"
                                placeholder="usuario@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Contraseña</label>
                        <input
                            type="password"
                            required
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button disabled={loading} className="w-full btn-primary disabled:opacity-50">
                        {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                    </button>

                    <button type="button" onClick={() => {
                        if (confirm('¿Reiniciar con datos frescos? Se borrarán tus cambios.')) {
                            localStorage.clear();
                            window.location.reload();
                        }
                    }} className="w-full text-xs text-slate-500 hover:text-red-400 mt-2 underline">
                        Restaurar Datos de Fábrica
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-700 text-xs text-slate-500 relative">
                    <p className="font-semibold mb-2">Credenciales Demo (Clave para todos: 123456):</p>
                    <ul className="space-y-1">
                        <li>Admin: admin@equus.com</li>
                        <li>Client (Agustin): agustin@mail.com</li>
                        <li>Client (Farid): farid@mail.com</li>
                        <li>Staff: rodrigo@equus.com</li>
                    </ul>

                    {/* Temporary Firebase Seeder */}
                    <button type="button" onClick={async () => {
                        if (confirm('¿Popular Firebase con datos Mock de prueba? ¡ESTO ALTERARÁ TU BASE DE DATOS REAL!')) {
                            const { executeFirebaseSeed } = await import('../utils/seedFirebase');
                            const res = await executeFirebaseSeed();
                            if(res.success) alert("Inyeccion completa. Inicia sesión con la nueva clave 123456");
                        }
                    }} className="absolute top-6 right-0 bg-red-900/40 text-red-500 px-2 py-1 rounded font-bold border border-red-500/50 hover:bg-red-500 hover:text-white transition-colors">
                        ⚠ Inyectar Datos Firebase
                    </button>
                </div>
            </div>
        </div>
    );
}
