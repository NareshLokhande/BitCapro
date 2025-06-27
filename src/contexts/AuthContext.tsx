import { Session, User } from '@supabase/supabase-js';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Submitter' | 'Approver_L1' | 'Approver_L2' | 'Approver_L3' | 'Approver_L4';
  department: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>; // eslint-disable-line @typescript-eslint/no-explicit-any
  signUp: (
    email: string,
    password: string,
    userData: { name: string; role: string; department: string },
  ) => Promise<{ error: any }>; // eslint-disable-line @typescript-eslint/no-explicit-any
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isApprover: boolean;
  isSubmitter: boolean;
  canApprove: (amount: number) => boolean;
  resetTimeout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Auto logout timeout in milliseconds (30 minutes)
const AUTO_LOGOUT_TIMEOUT = 30 * 60 * 1000;

// Warning timeout (5 minutes before auto logout)
const WARNING_TIMEOUT = 25 * 60 * 1000;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const mountedRef = useRef(true);
  const initializingRef = useRef(false);
  const profileFetchedRef = useRef(false);

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    setShowTimeoutWarning(false);
  }, []);

  const handleAutoLogout = useCallback(async () => {
    console.log('Auto logout triggered due to inactivity');
    await signOut();
    // Redirect to login page with timeout message
    window.location.href = '/login?timeout=true';
  }, []);

  const showWarning = useCallback(() => {
    setShowTimeoutWarning(true);
    console.log('Session timeout warning shown');
  }, []);

  const resetTimeout = useCallback(() => {
    if (!user) return;

    lastActivityRef.current = Date.now();
    clearTimeouts();

    // Set warning timeout (5 minutes before logout)
    warningTimeoutRef.current = setTimeout(showWarning, WARNING_TIMEOUT);

    // Set auto logout timeout (30 minutes)
    timeoutRef.current = setTimeout(handleAutoLogout, AUTO_LOGOUT_TIMEOUT);
  }, [user, clearTimeouts, handleAutoLogout, showWarning]);

  // Force loading to false after 5 seconds to prevent infinite loading
  useEffect(() => {
    const forceLoadingTimeout = setTimeout(() => {
      if (mountedRef.current && loading && !authInitialized) {
        console.log('Force stopping loading after timeout');
        setLoading(false);
        setAuthInitialized(true);
      }
    }, 5000);

    return () => clearTimeout(forceLoadingTimeout);
  }, [loading, authInitialized]);

  // Track user activity
  useEffect(() => {
    if (!user) return;

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const resetTimeoutHandler = () => {
      const now = Date.now();
      // Only reset if it's been more than 1 minute since last activity (to avoid excessive resets)
      if (now - lastActivityRef.current > 60000) {
        resetTimeout();
      }
    };

    // Add event listeners for user activity
    events.forEach((event) => {
      document.addEventListener(event, resetTimeoutHandler, true);
    });

    // Initial timeout setup
    resetTimeout();

    return () => {
      // Cleanup event listeners
      events.forEach((event) => {
        document.removeEventListener(event, resetTimeoutHandler, true);
      });
      clearTimeouts();
    };
  }, [user, resetTimeout, clearTimeouts]);

  // Handle session timeout warning
  useEffect(() => {
    if (!showTimeoutWarning) return;

    const handleWarningResponse = (extend: boolean) => {
      if (extend) {
        resetTimeout();
      } else {
        handleAutoLogout();
      }
    };

    // Show browser confirmation dialog
    const extendSession = window.confirm(
      'Your session will expire in 5 minutes due to inactivity. Would you like to extend your session?',
    );

    handleWarningResponse(extendSession);
  }, [showTimeoutWarning, resetTimeout, handleAutoLogout]);

  useEffect(() => {
    mountedRef.current = true;

    // Prevent multiple initializations
    if (initializingRef.current) {
      return;
    }

    // Get initial session
    const initializeAuth = async () => {
      if (initializingRef.current) return;

      initializingRef.current = true;

      try {
        console.log('Initializing auth...');

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          if (mountedRef.current) {
            setLoading(false);
            setAuthInitialized(true);
          }
          return;
        }

        console.log('Session retrieved:', session?.user?.email || 'No session');

        if (mountedRef.current) {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user && !profileFetchedRef.current) {
            await fetchUserProfile(session.user.id);
          } else {
            setLoading(false);
            setAuthInitialized(true);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mountedRef.current) {
          setLoading(false);
          setAuthInitialized(true);
        }
      } finally {
        initializingRef.current = false;
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        'Auth state changed:',
        event,
        session?.user?.email || 'No user',
      );

      if (mountedRef.current) {
        setSession(session);
        setUser(session?.user ?? null);

        // Only fetch profile if this is not a sign in event (which we handle in signIn function)
        if (
          session?.user &&
          !profileFetchedRef.current &&
          event !== 'SIGNED_IN'
        ) {
          await fetchUserProfile(session.user.id);
        } else if (!session?.user) {
          setProfile(null);
          profileFetchedRef.current = false;
          setLoading(false);
          setAuthInitialized(true);
          clearTimeouts(); // Clear timeouts when user logs out
        }
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      clearTimeouts();
    };
  }, [clearTimeouts]);

  const fetchUserProfile = async (
    userId: string,
    forceFetch: boolean = false,
  ) => {
    // Prevent multiple profile fetches unless forced (like during sign in)
    if (profileFetchedRef.current && !forceFetch) {
      if (mountedRef.current) {
        setLoading(false);
        setAuthInitialized(true);
      }
      return;
    }

    try {
      console.log('Fetching user profile for:', userId);
      profileFetchedRef.current = true;

      // First check if user profile exists
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        // If profile doesn't exist, we'll handle this gracefully
        setProfile(null);
      } else if (data) {
        console.log('User profile found:', data);
        setProfile(data);
      } else {
        // Profile doesn't exist - this is expected for new users
        console.log('No user profile found for user:', userId);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setAuthInitialized(true);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    profileFetchedRef.current = false; // Reset profile fetch flag
    try {
      console.log('Attempting to sign in:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        setLoading(false);
        return { error };
      }

      console.log('Sign in successful');

      // Update user state immediately after successful sign in
      if (data.user) {
        setUser(data.user);
        setSession(data.session);

        // Fetch user profile with force flag
        await fetchUserProfile(data.user.id, true);
      }

      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('Sign in exception:', error);
      setLoading(false);
      return { error };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: { name: string; role: string; department: string },
  ) => {
    setLoading(true);
    profileFetchedRef.current = false; // Reset profile fetch flag
    try {
      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setLoading(false);
        return { error: authError };
      }

      // If user was created successfully, create the profile
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authData.user.id,
            email: email,
            name: userData.name,
            role: userData.role,
            department: userData.department,
            active: true,
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Don't return error here as auth user was created successfully
        }
      }

      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    setLoading(true);
    clearTimeouts(); // Clear all timeouts when signing out
    profileFetchedRef.current = false; // Reset profile fetch flag
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setAuthInitialized(false);
    setLoading(false);
  };

  // Helper functions for role checking
  const isAdmin = profile?.role === 'Admin';
  const isApprover = profile?.role?.startsWith('Approver_') || false;
  const isSubmitter = profile?.role === 'Submitter';

  const canApprove = (amount: number) => {
    if (!profile || !isApprover) return false;

    // This would typically check against the approval matrix
    // For now, simplified logic based on role level
    const level = parseInt(profile.role.split('_')[1] || '0');

    if (level === 1) return amount <= 50000;
    if (level === 2) return amount <= 200000;
    if (level === 3) return amount <= 500000;
    if (level === 4) return true; // CEO can approve anything

    return false;
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isApprover,
    isSubmitter,
    canApprove,
    resetTimeout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
