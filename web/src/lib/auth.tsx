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
const TOKEN_STORAGE_KEY = 'nch_admin_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [backendToken, setBackendToken] = useState<string | null>(() => {
    try {
      return typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_STORAGE_KEY) : null;
    } catch {
      return null;
    }
  });
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
    let mounted = true;

    if (!isSupabaseConfigured) {
      if (backendToken) {
        loadAdminProfile(backendToken).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
      return () => {
        mounted = false;
      };
    }

    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);
      const tokenToUse = initialSession?.access_token ?? backendToken;
      if (tokenToUse) {
        await loadAdminProfile(tokenToUse);
      }
      if (mounted) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.access_token) {
        await loadAdminProfile(nextSession.access_token);
      } else if (!backendToken) {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [backendToken, loadAdminProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const loginRes = await request<{ token: string; user: AdminUser }>('/auth/login', {
          method: 'POST',
          body: { email, password },
        });
        if (loginRes.data?.token) {
          setBackendToken(loginRes.data.token);
          try {
            sessionStorage.setItem(TOKEN_STORAGE_KEY, loginRes.data.token);
          } catch {
            /* ignore storage errors */
          }
          setUser(loginRes.data.user);
          return;
        }
      } catch (err) {
        if (!isSupabaseConfigured) {
          throw err;
        }
      }

      const { data, error: sbErr } = await supabase.auth.signInWithPassword({ email, password });
      if (sbErr) throw new Error(sbErr.message);
      if (!data.session?.access_token) throw new Error('No session returned from Supabase Auth');
      setSession(data.session);
      try {
        sessionStorage.setItem(TOKEN_STORAGE_KEY, data.session.access_token);
      } catch {
        /* ignore storage errors */
      }
      const res = await request<AdminUser>('/auth/me', { token: data.session.access_token });
      setUser(res.data);
    },
    [],
  );

  const signOut = useCallback(async () => {
    const token = session?.access_token ?? backendToken;
    if (token) {
      try {
        await request('/auth/logout', { method: 'POST', token });
      } catch {
        /* ignore logout audit errors */
      }
    }
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      /* ignore storage errors */
    }
    setBackendToken(null);
    setSession(null);
    setUser(null);
  }, [backendToken, session?.access_token]);

  const adminRequest = useCallback(
    async <T,>(path: string, opts: Omit<RequestOptions, 'token'> = {}): Promise<ApiEnvelope<T>> => {
      const token =
        session?.access_token ??
        backendToken ??
        (isSupabaseConfigured ? (await supabase.auth.getSession()).data.session?.access_token : null) ??
        null;
      return request<T>(path, { ...opts, token });
    },
    [backendToken, session?.access_token],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token: session?.access_token ?? backendToken ?? null,
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

