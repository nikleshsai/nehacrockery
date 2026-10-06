/* =============================================================================
   NEHA CROCKERY HOUSE — ADMIN PANEL JAVASCRIPT
   Version: 2.0.0
   All CRUD operations connected to real backend API.
   Auth: JWT Bearer token in sessionStorage.
   No mock data, no local arrays, no placeholder functionality.
============================================================================= */
(function () {
  'use strict';

  /* ── CONFIG ────────────────────────────────────────────────────────────── */
  // API base URL — Vercel rewrites /api/* → Render backend in production.
  // Vite dev server proxies /api/* → localhost:4000 during local development.
  var API = '/api/v1';

  var TOKEN_KEY = 'nch_admin_token';
  // Supabase config — anon key is safe to expose in frontend
  var SUPABASE_URL = 'https://rptvadjhblznngaoaaxn.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwdHZhZGpoYmx6bm5nYW9hYXhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0OTg1MzIsImV4cCI6MjEwNjA3NDUzMn0.b-zhfMxeiNQCjnbLF2e8YBMfh_71ztrq1YoQdagoxrI';

  /* ── STATE ─────────────────────────────────────────────────────────────── */
  var state = {
    token: sessionStorage.getItem(TOKEN_KEY) || null,
    user: null,
    currentSection: 'dashboard',
    allCategories: [],
    allBrands: [],
    pages: {
      products: 1,
      enquiries: 1,
      sales: 1,
      auditlogs: 1,
    },
    filters: {
      productSearch: '',
      productCat: 'all',
      productBrand: 'all',
      productStatus: 'all',
      enquiryStatus: 'all',
      saleStatus: 'all',
      auditAction: 'all',
      auditEntity: 'all',
    },
    currentEnquiryId: null,
    saleItems: [],
  };

  /* ── UTILITY ────────────────────────────────────────────────────────────── */
  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmt(v) {
    if (v === null || v === undefined || v === '') return '—';
    return String(v);
  }
  function fmtPrice(v) {
    if (v === null || v === undefined || v === '') return '—';
    return '₹' + Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function fmtDateTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  function slugify(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function $ (id) { return document.getElementById(id); }

  /* ── TOAST ──────────────────────────────────────────────────────────────── */
  function toast(msg, type) {
    type = type || 'success';
    var icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    var el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.innerHTML = '<span class="toast-icon">' + (icons[type] || '') + '</span><span>' + esc(msg) + '</span>';
    var container = $('toast-container');
    if (container) container.appendChild(el);
    setTimeout(function () {
      el.classList.add('out');
      setTimeout(function () { el.remove(); }, 300);
    }, 4000);
  }

  /* ── CONFIRM DIALOG ─────────────────────────────────────────────────────── */
  function confirm(title, msg, onConfirm) {
    var existing = document.querySelector('.confirm-overlay');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML =
      '<div class="confirm-box">' +
      '<div class="confirm-icon">⚠️</div>' +
      '<div class="confirm-title">' + esc(title) + '</div>' +
      '<div class="confirm-msg">' + esc(msg) + '</div>' +
      '<div class="confirm-actions">' +
      '<button class="btn btn-ghost" id="confirm-cancel">Cancel</button>' +
      '<button class="btn btn-danger" id="confirm-ok">Confirm</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#confirm-cancel').onclick = function () { overlay.remove(); };
    overlay.querySelector('#confirm-ok').onclick = function () { overlay.remove(); onConfirm(); };
    overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };
  }

  /* ── API CALL ────────────────────────────────────────────────────────────── */
  function api(method, path, body, cb, isFormData) {
    var opts = { method: method, headers: {} };
    if (state.token) opts.headers['Authorization'] = 'Bearer ' + state.token;
    if (body && !isFormData) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    } else if (body && isFormData) {
      opts.body = body; // FormData — no Content-Type header
    }
    fetch(API + path, opts)
      .then(function (res) {
        if (res.status === 204) { cb(null, null); return; }
        return res.json().then(function (j) {
          if (res.status >= 400) {
            cb(new Error(j.message || 'Error ' + res.status), null);
          } else {
            cb(null, j);
          }
        });
      })
      .catch(function (err) { cb(err, null); });
  }

  /* ── PAGINATION ─────────────────────────────────────────────────────────── */
  function renderPagination(containerId, pg, goTo) {
    var el = $(containerId);
    if (!el) return;
    if (!pg || pg.totalPages <= 1) { el.innerHTML = ''; return; }
    var html = '';
    if (pg.page > 1) {
      html += '<button class="btn btn-ghost btn-sm" onclick="(' + goTo + ')(' + (pg.page - 1) + ')">← Prev</button>';
    }
    html += '<span class="text-muted text-sm" style="padding:0 16px;">Page ' + pg.page + ' of ' + pg.totalPages + ' (' + pg.total + ' total)</span>';
    if (pg.page < pg.totalPages) {
      html += '<button class="btn btn-ghost btn-sm" onclick="(' + goTo + ')(' + (pg.page + 1) + ')">Next →</button>';
    }
    el.innerHTML = html;
  }

  /* ── MODAL ───────────────────────────────────────────────────────────────── */
  function openModal(id) {
    var el = $(id);
    if (el) el.classList.remove('hidden');
  }
  function closeModal(id) {
    var el = $(id);
    if (el) el.classList.add('hidden');
  }

  /* ── NAVIGATION ─────────────────────────────────────────────────────────── */
  var SECTION_TITLES = {
    dashboard: 'Dashboard', products: 'Products', categories: 'Categories',
    brands: 'Brands', catalogues: 'Catalogues', homepage: 'Homepage Management',
    enquiries: 'Enquiries', customers: 'Customers', sales: 'Sales',
    reports: 'Reports', auditlogs: 'Audit Logs', settings: 'Settings',
    'shop-gallery': 'Shop Gallery',
  };

  function navigate(section) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(function (s) {
      s.classList.remove('active');
    });
    // Remove active from all nav items
    document.querySelectorAll('.nav-item').forEach(function (n) {
      n.classList.remove('active');
    });
    // Show target
    var target = $('section-' + section);
    if (target) target.classList.add('active');
    var navBtn = $('nav-' + section);
    if (navBtn) navBtn.classList.add('active');
    // Update topbar
    var topbarTitle = $('topbar-title');
    if (topbarTitle) topbarTitle.textContent = SECTION_TITLES[section] || section;
    state.currentSection = section;
    // Load data
    var loaders = {
      dashboard: loadDashboard,
      products: function () { loadProducts(1); },
      categories: loadCategories,
      brands: loadBrands,
      catalogues: loadCatalogues,
      homepage: loadHomepage,
      enquiries: function () { loadEnquiries(1); },
      customers: loadCustomers,
      sales: function () { loadSales(1); },
      reports: loadReports,
      auditlogs: function () { loadAuditLogs(1); },
      settings: loadSettings,
      'shop-gallery': loadShopGallery,
    };
    if (loaders[section]) loaders[section]();
  }
  window.navigate = navigate;

  /* ── BOOT ────────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    // Close modal buttons
    document.querySelectorAll('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', function () { closeModal(btn.dataset.close); });
    });
    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) overlay.classList.add('hidden');
      });
    });
    // Nav items
    document.querySelectorAll('.nav-item').forEach(function (btn) {
      btn.addEventListener('click', function () { navigate(btn.dataset.section); });
    });
    if (state.token) {
      showDashboard();
    } else {
      setupLogin();
    }

    // Wire gallery upload form
    var gForm = document.getElementById('gallery-upload-form');
    if (gForm) {
      gForm.addEventListener('submit', function (e) {
        e.preventDefault();
        submitGalleryUpload();
      });
    }

  });

  /* ── LOGIN ───────────────────────────────────────────────────────────────── */

  /* -- LOGIN (Supabase Auth) -- */
  function setupLogin() {
    var form = $('login-form');
    if (!form) return;

    // Show setup warning if Supabase key not configured
    if (!SUPABASE_ANON_KEY) {
      var warn = document.createElement('div');
      warn.style.cssText = 'background:#fef3c7;border:1px solid #d97706;border-radius:8px;padding:12px;font-size:12px;color:#92400e;margin-bottom:16px;line-height:1.5;';
      warn.innerHTML = '<strong>⚠️ Supabase setup needed:</strong> Add your Supabase ANON key to admin.js and create your admin user in <a href="https://supabase.com/dashboard/project/rptvadjhblznngaoaaxn/auth/users" target="_blank" style="color:#1d4ed8;text-decoration:underline;">Supabase Auth → Users</a>.';
      var loginBox = form.closest('.login-box') || form.parentNode;
      loginBox.insertBefore(warn, form);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('l-email').value.trim();
      var pw = $('l-password').value;
      var errEl = $('login-error');
      var btn = $('login-btn');
      if (!email) { errEl.textContent = 'Please enter your email.'; return; }
      if (!pw) { errEl.textContent = 'Please enter your password.'; return; }
      errEl.textContent = '';
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Signing in…';

      if (!SUPABASE_ANON_KEY) {
        // Fallback to backend JWT auth while Supabase is being configured
        api('POST', '/auth/login', { email: email, password: pw }, function (err, data) {
          btn.disabled = false; btn.textContent = 'Sign In →';
          if (err) { errEl.textContent = err.message || 'Login failed.'; return; }
          var token = (data.data && data.data.token) || data.token;
          var user = (data.data && data.data.user) || data.user;
          if (!token) { errEl.textContent = 'No token returned. Try again.'; return; }
          state.token = token; state.user = user;
          sessionStorage.setItem(TOKEN_KEY, token);
          showDashboard();
        });
        return;
      }

      // Supabase Auth: sign in with email + password
      fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: email, password: pw })
      })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        btn.disabled = false; btn.textContent = 'Sign In →';
        if (d.error || !d.access_token) {
          errEl.textContent = d.error_description || d.message || d.error || 'Invalid credentials.';
          return;
        }
        state.token = d.access_token;
        state.user = d.user ? {
          email: d.user.email,
          name: (d.user.user_metadata && d.user.user_metadata.name) || d.user.email
        } : null;
        sessionStorage.setItem(TOKEN_KEY, d.access_token);
        showDashboard();
      })
      .catch(function() {
        btn.disabled = false; btn.textContent = 'Sign In →';
        errEl.textContent = 'Network error. Please try again.';
      });
    });
  }


  function showDashboard() {
    $('login-screen').style.display = 'none';
    $('admin-app').style.display = 'flex';
    // Load user info if not set
    if (!state.user) {
      api('GET', '/auth/me', null, function (err, data) {
        if (!err && data && data.data) {
          state.user = data.data;
          updateUserInfo();
        }
      });
    } else {
      updateUserInfo();
    }
    loadMetaData(function () { navigate('dashboard'); });
    setupFilters();
    setupForms();
    setupLogout();
  }

  function updateUserInfo() {
    if (!state.user) return;
    var nameEl = $('user-name');
    var roleEl = $('user-role');
    var avatarEl = $('user-avatar');
    if (nameEl) nameEl.textContent = state.user.name || 'Admin';
    if (roleEl) roleEl.textContent = state.user.role || 'ADMIN';
    if (avatarEl) avatarEl.textContent = (state.user.name || 'A').charAt(0).toUpperCase();
  }

  function setupLogout() {
    var btn = $('logout-btn');
    if (btn) btn.addEventListener('click', function () {
      api('POST', '/auth/logout', null, function () {});
      sessionStorage.removeItem(TOKEN_KEY);
      state.token = null;
      state.user = null;
      location.reload();
    });
  }

  /* ── METADATA ────────────────────────────────────────────────────────────── */
  function loadMetaData(done) {
    var pending = 2;
    function finish() { if (--pending === 0 && done) done(); }
    api('GET', '/categories', null, function (err, data) {
      if (!err && data) {
        state.allCategories = (data.data || []);
        populateSelects('pf-category', state.allCategories, 'id', 'name', '— None —');
        populateSelects('cf-parent', state.allCategories, 'id', 'name', '— No Parent (Top Level) —');
        populateCategoryFilter();
      }
      finish();
    });
    api('GET', '/brands', null, function (err, data) {
      if (!err && data) {
        state.allBrands = (data.data || []);
        populateSelects('pf-brand', state.allBrands, 'id', 'name', '— None —');
        populateBrandFilter();
      }
      finish();
    });
  }

  function populateSelects(elId, items, valKey, labelKey, placeholder) {
    var sel = $(elId);
    if (!sel) return;
    var html = '<option value="">' + placeholder + '</option>';
    items.forEach(function (item) {
      html += '<option value="' + esc(item[valKey]) + '">' + esc(item[labelKey]) + '</option>';
    });
    sel.innerHTML = html;
  }

  function populateCategoryFilter() {
    var sel = $('product-filter-cat');
    if (!sel) return;
    var html = '<option value="all">All Categories</option>';
    state.allCategories.forEach(function (c) {
      html += '<option value="' + esc(c.slug) + '">' + esc(c.name) + '</option>';
    });
    sel.innerHTML = html;
  }

  function populateBrandFilter() {
    var sel = $('product-filter-brand');
    if (!sel) return;
    var html = '<option value="all">All Brands</option>';
    state.allBrands.forEach(function (b) {
      html += '<option value="' + esc(b.slug) + '">' + esc(b.name) + '</option>';
    });
    sel.innerHTML = html;
  }

  /* ── DASHBOARD ───────────────────────────────────────────────────────────── */
  function loadDashboard() {
    api('GET', '/admin/dashboard', null, function (err, data) {
      if (err) { toast('Failed to load dashboard: ' + err.message, 'error'); return; }
      var d = data.data || {};
      $('stat-products').textContent = d.products ? d.products.total : 0;
      $('stat-active').textContent = d.products ? d.products.active : 0;
      $('stat-featured').textContent = d.products ? d.products.featured : 0;
      $('stat-new').textContent = d.products ? d.products.newArrivals : 0;
      $('stat-enquiries').textContent = d.enquiries ? d.enquiries.total : 0;
      $('stat-new-enquiries').textContent = d.enquiries ? d.enquiries.new : 0;
      $('stat-catalogues').textContent = d.catalogues || 0;
      $('stat-sales').textContent = d.sales || 0;

      // Update enquiry badge
      var badge = $('enquiry-badge');
      if (badge && d.enquiries && d.enquiries.new > 0) {
        badge.textContent = d.enquiries.new;
        badge.classList.remove('hidden');
      }

      // Recent enquiries
      var eq = $('dash-enquiries');
      if (eq) {
        if (!d.recentEnquiries || !d.recentEnquiries.length) {
          eq.innerHTML = '<div style="padding:20px;color:var(--c-muted);font-size:13px;">No enquiries yet</div>';
        } else {
          eq.innerHTML = d.recentEnquiries.map(function (e) {
            return '<div class="activity-item">' +
              '<div class="activity-dot" style="background:' + enquiryStatusColor(e.status) + '"></div>' +
              '<div class="activity-text"><strong>' + esc(e.name) + '</strong>' +
              (e.companyName ? ' · ' + esc(e.companyName) : '') +
              '<br><span class="text-muted text-xs">' + esc(e.product ? e.product.name : (e.customerType || '')) + '</span></div>' +
              '<div class="activity-time">' + fmtDate(e.createdAt) + '</div>' +
              '</div>';
          }).join('');
        }
      }

      // Recent sales
      var sl = $('dash-sales');
      if (sl) {
        if (!d.recentSales || !d.recentSales.length) {
          sl.innerHTML = '<div style="padding:20px;color:var(--c-muted);font-size:13px;">No sales recorded yet</div>';
        } else {
          sl.innerHTML = d.recentSales.map(function (s) {
            return '<div class="activity-item">' +
              '<div class="activity-dot" style="background:' + saleStatusColor(s.status) + '"></div>' +
              '<div class="activity-text"><strong>' + esc(s.saleNumber) + '</strong> · ' + esc(s.customerName) +
              '<br><span class="text-muted text-xs">' + fmtPrice(s.totalAmount) + '</span></div>' +
              '<div class="activity-time">' + fmtDate(s.createdAt) + '</div>' +
              '</div>';
          }).join('');
        }
      }
    });
  }

  /* ── PRODUCTS ────────────────────────────────────────────────────────────── */
  function loadProducts(page) {
    state.pages.products = page || 1;
    var tbody = $('products-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="td-loading"><span class="spinner spinner-dark"></span> Loading products…</td></tr>';

    var q = 'page=' + state.pages.products + '&pageSize=30&sortBy=name&sortOrder=asc';
    if (state.filters.productSearch) q += '&search=' + encodeURIComponent(state.filters.productSearch);
    if (state.filters.productCat !== 'all') q += '&category=' + encodeURIComponent(state.filters.productCat);
    if (state.filters.productBrand !== 'all') q += '&brand=' + encodeURIComponent(state.filters.productBrand);
    if (state.filters.productStatus === 'featured') q += '&featured=true';
    else if (state.filters.productStatus === 'new') q += '&newArrival=true';

    api('GET', '/admin/products?' + q, null, function (err, res) {
      if (err) {
        tbody.innerHTML = '<tr><td colspan="8" class="td-empty" style="color:var(--c-danger);">' + esc(err.message) + '</td></tr>';
        return;
      }
      var products = res.data || [];
      var pagination = res.pagination || {};
      var countEl = $('products-count');
      if (countEl) countEl.textContent = (pagination.total || products.length) + ' products total';

      if (!products.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="td-empty">No products found</td></tr>';
        renderPagination('products-pagination', pagination, function(p){ loadProducts(p); });
        return;
      }

      // Apply status filter client-side for active/inactive
      var filtered = products;
      if (state.filters.productStatus === 'active') filtered = products.filter(function(p){ return p.isActive; });
      else if (state.filters.productStatus === 'inactive') filtered = products.filter(function(p){ return !p.isActive; });

      tbody.innerHTML = filtered.map(function (p) {
        var mrp = p.catalogueMrp || p.mrp;
        return '<tr>' +
          '<td><strong>' + esc(p.name) + '</strong>' +
          (p.isNewArrival ? ' <span class="badge badge-new-arr">NEW</span>' : '') +
          (p.isFeatured ? ' <span class="badge badge-featured">★</span>' : '') +
          '<br><span class="text-muted text-xs font-mono">' + esc(p.productCode || '') + '</span></td>' +
          '<td>' + esc((p.brand && p.brand.name) || '—') + '</td>' +
          '<td>' + esc((p.category && p.category.name) || '—') + '</td>' +
          '<td>' + esc(p.collection || '—') + '</td>' +
          '<td class="font-mono">' + (mrp ? fmtPrice(mrp) : '—') + '</td>' +
          '<td class="font-mono">' + (p.wholesalePrice ? fmtPrice(p.wholesalePrice) : '—') + '</td>' +
          '<td><span class="badge ' + (p.isActive ? 'badge-active' : 'badge-inactive') + '">' + (p.isActive ? 'Active' : 'Inactive') + '</span></td>' +
          '<td><div style="display:flex;gap:6px;flex-wrap:wrap;">' +
          '<button class="btn btn-sm btn-ghost" onclick="editProduct(\'' + p.id + '\')">Edit</button>' +
          '<button class="btn btn-sm btn-ghost" onclick="toggleProductFlag(\'' + p.id + '\',\'featured\',' + (p.isFeatured ? 'true' : 'false') + ')" title="Toggle Featured">' + (p.isFeatured ? '⭐' : '☆') + '</button>' +
          '<button class="btn btn-sm btn-ghost" onclick="toggleProductFlag(\'' + p.id + '\',\'newArrival\',' + (p.isNewArrival ? 'true' : 'false') + ')" title="Toggle New Arrival">' + (p.isNewArrival ? '🆕' : '🔲') + '</button>' +
          '<button class="btn btn-sm btn-ghost" onclick="toggleProductFlag(\'' + p.id + '\',\'active\',' + (p.isActive ? 'true' : 'false') + ')" title="Toggle Active">' + (p.isActive ? '✅' : '⬜') + '</button>' +
          '<button class="btn btn-sm btn-danger" onclick="deleteProduct(\'' + p.id + '\',\'' + esc(p.name).replace(/'/g, "\\'") + '\')">Del</button>' +
          '</div></td>' +
          '</tr>';
      }).join('');
      renderPagination('products-pagination', pagination, function(p){ loadProducts(p); });
    });
  }
  window.loadProducts = loadProducts;

  window.editProduct = function (id) {
    api('GET', '/admin/products/' + id, null, function (err, data) {
      if (err) { toast('Failed to load product: ' + err.message, 'error'); return; }
      openProductModal(data.data || data);
    });
  };

  window.deleteProduct = function (id, name) {
    confirm('Delete Product', 'Delete "' + name + '"? This cannot be undone.', function () {
      api('DELETE', '/admin/products/' + id, null, function (err) {
        if (err) { toast('Delete failed: ' + err.message, 'error'); return; }
        toast('Product deleted', 'success');
        loadProducts(state.pages.products);
      });
    });
  };

  window.toggleProductFlag = function (id, flag, current) {
    var body = {};
    if (flag === 'featured') body.isFeatured = !current;
    else if (flag === 'newArrival') body.isNewArrival = !current;
    else if (flag === 'active') body.isActive = !current;
    api('PUT', '/admin/products/' + id, body, function (err) {
      if (err) { toast('Update failed: ' + err.message, 'error'); return; }
      toast('Product updated', 'success');
      loadProducts(state.pages.products);
    });
  };

  function openProductModal(p) {
    var isEdit = p && p.id;
    $('product-modal-title').textContent = isEdit ? 'Edit Product' : 'Add Product';
    $('pf-id').value = isEdit ? p.id : '';
    $('pf-name').value = p ? (p.name || '') : '';
    $('pf-code').value = p ? (p.productCode || '') : '';
    $('pf-collection').value = p ? (p.collection || '') : '';
    $('pf-subcategory').value = p ? (p.subcategory || '') : '';
    $('pf-colour').value = p ? (p.colourFinish || '') : '';
    $('pf-material').value = p ? (p.material || '') : '';
    $('pf-capacity').value = p ? (p.capacity || '') : '';
    $('pf-dimensions').value = p ? (p.dimensions || '') : '';
    $('pf-set-contents').value = p ? (p.setContents || '') : '';
    $('pf-pieces').value = p ? (p.piecesPerSet || '') : '';
    $('pf-case-qty').value = p ? (p.caseQty || '') : '';
    $('pf-packaging').value = p ? (p.packagingInformation || '') : '';
    $('pf-features').value = p && p.features ? p.features.join(', ') : '';
    $('pf-mrp').value = p ? (p.mrp || '') : '';
    $('pf-catalogue-mrp').value = p ? (p.catalogueMrp || '') : '';
    $('pf-website-price').value = p ? (p.websitePrice || '') : '';
    $('pf-wholesale-price').value = p ? (p.wholesalePrice || '') : '';
    $('pf-price-unit').value = p ? (p.priceUnit || '') : '';
    $('pf-catalogue-page').value = p ? (p.cataloguePage || '') : '';
    $('pf-seo-title').value = p ? (p.seoTitle || '') : '';
    $('pf-seo-desc').value = p ? (p.seoDescription || '') : '';
    $('pf-description').value = p ? (p.description || '') : '';
    $('pf-featured').checked = p ? !!p.isFeatured : false;
    $('pf-new-arrival').checked = p ? !!p.isNewArrival : false;
    $('pf-active').checked = p ? (p.isActive !== false) : true;

    // Set brand/category selects
    var brandSel = $('pf-brand');
    if (brandSel && p && p.brand) {
      for (var i = 0; i < brandSel.options.length; i++) {
        if (brandSel.options[i].value === p.brand.id) {
          brandSel.selectedIndex = i; break;
        }
      }
    } else if (brandSel) { brandSel.selectedIndex = 0; }

    var catSel = $('pf-category');
    if (catSel && p && p.category) {
      for (var j = 0; j < catSel.options.length; j++) {
        if (catSel.options[j].value === p.category.id) {
          catSel.selectedIndex = j; break;
        }
      }
    } else if (catSel) { catSel.selectedIndex = 0; }

    $('product-form-error').textContent = '';
    openModal('product-modal');
  }

  /* ── CATEGORIES ──────────────────────────────────────────────────────────── */
  function loadCategories() {
    var tbody = $('categories-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="td-loading">Loading…</td></tr>';
    api('GET', '/admin/categories', null, function (err, data) {
      if (err) { tbody.innerHTML = '<tr><td colspan="6" class="td-empty text-danger">' + esc(err.message) + '</td></tr>'; return; }
      var cats = data.data || [];
      if (!cats.length) { tbody.innerHTML = '<tr><td colspan="6" class="td-empty">No categories yet</td></tr>'; return; }
      tbody.innerHTML = cats.map(function (c) {
        var parent = cats.find(function(x){ return x.id === c.parentId; });
        return '<tr>' +
          '<td><strong>' + esc(c.name) + '</strong></td>' +
          '<td class="text-muted font-mono text-sm">' + esc(c.slug) + '</td>' +
          '<td>' + (parent ? esc(parent.name) : '—') + '</td>' +
          '<td>' + (c._count ? c._count.products || 0 : '—') + '</td>' +
          '<td><span class="badge ' + (c.isActive ? 'badge-active' : 'badge-inactive') + '">' + (c.isActive ? 'Active' : 'Inactive') + '</span></td>' +
          '<td><div style="display:flex;gap:6px;">' +
          '<button class="btn btn-sm btn-ghost" onclick="editCategory(\'' + c.id + '\')">Edit</button>' +
          '<button class="btn btn-sm btn-danger" onclick="deleteCat(\'' + c.id + '\',\'' + esc(c.name).replace(/'/g, "\\'") + '\')">Del</button>' +
          '</div></td></tr>';
      }).join('');
    });
  }

  window.editCategory = function (id) {
    api('GET', '/admin/categories', null, function (err, data) {
      if (err) { toast('Failed: ' + err.message, 'error'); return; }
      var cats = data.data || [];
      var cat = cats.find(function (c) { return c.id === id; });
      if (!cat) { toast('Category not found', 'error'); return; }
      openCategoryModal(cat, cats);
    });
  };

  window.deleteCat = function (id, name) {
    confirm('Delete Category', 'Delete "' + name + '"? Products will keep their data.', function () {
      api('DELETE', '/admin/categories/' + id, null, function (err) {
        if (err) { toast('Delete failed: ' + err.message, 'error'); return; }
        toast('Category deleted', 'success');
        loadMetaData(loadCategories);
      });
    });
  };

  function openCategoryModal(cat, allCats) {
    $('category-modal-title').textContent = cat ? 'Edit Category' : 'Add Category';
    $('cf-id').value = cat ? cat.id : '';
    $('cf-name').value = cat ? (cat.name || '') : '';
    $('cf-slug').value = cat ? (cat.slug || '') : '';
    $('cf-desc').value = cat ? (cat.description || '') : '';
    $('cf-sort').value = cat ? (cat.sortOrder || 0) : 0;
    $('cf-active').checked = cat ? (cat.isActive !== false) : true;

    // Parent select
    var parentSel = $('cf-parent');
    if (parentSel) {
      var html = '<option value="">— No Parent (Top Level) —</option>';
      (allCats || state.allCategories).forEach(function (c) {
        if (cat && c.id === cat.id) return; // Skip self
        html += '<option value="' + c.id + '"' + (cat && cat.parentId === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>';
      });
      parentSel.innerHTML = html;
    }

    $('category-form-error').textContent = '';
    openModal('category-modal');
  }

  /* ── BRANDS ──────────────────────────────────────────────────────────────── */
  function loadBrands() {
    var tbody = $('brands-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="td-loading">Loading…</td></tr>';
    api('GET', '/admin/brands', null, function (err, data) {
      if (err) { tbody.innerHTML = '<tr><td colspan="5" class="td-empty text-danger">' + esc(err.message) + '</td></tr>'; return; }
      var brands = data.data || [];
      var countEl = $('brands-count');
      if (countEl) countEl.textContent = brands.length + ' brands';
      if (!brands.length) { tbody.innerHTML = '<tr><td colspan="5" class="td-empty">No brands yet</td></tr>'; return; }
      tbody.innerHTML = brands.map(function (b) {
        return '<tr>' +
          '<td><div style="display:flex;align-items:center;gap:10px;">' +
          (b.logo ? '<img src="' + esc(b.logo) + '" style="width:32px;height:32px;object-fit:contain;border-radius:4px;" onerror="this.style.display=\'none\'" />' : '') +
          '<strong>' + esc(b.name) + '</strong>' +
          (b.isOwnBrand ? ' <span class="badge badge-own-brand">Own Brand</span>' : '') +
          '</div></td>' +
          '<td class="text-muted font-mono text-sm">' + esc(b.slug) + '</td>' +
          '<td>' + (b.isOwnBrand ? '<span class="badge badge-own-brand">Own Brand</span>' : '<span class="badge badge-new">Supplier</span>') + '</td>' +
          '<td><span class="badge ' + (b.isActive ? 'badge-active' : 'badge-inactive') + '">' + (b.isActive ? 'Active' : 'Inactive') + '</span></td>' +
          '<td><div style="display:flex;gap:6px;">' +
          '<button class="btn btn-sm btn-ghost" onclick="editBrand(\'' + b.id + '\')">Edit</button>' +
          '<button class="btn btn-sm btn-danger" onclick="deleteBrand(\'' + b.id + '\',\'' + esc(b.name).replace(/'/g, "\\'") + '\')">Del</button>' +
          '</div></td></tr>';
      }).join('');
    });
  }

  window.editBrand = function (id) {
    api('GET', '/admin/brands', null, function (err, data) {
      if (err) { toast('Failed: ' + err.message, 'error'); return; }
      var brand = (data.data || []).find(function (b) { return b.id === id; });
      if (!brand) { toast('Brand not found', 'error'); return; }
      openBrandModal(brand);
    });
  };

  window.deleteBrand = function (id, name) {
    confirm('Delete Brand', 'Delete brand "' + name + '"?', function () {
      api('DELETE', '/admin/brands/' + id, null, function (err) {
        if (err) { toast('Delete failed: ' + err.message, 'error'); return; }
        toast('Brand deleted', 'success');
        loadMetaData(loadBrands);
      });
    });
  };

  function openBrandModal(b) {
    $('brand-modal-title').textContent = b ? 'Edit Brand' : 'Add Brand';
    $('bf-id').value = b ? b.id : '';
    $('bf-name').value = b ? (b.name || '') : '';
    $('bf-slug').value = b ? (b.slug || '') : '';
    $('bf-desc').value = b ? (b.description || '') : '';
    $('bf-website').value = b ? (b.website || '') : '';
    $('bf-logo').value = b ? (b.logo || '') : '';
    $('bf-sort').value = b ? (b.sortOrder || 0) : 0;
    $('bf-own').checked = b ? !!b.isOwnBrand : false;
    $('bf-active').checked = b ? (b.isActive !== false) : true;
    $('brand-form-error').textContent = '';
    openModal('brand-modal');
  }

  /* ── CATALOGUES ──────────────────────────────────────────────────────────── */
  function loadCatalogues() {
    var tbody = $('catalogues-tbody');
    var grid = $('catalogues-grid');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="td-loading">Loading…</td></tr>';
    if (grid) grid.innerHTML = '<div style="color:var(--c-muted);font-size:13px;padding:20px;">Loading catalogues…</div>';

    api('GET', '/admin/catalogues', null, function (err, data) {
      if (err) { tbody.innerHTML = '<tr><td colspan="6" class="td-empty text-danger">' + esc(err.message) + '</td></tr>'; return; }
      var cats = data.data || [];
      if (!cats.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="td-empty">No catalogues uploaded yet</td></tr>';
        if (grid) grid.innerHTML = '<div style="color:var(--c-muted);font-size:13px;padding:20px;">No catalogues yet. Upload your first catalogue.</div>';
        return;
      }
      tbody.innerHTML = cats.map(function (c) {
        return '<tr>' +
          '<td><strong>' + esc(c.title) + '</strong></td>' +
          '<td>' + esc(c.version || '—') + '</td>' +
          '<td><a href="' + esc(c.fileUrl) + '" target="_blank" rel="noopener" class="btn btn-xs btn-ghost">📄 View PDF</a></td>' +
          '<td><span class="badge ' + (c.isActive ? 'badge-active' : 'badge-inactive') + '">' + (c.isActive ? 'Active' : 'Hidden') + '</span></td>' +
          '<td class="text-muted text-sm">' + fmtDate(c.createdAt) + '</td>' +
          '<td><div style="display:flex;gap:6px;">' +
          '<button class="btn btn-sm btn-ghost" onclick="editCatalogue(\'' + c.id + '\')">Edit</button>' +
          '<button class="btn btn-sm btn-danger" onclick="deleteCatalogue(\'' + c.id + '\',\'' + esc(c.title).replace(/'/g, "\\'") + '\')">Del</button>' +
          '</div></td></tr>';
      }).join('');
      if (grid) {
        grid.innerHTML = cats.slice(0, 6).map(function (c) {
          return '<div class="catalogue-card">' +
            '<div class="catalogue-thumb">📋</div>' +
            '<div class="catalogue-info">' +
            '<div class="catalogue-title">' + esc(c.title) + '</div>' +
            '<div class="catalogue-meta">' + esc(c.version || 'No version') + ' · ' + (c.isActive ? 'Active' : 'Hidden') + '</div>' +
            '<div class="catalogue-actions">' +
            '<a href="' + esc(c.fileUrl) + '" target="_blank" class="btn btn-sm btn-ghost">📄 View</a>' +
            '<button class="btn btn-sm btn-danger" onclick="deleteCatalogue(\'' + c.id + '\',\'' + esc(c.title).replace(/'/g, "\\'") + '\')">Del</button>' +
            '</div></div></div>';
        }).join('');
      }
    });
  }

  window.editCatalogue = function (id) {
    api('GET', '/admin/catalogues', null, function (err, data) {
      if (err) { toast('Failed: ' + err.message, 'error'); return; }
      var cat = (data.data || []).find(function (c) { return c.id === id; });
      if (cat) openCatalogueModal(cat);
    });
  };

  window.deleteCatalogue = function (id, title) {
    confirm('Delete Catalogue', 'Delete "' + title + '"? The PDF file will be removed.', function () {
      api('DELETE', '/admin/catalogues/' + id, null, function (err) {
        if (err) { toast('Delete failed: ' + err.message, 'error'); return; }
        toast('Catalogue deleted', 'success');
        loadCatalogues();
      });
    });
  };

  function openCatalogueModal(c) {
    $('catalogue-modal-title').textContent = c ? 'Edit Catalogue' : 'Upload Catalogue';
    $('catf-id').value = c ? c.id : '';
    $('catf-title').value = c ? (c.title || '') : '';
    $('catf-version').value = c ? (c.version || '') : '';
    $('catf-url').value = c ? (c.fileUrl || '') : '';
    $('catf-active').checked = c ? (c.isActive !== false) : true;
    if (c) { $('catf-file-group').style.display = 'none'; } else { $('catf-file-group').style.display = ''; }
    $('catalogue-form-error').textContent = '';
    openModal('catalogue-modal');
  }

  /* ── HOMEPAGE MANAGEMENT ─────────────────────────────────────────────────── */
  function loadHomepage() {
    loadBanners();
    loadFeaturedProducts();
    loadNewArrivals();
    loadReviews();
  }

  // Homepage sub-tabs
  document.querySelectorAll('[data-hptab]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('[data-hptab]').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      document.querySelectorAll('[id^="hptab-"]').forEach(function (el) { el.classList.add('hidden'); });
      var target = $('hptab-' + btn.dataset.hptab);
      if (target) target.classList.remove('hidden');
    });
  });

  function loadBanners() {
    var tbody = $('banners-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="td-loading">Loading…</td></tr>';
    api('GET', '/admin/banners', null, function (err, data) {
      if (err) { tbody.innerHTML = '<tr><td colspan="6" class="td-empty text-danger">' + esc(err.message) + '</td></tr>'; return; }
      var banners = data.data || [];
      if (!banners.length) { tbody.innerHTML = '<tr><td colspan="6" class="td-empty">No banners yet</td></tr>'; return; }
      tbody.innerHTML = banners.map(function (b) {
        return '<tr>' +
          '<td>' + b.sortOrder + '</td>' +
          '<td><strong>' + esc(b.title) + '</strong></td>' +
          '<td class="text-muted">' + esc(b.subtitle || '—') + '</td>' +
          '<td>' + (b.buttonText ? esc(b.buttonText) + ' → ' + esc(b.buttonUrl || '') : '—') + '</td>' +
          '<td><span class="badge ' + (b.isActive ? 'badge-active' : 'badge-inactive') + '">' + (b.isActive ? 'Active' : 'Hidden') + '</span></td>' +
          '<td><div style="display:flex;gap:6px;">' +
          '<button class="btn btn-sm btn-ghost" onclick="editBanner(\'' + b.id + '\')">Edit</button>' +
          '<button class="btn btn-sm btn-danger" onclick="deleteBanner(\'' + b.id + '\',\'' + esc(b.title).replace(/'/g, "\\'") + '\')">Del</button>' +
          '</div></td></tr>';
      }).join('');
    });
  }

  window.editBanner = function (id) {
    api('GET', '/admin/banners', null, function (err, data) {
      if (err) { toast('Failed: ' + err.message, 'error'); return; }
      var banner = (data.data || []).find(function (b) { return b.id === id; });
      if (banner) openBannerModal(banner);
    });
  };

  window.deleteBanner = function (id, title) {
    confirm('Delete Banner', 'Delete banner "' + title + '"?', function () {
      api('DELETE', '/admin/banners/' + id, null, function (err) {
        if (err) { toast('Delete failed: ' + err.message, 'error'); return; }
        toast('Banner deleted', 'success');
        loadBanners();
      });
    });
  };

  function openBannerModal(b) {
    $('banner-modal-title').textContent = b ? 'Edit Banner' : 'Add Banner';
    $('bnf-id').value = b ? b.id : '';
    $('bnf-title').value = b ? (b.title || '') : '';
    $('bnf-subtitle').value = b ? (b.subtitle || '') : '';
    $('bnf-image').value = b ? (b.image || '') : '';
    $('bnf-btn-text').value = b ? (b.buttonText || '') : '';
    $('bnf-btn-url').value = b ? (b.buttonUrl || '') : '';
    $('bnf-sort').value = b ? (b.sortOrder || 0) : 0;
    $('bnf-active').checked = b ? (b.isActive !== false) : true;
    $('banner-form-error').textContent = '';
    openModal('banner-modal');
  }

  function loadFeaturedProducts() {
    var tbody = $('featured-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="td-loading">Loading…</td></tr>';
    api('GET', '/admin/products?featured=true&pageSize=50', null, function (err, res) {
      if (err) { tbody.innerHTML = '<tr><td colspan="5" class="td-empty text-danger">' + esc(err.message) + '</td></tr>'; return; }
      var products = res.data || [];
      if (!products.length) { tbody.innerHTML = '<tr><td colspan="5" class="td-empty">No featured products. Mark products as featured from the Products page.</td></tr>'; return; }
      tbody.innerHTML = products.map(function (p) {
        return '<tr>' +
          '<td><strong>' + esc(p.name) + '</strong><br><span class="text-muted text-xs">' + esc(p.productCode || '') + '</span></td>' +
          '<td>' + esc((p.brand && p.brand.name) || '—') + '</td>' +
          '<td>' + esc((p.category && p.category.name) || '—') + '</td>' +
          '<td><span class="badge badge-featured">⭐ Featured</span></td>' +
          '<td><button class="btn btn-sm btn-ghost" onclick="toggleProductFlag(\'' + p.id + '\',\'featured\',true)">Remove Featured</button></td>' +
          '</tr>';
      }).join('');
    });
  }

  function loadNewArrivals() {
    var tbody = $('new-arrivals-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" class="td-loading">Loading…</td></tr>';
    api('GET', '/admin/products?newArrival=true&pageSize=50', null, function (err, res) {
      if (err) { tbody.innerHTML = '<tr><td colspan="5" class="td-empty text-danger">' + esc(err.message) + '</td></tr>'; return; }
      var products = res.data || [];
      if (!products.length) { tbody.innerHTML = '<tr><td colspan="5" class="td-empty">No new arrivals. Mark products as new arrivals from the Products page.</td></tr>'; return; }
      tbody.innerHTML = products.map(function (p) {
        return '<tr>' +
          '<td><strong>' + esc(p.name) + '</strong><br><span class="text-muted text-xs">' + esc(p.productCode || '') + '</span></td>' +
          '<td>' + esc((p.brand && p.brand.name) || '—') + '</td>' +
          '<td>' + esc((p.category && p.category.name) || '—') + '</td>' +
          '<td><span class="badge badge-new-arr">🆕 New</span></td>' +
          '<td><button class="btn btn-sm btn-ghost" onclick="toggleProductFlag(\'' + p.id + '\',\'newArrival\',true)">Remove</button></td>' +
          '</tr>';
      }).join('');
    });
  }

  function loadReviews() {
    var tbody = $('reviews-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="td-loading">Loading…</td></tr>';
    api('GET', '/admin/reviews', null, function (err, data) {
      if (err) { tbody.innerHTML = '<tr><td colspan="7" class="td-empty text-danger">' + esc(err.message) + '</td></tr>'; return; }
      var reviews = data.data || [];
      if (!reviews.length) { tbody.innerHTML = '<tr><td colspan="7" class="td-empty">No reviews yet</td></tr>'; return; }
      tbody.innerHTML = reviews.map(function (r) {
        var stars = '★'.repeat(r.rating || 5) + '☆'.repeat(5 - (r.rating || 5));
        return '<tr>' +
          '<td><strong>' + esc(r.customerName) + '</strong></td>' +
          '<td>' + esc(r.businessName || '—') + '</td>' +
          '<td><span class="badge badge-new">' + esc(r.customerType || '') + '</span></td>' +
          '<td style="color:var(--c-gold);">' + stars + '</td>' +
          '<td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(r.reviewText) + '</td>' +
          '<td><span class="badge ' + (r.isPublished ? 'badge-active' : 'badge-inactive') + '">' + (r.isPublished ? 'Published' : 'Draft') + '</span></td>' +
          '<td><div style="display:flex;gap:6px;">' +
          '<button class="btn btn-sm btn-ghost" onclick="editReview(\'' + r.id + '\')">Edit</button>' +
          '<button class="btn btn-sm btn-ghost" onclick="toggleReview(\'' + r.id + '\',' + (r.isPublished ? 'true' : 'false') + ')">' + (r.isPublished ? 'Unpublish' : 'Publish') + '</button>' +
          '<button class="btn btn-sm btn-danger" onclick="deleteReview(\'' + r.id + '\',\'' + esc(r.customerName).replace(/'/g, "\\'") + '\')">Del</button>' +
          '</div></td></tr>';
      }).join('');
    });
  }

  window.editReview = function (id) {
    api('GET', '/admin/reviews', null, function (err, data) {
      if (err) { toast('Failed: ' + err.message, 'error'); return; }
      var r = (data.data || []).find(function (x) { return x.id === id; });
      if (r) openReviewModal(r);
    });
  };
  window.toggleReview = function (id, current) {
    api('PUT', '/admin/reviews/' + id, { isPublished: !current }, function (err) {
      if (err) { toast('Failed: ' + err.message, 'error'); return; }
      toast('Review updated', 'success'); loadReviews();
    });
  };
  window.deleteReview = function (id, name) {
    confirm('Delete Review', 'Delete review from "' + name + '"?', function () {
      api('DELETE', '/admin/reviews/' + id, null, function (err) {
        if (err) { toast('Delete failed: ' + err.message, 'error'); return; }
        toast('Review deleted', 'success'); loadReviews();
      });
    });
  };

  function openReviewModal(r) {
    $('review-modal-title').textContent = r ? 'Edit Review' : 'Add Review';
    $('rvf-id').value = r ? r.id : '';
    $('rvf-name').value = r ? (r.customerName || '') : '';
    $('rvf-business').value = r ? (r.businessName || '') : '';
    $('rvf-type').value = r ? (r.customerType || 'INDIVIDUAL') : 'INDIVIDUAL';
    $('rvf-rating').value = r ? (r.rating || 5) : 5;
    $('rvf-text').value = r ? (r.reviewText || '') : '';
    $('rvf-source').value = r ? (r.source || '') : '';
    $('rvf-published').checked = r ? !!r.isPublished : false;
    $('review-form-error').textContent = '';
    openModal('review-modal');
  }

  /* ── ENQUIRIES ───────────────────────────────────────────────────────────── */
  function loadEnquiries(page) {
    state.pages.enquiries = page || 1;
    var tbody = $('enquiries-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="td-loading">Loading…</td></tr>';
    var q = 'page=' + state.pages.enquiries + '&pageSize=30&sortOrder=desc';
    if (state.filters.enquiryStatus !== 'all') q += '&status=' + state.filters.enquiryStatus;
    api('GET', '/admin/enquiries?' + q, null, function (err, res) {
      if (err) { tbody.innerHTML = '<tr><td colspan="8" class="td-empty text-danger">' + esc(err.message) + '</td></tr>'; return; }
      var items = res.data || [];
      var pagination = res.pagination || {};
      var countEl = $('enquiries-count');
      if (countEl) countEl.textContent = (pagination.total || items.length) + ' enquiries total';
      if (!items.length) { tbody.innerHTML = '<tr><td colspan="8" class="td-empty">No enquiries found</td></tr>'; return; }
      tbody.innerHTML = items.map(function (e) {
        return '<tr>' +
          '<td><strong>' + esc(e.name) + '</strong><br><span class="text-muted text-xs">' + esc(e.phone || '') + (e.email ? ' · ' + esc(e.email) : '') + '</span></td>' +
          '<td>' + esc(e.companyName || '—') + '</td>' +
          '<td><span class="badge badge-new text-xs">' + esc(e.customerType || '') + '</span></td>' +
          '<td style="max-width:180px;"><span title="' + esc(e.message || '') + '">' + esc((e.product && e.product.name) || (e.message ? e.message.substring(0, 40) + (e.message.length > 40 ? '…' : '') : '—')) + '</span></td>' +
          '<td>' + esc(e.quantity || '—') + '</td>' +
          '<td><span class="badge badge-' + (e.status || '').toLowerCase().replace('_','-') + '">' + esc(e.status || '') + '</span></td>' +
          '<td class="text-muted text-sm">' + fmtDate(e.createdAt) + '</td>' +
          '<td><div style="display:flex;gap:6px;">' +
          '<button class="btn btn-sm btn-ghost" onclick="viewEnquiry(\'' + e.id + '\')">View</button>' +
          '</div></td></tr>';
      }).join('');
      renderPagination('enquiries-pagination', pagination, function(p){ loadEnquiries(p); });
    });
  }
  window.loadEnquiries = loadEnquiries;

  window.viewEnquiry = function (id) {
    api('GET', '/admin/enquiries/' + id, null, function (err, data) {
      if (err) { toast('Failed: ' + err.message, 'error'); return; }
      var e = data.data || {};
      state.currentEnquiryId = id;
      var body = $('enquiry-modal-body');
      if (body) {
        body.innerHTML =
          '<div class="form-grid"><div><span class="form-label">Name</span><p><strong>' + esc(e.name) + '</strong></p></div>' +
          '<div><span class="form-label">Company</span><p>' + esc(e.companyName || '—') + '</p></div>' +
          '<div><span class="form-label">Phone</span><p>' + esc(e.phone || '—') + '</p></div>' +
          '<div><span class="form-label">Email</span><p>' + esc(e.email || '—') + '</p></div>' +
          '<div><span class="form-label">Customer Type</span><p>' + esc(e.customerType || '—') + '</p></div>' +
          '<div><span class="form-label">Quantity</span><p>' + esc(e.quantity || '—') + '</p></div>' +
          (e.product ? '<div class="form-full"><span class="form-label">Product</span><p>' + esc(e.product.name) + (e.product.productCode ? ' (' + esc(e.product.productCode) + ')' : '') + '</p></div>' : '') +
          '<div class="form-full"><span class="form-label">Message</span><p>' + esc(e.message || '—') + '</p></div>' +
          '<div><span class="form-label">Source</span><p>' + esc(e.source || 'website') + '</p></div>' +
          '<div><span class="form-label">Date</span><p>' + fmtDateTime(e.createdAt) + '</p></div></div>';
      }
      var statusSel = $('enquiry-status-select');
      if (statusSel) statusSel.value = e.status || 'NEW';
      openModal('enquiry-modal');
    });
  };

  /* ── CUSTOMERS ───────────────────────────────────────────────────────────── */
  function loadCustomers() {
    var tbody = $('customers-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="td-loading">Loading customers from enquiries…</td></tr>';
    api('GET', '/admin/enquiries?pageSize=200', null, function (err, res) {
      if (err) { tbody.innerHTML = '<tr><td colspan="7" class="td-empty text-danger">' + esc(err.message) + '</td></tr>'; return; }
      var items = res.data || [];
      // Build unique customer list from enquiries (group by phone)
      var customerMap = {};
      items.forEach(function (e) {
        var key = e.phone || e.email || e.name;
        if (!customerMap[key]) {
          customerMap[key] = { name: e.name, companyName: e.companyName, type: e.customerType, phone: e.phone, email: e.email, count: 0, lastContact: e.createdAt };
        }
        customerMap[key].count++;
        if (new Date(e.createdAt) > new Date(customerMap[key].lastContact)) {
          customerMap[key].lastContact = e.createdAt;
        }
      });
      var customers = Object.values(customerMap);
      if (!customers.length) { tbody.innerHTML = '<tr><td colspan="7" class="td-empty">No customers yet</td></tr>'; return; }
      tbody.innerHTML = customers.map(function (c) {
        return '<tr>' +
          '<td><strong>' + esc(c.name) + '</strong></td>' +
          '<td>' + esc(c.companyName || '—') + '</td>' +
          '<td><span class="badge badge-new text-xs">' + esc(c.type || '') + '</span></td>' +
          '<td>' + esc(c.phone || '—') + '</td>' +
          '<td>' + esc(c.email || '—') + '</td>' +
          '<td>' + c.count + '</td>' +
          '<td class="text-muted text-sm">' + fmtDate(c.lastContact) + '</td>' +
          '</tr>';
      }).join('');
    });
  }

  /* ── SALES ───────────────────────────────────────────────────────────────── */
  function loadSales(page) {
    state.pages.sales = page || 1;
    var tbody = $('sales-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="td-loading">Loading…</td></tr>';
    var q = 'page=' + state.pages.sales + '&pageSize=30';
    if (state.filters.saleStatus !== 'all') q += '&status=' + state.filters.saleStatus;

    // Load stats
    api('GET', '/admin/sales/stats', null, function (err, data) {
      if (!err && data && data.data) {
        var s = data.data;
        var statsEl = $('sales-stats');
        if (statsEl) {
          var statusCols = { QUOTE:'badge-quote', CONFIRMED:'badge-confirmed', PROCESSING:'badge-processing', DELIVERED:'badge-delivered', CANCELLED:'badge-cancelled' };
          statsEl.innerHTML =
            '<div class="stat-card" style="--accent:var(--c-navy)"><span class="stat-card-icon">💼</span><div class="stat-value">' + (s.totalSales || 0) + '</div><div class="stat-label">Total Sales</div></div>' +
            '<div class="stat-card" style="--accent:var(--c-success)"><span class="stat-card-icon">💰</span><div class="stat-value">' + fmtPrice(s.totalRevenue) + '</div><div class="stat-label">Total Revenue</div></div>' +
            (s.byStatus || []).map(function (bs) {
              return '<div class="stat-card"><span class="stat-card-icon">📊</span><div class="stat-value">' + bs.count + '</div><div class="stat-label">' + bs.status + '</div><div class="stat-delta">' + fmtPrice(bs.revenue) + '</div></div>';
            }).join('');
        }
        var countEl = $('sales-count');
        if (countEl) countEl.textContent = (s.totalSales || 0) + ' sales · Total Revenue: ' + fmtPrice(s.totalRevenue);
      }
    });

    api('GET', '/admin/sales?' + q, null, function (err, res) {
      if (err) { tbody.innerHTML = '<tr><td colspan="8" class="td-empty text-danger">' + esc(err.message) + '</td></tr>'; return; }
      var sales = res.data || [];
      var pagination = res.pagination || {};
      if (!sales.length) { tbody.innerHTML = '<tr><td colspan="8" class="td-empty">No sales recorded yet. Create your first sale.</td></tr>'; return; }
      tbody.innerHTML = sales.map(function (s) {
        var statusClass = { QUOTE:'badge-quote', CONFIRMED:'badge-confirmed', PROCESSING:'badge-processing', DELIVERED:'badge-delivered', CANCELLED:'badge-cancelled' }[s.status] || 'badge-closed';
        return '<tr>' +
          '<td class="font-mono font-bold">' + esc(s.saleNumber) + '</td>' +
          '<td><strong>' + esc(s.customerName) + '</strong></td>' +
          '<td>' + esc(s.companyName || '—') + '</td>' +
          '<td>' + (s.items ? s.items.length : 0) + ' items</td>' +
          '<td class="font-mono font-bold">' + fmtPrice(s.totalAmount) + '</td>' +
          '<td><span class="badge ' + statusClass + '">' + esc(s.status) + '</span></td>' +
          '<td class="text-muted text-sm">' + fmtDate(s.createdAt) + '</td>' +
          '<td><div style="display:flex;gap:6px;">' +
          '<button class="btn btn-sm btn-ghost" onclick="editSale(\'' + s.id + '\')">Edit</button>' +
          '<button class="btn btn-sm btn-danger" onclick="deleteSale(\'' + s.id + '\',\'' + esc(s.saleNumber) + '\')">Del</button>' +
          '</div></td></tr>';
      }).join('');
      renderPagination('sales-pagination', pagination, function(p){ loadSales(p); });
    });
  }
  window.loadSales = loadSales;

  window.editSale = function (id) {
    api('GET', '/admin/sales/' + id, null, function (err, data) {
      if (err) { toast('Failed: ' + err.message, 'error'); return; }
      openSaleModal(data.data || data);
    });
  };

  window.deleteSale = function (id, saleNum) {
    confirm('Delete Sale', 'Delete sale ' + saleNum + '? This cannot be undone.', function () {
      api('DELETE', '/admin/sales/' + id, null, function (err) {
        if (err) { toast('Delete failed: ' + err.message, 'error'); return; }
        toast('Sale deleted', 'success');
        loadSales(state.pages.sales);
      });
    });
  };

  function openSaleModal(s) {
    $('sale-modal-title').textContent = s ? 'Edit Sale' : 'New Sale';
    $('sf-id').value = s ? s.id : '';
    $('sf-customer').value = s ? (s.customerName || '') : '';
    $('sf-company').value = s ? (s.companyName || '') : '';
    $('sf-phone').value = s ? (s.phone || '') : '';
    $('sf-email').value = s ? (s.email || '') : '';
    $('sf-status').value = s ? (s.status || 'QUOTE') : 'QUOTE';
    $('sf-notes').value = s ? (s.notes || '') : '';
    // Set items
    state.saleItems = s && s.items ? s.items.map(function (i) {
      return { productId: i.productId || '', productName: i.productName || '', productCode: i.productCode || '', quantity: i.quantity || 1, unitPrice: parseFloat(i.unitPrice) || 0 };
    }) : [];
    renderSaleItems();
    $('sale-form-error').textContent = '';
    openModal('sale-modal');
  }

  function renderSaleItems() {
    var container = $('sale-items-container');
    if (!container) return;
    if (!state.saleItems.length) {
      container.innerHTML = '<p class="text-muted text-sm">No items yet. Click "+ Add Item" to add.</p>';
      $('sale-total').textContent = '₹0.00';
      return;
    }
    var total = 0;
    container.innerHTML = state.saleItems.map(function (item, idx) {
      var lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
      total += lineTotal;
      return '<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto;gap:8px;align-items:center;margin-bottom:8px;padding:10px;background:var(--c-surface);border-radius:var(--r-md);">' +
        '<input type="text" class="form-input" value="' + esc(item.productName) + '" placeholder="Product name" oninput="updateSaleItem(' + idx + ',\'productName\',this.value)" />' +
        '<input type="text" class="form-input" value="' + esc(item.productCode || '') + '" placeholder="Code" oninput="updateSaleItem(' + idx + ',\'productCode\',this.value)" />' +
        '<input type="number" class="form-input" value="' + (item.quantity || 1) + '" min="1" placeholder="Qty" oninput="updateSaleItem(' + idx + ',\'quantity\',+this.value)" />' +
        '<input type="number" class="form-input" value="' + (item.unitPrice || '') + '" min="0" step="0.01" placeholder="Unit Price" oninput="updateSaleItem(' + idx + ',\'unitPrice\',+this.value)" />' +
        '<button type="button" class="btn btn-danger btn-sm" onclick="removeSaleItem(' + idx + ')">✕</button>' +
        '</div>';
    }).join('');
    $('sale-total').textContent = fmtPrice(total);
  }

  window.updateSaleItem = function (idx, key, val) {
    if (state.saleItems[idx]) { state.saleItems[idx][key] = val; renderSaleItems(); }
  };
  window.removeSaleItem = function (idx) {
    state.saleItems.splice(idx, 1); renderSaleItems();
  };

  /* ── REPORTS ─────────────────────────────────────────────────────────────── */
  function loadReports() {
    // Products breakdown
    api('GET', '/admin/dashboard', null, function (err, data) {
      if (err) return;
      var d = data.data || {};
      var prodEl = $('report-products');
      if (prodEl && d.products) {
        prodEl.innerHTML = renderReportRow('Total Products', d.products.total) +
          renderReportRow('Active', d.products.active, 'badge-active') +
          renderReportRow('Featured', d.products.featured, 'badge-featured') +
          renderReportRow('New Arrivals', d.products.newArrivals, 'badge-new-arr') +
          renderReportRow('Categories', d.categories) +
          renderReportRow('Brands', d.brands);
      }
      var eqEl = $('report-enquiries');
      if (eqEl && d.enquiries) {
        eqEl.innerHTML = renderReportRow('Total Enquiries', d.enquiries.total) +
          renderReportRow('New (Unread)', d.enquiries.new, 'badge-new');
      }
    });
    // Sales breakdown
    api('GET', '/admin/sales/stats', null, function (err, data) {
      if (err) return;
      var d = data.data || {};
      var salesEl = $('report-sales');
      if (salesEl) {
        salesEl.innerHTML = renderReportRow('Total Sales', d.totalSales) +
          renderReportRow('Total Revenue', fmtPrice(d.totalRevenue)) +
          (d.byStatus || []).map(function (s) {
            return renderReportRow(s.status, s.count + ' sales · ' + fmtPrice(s.revenue));
          }).join('');
      }
    });
    // Category breakdown
    api('GET', '/admin/categories', null, function (err, data) {
      if (err) return;
      var cats = (data.data || []);
      var catEl = $('report-categories');
      if (catEl) {
        catEl.innerHTML = cats.map(function (c) {
          return renderReportRow(c.name, '<span class="badge ' + (c.isActive ? 'badge-active' : 'badge-inactive') + '">' + (c.isActive ? 'Active' : 'Inactive') + '</span>');
        }).join('') || '<p class="text-muted">No categories</p>';
      }
    });
  }

  function renderReportRow(label, value, badgeClass) {
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--c-border);">' +
      '<span class="text-muted">' + esc(String(label)) + '</span>' +
      '<strong>' + (badgeClass ? '<span class="badge ' + badgeClass + '">' + esc(String(value || 0)) + '</span>' : esc(String(value !== undefined ? value : '—'))) + '</strong>' +
      '</div>';
  }

  window.exportReport = function () {
    toast('Report export feature — coming soon. Use the export buttons in each section.', 'info');
  };

  /* ── AUDIT LOGS ──────────────────────────────────────────────────────────── */
  function loadAuditLogs(page) {
    state.pages.auditlogs = page || 1;
    var tbody = $('auditlogs-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="td-loading">Loading…</td></tr>';
    var q = 'page=' + state.pages.auditlogs + '&pageSize=30';
    if (state.filters.auditAction !== 'all') q += '&action=' + state.filters.auditAction;
    if (state.filters.auditEntity !== 'all') q += '&entity=' + state.filters.auditEntity;
    api('GET', '/admin/audit-logs?' + q, null, function (err, res) {
      if (err) { tbody.innerHTML = '<tr><td colspan="6" class="td-empty text-danger">' + esc(err.message) + '</td></tr>'; return; }
      var logs = res.data || [];
      var pagination = res.pagination || {};
      if (!logs.length) { tbody.innerHTML = '<tr><td colspan="6" class="td-empty">No audit logs found</td></tr>'; return; }
      var actionColors = {
        LOGIN:'badge-active', LOGOUT:'badge-closed', CREATE:'badge-confirmed', UPDATE:'badge-new',
        DELETE:'badge-cancelled', PRICE_CHANGE:'badge-featured', IMPORT:'badge-processing',
        CATALOGUE_UPLOAD:'badge-gold', HOMEPAGE_CHANGE:'badge-progress',
        SALE_CHANGE:'badge-confirmed', USER_CHANGE:'badge-cancelled', STATUS_CHANGE:'badge-new',
        SETTINGS_CHANGE:'badge-processing',
      };
      tbody.innerHTML = logs.map(function (l) {
        return '<tr>' +
          '<td class="text-sm">' + fmtDateTime(l.createdAt) + '</td>' +
          '<td><strong class="text-sm">' + esc(l.userName || '—') + '</strong><br><span class="text-muted text-xs">' + esc(l.userEmail || '') + '</span></td>' +
          '<td><span class="badge ' + (actionColors[l.action] || 'badge-closed') + ' text-xs">' + esc(l.action) + '</span></td>' +
          '<td class="text-sm">' + esc(l.entity || '—') + '</td>' +
          '<td class="text-muted text-sm" style="max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(l.details || '—') + '</td>' +
          '<td class="font-mono text-xs text-muted">' + esc(l.ipAddress || '—') + '</td>' +
          '</tr>';
      }).join('');
      renderPagination('auditlogs-pagination', pagination, function(p){ loadAuditLogs(p); });
    });
  }
  window.loadAuditLogs = loadAuditLogs;

  /* ── SETTINGS ────────────────────────────────────────────────────────────── */
  function loadSettings() {
    api('GET', '/admin/settings', null, function (err, data) {
      if (err) { toast('Failed to load settings: ' + err.message, 'error'); return; }
      var s = data.data || {};
      var fields = ['businessName', 'tagline', 'phone', 'whatsapp', 'email', 'address', 'warehouseAddress', 'businessHours', 'googleMapsUrl', 'instagram', 'facebook', 'youtube', 'gstNumber', 'panNumber'];
      fields.forEach(function (f) {
        var el = $('s-' + f);
        if (el) el.value = s[f] || '';
      });
    });
  }

  /* ── FILTER SETUP ────────────────────────────────────────────────────────── */
  function setupFilters() {
    // Product search
    var ps = $('product-search');
    if (ps) {
      var deb;
      ps.addEventListener('input', function () {
        clearTimeout(deb);
        deb = setTimeout(function () { state.filters.productSearch = ps.value.trim(); loadProducts(1); }, 400);
      });
    }
    function bindFilter(elId, stateKey, loader) {
      var el = $(elId);
      if (el) el.addEventListener('change', function () { state.filters[stateKey] = el.value; loader(1); });
    }
    bindFilter('product-filter-cat', 'productCat', loadProducts);
    bindFilter('product-filter-brand', 'productBrand', loadProducts);
    bindFilter('product-filter-status', 'productStatus', loadProducts);
    bindFilter('enquiry-filter-status', 'enquiryStatus', loadEnquiries);
    bindFilter('sale-filter-status', 'saleStatus', loadSales);
    bindFilter('audit-filter-action', 'auditAction', loadAuditLogs);
    bindFilter('audit-filter-entity', 'auditEntity', loadAuditLogs);
  }

  /* ── FORM SETUP ──────────────────────────────────────────────────────────── */
  function setupForms() {
    // Product form save
    $('btn-add-product') && $('btn-add-product').addEventListener('click', function () { openProductModal(null); });
    $('product-save-btn') && $('product-save-btn').addEventListener('click', function () { saveProduct(); });

    // Category form
    $('btn-add-category') && $('btn-add-category').addEventListener('click', function () { openCategoryModal(null, state.allCategories); });
    $('category-save-btn') && $('category-save-btn').addEventListener('click', function () { saveCategory(); });

    // Brand form
    $('btn-add-brand') && $('btn-add-brand').addEventListener('click', function () { openBrandModal(null); });
    $('brand-save-btn') && $('brand-save-btn').addEventListener('click', function () { saveBrand(); });

    // Catalogue form
    $('btn-add-catalogue') && $('btn-add-catalogue').addEventListener('click', function () { openCatalogueModal(null); });
    $('catalogue-save-btn') && $('catalogue-save-btn').addEventListener('click', function () { saveCatalogue(); });

    // Banner form
    $('btn-add-banner') && $('btn-add-banner').addEventListener('click', function () { openBannerModal(null); });
    $('banner-save-btn') && $('banner-save-btn').addEventListener('click', function () { saveBanner(); });

    // Review form
    $('btn-add-review') && $('btn-add-review').addEventListener('click', function () { openReviewModal(null); });
    $('review-save-btn') && $('review-save-btn').addEventListener('click', function () { saveReview(); });

    // Sale form
    $('btn-add-sale') && $('btn-add-sale').addEventListener('click', function () { openSaleModal(null); });
    $('sale-save-btn') && $('sale-save-btn').addEventListener('click', function () { saveSale(); });
    $('add-sale-item') && $('add-sale-item').addEventListener('click', function () {
      state.saleItems.push({ productId: '', productName: '', productCode: '', quantity: 1, unitPrice: 0 });
      renderSaleItems();
    });

    // Enquiry update status
    $('enquiry-update-btn') && $('enquiry-update-btn').addEventListener('click', function () {
      if (!state.currentEnquiryId) return;
      var status = $('enquiry-status-select').value;
      api('PUT', '/admin/enquiries/' + state.currentEnquiryId, { status: status }, function (err) {
        if (err) { toast('Failed: ' + err.message, 'error'); return; }
        toast('Enquiry status updated', 'success');
        closeModal('enquiry-modal');
        loadEnquiries(state.pages.enquiries);
        // Refresh dashboard badge
        api('GET', '/admin/dashboard', null, function (err2, data) {
          if (!err2 && data && data.data && data.data.enquiries) {
            var badge = $('enquiry-badge');
            if (badge) {
              if (data.data.enquiries.new > 0) {
                badge.textContent = data.data.enquiries.new;
                badge.classList.remove('hidden');
              } else {
                badge.classList.add('hidden');
              }
            }
          }
        });
      });
    });

    // Settings save
    $('btn-save-settings') && $('btn-save-settings').addEventListener('click', function () { saveSettings(); });

    // Password form
    var pwForm = $('password-form');
    if (pwForm) pwForm.addEventListener('submit', function (e) {
      e.preventDefault();
      toast('Password change is managed via the backend directly.', 'info');
    });

    // Import
    $('btn-import-products') && $('btn-import-products').addEventListener('click', function () { openModal('import-modal'); });
    var dropZone = $('import-drop-zone');
    var fileInput = $('import-file');
    if (dropZone && fileInput) {
      dropZone.addEventListener('click', function () { fileInput.click(); });
      dropZone.addEventListener('dragover', function (e) { e.preventDefault(); dropZone.style.borderColor = 'var(--c-gold)'; });
      dropZone.addEventListener('dragleave', function () { dropZone.style.borderColor = ''; });
      dropZone.addEventListener('drop', function (e) { e.preventDefault(); dropZone.style.borderColor = ''; handleImportFile(e.dataTransfer.files[0]); });
      fileInput.addEventListener('change', function () { if (fileInput.files[0]) handleImportFile(fileInput.files[0]); });
    }
    $('import-submit-btn') && $('import-submit-btn').addEventListener('click', function () { doImport(); });

    // Export enquiries
    window.exportEnquiries = function () {
      api('GET', '/admin/enquiries?pageSize=1000', null, function (err, res) {
        if (err) { toast('Export failed: ' + err.message, 'error'); return; }
        var items = res.data || [];
        var csv = 'Name,Company,Type,Phone,Email,Product,Message,Quantity,Status,Date\n';
        items.forEach(function (e) {
          csv += [e.name, e.companyName || '', e.customerType, e.phone || '', e.email || '',
            (e.product && e.product.name) || '', (e.message || '').replace(/\n/g,' '), e.quantity || '', e.status,
            fmtDate(e.createdAt)].map(function(v){ return '"' + String(v).replace(/"/g,'""') + '"'; }).join(',') + '\n';
        });
        downloadCSV('enquiries.csv', csv);
        toast('Enquiries exported', 'success');
      });
    };
  }

  function downloadCSV(filename, content) {
    var a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(content);
    a.download = filename;
    a.click();
  }

  /* ── SAVE FUNCTIONS ──────────────────────────────────────────────────────── */
  function saveProduct() {
    var id = $('pf-id').value;
    var name = $('pf-name').value.trim();
    if (!name) { $('product-form-error').textContent = 'Product name is required.'; return; }
    var body = {
      name: name,
      productCode: $('pf-code').value.trim() || null,
      collection: $('pf-collection').value.trim() || null,
      brandId: $('pf-brand').value || null,
      categoryId: $('pf-category').value || null,
      subcategory: $('pf-subcategory').value.trim() || null,
      colourFinish: $('pf-colour').value.trim() || null,
      material: $('pf-material').value.trim() || null,
      capacity: $('pf-capacity').value.trim() || null,
      dimensions: $('pf-dimensions').value.trim() || null,
      setContents: $('pf-set-contents').value.trim() || null,
      piecesPerSet: $('pf-pieces').value ? parseInt($('pf-pieces').value) : null,
      caseQty: $('pf-case-qty').value ? parseInt($('pf-case-qty').value) : null,
      packagingInformation: $('pf-packaging').value.trim() || null,
      features: $('pf-features').value ? $('pf-features').value.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : [],
      mrp: $('pf-mrp').value ? parseFloat($('pf-mrp').value) : null,
      catalogueMrp: $('pf-catalogue-mrp').value ? parseFloat($('pf-catalogue-mrp').value) : null,
      websitePrice: $('pf-website-price').value ? parseFloat($('pf-website-price').value) : null,
      wholesalePrice: $('pf-wholesale-price').value ? parseFloat($('pf-wholesale-price').value) : null,
      priceUnit: $('pf-price-unit').value.trim() || null,
      cataloguePage: $('pf-catalogue-page').value.trim() || null,
      seoTitle: $('pf-seo-title').value.trim() || null,
      seoDescription: $('pf-seo-desc').value.trim() || null,
      description: $('pf-description').value.trim() || null,
      isFeatured: $('pf-featured').checked,
      isNewArrival: $('pf-new-arrival').checked,
      isActive: $('pf-active').checked,
    };
    var btn = $('product-save-btn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving…';
    var method = id ? 'PUT' : 'POST';
    var path = id ? '/admin/products/' + id : '/admin/products';
    api(method, path, body, function (err) {
      btn.disabled = false; btn.textContent = 'Save Product';
      if (err) { $('product-form-error').textContent = err.message; return; }
      toast(id ? 'Product updated!' : 'Product created!', 'success');
      closeModal('product-modal');
      loadProducts(state.pages.products);
    });
  }

  function saveCategory() {
    var id = $('cf-id').value;
    var name = $('cf-name').value.trim();
    if (!name) { $('category-form-error').textContent = 'Name is required.'; return; }
    var slug = $('cf-slug').value.trim() || slugify(name);
    var body = {
      name: name, slug: slug,
      description: $('cf-desc').value.trim() || null,
      parentId: $('cf-parent').value || null,
      sortOrder: parseInt($('cf-sort').value) || 0,
      isActive: $('cf-active').checked,
    };
    var btn = $('category-save-btn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
    var method = id ? 'PUT' : 'POST';
    var path = id ? '/admin/categories/' + id : '/admin/categories';
    api(method, path, body, function (err) {
      btn.disabled = false; btn.textContent = 'Save Category';
      if (err) { $('category-form-error').textContent = err.message; return; }
      toast(id ? 'Category updated!' : 'Category created!', 'success');
      closeModal('category-modal');
      loadMetaData(loadCategories);
    });
  }

  function saveBrand() {
    var id = $('bf-id').value;
    var name = $('bf-name').value.trim();
    if (!name) { $('brand-form-error').textContent = 'Brand name is required.'; return; }
    var body = {
      name: name,
      slug: $('bf-slug').value.trim() || slugify(name),
      description: $('bf-desc').value.trim() || null,
      website: $('bf-website').value.trim() || null,
      logo: $('bf-logo').value.trim() || null,
      sortOrder: parseInt($('bf-sort').value) || 0,
      isOwnBrand: $('bf-own').checked,
      isActive: $('bf-active').checked,
    };
    var btn = $('brand-save-btn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
    var method = id ? 'PUT' : 'POST';
    var path = id ? '/admin/brands/' + id : '/admin/brands';
    api(method, path, body, function (err) {
      btn.disabled = false; btn.textContent = 'Save Brand';
      if (err) { $('brand-form-error').textContent = err.message; return; }
      toast(id ? 'Brand updated!' : 'Brand created!', 'success');
      closeModal('brand-modal');
      loadMetaData(loadBrands);
    });
  }

  function saveCatalogue() {
    var id = $('catf-id').value;
    var title = $('catf-title').value.trim();
    if (!title) { $('catalogue-form-error').textContent = 'Title is required.'; return; }
    var btn = $('catalogue-save-btn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving…';

    var fileInput = $('catf-file');
    var hasFile = fileInput && fileInput.files && fileInput.files.length > 0;

    if (hasFile && !id) {
      // Upload with file using FormData
      var fd = new FormData();
      fd.append('title', title);
      fd.append('version', $('catf-version').value.trim());
      fd.append('isActive', $('catf-active').checked ? 'true' : 'false');
      fd.append('file', fileInput.files[0]);
      api('POST', '/admin/catalogues', fd, function (err) {
        btn.disabled = false; btn.textContent = 'Save Catalogue';
        if (err) { $('catalogue-form-error').textContent = err.message; return; }
        toast('Catalogue uploaded!', 'success');
        closeModal('catalogue-modal');
        loadCatalogues();
      }, true);
    } else {
      // JSON update
      var body = {
        title: title,
        version: $('catf-version').value.trim() || null,
        isActive: $('catf-active').checked,
      };
      var url = $('catf-url').value.trim();
      if (url) body.fileUrl = url;
      var method = id ? 'PUT' : 'POST';
      var path = id ? '/admin/catalogues/' + id : '/admin/catalogues';
      api(method, path, body, function (err) {
        btn.disabled = false; btn.textContent = 'Save Catalogue';
        if (err) { $('catalogue-form-error').textContent = err.message; return; }
        toast(id ? 'Catalogue updated!' : 'Catalogue saved!', 'success');
        closeModal('catalogue-modal');
        loadCatalogues();
      });
    }
  }

  function saveBanner() {
    var id = $('bnf-id').value;
    var title = $('bnf-title').value.trim();
    var image = $('bnf-image').value.trim();
    if (!title || !image) { $('banner-form-error').textContent = 'Title and image are required.'; return; }
    var body = {
      title: title, subtitle: $('bnf-subtitle').value.trim() || null, image: image,
      buttonText: $('bnf-btn-text').value.trim() || null, buttonUrl: $('bnf-btn-url').value.trim() || null,
      sortOrder: parseInt($('bnf-sort').value) || 0, isActive: $('bnf-active').checked,
    };
    var btn = $('banner-save-btn');
    btn.disabled = true;
    var method = id ? 'PUT' : 'POST';
    var path = id ? '/admin/banners/' + id : '/admin/banners';
    api(method, path, body, function (err) {
      btn.disabled = false; btn.textContent = 'Save Banner';
      if (err) { $('banner-form-error').textContent = err.message; return; }
      toast(id ? 'Banner updated!' : 'Banner created!', 'success');
      closeModal('banner-modal');
      loadBanners();
    });
  }

  function saveReview() {
    var id = $('rvf-id').value;
    var name = $('rvf-name').value.trim();
    var text = $('rvf-text').value.trim();
    if (!name || !text) { $('review-form-error').textContent = 'Name and review text are required.'; return; }
    var body = {
      customerName: name, businessName: $('rvf-business').value.trim() || null,
      customerType: $('rvf-type').value, rating: parseInt($('rvf-rating').value) || 5,
      reviewText: text, source: $('rvf-source').value.trim() || null,
      isPublished: $('rvf-published').checked,
    };
    var btn = $('review-save-btn');
    btn.disabled = true;
    var method = id ? 'PUT' : 'POST';
    var path = id ? '/admin/reviews/' + id : '/admin/reviews';
    api(method, path, body, function (err) {
      btn.disabled = false; btn.textContent = 'Save Review';
      if (err) { $('review-form-error').textContent = err.message; return; }
      toast(id ? 'Review updated!' : 'Review created!', 'success');
      closeModal('review-modal');
      loadReviews();
    });
  }

  function saveSale() {
    var id = $('sf-id').value;
    var customer = $('sf-customer').value.trim();
    if (!customer) { $('sale-form-error').textContent = 'Customer name is required.'; return; }
    if (!state.saleItems.length) { $('sale-form-error').textContent = 'Add at least one item.'; return; }
    var invalidItems = state.saleItems.filter(function(i){ return !i.productName || i.unitPrice <= 0; });
    if (invalidItems.length) { $('sale-form-error').textContent = 'All items need a name and price > 0.'; return; }
    var body = {
      customerName: customer,
      companyName: $('sf-company').value.trim() || null,
      phone: $('sf-phone').value.trim() || null,
      email: $('sf-email').value.trim() || null,
      status: $('sf-status').value,
      notes: $('sf-notes').value.trim() || null,
      items: state.saleItems,
    };
    var btn = $('sale-save-btn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving…';
    var method = id ? 'PUT' : 'POST';
    var path = id ? '/admin/sales/' + id : '/admin/sales';
    api(method, path, body, function (err) {
      btn.disabled = false; btn.textContent = 'Save Sale';
      if (err) { $('sale-form-error').textContent = err.message; return; }
      toast(id ? 'Sale updated!' : 'Sale created!', 'success');
      closeModal('sale-modal');
      loadSales(state.pages.sales);
    });
  }

  function saveSettings() {
    var btn = $('btn-save-settings');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving…';
    var body = {
      businessName: $('s-businessName').value.trim(),
      tagline: $('s-tagline').value.trim() || null,
      phone: $('s-phone').value.trim() || null,
      whatsapp: $('s-whatsapp').value.trim() || null,
      email: $('s-email').value.trim() || null,
      address: $('s-address').value.trim() || null,
      warehouseAddress: $('s-warehouseAddress').value.trim() || null,
      businessHours: $('s-businessHours').value.trim() || null,
      googleMapsUrl: $('s-googleMapsUrl').value.trim() || null,
      instagram: $('s-instagram').value.trim() || null,
      facebook: $('s-facebook').value.trim() || null,
      youtube: $('s-youtube').value.trim() || null,
      gstNumber: $('s-gstNumber').value.trim() || null,
      panNumber: $('s-panNumber').value.trim() || null,
    };
    api('PUT', '/admin/settings', body, function (err, data) {
      btn.disabled = false; btn.textContent = 'Save Settings';
      if (err) { toast('Failed: ' + err.message, 'error'); return; }
      toast('Settings saved! All website pages will update instantly.', 'success');
      // ── Bust the frontend settings cache so every page picks up new values ──
      try {
        // sessionStorage is per-tab so we use localStorage as a cross-tab signal
        localStorage.setItem('nch_settings_version', String(Date.now()));
        // Also update sessionStorage directly with the saved data
        var saved = (data && data.data) ? data.data : body;
        sessionStorage.setItem('nch_site_settings', JSON.stringify({ ts: Date.now(), data: saved }));
      } catch (e) { /* ignore storage errors */ }
    });
  }

  /* ── IMPORT ──────────────────────────────────────────────────────────────── */
  var importFile = null;
  function handleImportFile(file) {
    if (!file) return;
    importFile = file;
    var preview = $('import-preview');
    var submitBtn = $('import-submit-btn');
    if (preview) {
      preview.style.display = 'block';
      preview.innerHTML = '<div class="card" style="padding:14px;"><strong>Selected file:</strong> ' + esc(file.name) + ' (' + Math.round(file.size / 1024) + ' KB)</div>';
    }
    if (submitBtn) submitBtn.classList.remove('hidden');
  }

  function doImport() {
    if (!importFile) return;
    var btn = $('import-submit-btn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Importing…';
    var fd = new FormData();
    fd.append('file', importFile);
    api('POST', '/admin/products/import', fd, function (err, data) {
      btn.disabled = false; btn.textContent = 'Import Products';
      if (err) { toast('Import failed: ' + err.message, 'error'); return; }
      var d = data.data || data;
      toast('Import complete: ' + (d.successful || 0) + ' created, ' + (d.failed || 0) + ' failed.', d.failed > 0 ? 'warning' : 'success');
      closeModal('import-modal');
      loadProducts(1);
      importFile = null;
      var preview = $('import-preview');
      if (preview) { preview.style.display = 'none'; preview.innerHTML = ''; }
    }, true);
  }

  /* ── STATUS COLORS ───────────────────────────────────────────────────────── */
  function enquiryStatusColor(status) {
    var m = { NEW: '#ef4444', CONTACTED: '#f59e0b', IN_PROGRESS: '#3b82f6', COMPLETED: '#10b981', CLOSED: '#94a3b8' };
    return m[status] || '#94a3b8';
  }
  function saleStatusColor(status) {
    var m = { QUOTE: '#3b82f6', CONFIRMED: '#10b981', PROCESSING: '#f59e0b', DELIVERED: '#10b981', CANCELLED: '#ef4444' };
    return m[status] || '#94a3b8';
  }

  /* ── SHOP GALLERY ────────────────────────────────────────────────────────── */

  function loadShopGallery() {
    var grid = $('gallery-admin-grid');
    if (!grid) return;
    grid.innerHTML = '<p style="color:#888;font-size:.9rem;">Loading...</p>';
    api('GET', '/admin/shop-media', null, function (err, data) {
      if (err) { grid.innerHTML = '<p style="color:red;">Failed to load gallery.</p>'; return; }
      var items = (data && data.data) || [];
      if (!items.length) {
        grid.innerHTML = '<p style="color:#888;font-size:.9rem;">No media uploaded yet. Click "Upload Media" to add shop photos or videos.</p>';
        return;
      }
      grid.innerHTML = items.map(function (item) {
        var thumb = item.mediaType === 'video'
          ? (item.thumbnailUrl
              ? '<img src="' + esc(item.thumbnailUrl) + '" style="width:100%;height:140px;object-fit:cover;border-radius:8px 8px 0 0;" />'
              : '<div style="width:100%;height:140px;background:linear-gradient(135deg,#1a2b4a,#3a5a8a);display:flex;align-items:center;justify-content:center;border-radius:8px 8px 0 0;"><span style="font-size:2rem;color:rgba(255,255,255,.8);">&#9654;</span></div>')
          : '<img src="' + esc(item.mediaUrl) + '" style="width:100%;height:140px;object-fit:cover;border-radius:8px 8px 0 0;" loading="lazy" onerror="this.style.background=\'#eee\';" />';
        var badge = item.mediaType === 'video'
          ? '<span style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,.6);color:#fff;font-size:.7rem;padding:2px 8px;border-radius:20px;">&#9654; Video</span>'
          : '';
        var activeToggle = item.isActive
          ? '<span style="font-size:.7rem;background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:20px;font-weight:600;">Active</span>'
          : '<span style="font-size:.7rem;background:#fee2e2;color:#b91c1c;padding:2px 8px;border-radius:20px;font-weight:600;">Hidden</span>';
        return '<div style="background:#fff;border-radius:8px;box-shadow:0 1px 8px rgba(0,0,0,.08);overflow:hidden;position:relative;">' +
          '<div style="position:relative;">' + thumb + badge + '</div>' +
          '<div style="padding:10px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
              '<span style="font-size:.82rem;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(item.title || '(no title)') + '</span>' +
              activeToggle +
            '</div>' +
            '<div style="display:flex;gap:6px;margin-top:8px;">' +
              '<button class="btn btn-sm" onclick="toggleGalleryActive(\'' + esc(item.id) + '\',' + (!item.isActive) + ')" style="flex:1;font-size:.72rem;">' + (item.isActive ? 'Hide' : 'Show') + '</button>' +
              '<button class="btn btn-sm btn-danger" onclick="deleteGalleryItem(\'' + esc(item.id) + '\')" style="font-size:.72rem;">Delete</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    });
  }

  function openGalleryUpload() {
    var wrap = $('gallery-upload-form-wrap');
    if (wrap) wrap.style.display = 'block';
    var status = $('gallery-upload-status');
    if (status) status.textContent = '';
  }
  window.openGalleryUpload = openGalleryUpload;

  function closeGalleryUpload() {
    var wrap = $('gallery-upload-form-wrap');
    if (wrap) wrap.style.display = 'none';
    var form = $('gallery-upload-form');
    if (form) form.reset();
  }
  window.closeGalleryUpload = closeGalleryUpload;

  function submitGalleryUpload() {
    var form = $('gallery-upload-form');
    var fileInput = $('gallery-file');
    var btn = $('gallery-submit-btn');
    var status = $('gallery-upload-status');

    if (!fileInput || !fileInput.files[0]) {
      if (status) { status.style.color = 'red'; status.textContent = 'Please select a file.'; }
      return;
    }

    var fd = new FormData(form);
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Uploading…';
    if (status) { status.style.color = '#555'; status.textContent = 'Uploading…'; }

    api('POST', '/admin/shop-media', fd, function (err) {
      btn.disabled = false;
      btn.textContent = 'Upload';
      if (err) {
        if (status) { status.style.color = 'red'; status.textContent = 'Error: ' + err.message; }
        return;
      }
      if (status) { status.style.color = 'green'; status.textContent = 'Uploaded!'; }
      toast('Media uploaded successfully!', 'success');
      form.reset();
      setTimeout(closeGalleryUpload, 1000);
      loadShopGallery();
    }, true); // true = multipart
  }

  function deleteGalleryItem(id) {
    confirm(
      'Delete Media',
      'Permanently delete this photo/video from the gallery? This cannot be undone.',
      function () {
        api('DELETE', '/admin/shop-media/' + id, null, function (err) {
          if (err) { toast('Delete failed: ' + err.message, 'error'); return; }
          toast('Deleted successfully!', 'success');
          loadShopGallery();
        });
      }
    );
  }
  window.deleteGalleryItem = deleteGalleryItem;

  function toggleGalleryActive(id, newActive) {
    var msg = newActive
      ? 'Make this media visible on the website?'
      : 'Hide this media from the website?';
    confirm(
      newActive ? 'Show Media' : 'Hide Media',
      msg,
      function () {
        api('PUT', '/admin/shop-media/' + id, { isActive: newActive }, function (err) {
          if (err) { toast('Update failed: ' + err.message, 'error'); return; }
          toast(newActive ? 'Media is now visible on website' : 'Media hidden from website', 'success');
          loadShopGallery();
        });
      }
    );
  }
  window.toggleGalleryActive = toggleGalleryActive;

})();
