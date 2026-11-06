# Neha Crockery House

> **Premium Glassware & Crockery Wholesaler — Park Town, Chennai**

A full-stack B2B catalogue and enquiry management system with a customer-facing website, an internal admin dashboard, and a REST API backend.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Applications](#applications)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Architecture](#architecture)
- [Scripts Reference](#scripts-reference)
- [Documentation](#documentation)

---

## Project Structure

```
neha-crockery-house/
├── frontend/               Customer-facing website
│   ├── index.html          Homepage (hero, featured products, banners)
│   ├── products.html       Product catalogue listing
│   ├── product.html        Single product detail page
│   ├── brands.html         Brand showcase
│   ├── catalogue.html      Downloadable catalogue page
│   ├── about.html          About us page
│   ├── contact.html        Contact & shop gallery
│   ├── taroba.html         Taroba collection page
│   ├── privacy.html        Privacy policy
│   ├── terms.html          Terms & conditions
│   ├── scripts/main.js     All frontend JS logic
│   ├── styles/             CSS stylesheets
│   └── components/         Reusable HTML components
├── admin/                  Internal staff dashboard (SPA)
│   ├── index.html          Admin panel (single-page app)
│   ├── admin.js            All admin JS logic
│   └── admin.css           Admin panel styles
├── backend/                REST API server
│   ├── src/
│   │   ├── app.ts          Express app setup & middleware
│   │   ├── server.ts       Server entry point
│   │   ├── routes/         Route definitions
│   │   ├── controllers/    Request handlers
│   │   ├── services/       Business logic layer
│   │   ├── middleware/     Auth, validation, upload, error handling
│   │   ├── validators/     Zod input validation schemas
│   │   ├── config/         Env config & DB client
│   │   └── utils/          Logger, AppError helpers
│   ├── prisma/
│   │   ├── schema.prisma   Database schema (PostgreSQL)
│   │   ├── seed.ts         Initial seed data
│   │   ├── seed-products.ts Product seeding script
│   │   └── migrations/     Database migration history
│   └── tests/              Jest integration tests
├── docs/
│   └── api-endpoints.md    Complete API reference
├── vercel.json             Vercel deployment config (frontend + admin)
├── render.yaml             Render deployment config (backend)
├── vite.config.js          Vite build config for frontend
└── package.json            Root workspace (Vite dev server)
```

---

## Applications

| App | Tech Stack | Dev Port | Purpose |
|-----|-----------|----------|---------|
| **Frontend** | HTML + CSS + Vanilla JS (Vite) | `3000` | Customer-facing website |
| **Admin** | HTML + CSS + Vanilla JS | `3000/admin` | Internal staff management dashboard |
| **Backend** | Node.js + TypeScript + Express + Prisma | `4000` | REST API + PostgreSQL database |

---

## Tech Stack

### Frontend & Admin
- **HTML5** — Semantic markup with SEO meta tags
- **CSS3** — Custom stylesheets (no framework)
- **Vanilla JavaScript** — All interactivity and API calls via `fetch()`
- **Vite** — Dev server and build tool

### Backend
- **Node.js** + **TypeScript**
- **Express 4** — HTTP framework
- **Prisma 5** — ORM with PostgreSQL (Supabase)
- **Supabase** — PostgreSQL database + file storage
- **Zod** — Request validation schemas
- **JWT** + **bcryptjs** — Authentication & password hashing
- **Multer** — File upload handling (images, PDFs, CSV/Excel)
- **Helmet** — HTTP security headers
- **express-rate-limit** — API rate limiting
- **Winston** + **Morgan** — Structured logging
- **XLSX** — Excel/CSV import for product bulk upload
- **Jest** + **Supertest** — Integration testing

---

## Database Schema

The database runs on **PostgreSQL** (hosted on Supabase) and is managed via **Prisma**.

### Models

| Model | Description |
|-------|-------------|
| `User` | Admin users with roles: `SUPER_ADMIN`, `ADMIN`, `STAFF` |
| `Product` | Product catalogue with pricing, images, SEO, and physical attributes |
| `ProductImage` | Multiple images per product, ordered by `sortOrder` |
| `Category` | Hierarchical categories (parent/child) with slugs |
| `Brand` | Product brands with logo and website info |
| `Enquiry` | Customer enquiries (B2B — Retailer, Wholesaler, Hotel, etc.) |
| `CatalogueRequest` | Requests for physical/digital catalogue |
| `Catalogue` | Uploaded PDF catalogues for download |
| `Review` | Customer reviews/testimonials (published by admin) |
| `Banner` | Homepage hero banners with CTA buttons |
| `Sale` | Internal sales tracking (Quote → Confirmed → Delivered) |
| `SaleItem` | Line items per sale with product reference |
| `SiteSettings` | Business info: contact, address, social links, GST/PAN |
| `ShopMedia` | Shop gallery images/videos shown on contact page |
| `AuditLog` | Full audit trail for all admin actions |

### Enums

| Enum | Values |
|------|--------|
| `UserRole` | `SUPER_ADMIN`, `ADMIN`, `STAFF` |
| `CustomerType` | `RETAILER`, `WHOLESALER`, `HOTEL`, `RESTAURANT`, `INSTITUTION`, `INDIVIDUAL`, `OTHER` |
| `EnquiryStatus` | `NEW`, `CONTACTED`, `IN_PROGRESS`, `COMPLETED`, `CLOSED` |
| `CatalogueRequestStatus` | `NEW`, `SENT`, `CLOSED` |
| `SaleStatus` | `QUOTE`, `CONFIRMED`, `PROCESSING`, `DELIVERED`, `CANCELLED` |
| `AuditAction` | `LOGIN`, `LOGOUT`, `CREATE`, `UPDATE`, `DELETE`, `PRICE_CHANGE`, `IMPORT`, `CATALOGUE_UPLOAD`, `HOMEPAGE_CHANGE`, `SALE_CHANGE`, `USER_CHANGE`, `STATUS_CHANGE`, `SETTINGS_CHANGE` |

---

## API Endpoints

Base URL: `http://localhost:4000/api/v1`

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/products` | List products (paginated; filter by `search`, `category`, `brand`) |
| `GET` | `/products/:slug` | Get single product by slug |
| `GET` | `/categories` | List all active categories |
| `GET` | `/categories/:slug` | Get category by slug |
| `GET` | `/brands` | List all active brands |
| `GET` | `/brands/:slug` | Get brand by slug |
| `GET` | `/banners` | List active homepage banners |
| `GET` | `/reviews` | List published customer reviews |
| `GET` | `/site-settings` | Get business info & contact details |
| `GET` | `/catalogues` | List active downloadable catalogues |
| `GET` | `/shop-media` | List shop gallery images/videos |
| `POST` | `/enquiries` | Submit a customer enquiry |
| `POST` | `/catalogue-requests` | Submit a catalogue request |

### Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | Admin login (sets JWT cookie `nch_token`) |
| `POST` | `/auth/logout` | Clear auth cookie |
| `GET` | `/auth/me` | Get current logged-in user |

### Admin Endpoints (`/api/v1/admin/*`)

> All admin routes require authentication. Role-based access control is enforced.

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET` | `/admin/dashboard` | All | Dashboard stats |
| `GET` | `/admin/audit-logs` | SUPER_ADMIN, ADMIN | Audit log history |
| `GET` / `POST` | `/admin/products` | All / ADMIN+ | List / Create product |
| `POST` | `/admin/products/import` | ADMIN+ | Bulk import via CSV/Excel |
| `GET` / `PUT` / `DELETE` | `/admin/products/:id` | All / ADMIN+ | Get / Update / Delete product |
| `POST` | `/admin/products/:id/images` | ADMIN+ | Upload product images |
| `DELETE` | `/admin/products/:id/images/:imageId` | ADMIN+ | Delete product image |
| `GET` / `POST` | `/admin/categories` | All / ADMIN+ | List / Create category |
| `PUT` / `DELETE` | `/admin/categories/:id` | ADMIN+ | Update / Delete category |
| `GET` / `POST` | `/admin/brands` | All / ADMIN+ | List / Create brand |
| `PUT` / `DELETE` | `/admin/brands/:id` | ADMIN+ | Update / Delete brand |
| `GET` | `/admin/enquiries` | All | List all enquiries |
| `GET` / `PUT` | `/admin/enquiries/:id` | All / ADMIN+ | Get / Update enquiry status |
| `GET` / `POST` | `/admin/banners` | All / ADMIN+ | List / Create banner |
| `PUT` / `DELETE` | `/admin/banners/:id` | ADMIN+ | Update / Delete banner |
| `GET` / `POST` | `/admin/reviews` | All / ADMIN+ | List / Create review |
| `PUT` / `DELETE` | `/admin/reviews/:id` | ADMIN+ | Update / Delete review |
| `GET` / `POST` | `/admin/catalogues` | All / ADMIN+ | List / Upload catalogue PDF |
| `PUT` / `DELETE` | `/admin/catalogues/:id` | ADMIN+ | Update / Delete catalogue |
| `GET` / `PUT` | `/admin/settings` | All / ADMIN+ | Get / Update site settings |
| `GET` / `POST` | `/admin/sales` | All / ADMIN+ | List / Create sale |
| `GET` | `/admin/sales/stats` | All | Sales statistics |
| `GET` / `PUT` / `DELETE` | `/admin/sales/:id` | All / ADMIN+ | Get / Update / Delete sale |
| `GET` / `POST` | `/admin/shop-media` | All / ADMIN+ | List / Upload shop gallery media |
| `PUT` / `DELETE` | `/admin/shop-media/:id` | ADMIN+ | Update / Delete shop media |

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (or a [Supabase](https://supabase.com) project)

### 1. Clone & Install

```bash
git clone <repo-url>
cd neha-crockery-house
```

### 2. Start the Backend

```bash
cd backend
cp .env.example .env        # Copy env template
# Edit .env with your DB credentials and secrets
npm install
npm run prisma:generate     # Generate Prisma client
npm run prisma:migrate      # Run DB migrations
npm run prisma:seed         # Seed initial data
npm run dev                 # Start dev server
```

Backend API runs at: `http://localhost:4000/api/v1`

### 3. Start the Frontend

```bash
# From project root
npm install
npm run dev
```

Frontend: `http://localhost:3000`
Admin panel: `http://localhost:3000/admin`

---

## Environment Variables

Create `backend/.env` with the following keys:

```env
# App
NODE_ENV=development
PORT=4000

# PostgreSQL (Supabase)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_DAYS=7

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:3000

# Supabase (for file storage)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...

# File uploads
STORAGE_STRATEGY=supabase   # or "local"
UPLOAD_MAX_SIZE_MB=10

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=10
```

---

## Deployment

The project is split across two platforms:

### Frontend + Admin → [Vercel](https://vercel.com)

Configured via `vercel.json`:
- `/` → serves `frontend/index.html`
- `/admin` → serves `admin/index.html`
- `/api/*` → proxied to the Render backend (`https://nehacrockery.onrender.com`)
- `/uploads/*` → proxied to the Render backend

### Backend → [Render](https://render.com)

Configured via `render.yaml`:
- **Region**: Singapore (closest to India)
- **Build**: `npm ci && npm run build:render` (generates Prisma client + compiles TypeScript)
- **Start**: `npm run start:prod` (runs migrations then starts server)
- **Health check**: `GET /api/v1/health`
- **Port**: `10000` (Render internal)

> Set `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, and `SUPABASE_*` in the **Render Dashboard → Environment** tab. Never commit real values.

---

## Architecture

```
Customer Browser              Admin Browser
      │                             │
      ▼                             ▼
  Vercel CDN                   Vercel CDN
  /frontend/*                  /admin/*
  (HTML/CSS/JS)               (HTML/CSS/JS SPA)
      │                             │
      └──────────┬──────────────────┘
                 │ /api/v1/* (proxied)
                 ▼
         Render (Node.js)
           Express App
           ├── JWT Auth Middleware
           ├── Zod Validation
           ├── Prisma ORM
           │       │
           │       ▼
           │   PostgreSQL
           │  (Supabase)
           └── Supabase Storage
               (images, PDFs)
```

**Data flow:**
1. **Public visitors** browse the frontend → JS `fetch()` calls to `/api/v1/*`
2. **Admin staff** log in via `/admin` → JWT cookie stored → calls to `/api/v1/admin/*`
3. **Backend** validates requests with Zod, checks JWT auth middleware, queries DB via Prisma, stores files on Supabase Storage
4. All admin mutations are recorded in the **AuditLog** table

---

## Scripts Reference

### Root (Vite)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server for frontend |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build locally |

### Backend (`cd backend`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start API with hot-reload (`ts-node-dev`) |
| `npm run build` | Compile TypeScript |
| `npm run build:render` | Prisma generate + compile (used on Render) |
| `npm run start` | Run compiled JS (`dist/server.js`) |
| `npm run start:prod` | Migrate + start (production) |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run migrations (dev) |
| `npm run prisma:migrate:deploy` | Run migrations (production) |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run prisma:seed` | Seed initial data |
| `npm run test` | Run Jest test suite |
| `npm run lint` | Lint TypeScript source |
| `npm run format` | Format with Prettier |

---

## Documentation

- [Backend README](./backend/README.md) — Full backend API documentation
- [API Endpoints](./docs/api-endpoints.md) — Complete endpoint reference
