import { JSX, ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../contexts/SupabaseAuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * Protected route component that handles authentication logic and redirects.
 *
 * @param {ProtectedRouteProps} props - The component props
 * @param {ReactNode} props.children - Child components to render
 * @param {boolean} props.requireAuth - Whether authentication is required (default: true)
 * @param {string} props.redirectTo - Where to redirect if conditions aren't met
 * @returns {JSX.Element} The protected route component or redirect
 */
export default function ProtectedRoute({
  children,
  requireAuth = true,
  redirectTo,
}: ProtectedRouteProps): JSX.Element {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('[ProtectedRoute] Auth check:', { 
      loading, 
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      requireAuth, 
      pathname: location.pathname,
      timestamp: new Date().toISOString()
    });

    // Wait for auth to finish loading
    if (loading) {
      console.log('[ProtectedRoute] Still loading auth, waiting...', {
        loading,
        hasUser: !!user,
        willWait: true
      });
      return; // Wait for auth to load
    }
    
    console.log('[ProtectedRoute] Auth loading complete, checking access...', {
      requireAuth,
      hasUser: !!user,
      willRedirect: requireAuth && !user
    });
    
    // If auth is done loading and no user, redirect to login
    if (requireAuth && !user) {
      console.log('[ProtectedRoute] Auth required but no user, redirecting to login', {
        from: location.pathname,
        to: '/login'
      });
      navigate('/login', { state: { from: location }, replace: true, viewTransition: true });
      return;
    }

    if (
      user &&
      !requireAuth &&
      (location.pathname === '/login' || location.pathname === '/register')
    ) {
      console.log('[ProtectedRoute] User authenticated but on auth page, redirecting to dashboard');
      navigate('/dashboard', { replace: true, viewTransition: true });
      return;
    }

    if (redirectTo) {
      console.log('[ProtectedRoute] Redirecting to:', redirectTo);
      navigate(redirectTo, { replace: true, viewTransition: true });
    } else {
      console.log('[ProtectedRoute] Route access granted');
    }
  }, [user, loading, requireAuth, location.pathname, navigate, redirectTo, location]);

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if auth is required but user is not authenticated
  // (will be redirected by useEffect)
  if (requireAuth && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
