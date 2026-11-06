import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/enquiries', label: 'Enquiries' },
  { to: '/admin/sales', label: 'Sales & Orders' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/brands', label: 'Brands' },
  { to: '/admin/catalogues', label: 'Catalogues (PDF)' },
  { to: '/admin/shop-media', label: 'Shop Gallery' },
  { to: '/admin/settings', label: 'Site Settings' },
  { to: '/admin/audit-logs', label: 'Audit Logs' },
];

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-root flex min-h-screen">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-navy text-white flex flex-col transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="font-serif text-xl font-semibold text-gold tracking-wide">
              Neha Crockery
            </div>
            <div className="text-[11px] uppercase tracking-widest text-white/60 mt-0.5">
              Admin Console
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden text-white/70 hover:text-white text-xl"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            &times;
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `block px-3.5 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-colors ${
                  isActive
                    ? 'bg-gold text-navy font-semibold'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2 text-xs">
          <Link
            to="/"
            className="block px-3 py-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            &#8592; View Public Website
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[#e5dfd3] px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden px-2.5 py-1.5 rounded border border-gray-300 text-xs font-medium"
              onClick={() => setSidebarOpen(true)}
            >
              Menu
            </button>
            <span className="text-xs uppercase tracking-widest text-charcoal-lt font-semibold">
              Neha Crockery House Management
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-navy">{user.name || user.email}</div>
                <div className="text-[10px] uppercase tracking-wider text-charcoal-lt">
                  {user.role}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-md bg-navy text-white text-xs font-medium hover:bg-navy-mid transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

