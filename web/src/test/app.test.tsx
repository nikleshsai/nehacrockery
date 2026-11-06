import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { SettingsProvider } from '@/lib/settings';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/admin/LoginPage';
import { AuthProvider } from '@/lib/auth';

describe('React + Vite Pages', () => {
  it('renders HomePage with brand hero heading', () => {
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/']}>
          <SettingsProvider>
            <HomePage />
          </SettingsProvider>
        </MemoryRouter>
      </HelmetProvider>,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Chennai's Premier/i);
    expect(screen.getByText(/Explore Products/i)).toBeInTheDocument();
  });

  it('renders Admin LoginPage at /admin/login', () => {
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/admin/login']}>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </MemoryRouter>
      </HelmetProvider>,
    );

    expect(screen.getByRole('heading', { name: /Admin Sign In/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });
});

