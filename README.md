# Neha Crockery House

> **Premium Crockery, Cutlery & Glassware Wholesaler — Park Town, Chennai (Est. 1994)**

A full-stack B2B catalogue, enquiry, and wholesale management system built with **React + TypeScript + Vite + Tailwind CSS** on the frontend (`web/`) and **Node.js + Express + Prisma + Supabase (PostgreSQL, Auth & Storage)** on the backend (`backend/`).

---

## Table of Contents

- [Project Structure](#project-structure)
- [Tech Stack by Layer](#tech-stack-by-layer)
- [Applications](#applications)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Testing (Vitest)](#testing-vitest)
- [Deployment](#deployment)

---

## Project Structure

```text
nehacrockery/
├── web/                        React + TypeScript + Vite + Tailwind v4 SPA (Public + /admin)
│   ├── index.html              SPA HTML entry point
│   ├── vite.config.ts          Vite + Tailwind v4 + Vitest configuration
│   ├── tsconfig.json           Strict TypeScript config with @/* alias
│   ├── public/assets/images/   Static brand & hero assets
│   └── src/
│       ├── main.tsx            React root mount (HelmetProvider, BrowserRouter, SettingsProvider)
│       ├── App.tsx             React Router v6 routes (public + protected /admin/*)
│       ├── index.css           Tailwind v4 theme tokens + layered brand CSS
│       ├── lib/                API client, Supabase Auth context, hooks, settings, types
│       ├── components/
│       │   ├── site/           Public site components (Header, Footer, ProductCard, EnquiryForm, etc.)
│       │   └── admin/          Admin layout & reusable UI primitives
│       ├── pages/              Public pages (Home, About, Products, ProductDetail, Brands, Taroba, Catalogue, Contact, Privacy, Terms)
│       │   └── admin/          Admin pages (Login, Dashboard, Products, Enquiries, Sales, Categories, Brands, Catalogues, ShopMedia, Settings, AuditLogs)
│       └── test/               Vitest + React Testing Library tests
├── backend/                    Node.js + Express + TypeScript + Prisma REST API
│   ├── src/
│   │   ├── app.ts              Express setup, security headers, CORS, rate-limiting
│   │   ├── server.ts           HTTP server entry point
│   │   ├── routes/             Public, Auth (/auth/me, /auth/logout), and Admin (/admin/*) routes
│   │   ├── controllers/        Request handlers
│   │   ├── services/           Business logic & Supabase Storage integration
│   │   ├── middleware/         Supabase Auth token verification, RBAC, Zod validation, Multer uploads
│   │   └── validators/         Zod schemas
│   ├── prisma/
│   │   ├── schema.prisma       PostgreSQL schema (Supabase)
│   │   └── migrations/         Prisma migration history
│   ├── tests/                  Vitest + Supertest API integration tests
│   └── vitest.config.ts        Backend Vitest config
├── frontend/                   (Legacy static HTML/JS site — preserved for reference)
├── admin/                      (Legacy static admin panel — preserved for reference)
└── docs/
    └── api-endpoints.md        Detailed API endpoint documentation
```

---

## Tech Stack by Layer

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | Customer-facing website and reusable UI components |
| **Build Tool** | Vite 5 | Fast development server and production builds |
| **Styling** | Tailwind CSS v4 + Brand CSS | Responsive layouts and consistent design system |
| **Routing** | React Router v6 | Public website pages and `/admin/*` navigation |
| **API Communication** | Fetch API wrapper (`web/src/lib/api.ts`) | Connect frontend and admin panel to backend REST APIs |
| **Admin Panel** | React + TypeScript + Tailwind CSS (`/admin`) | Manage products, catalogues, enquiries, sales, gallery, and settings |
| **Backend Runtime & Framework** | Node.js + Express.js + TypeScript | REST API endpoints, business logic, and middleware |
| **ORM & Database** | Prisma ORM + Supabase PostgreSQL | Type-safe database queries, schema management, and migrations |
| **Authentication** | Supabase Auth | Administrator sign-in and session management |
| **Authorization** | Backend Middleware + RBAC (`SUPER_ADMIN`, `ADMIN`, `STAFF`) | Restrict administrative features and sensitive API operations |
| **Validation** | Zod | Validate API requests and incoming data |
| **Image & PDF Storage** | Supabase Storage | Store product images, showroom photos/videos, and downloadable catalogue PDFs |
| **Testing** | Vitest + React Testing Library + Supertest | Unit, component, and API integration testing |
| **SEO** | `react-helmet-async` | Manage page titles, meta descriptions, canonical URLs, and OpenGraph tags |

---

## Applications

| App | Directory | Dev URL | Description |
|-----|-----------|---------|-------------|
| **Public Website** | `web/` | `http://localhost:3000` | Customer-facing wholesale catalogue & enquiry site |
| **Admin Console** | `web/` | `http://localhost:3000/admin` | Supabase-authenticated management dashboard |
| **REST API** | `backend/` | `http://localhost:4000/api/v1` | Express + Prisma API server |

---

## Quick Start

### Prerequisites
- **Node.js** 18+
- A **Supabase** project (PostgreSQL database, Supabase Auth enabled, and Storage buckets configured)

### 1. Clone the Repository

```bash
git clone https://github.com/nikleshsai/nehacrockery.git
cd nehacrockery
```

### 2. Configure & Start the Backend (`:4000`)

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, DIRECT_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### 3. Configure & Start the React Web App (`:3000`)

```bash
cd ../web
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

- **Public site:** `http://localhost:3000`
- **Admin panel:** `http://localhost:3000/admin/login`

---

## Environment Variables

### `backend/.env`

```env
NODE_ENV=development
PORT=4000

# Supabase PostgreSQL
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# CORS
CORS_ORIGINS=http://localhost:3000

# Supabase Auth & Storage
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Uploads & Rate Limiting
STORAGE_STRATEGY=supabase
UPLOAD_MAX_SIZE_MB=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### `web/.env`

```env
# Optional: defaults to '' (uses Vite /api proxy in development)
VITE_API_URL=

# Required for /admin sign-in via Supabase Auth
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## API Endpoints

Base URL: `http://localhost:4000/api/v1`

- **Public:** `GET /health`, `GET /products`, `GET /products/:slug`, `GET /categories`, `GET /brands`, `GET /banners`, `GET /reviews`, `GET /site-settings`, `GET /catalogues`, `GET /shop-media`, `POST /enquiries`, `POST /catalogue-requests`
- **Auth (Supabase Bearer token):** `GET /auth/me`, `POST /auth/logout`
- **Admin (`/admin/*`, requires Supabase Bearer token + role):**
  - `GET /admin/dashboard`
  - `GET /admin/audit-logs`
  - `GET | POST /admin/products`, `POST /admin/products/import`, `GET | PUT | DELETE /admin/products/:id`, `POST | DELETE /admin/products/:id/images`
  - `GET | POST | PUT | DELETE /admin/categories`
  - `GET | POST | PUT | DELETE /admin/brands`
  - `GET | PUT /admin/enquiries`
  - `GET | POST | PUT | DELETE /admin/catalogues`
  - `GET | POST | PUT | DELETE /admin/sales`, `GET /admin/sales/stats`
  - `GET | POST | PUT | DELETE /admin/shop-media`
  - `GET | PUT /admin/settings`

---

## Testing (Vitest)

Both the React frontend and Express backend use **Vitest**:

```bash
# Run frontend unit & component tests
cd web
npm test
npm run typecheck

# Run backend API integration tests
cd ../backend
npm test
```

---

## Deployment

- **Frontend (`web/`):** Deploy to **Vercel** (Root Directory: `web`, Build Command: `npm run build`, Output Directory: `dist`). Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL`.
- **Backend (`backend/`):** Deploy to **Render** or any Node.js host using `render.yaml` (`npm ci && npm run build:render`, start command `npm run start:prod`).
