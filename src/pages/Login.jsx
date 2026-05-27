import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User } from 'lucide-react';
import { Card } from '../components/ui';

export default function Login() {
    const { login, currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
            setError('Credenciales inválidas o error de conexión.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card padding="normal" className="w-full max-w-md bg-white border-ink-200 shadow-xl rounded-3xl p-8 animate-in zoom-in duration-300">
                <div className="text-center mb-8">
                    <img src="/logo.png" alt="Horse Manager Logo" className="h-40 mx-auto mb-2 object-contain" />
                    <p className="text-ink-500 font-medium mt-2">Acceso a la Plataforma</p>
                </div>

                {error && <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-2.5 rounded-xl mb-4 text-sm font-medium">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs uppercase font-bold text-ink-500 mb-1.5">Correo Electrónico</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                            <input
                                type="email"
                                required
                                className="input-field pl-10 bg-white border-ink-200 text-ink-800 focus:border-primary-500 focus:ring-0"
                                placeholder="usuario@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs uppercase font-bold text-ink-500 mb-1.5">Contraseña</label>
                        <input
                            type="password"
                            required
                            className="input-field bg-white border-ink-200 text-ink-800 focus:border-primary-500 focus:ring-0"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button disabled={loading} className="w-full btn-primary py-3 rounded-xl font-bold text-base shadow-sm mt-2">
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-ink-100 pt-6">
                    <p className="text-xs text-ink-500 font-medium mb-3">¿Buscando pensión para tu caballo?</p>
                    <button 
                        onClick={() => navigate('/instalaciones')}
                        className="text-primary-600 hover:text-primary-700 text-sm font-bold bg-primary-50 hover:bg-primary-100 px-6 py-2.5 rounded-full transition-colors inline-flex items-center gap-2"
                    >
                        Ver Caballerizas y Tarifas
                    </button>
                </div>
            </Card>
        </div>
    );
}
