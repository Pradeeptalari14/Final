import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Role } from '@/types';
import { LoadingFallback } from '@/components/ui/LoadingFallback';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { session, loading: authLoading } = useAuth();
    const { currentUser } = useData();
    const location = useLocation();

    if (authLoading) {
        return <LoadingFallback />;
    }

    if (!session) {
        // Redirect to login but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && currentUser) {
        const hasAccess = allowedRoles.includes(currentUser.role) ||
            (currentUser.role === Role.SUPER_ADMIN && allowedRoles.includes(Role.ADMIN));

        if (!hasAccess) {
            // Role unauthorized: redirect to dashboard (or error page)
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
}
