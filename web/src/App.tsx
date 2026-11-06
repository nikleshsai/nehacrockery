import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
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

export default function App() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>}>
      <Routes>
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

