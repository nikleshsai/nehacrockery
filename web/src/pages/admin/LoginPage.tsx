import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { user, loading, signIn, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email.trim() || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-root min-h-screen flex items-center justify-center p-4 bg-navy">
      <Seo title="Admin Sign In – Neha Crockery House" noindex />
      <div className="w-full max-w-md bg-white rounded-2xl shadow-brand-lg p-8">
        <div className="text-center mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold mb-1">
            Neha Crockery House
          </p>
          <h1 className="font-serif text-3xl font-semibold text-navy">Admin Sign In</h1>
          <p className="text-xs text-charcoal-lt mt-1">
            Sign in with your administrator account
          </p>
        </div>

        {(formError || authError) && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs"
          >
            {formError || authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="admin-email" className="block text-xs font-semibold text-charcoal mb-1">
              Email Address
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@nehacrockery.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-greige-2 text-sm focus:outline-none focus:border-navy"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-semibold text-charcoal mb-1">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-greige-2 text-sm focus:outline-none focus:border-navy"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg bg-navy text-white text-xs font-semibold uppercase tracking-wider hover:bg-navy-mid transition-colors disabled:opacity-60 cursor-pointer"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-charcoal-lt hover:text-navy">
            &#8592; Return to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}

