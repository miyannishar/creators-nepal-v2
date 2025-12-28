import { JSX, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter, Outlet, useNavigate, Navigate } from 'react-router';
// UserInfo type removed - use Supabase User type from @supabase/supabase-js
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { AppDataProvider } from '@/contexts/AppDataContext';
import LandingPage from '@/pages/landing';
import Home from '@/pages/home';
import { Login } from '@/pages/login';
import { Register } from '@/pages/register';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ForgotPasswordPage } from '@/pages/forgot-password';
import FeedDashboard from '@/pages/dashboard/feed';
import CreatorDashboard from '@/pages/dashboard/creator';
import Content from '@/pages/dashboard/content';
import Insights from '@/pages/dashboard/insights';
import Audience from '@/pages/dashboard/audience';
import Payouts from '@/pages/dashboard/payouts';
import Settings from '@/pages/settings';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import NewPost from '@/pages/new-post';
import EditPost from '@/pages/edit-post';
import Post from '@/pages/post';
import CreatorProfilePage from '@/pages/creator-profile';
import { AuthCallback } from '@/pages/auth-callback';

import type { User } from '@supabase/supabase-js';
import type { PostResponse } from '@/contexts/AppDataContext';

const initialData = (window as any).__INITIAL_DATA__ as {
  user?: User;
  posts?: PostResponse[];
  singlePost?: PostResponse;
} | null;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Outlet />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        Component: LandingPage,
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'dashboard',
        Component: () => (
          <ProtectedRoute requireAuth={true}>
            <FeedDashboard />
          </ProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'dashboard/creator',
        Component: () => (
          <ProtectedRoute requireAuth={true}>
            <CreatorDashboard />
          </ProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'login',
        Component: () => (
          <ProtectedRoute requireAuth={false}>
            <Login />
          </ProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'register',
        Component: () => (
          <ProtectedRoute requireAuth={false}>
            <Register />
          </ProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'reset-password',
        Component: () => (
          <ProtectedRoute requireAuth={false}>
            <ForgotPasswordPage />
          </ProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'auth/callback',
        Component: () => {
          console.log('[Router] Rendering auth callback route');
          return <AuthCallback />;
        },
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'dashboard/content',
        Component: () => (
          <ProtectedRoute requireAuth={true}>
            <Content />
          </ProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'dashboard/insights',
        Component: () => (
          <ProtectedRoute requireAuth={true}>
            <Insights />
          </ProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'dashboard/audience',
        Component: () => (
          <ProtectedRoute requireAuth={true}>
            <Audience />
          </ProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'dashboard/payouts',
        Component: () => (
          <ProtectedRoute requireAuth={true}>
            <Payouts />
          </ProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'new-post',
        Component: () => (
          <ProtectedRoute requireAuth={true}>
            <NewPost />
          </ProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'edit-post',
        Component: () => (
          <ProtectedRoute requireAuth={true}>
            <EditPost />
          </ProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'settings',
        Component: () => (
          <ProtectedRoute requireAuth={true}>
            <Settings />
          </ProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'post/:postId',
        Component: () => (
          <ProtectedRoute requireAuth={true}>
            <Post />
          </ProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
      },
      {
        path: 'creator/:creatorId',
        Component: () => (
          <ProtectedRoute requireAuth={true}>
            <CreatorProfilePage />
          </ProtectedRoute>
        ),
        errorElement: <ErrorBoundary />,
  },
  {
    path: '*',
    Component: () => {
          // Return a 404 component for unmatched routes
          const navigate = useNavigate();
          console.log('[Router] 404 - Catch-all route matched. Current path:', window.location.pathname);
          return (
            <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
              <div className="w-full max-w-md space-y-8 text-center">
                <div className="mx-auto h-12 w-12 text-red-500">
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h2 className="mt-6 text-3xl font-bold">404 Not Found</h2>
                <p className="mt-2 text-sm">The page you're looking for doesn't exist.</p>
                <p className="mt-1 text-xs text-gray-500">Path: {window.location.pathname}</p>
                <div className="mt-8 space-y-3">
                  <Button onClick={() => navigate('/dashboard')} className="w-full" variant="default">
                    Go to Dashboard
                  </Button>
                  <Button onClick={() => window.location.reload()} className="w-full" variant="secondary">
                    Reload Page
                  </Button>
                </div>
              </div>
            </div>
          );
    },
    errorElement: <ErrorBoundary />,
      },
    ],
  },
]);

/**
 * Root component that wraps the app with providers.
 *
 * @returns {JSX.Element} The app component with providers
 */
const App = (): JSX.Element => {
  return (
    <AuthProvider>
      <AppDataProvider
        initialPosts={initialData?.posts}
        initialSinglePost={initialData?.singlePost}
      >
        <RouterProvider router={router} />
      </AppDataProvider>
    </AuthProvider>
  );
};

const rootElement = document.getElementById('root') as HTMLElement;

// Using createRoot for client-side rendering to avoid hydration mismatches
// Server uses StaticRouter while client uses RouterProvider - different routing setups
console.log('[Client] Using createRoot (client-side rendering)');
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
