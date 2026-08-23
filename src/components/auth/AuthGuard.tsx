import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Define which routes are restricted by role
const staffOnlyPrefixes = [
  '/inventory',
  '/crm',
  '/procurement',
  '/reports',
];

const adminOnlyPrefixes = ['/settings'];

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, initialized, userRole } = useAuth();
  const location = useLocation();

  if (!initialized) {
    return <LoadingSkeleton />;
  }

  // Check for OAuth callback — hash fragments OR query code parameter
  // Supabase may redirect with #access_token=... or ?code=...
  const hasOAuthCallback =
    (location.hash && (location.hash.includes('access_token') || location.hash.includes('refresh_token'))) ||
    (location.search && location.search.includes('code='));

  if (!user && hasOAuthCallback) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based access control
  const path = location.pathname;

  // Viewers/clients can only access dashboard, sales (their orders/invoices), and AI
  if (userRole === 'viewer' || userRole === 'client') {
    const isStaffOnly = staffOnlyPrefixes.some((prefix) => path.startsWith(prefix));
    const isAdminOnly = adminOnlyPrefixes.some((prefix) => path.startsWith(prefix));
    if (isStaffOnly || isAdminOnly) {
      return <Navigate to="/" replace />;
    }
  }

  // Staff cannot access admin settings
  if (userRole === 'staff' || userRole === 'manager') {
    const isAdminOnly = adminOnlyPrefixes.some((prefix) => path.startsWith(prefix));
    if (isAdminOnly) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
