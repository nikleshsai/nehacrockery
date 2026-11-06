import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { SiteLayout } from '@/components/site/SiteLayout';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AuthProvider, RequireAuth } from '@/lib/auth';

const HomePage = lazy(() => import('@/pages/HomePage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const BrandsPage = lazy(() => import('@/pages/BrandsPage'));
const TarobaPage = lazy(() => import('@/pages/TarobaPage'));
const CataloguePage = lazy(() => import('@/pages/CataloguePage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const LoginPage = lazy(() => import('@/pages/admin/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const ProductsAdminPage = lazy(() => import('@/pages/admin/ProductsAdminPage'));
const EnquiriesPage = lazy(() => import('@/pages/admin/EnquiriesPage'));
const CategoriesPage = lazy(() => import('@/pages/admin/CategoriesPage'));
const BrandsAdminPage = lazy(() => import('@/pages/admin/BrandsAdminPage'));
const CataloguesPage = lazy(() => import('@/pages/admin/CataloguesPage'));
const SalesPage = lazy(() => import('@/pages/admin/SalesPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));
const AuditLogsPage = lazy(() => import('@/pages/admin/AuditLogsPage'));
const ShopMediaPage = lazy(() => import('@/pages/admin/ShopMediaPage'));

/** Redirects legacy `/product?slug=foo` or `/frontend/product.html?slug=foo` to `/product/foo`. */
function LegacyProductQueryRedirect() {
  const [params] = useSearchParams();
  const slug = params.get('slug');
  return <Navigate to={slug ? `/product/${encodeURIComponent(slug)}` : '/products'} replace />;
}

/** Preserves query string when redirecting legacy `.html` or `/frontend/*` routes. */
function PreserveQueryRedirect({ to }: { to: string }) {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>}>
      <Routes>
        {/* Legacy /frontend/admin and .html redirects */}
        <Route path="frontend/admin" element={<Navigate to="/admin" replace />} />
        <Route path="frontend/admin/*" element={<Navigate to="/admin" replace />} />
        <Route path="frontend" element={<PreserveQueryRedirect to="/" />} />
        <Route path="frontend/index" element={<PreserveQueryRedirect to="/" />} />
        <Route path="frontend/index.html" element={<PreserveQueryRedirect to="/" />} />
        <Route path="index.html" element={<PreserveQueryRedirect to="/" />} />
        <Route path="frontend/about" element={<PreserveQueryRedirect to="/about" />} />
        <Route path="frontend/about.html" element={<PreserveQueryRedirect to="/about" />} />
        <Route path="about.html" element={<PreserveQueryRedirect to="/about" />} />
        <Route path="frontend/products" element={<PreserveQueryRedirect to="/products" />} />
        <Route path="frontend/products.html" element={<PreserveQueryRedirect to="/products" />} />
        <Route path="products.html" element={<PreserveQueryRedirect to="/products" />} />
        <Route path="product" element={<LegacyProductQueryRedirect />} />
        <Route path="product.html" element={<LegacyProductQueryRedirect />} />
        <Route path="frontend/product" element={<LegacyProductQueryRedirect />} />
        <Route path="frontend/product.html" element={<LegacyProductQueryRedirect />} />
        <Route path="frontend/brands" element={<PreserveQueryRedirect to="/brands" />} />
        <Route path="frontend/brands.html" element={<PreserveQueryRedirect to="/brands" />} />
        <Route path="brands.html" element={<PreserveQueryRedirect to="/brands" />} />
        <Route path="frontend/taroba" element={<PreserveQueryRedirect to="/taroba" />} />
        <Route path="frontend/taroba.html" element={<PreserveQueryRedirect to="/taroba" />} />
        <Route path="taroba.html" element={<PreserveQueryRedirect to="/taroba" />} />
        <Route path="frontend/catalogue" element={<PreserveQueryRedirect to="/catalogue" />} />
        <Route path="frontend/catalogue.html" element={<PreserveQueryRedirect to="/catalogue" />} />
        <Route path="catalogue.html" element={<PreserveQueryRedirect to="/catalogue" />} />
        <Route path="frontend/contact" element={<PreserveQueryRedirect to="/contact" />} />
        <Route path="frontend/contact.html" element={<PreserveQueryRedirect to="/contact" />} />
        <Route path="contact.html" element={<PreserveQueryRedirect to="/contact" />} />
        <Route path="frontend/privacy" element={<PreserveQueryRedirect to="/privacy" />} />
        <Route path="frontend/privacy.html" element={<PreserveQueryRedirect to="/privacy" />} />
        <Route path="privacy.html" element={<PreserveQueryRedirect to="/privacy" />} />
        <Route path="frontend/terms" element={<PreserveQueryRedirect to="/terms" />} />
        <Route path="frontend/terms.html" element={<PreserveQueryRedirect to="/terms" />} />
        <Route path="terms.html" element={<PreserveQueryRedirect to="/terms" />} />

        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="product/:slug" element={<ProductDetailPage />} />
          <Route path="brands" element={<BrandsPage />} />
          <Route path="taroba" element={<TarobaPage />} />
          <Route path="catalogue" element={<CataloguePage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
        </Route>

        <Route path="admin/login" element={<AuthProvider><LoginPage /></AuthProvider>} />
        <Route
          path="admin"
          element={
            <AuthProvider>
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            </AuthProvider>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsAdminPage />} />
          <Route path="enquiries" element={<EnquiriesPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="brands" element={<BrandsAdminPage />} />
          <Route path="catalogues" element={<CataloguesPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="shop-media" element={<ShopMediaPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
        </Route>

        <Route element={<SiteLayout />}>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

