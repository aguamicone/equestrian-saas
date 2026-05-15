import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { currentUser, currentTenant } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check Role
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        // If role is wrong, redirect to their appropriate dashboard or unauthorized page
        // For now, simple redirect based on their actual role
        if (currentUser.role === 'superAdmin') return <Navigate to="/admin" replace />;
        if (currentUser.role === 'tenantAdmin') return <Navigate to="/tenant-admin" replace />;
        if (currentUser.role === 'client') return <Navigate to="/client" replace />;
        if (currentUser.role === 'staff') return <Navigate to="/staff" replace />;

        return <div className="text-white p-4">Unauthorized Access</div>;
    }

    // Check Tenant Isolation (Optional: Super Admin can access all)
    // If user is not superAdmin, they must match the current tenant context if one is set.
    if (currentUser.role !== 'superAdmin' && currentTenant && currentUser.tenantId !== currentTenant.id) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-900 text-slate-200">
                <div className="glass-panel p-8">
                    <h2 className="text-xl font-bold text-red-500 mb-2">Tenant Mismatch</h2>
                    <p>You belong to {currentUser.tenantId} but are trying to access {currentTenant.name}.</p>
                </div>
            </div>
        );
    }

    return children;
}
