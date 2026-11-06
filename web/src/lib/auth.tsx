import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { request, type RequestOptions } from './api';
import { isSupabaseConfigured, supabase } from './supabase';
import type { AdminUser, ApiEnvelope } from './types';

interface AuthContextValue {
  user: AdminUser | null;
  session: Session | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  adminRequest: <T>(path: string, opts?: Omit<RequestOptions, 'token'>) => Promise<ApiEnvelope<T>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAdminProfile = useCallback(async (accessToken: string) => {
    try {
      const res = await request<AdminUser>('/auth/me', { token: accessToken });
      setUser(res.data);
      setError(null);
    } catch (err) {
      setUser(null);
      setError(err instanceof Error ? err.message : 'Not authorized as admin');
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);
      if (initialSession?.access_token) {
        await loadAdminProfile(initialSession.access_token);
      }
      if (mounted) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.access_token) {
        await loadAdminProfile(nextSession.access_token);
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadAdminProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setError(null);
      const { data, error: sbErr } = await supabase.auth.signInWithPassword({ email, password });
      if (sbErr) throw new Error(sbErr.message);
      if (!data.session?.access_token) throw new Error('No session returned from Supabase Auth');
      setSession(data.session);
      const res = await request<AdminUser>('/auth/me', { token: data.session.access_token });
      setUser(res.data);
    },
    [],
  );

  const signOut = useCallback(async () => {
    const token = session?.access_token;
    if (token) {
      try {
        await request('/auth/logout', { method: 'POST', token });
      } catch {
        /* ignore logout audit errors */
      }
    }
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, [session?.access_token]);

  const adminRequest = useCallback(
    async <T,>(path: string, opts: Omit<RequestOptions, 'token'> = {}): Promise<ApiEnvelope<T>> => {
      const token = session?.access_token ?? (await supabase.auth.getSession()).data.session?.access_token ?? null;
      return request<T>(path, { ...opts, token });
    },
    [session?.access_token],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token: session?.access_token ?? null,
        loading,
        error,
        signIn,
        signOut,
        adminRequest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-root min-h-screen flex items-center justify-center bg-[#f4f6f9] text-[#0D2240]">
        <div className="text-sm font-medium tracking-wide">Verifying admin session…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

