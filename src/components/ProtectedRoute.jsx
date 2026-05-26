import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from './ui';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { currentUser, currentTenant } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check Role
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        if (currentUser.role === 'superAdmin') return <Navigate to="/admin" replace />;
        if (currentUser.role === 'tenantAdmin') return <Navigate to="/tenant-admin" replace />;
        if (currentUser.role === 'client') return <Navigate to="/client" replace />;
        if (currentUser.role === 'staff') return <Navigate to="/staff" replace />;

        return <div className="text-ink-700 p-4 font-semibold text-center">Acceso No Autorizado</div>;
    }

    // Check Tenant Isolation
    if (currentUser.role !== 'superAdmin' && currentTenant && currentUser.tenantId !== currentTenant.id) {
        return (
            <div className="h-screen flex items-center justify-center p-4">
                <Card padding="normal" className="max-w-md w-full border-ink-200 bg-white shadow-xl text-center">
                    <h2 className="text-xl font-bold text-danger-700 mb-2">Error de Haras / Tenant</h2>
                    <p className="text-ink-600 text-sm">
                        Tu usuario pertenece al haras <span className="font-semibold text-ink-800">{currentUser.tenantId}</span>, pero estás intentando acceder a <span className="font-semibold text-ink-800">{currentTenant.name}</span>.
                    </p>
                </Card>
            </div>
        );
    }

    return children;
}
