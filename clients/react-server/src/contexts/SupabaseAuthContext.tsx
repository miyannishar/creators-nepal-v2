import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  description: string | null;
  banner_url: string | null;
  role: 'user' | 'creator' | 'admin';
  email_verified: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface CreatorProfile {
  id: string;
  user_id: string;
  bio: string | null;
  category: string | null;
  website_url: string | null;
  twitter_handle: string | null;
  instagram_handle: string | null;
  youtube_channel: string | null;
  total_earnings: number;
  supporters_count: number;
  followers_count: number;
  posts_count: number;
  likes_count: number;
  series_count: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  creatorProfile: CreatorProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isCreator: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<{ data: any; error: any }>;
  signInWithEmail: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateUserRole: (role: 'user' | 'creator') => Promise<{ error: any }>;
  createCreatorProfile: (
    bio: string,
    category: string,
    websiteUrl?: string,
    socialHandles?: {
      twitter?: string;
      instagram?: string;
      youtube?: string;
    }
  ) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialLoadCompleteRef = useRef(false);

  // Load user profile data
  const loadUserProfile = async (userId: string) => {
    console.log('[Auth] Loading user profile for userId:', userId);
    const startTime = Date.now();
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const loadTime = Date.now() - startTime;
      console.log('[Auth] User profile query completed in', loadTime, 'ms', { 
        hasProfile: !!profile, 
        error: error?.message,
        profileId: profile?.id 
      });

      if (error) {
        console.error('[Auth] Error loading user profile:', error);
        setUserProfile(null);
        setCreatorProfile(null);
        console.log('[Auth] Profile set to null due to error');
        return;
      }

      console.log('[Auth] User profile loaded:', { id: profile?.id, email: profile?.email, role: profile?.role });
      setUserProfile(profile);
      console.log('[Auth] userProfile state updated');

      // If user is a creator, load creator profile
      if (profile.role === 'creator' || profile.role === 'admin') {
        console.log('[Auth] Loading creator profile for user:', userId);
        const creatorStartTime = Date.now();
        const { data: creator, error: creatorError } = await supabase
          .from('creator_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        const creatorLoadTime = Date.now() - creatorStartTime;
        console.log('[Auth] Creator profile query completed in', creatorLoadTime, 'ms', {
          hasCreator: !!creator,
          error: creatorError?.message
        });

        if (creatorError) {
          console.error('[Auth] Error loading creator profile:', creatorError);
          setCreatorProfile(null);
          console.log('[Auth] Creator profile set to null due to error');
        } else {
          console.log('[Auth] Creator profile loaded:', creator);
          setCreatorProfile(creator);
          console.log('[Auth] creatorProfile state updated');
        }
      } else {
        console.log('[Auth] User is not a creator, skipping creator profile load');
        setCreatorProfile(null);
        console.log('[Auth] creatorProfile set to null (not a creator)');
      }
      
      console.log('[Auth] loadUserProfile completed successfully');
    } catch (error) {
      const loadTime = Date.now() - startTime;
      console.error('[Auth] Exception in loadUserProfile after', loadTime, 'ms:', error);
      setUserProfile(null);
      setCreatorProfile(null);
      console.log('[Auth] Profile set to null due to exception');
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    console.log('[Auth] Refreshing profile, user:', user?.id);
    if (user) {
      await loadUserProfile(user.id);
    } else {
      console.warn('[Auth] Cannot refresh profile: no user');
    }
  };

  // Initialize auth state
  useEffect(() => {
    console.log('[Auth] Initializing auth state...');
    setLoading(true);
    initialLoadCompleteRef.current = false;

    // Listen for auth changes - this fires immediately with INITIAL_SESSION
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      const eventStartTime = Date.now();
      console.log('[Auth] Auth state changed:', { 
        event, 
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        initialLoadComplete: initialLoadCompleteRef.current
      });
      
      console.log('[Auth] Setting session and user state...');
      setSession(session);
      setUser(session?.user ?? null);
      console.log('[Auth] Session and user state updated');

      // Start profile loading but don't wait for it - set loading to false immediately
      // This prevents the UI from hanging if profile query is slow
      if (session?.user) {
        console.log('[Auth] Session found, will load profile for:', session.user.id);
        // Load profile in background - don't block on it
        loadUserProfile(session.user.id).catch((err) => {
          console.error('[Auth] Background profile loading failed:', err);
        });
      } else {
        console.log('[Auth] No session, clearing profile data');
        setUserProfile(null);
        setCreatorProfile(null);
        console.log('[Auth] Profile data cleared');
      }

      // CRITICAL: Always set loading to false immediately after setting user
      // Don't wait for profile to load - user is authenticated, profile can load in background
      console.log('[Auth] Setting initialLoadCompleteRef to true');
      initialLoadCompleteRef.current = true;
      console.log('[Auth] Setting loading to false immediately (profile will load in background)...');
      setLoading(false);
      const eventTime = Date.now() - eventStartTime;
      console.log('[Auth] Auth state change handled in', eventTime, 'ms, loading:', false, 'event:', event);
      
      // Force a state update check
      setTimeout(() => {
        console.log('[Auth] Post-setLoading check - loading should be false now');
      }, 0);
      
      // Note: We can't log state values here due to closure, but the context value update will log them
    });

    return () => {
      console.log('[Auth] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    console.log('[Auth] Initiating Google sign in...');
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('[Auth] Google sign in error:', error);
      } else {
        console.log('[Auth] Google sign in initiated, redirecting...', { url: data?.url });
      }

      // Note: OAuth returns a redirect URL, not user data directly
      return { data: { url: data?.url }, error };
    } catch (err) {
      console.error('[Auth] Exception during Google sign in:', err);
      return { data: null, error: err };
    }
  };

  // Sign in with email
  const signInWithEmail = async (email: string, password: string) => {
    console.log('[Auth] Signing in with email:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Email sign in error:', error);
      } else {
        console.log('[Auth] Email sign in successful:', { userId: data.user?.id, email: data.user?.email });
      }

      if (!error && data.user) {
        console.log('[Auth] Loading profile after email sign in...');
        await loadUserProfile(data.user.id);
      }

      return { data, error };
    } catch (err) {
      console.error('[Auth] Exception during email sign in:', err);
      return { data: null, error: err };
    }
  };

  // Sign up with email
  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    console.log('[Auth] Signing up with email:', { email, displayName });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        console.error('[Auth] Email sign up error:', error);
      } else {
        console.log('[Auth] Email sign up successful:', { 
          userId: data.user?.id, 
          email: data.user?.email,
          needsConfirmation: !data.session 
        });
      }

      if (!error && data.user) {
        console.log('[Auth] Profile will be created via trigger, loading profile...');
        // Profile will be created automatically via trigger
        await loadUserProfile(data.user.id);
      }

      return { data, error };
    } catch (err) {
      console.error('[Auth] Exception during email sign up:', err);
      return { data: null, error: err };
    }
  };

  // Sign out
  const signOut = async () => {
    console.log('[Auth] Signing out...');
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[Auth] Sign out error:', error);
      } else {
        console.log('[Auth] Sign out successful, clearing state');
        setUser(null);
        setUserProfile(null);
        setCreatorProfile(null);
        setSession(null);
      }

      return { error };
    } catch (err) {
      console.error('[Auth] Exception during sign out:', err);
      return { error: err };
    }
  };

  // Update user role
  const updateUserRole = async (role: 'user' | 'creator') => {
    if (!user) {
      return { error: new Error('Not authenticated') };
    }

    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', user.id);

    if (!error) {
      await loadUserProfile(user.id);
    }

    return { error };
  };

  // Create creator profile
  const createCreatorProfile = async (
    bio: string,
    category: string,
    websiteUrl?: string,
    socialHandles?: {
      twitter?: string;
      instagram?: string;
      youtube?: string;
    }
  ) => {
    if (!user) {
      return { error: new Error('Not authenticated') };
    }

    // First update user role to creator
    const { error: roleError } = await updateUserRole('creator');
    if (roleError) {
      return { error: roleError };
    }

    // Then create creator profile
    const { error } = await supabase.from('creator_profiles').insert({
      user_id: user.id,
      bio,
      category,
      website_url: websiteUrl,
      twitter_handle: socialHandles?.twitter,
      instagram_handle: socialHandles?.instagram,
      youtube_channel: socialHandles?.youtube,
    });

    if (!error) {
      await loadUserProfile(user.id);
    }

    return { error };
  };

  const value: AuthContextType = {
    user,
    userProfile,
    creatorProfile,
    session,
    isAuthenticated: !!user,
    isCreator: userProfile?.role === 'creator' || userProfile?.role === 'admin',
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    updateUserRole,
    createCreatorProfile,
    refreshProfile,
  };

  // Log context value changes (but not on every render to avoid spam)
  useEffect(() => {
    console.log('[Auth] Context value updated:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasProfile: !!userProfile,
      profileId: userProfile?.id,
      profileEmail: userProfile?.email,
      hasCreatorProfile: !!creatorProfile,
      isAuthenticated: !!user,
      loading,
      hasSession: !!session,
      timestamp: new Date().toISOString()
    });
  }, [user?.id, userProfile?.id, creatorProfile?.id, loading, session?.user?.id]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

