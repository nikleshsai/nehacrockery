import fs from 'node:fs';
import path from 'node:path';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { EnquiryForm } from '@/components/site/EnquiryForm';
import { SettingsProvider } from '@/lib/settings';
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import ProductsPage from '@/pages/ProductsPage';
import CataloguePage from '@/pages/CataloguePage';
import PrivacyPage from '@/pages/PrivacyPage';
import TermsPage from '@/pages/TermsPage';

const repoRoot = path.resolve(__dirname, '../../..');

function renderWithProviders(ui: React.ReactElement, initialEntries = ['/']) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <SettingsProvider>{ui}</SettingsProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('Website Bug Report Verification Suite (Issues 1–12 & Step 2)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Issue 1, 2 & 4: vercel.json configures 308 redirects for /frontend/admin, /frontend/*, and *.html, and root index.html redirect stub is removed', () => {
    const vercelConfig = JSON.parse(fs.readFileSync(path.join(repoRoot, 'vercel.json'), 'utf8'));
    expect(Array.isArray(vercelConfig.redirects)).toBe(true);

    const redirectSources = vercelConfig.redirects.map((r: { source: string }) => r.source);
    expect(redirectSources).toContain('/frontend/admin');
    expect(redirectSources).toContain('/frontend');
    expect(redirectSources).toContain('/frontend/index.html');
    expect(redirectSources).toContain('/index.html');

    // Root index.html redirect stub must not exist to intercept '/'
    expect(fs.existsSync(path.join(repoRoot, 'index.html'))).toBe(false);
    // Fallback redirect stub at frontend/admin/index.html must exist
    expect(fs.existsSync(path.join(repoRoot, 'frontend/admin/index.html'))).toBe(true);
  });

  it('Issue 1 & 2 (SPA Routing): /frontend/admin redirects to /admin/login when unauthenticated', async () => {
    renderWithProviders(<App />, ['/frontend/admin']);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Admin Sign In/i })).toBeInTheDocument();
    });
  });

  it('Issue 3: ProductsPage handles loading, error + retry, empty + reset filters, and category slug normalization', async () => {
    // 1. Simulate API failure -> shows error state, updates #products-count, and provides Retry button
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network failure'));

    const { unmount } = renderWithProviders(<ProductsPage />, ['/products']);
    expect(document.getElementById('products-count')?.textContent).toBe('Loading products…');

    await waitFor(() => {
      expect(document.getElementById('products-count')?.textContent).toBe('Unable to load products');
    });
    expect(document.getElementById('products-retry-btn')).toBeInTheDocument();
    unmount();

    // 2. Simulate API success with DB category slug 'crockery-dinnerware'
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [
          {
            id: 'prod-1',
            name: 'Opalware Dinner Set 32 Pcs',
            slug: 'opalware-dinner-set-32-pcs',
            productCode: 'NCH-001',
            isFeatured: true,
            isNewArrival: true,
            category: { id: 'c1', name: 'Crockery & Dinnerware', slug: 'crockery-dinnerware' },
            brand: { id: 'b1', name: 'Larah', slug: 'larah' },
            images: [],
          },
        ],
        pagination: { totalPages: 1 },
      }),
    } as Response);

    renderWithProviders(<ProductsPage />, ['/products?category=crockery']);
    await waitFor(() => {
      expect(screen.getByText('Opalware Dinner Set 32 Pcs')).toBeInTheDocument();
    });
    expect(document.getElementById('products-count')?.textContent).toBe('Showing 1 of 1 products');

    // Filter to a non-matching search term -> shows 0 products found + Reset Filters button
    const searchInput = document.getElementById('products-search') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'nonexistent-xyz' } });
    expect(document.getElementById('products-count')?.textContent).toBe('0 products found');
    const resetBtn = document.getElementById('products-reset-btn');
    expect(resetBtn).toBeInTheDocument();

    fireEvent.click(resetBtn!);
    expect(document.getElementById('products-count')?.textContent).toBe('Showing 1 of 1 products');
  });

  it('Issue 5, 7 & 8: Header & Footer have space in "Neha Crockery House", decorative logo alt="", accessible WhatsApp aria-label, and inert mobile menu', () => {
    renderWithProviders(
      <>
        <Header />
        <Footer />
      </>,
    );

    const logoLink = document.getElementById('logo-link')!;
    expect(logoLink.textContent).toBe('Neha Crockery House');
    expect(logoLink.querySelector('img')?.getAttribute('alt')).toBe('');

    const footerLogoText = document.querySelector('.footer-logo-text')!;
    expect(footerLogoText.textContent).toBe('Neha Crockery House');
    expect(document.querySelector('.footer-logo-img')?.getAttribute('alt')).toBe('');

    const headerWa = document.getElementById('header-whatsapp')!;
    expect(headerWa.getAttribute('aria-label')).toBe('Chat with Neha Crockery House on WhatsApp');

    const mobileMenu = document.getElementById('mobile-menu')!;
    const toggleBtn = document.getElementById('mobile-toggle')!;
    expect(mobileMenu.getAttribute('aria-hidden')).toBe('true');
    expect(mobileMenu.hasAttribute('inert')).toBe(true);

    // Open mobile menu
    fireEvent.click(toggleBtn);
    expect(mobileMenu.getAttribute('aria-hidden')).toBe('false');
    expect(mobileMenu.hasAttribute('inert')).toBe(false);

    // Press Escape to close mobile menu
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mobileMenu.getAttribute('aria-hidden')).toBe('true');
    expect(mobileMenu.hasAttribute('inert')).toBe(true);
  });

  it('Issue 6, 7 & 9: HomePage & AboutPage have consistent "over 30 years", accessible hero/about images, and phone number in desktop Call CTA', () => {
    renderWithProviders(
      <>
        <HomePage />
        <AboutPage />
        <CataloguePage />
      </>,
    );

    expect(document.body.textContent).not.toContain('over 30+ years');
    expect(document.querySelector('.hero-right')?.hasAttribute('aria-hidden')).toBe(false);
    expect(document.querySelector('.about-img-col')?.hasAttribute('aria-hidden')).toBe(false);

    const callCta = document.getElementById('hero-call-cta')!;
    expect(callCta.textContent).toContain('+91 97102 54681');
    expect(callCta.getAttribute('title')).toContain('+91 97102 54681');
  });

  it('Issue 12 & Step 2: Privacy Policy, Terms & Conditions, and EnquiryForm phone validation work accurately', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderWithProviders(
      <>
        <PrivacyPage />
        <TermsPage />
        <EnquiryForm source="test" idPrefix="test" />
      </>,
    );

    expect(document.body.textContent).toContain('localStorage');
    expect(document.body.textContent).toContain('indicative MRP');

    // Submit form with invalid short phone number
    fireEvent.change(document.getElementById('test-name')!, { target: { value: 'Test Buyer' } });
    fireEvent.change(document.getElementById('test-phone')!, { target: { value: '123' } });
    fireEvent.change(document.getElementById('test-message')!, { target: { value: 'Need 50 dinner sets' } });
    fireEvent.submit(document.getElementById('test-enquiry-form')!);

    expect(alertSpy).toHaveBeenCalledWith(expect.stringMatching(/valid phone/i));
  });

  it('Static HTML Verification: All 10 frontend/*.html files use clean URLs, canonical tags, brand spacing, and accessible markup', () => {
    const htmlFiles = [
      'index.html',
      'about.html',
      'products.html',
      'product.html',
      'brands.html',
      'taroba.html',
      'catalogue.html',
      'contact.html',
      'privacy.html',
      'terms.html',
    ];

    for (const file of htmlFiles) {
      const content = fs.readFileSync(path.join(repoRoot, 'frontend', file), 'utf8');
      expect(content, `${file} should have canonical link`).toContain('rel="canonical"');
      expect(content, `${file} should have spaced brand name`).toContain(
        '<span class="logo-name">Neha Crockery</span> <span class="logo-tagline">House</span>',
      );
      expect(content, `${file} should have inert mobile menu`).toContain('id="mobile-menu" aria-hidden="true" inert');
      expect(content, `${file} should not have .html nav links`).not.toMatch(/href="(index|about|products|brands|taroba|catalogue|contact|privacy|terms)\.html"/);
    }
  });
});

