import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getAuthRedirectUrl, createSessionFromUrl } from '@/lib/authRedirect';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configured: boolean;
  /** True after an email password-reset link is opened; route to the reset screen. */
  recoveryMode: boolean;
  endRecoveryMode: () => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  resendConfirmation: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  configured: true,
  recoveryMode: false,
  endRecoveryMode: () => {},
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  resendConfirmation: async () => ({ error: null }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        if (!mounted) return;
        setSession(s);
        setLoading(false);
      })
      .catch((e) => {
        if (__DEV__) console.warn('[auth] getSession failed', e);
        if (!mounted) return;
        setSession(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;
      setSession(s);
      setLoading(false);
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Native deep links: email confirmation / magic / reset links open the app
  // via the overflow-rentals:// scheme. Web handles this automatically through
  // detectSessionInUrl, so this effect is native-only.
  useEffect(() => {
    if (Platform.OS === 'web' || !isSupabaseConfigured) return;
    let active = true;

    const handleUrl = async (url: string | null) => {
      if (!url) return;
      try {
        const { type } = await createSessionFromUrl(url);
        if (active && type === 'recovery') setRecoveryMode(true);
      } catch (e) {
        if (__DEV__) console.warn('[auth] deep-link session failed', e);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (active) handleUrl(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: (error as Error) ?? null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name }, emailRedirectTo: getAuthRedirectUrl() },
      });
      return { error: (error as Error) ?? null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      if (__DEV__) console.warn('[auth] signOut failed', e);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthRedirectUrl(),
      });
      return { error: (error as Error) ?? null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      return { error: (error as Error) ?? null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: getAuthRedirectUrl() },
      });
      return { error: (error as Error) ?? null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const endRecoveryMode = useCallback(() => setRecoveryMode(false), []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        configured: isSupabaseConfigured,
        recoveryMode,
        endRecoveryMode,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        resendConfirmation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
