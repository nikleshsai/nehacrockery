# Frontend Components Reference

## Overview

The Neha Crockery House frontend uses server-rendered HTML pages (Vite MPA).
There is no JS component framework. "Components" here means reusable HTML snippets
that appear across multiple pages.

## Shared HTML Patterns

### Site Header
Every page includes the site header with:
- Logo (assets/images/logo.jpeg)
- Desktop nav (7 links with `active` class on current page)
- Mobile toggle button
- WhatsApp header button
- Mobile menu dropdown

**Template:** Copy from any existing page's `<header class="site-header">` block.
**Active link:** Add `class="desktop-nav-link active"` to the current page link.
**JS:** Handled by `scripts/main.js` (mobile toggle, scroll effect).

### Page Banner
All inner pages (not the homepage) use:
```html
<section class="page-banner" aria-label="[Page] page banner">
  <div class="page-banner-bg" aria-hidden="true"></div>
  <div class="container page-banner-content">
    <p class="section-eyebrow page-eyebrow"><span class="eyebrow-line" aria-hidden="true"></span>EYEBROW TEXT</p>
    <h1 class="page-banner-title">Page Title</h1>
    <p class="page-banner-desc">Subtitle text.</p>
  </div>
</section>
```

### Site Footer
Identical footer across all pages. Logo, Quick Links, Products, Legal columns.
Assets path: `assets/images/logo.jpeg`

### Floating WhatsApp Button
```html
<a href="https://wa.me/919710254681" class="float-whatsapp" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">
  [whatsapp svg]
</a>
```

### Script Include
Every page ends with:
```html
<script src="scripts/main.js"></script>
```

## Styles
- `styles/main.css` — all frontend CSS (design tokens, layout, components, pages)

## Data
- `data/products.json` — product catalogue
- `data/brands.json` — brands list
- Fetched by `scripts/main.js` via `fetch('../data/products.json')`

## Adding a New Page
1. Copy an existing page (e.g. `taroba.html`)
2. Update `<title>`, `<meta name="description">`, `<body class="page-{name}">`
3. Update the `active` class on the nav link for the new page
4. Add new entry to `vite.config.js` rollupOptions.input
5. Add link to navigation in all other pages
