import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';

const CLEAN_PAGES = new Set([
  'about',
  'products',
  'product',
  'brands',
  'taroba',
  'catalogue',
  'contact',
  'privacy',
  'terms',
]);

function vercelRoutingPlugin(env = {}) {
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || '';
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';
  return {
    name: 'vercel-routing-compat',
    transformIndexHtml(html) {
      if (!supabaseUrl && !supabaseAnonKey) return html;
      const metaTags = [
        supabaseUrl ? `<meta name="supabase-url" content="${supabaseUrl}">` : '',
        supabaseAnonKey ? `<meta name="supabase-anon-key" content="${supabaseAnonKey}">` : '',
      ]
        .filter(Boolean)
        .join('\n  ');
      return html.replace('</head>', `  ${metaTags}\n</head>`);
    },
    resolveId(id) {
      if (id.startsWith('/scripts/') || id.startsWith('/styles/') || id.startsWith('/assets/')) {
        return path.resolve(process.cwd(), 'frontend', id.slice(1));
      }
      return null;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();
        const [pathname, search = ''] = req.url.split('?');
        const qs = search ? `?${search}` : '';

        if (pathname === '/frontend/admin' || pathname === '/frontend/admin/') {
          res.writeHead(308, { Location: `/admin${qs}` });
          res.end();
          return;
        }
        if (pathname === '/frontend' || pathname === '/frontend/' || pathname === '/frontend/index.html' || pathname === '/index.html') {
          res.writeHead(308, { Location: `/${qs}` });
          res.end();
          return;
        }
        const feHtmlMatch = pathname.match(/^\/frontend\/([a-z-]+?)(?:\.html)?$/);
        if (feHtmlMatch && CLEAN_PAGES.has(feHtmlMatch[1])) {
          res.writeHead(308, { Location: `/${feHtmlMatch[1]}${qs}` });
          res.end();
          return;
        }
        const rootHtmlMatch = pathname.match(/^\/([a-z-]+)\.html$/);
        if (rootHtmlMatch && CLEAN_PAGES.has(rootHtmlMatch[1])) {
          res.writeHead(308, { Location: `/${rootHtmlMatch[1]}${qs}` });
          res.end();
          return;
        }

        if (pathname === '/') {
          req.url = `/frontend/index.html${qs}`;
        } else if (pathname === '/admin' || pathname === '/admin/') {
          req.url = `/admin/index.html${qs}`;
        } else if (CLEAN_PAGES.has(pathname.slice(1))) {
          req.url = `/frontend${pathname}.html${qs}`;
        } else if (
          pathname.startsWith('/assets/') ||
          pathname.startsWith('/styles/') ||
          pathname.startsWith('/scripts/') ||
          pathname.startsWith('/data/')
        ) {
          req.url = `/frontend${pathname}${qs}`;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, process.cwd(), '');
  const backendEnv = loadEnv(mode, path.resolve(process.cwd(), 'backend'), '');
  const mergedEnv = { ...backendEnv, ...rootEnv, ...process.env };

  return {
    // Serve from project root — frontend/ and admin/ are sub-directories
    root: '.',
    plugins: [vercelRoutingPlugin(mergedEnv)],
    server: {
      port: 3000,
      open: '/',
      // ── Dev proxy: forward API & upload requests to the backend server ──────
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          // ── Frontend (customer-facing) pages ──────────────────
          home: 'frontend/index.html',
          about: 'frontend/about.html',
          products: 'frontend/products.html',
          product: 'frontend/product.html',
          brands: 'frontend/brands.html',
          taroba: 'frontend/taroba.html',
          catalogue: 'frontend/catalogue.html',
          contact: 'frontend/contact.html',
          privacy: 'frontend/privacy.html',
          terms: 'frontend/terms.html',

          // ── Admin (internal staff) ────────────────────────────
          admin: 'admin/index.html'
        }
      }
    }
  };
});

