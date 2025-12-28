import { JSX, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

/**
 * Auth callback page that handles OAuth redirects from Supabase.
 * Supabase automatically processes the OAuth callback from the URL hash.
 * This component waits for the auth state change event and then redirects.
 *
 * @returns {JSX.Element} The auth callback component
 */
export const AuthCallback = (): JSX.Element => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[AuthCallback] OAuth callback page loaded');
    console.log('[AuthCallback] Current URL:', window.location.href);
    
    // Check for OAuth errors in URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const errorParam = hashParams.get('error');
    const errorDescription = hashParams.get('error_description');

    if (errorParam) {
      console.error('[AuthCallback] OAuth error in URL:', errorParam, errorDescription);
      setError(errorDescription || errorParam || 'Authentication failed');
      setStatus('error');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
      return;
    }

    // Supabase automatically processes the OAuth callback from the URL hash
    // We just need to wait for the auth state change event
    let timeoutId: NodeJS.Timeout;
    let hasRedirected = false;

    const checkSession = async (): Promise<void> => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[AuthCallback] Error getting session:', sessionError);
        setError(sessionError.message);
        setStatus('error');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
        return;
      }

      if (session && !hasRedirected) {
        console.log('[AuthCallback] Session established, user authenticated:', session.user.id);
        hasRedirected = true;
        setStatus('success');
        // Clear the URL hash to remove OAuth tokens
        window.history.replaceState(null, '', window.location.pathname);
        // Redirect to home page
        navigate('/', { replace: true });
      }
    };

    // Listen for auth state changes (Supabase will fire this when processing OAuth callback)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('[AuthCallback] Auth state changed:', { event, hasSession: !!session });

      if (event === 'SIGNED_IN' && session) {
        console.log('[AuthCallback] User signed in via OAuth callback');
        if (!hasRedirected) {
          hasRedirected = true;
          setStatus('success');
          // Clear the URL hash
          window.history.replaceState(null, '', window.location.pathname);
          navigate('/', { replace: true });
        }
      } else if (event === 'TOKEN_REFRESHED' && session) {
        console.log('[AuthCallback] Token refreshed');
        if (!hasRedirected) {
          hasRedirected = true;
          setStatus('success');
          window.history.replaceState(null, '', window.location.pathname);
          navigate('/', { replace: true });
        }
      }
    });

    // Also check session immediately and periodically
    void checkSession();
    const intervalId = setInterval(() => {
      if (!hasRedirected) {
        void checkSession();
      }
    }, 500);

    // Timeout after 10 seconds
    timeoutId = setTimeout(() => {
      if (!hasRedirected) {
        console.warn('[AuthCallback] Timeout waiting for authentication');
        setError('Authentication timed out. Please try again.');
        setStatus('error');
        subscription.unsubscribe();
        clearInterval(intervalId);
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [navigate]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600"></div>
          <p className="mt-4 text-gray-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="mx-auto h-12 w-12 text-red-500">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold">Authentication Failed</h2>
          <p className="mt-2 text-sm text-gray-600">{error || 'An error occurred during authentication'}</p>
          <p className="mt-4 text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-300">
          <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">Authentication Successful!</h3>
        <p className="mt-2 text-gray-600">Redirecting you to the home page...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

