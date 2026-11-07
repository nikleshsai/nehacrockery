/* =============================================================================
   Neha Crockery House - Cart, Online Payment (Razorpay) & Unique Bill Generator
   - Store Pickup Only (No Delivery Option / No Delivery Address field)
   - Generates a cryptographically unique random Bill Number (never repeated)
     shared between Customer Bill Receipt and Admin Sales panel.
   ============================================================================= */
(function () {
  'use strict';
  var API = '/api/v1';
  var KEY = 'nch_cart';
  var DEFAULT_WA = '919710254681';
  var DEFAULT_PHONE = '+91 97102 54681';
  var DEFAULT_ADDRESS = '13/3, Memorial Hall Road, Rattan Bazaar, Park Town, Chennai, Tamil Nadu 600003';
  var DEFAULT_BUSINESS = 'Neha Crockery House';

  function getWaNumber() {
    var s = window.__NCH_SITE_SETTINGS__;
    var raw = (s && (s.whatsapp || s.phone)) || (document.body && document.body.dataset.waNumber) || DEFAULT_WA;
    var digits = String(raw).replace(/\D/g, '');
    return digits.length === 10 ? '91' + digits : (digits || DEFAULT_WA);
  }

  function getPickupAddress() {
    var s = window.__NCH_SITE_SETTINGS__;
    return (s && s.address) || (document.body && document.body.dataset.pickupAddress) || DEFAULT_ADDRESS;
  }

  function getBusinessName() {
    var s = window.__NCH_SITE_SETTINGS__;
    return (s && s.businessName) || DEFAULT_BUSINESS;
  }

  function getBusinessPhone() {
    var s = window.__NCH_SITE_SETTINGS__;
    return (s && s.phone) || (document.body && document.body.dataset.phoneDisplay) || DEFAULT_PHONE;
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function save(c) {
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { }
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function inr(n) {
    return '\u20b9' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  var cart = load();

  function count() { return cart.reduce(function (a, i) { return a + i.qty; }, 0); }
  function total() { return cart.reduce(function (a, i) { return a + (i.price ? i.price * i.qty : 0); }, 0); }
  function hasUnpriced() { return cart.some(function (i) { return !i.price; }); }

  function add(item) {
    if (!item || !item.slug) return;
    var f = cart.filter(function (c) { return c.slug === item.slug; })[0];
    if (f) {
      f.qty += 1;
    } else {
      cart.push({
        slug: item.slug,
        name: item.name,
        code: item.code || '',
        price: Number(item.price) || 0,
        img: item.img || '',
        qty: 1
      });
    }
    save(cart);
    render();
    open();
  }

  function setQty(slug, q) {
    cart = cart.map(function (c) {
      if (c.slug === slug) c.qty = q;
      return c;
    }).filter(function (c) { return c.qty > 0; });
    save(cart);
    render();
  }

  function generateFallbackBillNumber() {
    var chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    var d = new Date();
    var datePart = String(d.getFullYear()) +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0');
    var rand = '';
    var arr = typeof Uint32Array !== 'undefined' && window.crypto ? new Uint32Array(6) : null;
    if (arr) window.crypto.getRandomValues(arr);
    for (var i = 0; i < 6; i++) {
      var idx = arr ? (arr[i] % chars.length) : Math.floor(Math.random() * chars.length);
      rand += chars.charAt(idx);
    }
    return 'NCH-BILL-' + datePart + '-' + rand;
  }

  /* ---------- UI STYLES ---------- */
  var css =
    '.nch-cart-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border:1px solid #d9d2c3;border-radius:50%;background:#fff;color:#1a2744;cursor:pointer;margin-right:10px}' +
    '.nch-cart-btn:hover{border-color:#c8a84b}' +
    '.nch-cart-count{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#c8a84b;color:#fff;font:600 11px/18px Montserrat,sans-serif;text-align:center}' +
    '.nch-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9998;display:none}.nch-ov.on{display:block}' +
    '.nch-dr{position:fixed;top:0;right:0;height:100%;width:min(440px,100%);background:#fff;z-index:9999;transform:translateX(100%);transition:transform .25s;display:flex;flex-direction:column;font-family:Montserrat,sans-serif;color:#1a2744}.nch-dr.on{transform:none}' +
    '.nch-hd{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #eee;font:600 20px "Cormorant Garamond",serif}' +
    '.nch-x{background:none;border:0;font-size:26px;cursor:pointer;color:#1a2744}' +
    '.nch-bd{flex:1;overflow:auto;padding:12px 20px}' +
    '.nch-it{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #f0ece2}' +
    '.nch-it img,.nch-ph{width:60px;height:60px;object-fit:cover;border-radius:6px;background:#f6f1e7;flex:none}' +
    '.nch-in{flex:1;font-size:13px}.nch-in b{display:block;font-weight:600;margin-bottom:2px}.nch-pr{color:#8a7a3b;font-size:12px}' +
    '.nch-q{display:inline-flex;align-items:center;gap:8px;margin-top:6px}.nch-q button{width:26px;height:26px;border:1px solid #d9d2c3;background:#fff;border-radius:4px;cursor:pointer}' +
    '.nch-ft{padding:14px 20px;border-top:1px solid #eee;font-size:13px;background:#faf8f4}' +
    '.nch-tot{display:flex;justify-content:space-between;font-weight:700;font-size:14px;margin-bottom:10px;color:#1a2744}' +
    '.nch-pickup-box{background:#fff8e6;border:1px solid #e6c97a;border-radius:8px;padding:10px 12px;margin-bottom:10px;font-size:12px;line-height:1.45;color:#1a2744}' +
    '.nch-pickup-box strong{display:block;color:#8a640f;font-size:12px;margin-bottom:3px}' +
    '.nch-ft input{width:100%;box-sizing:border-box;margin-bottom:8px;padding:9px 10px;border:1px solid #d9d2c3;border-radius:6px;font:13px Montserrat,sans-serif;background:#fff}' +
    '.nch-go{width:100%;padding:12px;border:0;border-radius:6px;background:#1a2744;color:#fff;font:600 13px Montserrat,sans-serif;cursor:pointer;transition:background .2s}' +
    '.nch-go:hover{background:#263861}.nch-go[disabled]{opacity:.6;cursor:not-allowed}' +
    '.nch-cash-btn{width:100%;margin-top:8px;padding:11px 12px;border:1.5px solid #c8a84b;border-radius:6px;background:#fff9eb;color:#1a2744;font:600 13px Montserrat,sans-serif;cursor:pointer;transition:all .2s}' +
    '.nch-cash-btn:hover{background:#c8a84b;color:#fff}.nch-cash-btn[disabled]{opacity:.6;cursor:not-allowed}' +
    '.nch-note{font-size:11px;color:#666;margin:8px 0 0;text-align:center}' +
    '.nch-empty{text-align:center;color:#777;padding:40px 0;font-size:14px}' +
    '.nch-pay-modal{position:fixed;inset:0;background:rgba(13,34,64,.72);z-index:10000;display:flex;align-items:center;justify-content:center;padding:16px;font-family:Montserrat,sans-serif}' +
    '.nch-pay-card{background:#fff;border-radius:14px;max-width:520px;width:100%;max-height:92vh;overflow:auto;box-shadow:0 20px 60px rgba(0,0,0,.35);color:#1a2744}' +
    '.nch-pay-hdr{background:#1a2744;color:#fff;padding:16px 20px;border-radius:14px 14px 0 0;display:flex;justify-content:space-between;align-items:center}' +
    '.nch-pay-bdy{padding:20px}' +
    '.nch-pay-methods{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}' +
    '.nch-pay-mbtn{padding:10px 8px;border:1.5px solid #d9d2c3;border-radius:8px;background:#fff;font:600 12px Montserrat,sans-serif;color:#1a2744;cursor:pointer;text-align:center}' +
    '.nch-pay-mbtn.active{border-color:#c8a84b;background:#fff9eb;color:#8a640f}' +
    '.nch-bill-box{border:1px solid #e2dcd0;border-radius:10px;padding:16px;background:#fffdf9;font-size:12px;line-height:1.5}' +
    '.nch-bill-table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px}' +
    '.nch-bill-table th,.nch-bill-table td{border-bottom:1px solid #eee;padding:6px 4px;text-align:left}' +
    '.nch-bill-table th:last-child,.nch-bill-table td:last-child{text-align:right}' +
    '.nch-bill-actions{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}' +
    '.nch-bill-actions button,.nch-bill-actions a{flex:1;min-width:140px;padding:10px 12px;border-radius:6px;font:600 12px Montserrat,sans-serif;text-align:center;cursor:pointer;text-decoration:none;border:0}';

  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  var ov = document.createElement('div');
  ov.className = 'nch-ov';
  var dr = document.createElement('aside');
  dr.className = 'nch-dr';
  dr.setAttribute('aria-label', 'Shopping cart');
  dr.innerHTML =
    '<div class="nch-hd"><span>Your Cart</span><button class="nch-x" aria-label="Close cart">&times;</button></div>' +
    '<div class="nch-bd"></div>' +
    '<div class="nch-ft"></div>';
  document.body.appendChild(ov);
  document.body.appendChild(dr);
  var bd = dr.querySelector('.nch-bd');
  var ft = dr.querySelector('.nch-ft');

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nch-cart-btn';
  btn.setAttribute('aria-label', 'Open cart');
  btn.innerHTML =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.7 12.4a1 1 0 001 .8h8.9a1 1 0 001-.8L20 7H6"/></svg>' +
    '<span class="nch-cart-count">0</span>';
  var hc = document.querySelector('.header-controls');
  if (hc) hc.insertBefore(btn, hc.firstChild);
  var badge = btn.querySelector('.nch-cart-count');

  function open() { ov.classList.add('on'); dr.classList.add('on'); }
  function close() { ov.classList.remove('on'); dr.classList.remove('on'); }
  btn.addEventListener('click', open);
  ov.addEventListener('click', close);
  dr.querySelector('.nch-x').addEventListener('click', close);

  function render() {
    badge.textContent = count();
    badge.style.display = count() ? '' : 'none';
    if (!cart.length) {
      bd.innerHTML = '<div class="nch-empty">Your cart is empty.</div>';
      ft.innerHTML = '';
      return;
    }
    bd.innerHTML = cart.map(function (c) {
      return '<div class="nch-it">' +
        (c.img ? '<img src="' + esc(c.img) + '" alt="">' : '<div class="nch-ph"></div>') +
        '<div class="nch-in"><b>' + esc(c.name) + '</b>' +
        (c.code ? '<span class="nch-pr">Code: ' + esc(c.code) + '</span><br>' : '') +
        '<span class="nch-pr">' + (c.price ? inr(c.price) + ' each' : 'Price on request') + '</span>' +
        '<div class="nch-q">' +
        '<button data-d="-1" data-s="' + esc(c.slug) + '" aria-label="Decrease">&minus;</button>' +
        '<span>' + c.qty + '</span>' +
        '<button data-d="1" data-s="' + esc(c.slug) + '" aria-label="Increase">+</button>' +
        '<button data-d="0" data-s="' + esc(c.slug) + '" style="width:auto;padding:0 8px;margin-left:8px">Remove</button>' +
        '</div></div></div>';
    }).join('');

    ft.innerHTML =
      '<div class="nch-pickup-box">' +
      '<strong>\ud83c\udfec Store Pickup Only \u2014 No Delivery Option</strong>' +
      '<div>Pickup Showroom: <span id="nch-pickup-addr-text">' + esc(getPickupAddress()) + '</span></div>' +
      '</div>' +
      '<div class="nch-tot"><span>Total Payable</span><span>' + inr(total()) + (hasUnpriced() ? '+' : '') + '</span></div>' +
      '<input id="nch-name" placeholder="Your Full Name *" autocomplete="name">' +
      '<input id="nch-phone" placeholder="Phone / WhatsApp Number *" inputmode="tel" autocomplete="tel">' +
      '<input id="nch-email" placeholder="Email Address (optional)" type="email" autocomplete="email">' +
      '<input id="nch-company" placeholder="Business / Shop Name (optional)" autocomplete="organization">' +
      '<button class="nch-go" id="nch-go">\ud83d\udcb3 Pay Online &amp; Generate Bill \u2192</button>' +
      '<button class="nch-cash-btn" id="nch-cash-go">\ud83d\udcb5 Pay by Cash (at Store Pickup) \u2192</button>' +
      '<p class="nch-note">Pay Online (UPI / Card / NetBanking) or Pay by Cash at Showroom Pickup. Instant unique Bill generated.</p>';
  }

  window.addEventListener('nch:settings-updated', function () {
    var addrEl = document.getElementById('nch-pickup-addr-text');
    if (addrEl) addrEl.textContent = getPickupAddress();
  });

  bd.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-s]');
    if (!b) return;
    var s = b.getAttribute('data-s');
    var d = Number(b.getAttribute('data-d'));
    var it = cart.filter(function (c) { return c.slug === s; })[0];
    if (!it) return;
    setQty(s, d === 0 ? 0 : it.qty + d);
  });

  function loadRazorpaySdk(cb) {
    if (window.Razorpay) { cb(true); return; }
    var script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = function () { cb(true); };
    script.onerror = function () { cb(false); };
    document.head.appendChild(script);
  }

  function printBillWindow(bill) {
    var win = window.open('', '_blank', 'width=800,height=750');
    if (!win) { window.print(); return; }
    var itemsRows = (bill.items || []).map(function (it, idx) {
      var lineTotal = (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0);
      return '<tr>' +
        '<td style="padding:8px;border-bottom:1px solid #ddd;">' + (idx + 1) + '</td>' +
        '<td style="padding:8px;border-bottom:1px solid #ddd;"><strong>' + esc(it.productName) + '</strong>' + (it.productCode ? '<br><small style="color:#666;">Code: ' + esc(it.productCode) + '</small>' : '') + '</td>' +
        '<td style="padding:8px;border-bottom:1px solid #ddd;text-align:center;">' + esc(it.quantity) + '</td>' +
        '<td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">' + inr(it.unitPrice) + '</td>' +
        '<td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;font-weight:600;">' + inr(lineTotal) + '</td>' +
        '</tr>';
    }).join('');

    var isCash = String(bill.paymentMethod || '').toLowerCase().indexOf('cash') !== -1;
    var payStatusBadge = isCash
      ? 'PAY BY CASH AT STORE PICKUP'
      : ('PAID ONLINE (' + esc(bill.paymentMethod) + ')');
    var totalLabel = isCash ? 'Grand Total Payable (Cash at Pickup):' : 'Grand Total Paid:';

    var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bill ' + esc(bill.billNumber) + ' - ' + esc(bill.businessName) + '</title>' +
      '<style>body{font-family:Arial,sans-serif;color:#1a2744;margin:28px;line-height:1.5}' +
      '.hdr{display:flex;justify-content:space-between;border-bottom:2px solid #1a2744;padding-bottom:14px;margin-bottom:16px}' +
      '.badge{display:inline-block;padding:4px 10px;border-radius:4px;background:' + (isCash ? '#fff8e6;color:#8a640f;border:1px solid #e6c97a' : '#e6f4ea;color:#137333') + ';font-weight:700;font-size:12px}' +
      '.pickup{background:#fff8e6;border:1px solid #e6c97a;padding:10px 14px;border-radius:6px;margin:14px 0;font-size:13px}' +
      'table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#1a2744;color:#fff;padding:8px;text-align:left;font-size:13px}' +
      '@media print{.no-print{display:none}}</style></head><body>' +
      '<div class="no-print" style="text-align:right;margin-bottom:12px;"><button onclick="window.print()" style="padding:8px 16px;background:#1a2744;color:#fff;border:0;border-radius:4px;cursor:pointer;font-weight:600;">\ud83d\udda8\ufe0f Print / Save as PDF</button></div>' +
      '<div class="hdr"><div><h2 style="margin:0 0 4px;">' + esc(bill.businessName) + '</h2>' +
      '<div style="font-size:12px;color:#444;">' + esc(bill.pickupAddress) + '<br>Phone: ' + esc(bill.businessPhone) + (bill.gstNumber ? ' | GSTIN: ' + esc(bill.gstNumber) : '') + '</div></div>' +
      '<div style="text-align:right;"><div style="font-size:11px;color:#666;text-transform:uppercase;">Original Customer &amp; Admin Bill</div>' +
      '<div style="font-size:18px;font-weight:700;color:#1a2744;margin:2px 0;">' + esc(bill.billNumber) + '</div>' +
      '<div style="font-size:12px;color:#555;">Date: ' + esc(bill.dateStr) + '</div>' +
      '<div class="badge" style="margin-top:4px;">' + payStatusBadge + '</div></div></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:10px;">' +
      '<div><strong>Billed To:</strong><br>' + esc(bill.customerName) + (bill.companyName ? ' (' + esc(bill.companyName) + ')' : '') + '<br>Phone: ' + esc(bill.phone) + (bill.email ? '<br>Email: ' + esc(bill.email) : '') + '</div>' +
      '<div style="text-align:right;"><strong>Payment Ref:</strong> ' + esc(bill.paymentRef) + '<br><strong>Fulfillment:</strong> Store Pickup Only (No Delivery)</div></div>' +
      '<div class="pickup"><strong>\ud83c\udfec STORE PICKUP ONLY (NO DELIVERY OPTION):</strong> Please present Bill No. <strong>' + esc(bill.billNumber) + '</strong> at our showroom (' + esc(bill.pickupAddress) + ')' + (isCash ? ' and pay by Cash at pickup' : '') + ' to collect your order.</div>' +
      '<table><thead><tr><th>#</th><th>Product Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Amount</th></tr></thead>' +
      '<tbody>' + itemsRows + '</tbody>' +
      '<tfoot><tr><td colspan="4" style="padding:10px 8px;text-align:right;font-weight:700;font-size:15px;">' + totalLabel + '</td><td style="padding:10px 8px;text-align:right;font-weight:700;font-size:15px;">' + inr(bill.totalAmount) + '</td></tr></tfoot></table>' +
      '<p style="margin-top:24px;font-size:12px;color:#666;text-align:center;">Thank you for shopping with ' + esc(bill.businessName) + '! This unique Bill Number (' + esc(bill.billNumber) + ') is recorded in our Admin Sales ledger.</p>' +
      '</body></html>';
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  function showGeneratedBillInDrawer(bill) {
    cart = [];
    save(cart);
    badge.style.display = 'none';
    badge.textContent = '0';
    ft.innerHTML = '';

    var isCash = String(bill.paymentMethod || '').toLowerCase().indexOf('cash') !== -1;

    var waSummary = [
      'Hello ' + bill.businessName + ',',
      isCash
        ? 'I have generated a Store Pickup Bill (Pay by Cash at Showroom).'
        : 'My Online Payment is completed for Store Pickup.',
      'Unique Bill No: ' + bill.billNumber,
      'Payment Mode: ' + (isCash ? 'Pay by Cash at Store Pickup' : ('Paid Online (' + bill.paymentMethod + ')')),
      'Ref: ' + bill.paymentRef,
      'Customer: ' + bill.customerName + ' (' + bill.phone + ')',
      'Items:',
    ].concat(
      bill.items.map(function (it, i) {
        return (i + 1) + '. ' + it.productName + (it.productCode ? ' [' + it.productCode + ']' : '') + ' x ' + it.quantity + ' = ' + inr(it.quantity * it.unitPrice);
      }),
      [(isCash ? 'Total Payable (Cash at Pickup): ' : 'Total Paid: ') + inr(bill.totalAmount), 'Fulfillment: Store Pickup Only (No Delivery)']
    ).join('\n');

    var waUrl = 'https://wa.me/' + getWaNumber() + '?text=' + encodeURIComponent(waSummary);

    bd.innerHTML =
      '<div class="nch-bill-box">' +
      '<div style="text-align:center;border-bottom:1px dashed #d9d2c3;padding-bottom:10px;margin-bottom:10px;">' +
      '<div style="font-size:11px;color:' + (isCash ? '#8a640f' : '#137333') + ';font-weight:700;text-transform:uppercase;">\u2705 ' + (isCash ? 'Store Pickup Bill Generated (Pay by Cash)' : 'Online Payment Successful') + '</div>' +
      '<h3 style="margin:4px 0;font-family:\'Cormorant Garamond\',serif;font-size:22px;">' + esc(bill.businessName) + ' \u2014 Official Bill</h3>' +
      '<div style="background:#1a2744;color:#fff;display:inline-block;padding:4px 12px;border-radius:6px;font-weight:700;font-size:13px;letter-spacing:.5px;margin-top:4px;">Bill No: ' + esc(bill.billNumber) + '</div>' +
      '<div style="font-size:11px;color:#666;margin-top:4px;">' + esc(bill.dateStr) + ' | Ref: ' + esc(bill.paymentRef) + '</div>' +
      '</div>' +
      '<div style="font-size:12px;margin-bottom:8px;">' +
      '<div><strong>Customer:</strong> ' + esc(bill.customerName) + ' (' + esc(bill.phone) + ')</div>' +
      '<div><strong>Payment:</strong> ' + (isCash ? 'PAY BY CASH AT STORE PICKUP' : ('PAID ONLINE (' + esc(bill.paymentMethod) + ')')) + '</div>' +
      '<div style="margin-top:6px;padding:7px 9px;background:#fff8e6;border:1px solid #e6c97a;border-radius:6px;">' +
      '<strong>\ud83c\udfec Store Pickup Only (No Delivery):</strong><br>' + esc(bill.pickupAddress) +
      '</div>' +
      '</div>' +
      '<table class="nch-bill-table">' +
      '<thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>' +
      '<tbody>' +
      bill.items.map(function (it) {
        return '<tr><td>' + esc(it.productName) + '</td><td>' + esc(it.quantity) + '</td><td>' + inr(it.quantity * it.unitPrice) + '</td></tr>';
      }).join('') +
      '</tbody>' +
      '<tfoot><tr><th colspan="2">' + (isCash ? 'Total Payable (Cash)' : 'Total Paid') + '</th><th>' + inr(bill.totalAmount) + '</th></tr></tfoot>' +
      '</table>' +
      '<div class="nch-bill-actions">' +
      '<button type="button" id="nch-print-bill-btn" style="background:#1a2744;color:#fff;">\ud83d\udda8\ufe0f Print / Download Bill</button>' +
      '<a href="' + esc(waUrl) + '" target="_blank" rel="noopener noreferrer" style="background:#25D366;color:#fff;">\ud83d\udcac Send Bill on WhatsApp</a>' +
      '</div>' +
      '</div>';

    var printBtn = document.getElementById('nch-print-bill-btn');
    if (printBtn) {
      printBtn.addEventListener('click', function () {
        printBillWindow(bill);
      });
    }
  }

  function finalizeOrderOnBackend(payload, onDone) {
    fetch(API + '/orders/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)); })
      .then(function (resp) {
        var d = (resp && resp.data) || resp || {};
        var sale = d.sale || {};
        var biz = d.business || {};
        onDone({
          billNumber: d.billNumber || sale.saleNumber || payload.billNumber || generateFallbackBillNumber(),
          dateStr: new Date(sale.createdAt || Date.now()).toLocaleString('en-IN'),
          customerName: payload.customerName,
          companyName: payload.companyName || '',
          phone: payload.phone,
          email: payload.email || '',
          paymentRef: d.paymentRef || payload.razorpayPaymentId || payload.transactionRef || ('PAY-' + Date.now().toString(36).toUpperCase()),
          paymentMethod: d.paymentMethod || payload.paymentMethod || 'Online Payment',
          items: payload.items,
          totalAmount: payload.items.reduce(function (s, i) { return s + i.quantity * i.unitPrice; }, 0),
          businessName: biz.businessName || getBusinessName(),
          pickupAddress: biz.pickupAddress || getPickupAddress(),
          businessPhone: biz.phone || getBusinessPhone(),
          gstNumber: biz.gstNumber || ''
        });
      })
      .catch(function () {
        // Fallback: save to /enquiries with the unique bill number so it is still recorded if /orders/complete isn't deployed yet
        var fallbackBillNo = payload.billNumber || generateFallbackBillNumber();
        var fallbackRef = payload.razorpayPaymentId || payload.transactionRef || ('PAY-' + Date.now().toString(36).toUpperCase());
        var totalAmt = payload.items.reduce(function (s, i) { return s + i.quantity * i.unitPrice; }, 0);
        var msg = [
          'BILL NO: ' + fallbackBillNo,
          'PAYMENT: PAID ONLINE (' + (payload.paymentMethod || 'Online Payment') + ') Ref: ' + fallbackRef,
          'FULFILLMENT: Store Pickup Only (No Delivery Option)',
        ].concat(
          payload.items.map(function (it, idx) {
            return (idx + 1) + '. ' + it.productName + ' x ' + it.quantity + ' = ' + inr(it.quantity * it.unitPrice);
          }),
          ['TOTAL PAID: ' + inr(totalAmt)]
        ).join('\n');

        fetch(API + '/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: payload.customerName,
            companyName: payload.companyName || undefined,
            phone: payload.phone,
            email: payload.email || undefined,
            message: msg.slice(0, 2000),
            source: 'website-online-order'
          })
        }).catch(function () { });

        onDone({
          billNumber: fallbackBillNo,
          dateStr: new Date().toLocaleString('en-IN'),
          customerName: payload.customerName,
          companyName: payload.companyName || '',
          phone: payload.phone,
          email: payload.email || '',
          paymentRef: fallbackRef,
          paymentMethod: payload.paymentMethod || 'Online Payment',
          items: payload.items,
          totalAmount: totalAmt,
          businessName: getBusinessName(),
          pickupAddress: getPickupAddress(),
          businessPhone: getBusinessPhone(),
          gstNumber: ''
        });
      });
  }

  function openOnlineGatewayModal(initData, customer, items, onCancel) {
    var modal = document.createElement('div');
    modal.className = 'nch-pay-modal';
    var amountInr = inr(initData.totalAmount);
    var selectedMethod = 'UPI (GPay / PhonePe / Paytm)';

    modal.innerHTML =
      '<div class="nch-pay-card" role="dialog" aria-modal="true" aria-label="Online Payment Checkout">' +
      '<div class="nch-pay-hdr">' +
      '<div>' +
      '<div style="font-size:11px;opacity:.85;">' + esc(getBusinessName()) + ' \u2014 Secure Checkout</div>' +
      '<div style="font-size:16px;font-weight:700;">Bill No: ' + esc(initData.billNumber) + '</div>' +
      '</div>' +
      '<button type="button" id="nch-pay-close" style="background:none;border:0;color:#fff;font-size:24px;cursor:pointer;">&times;</button>' +
      '</div>' +
      '<div class="nch-pay-bdy">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;background:#f6f1e7;padding:10px 14px;border-radius:8px;margin-bottom:14px;">' +
      '<div><div style="font-size:11px;color:#666;">Customer</div><strong style="font-size:13px;">' + esc(customer.customerName) + ' (' + esc(customer.phone) + ')</strong></div>' +
      '<div style="text-align:right;"><div style="font-size:11px;color:#666;">Amount Payable</div><strong style="font-size:16px;color:#1a2744;">' + amountInr + '</strong></div>' +
      '</div>' +
      '<div class="nch-pickup-box" style="margin-bottom:14px;">' +
      '<strong>\ud83c\udfec Store Pickup Only \u2014 No Delivery Option</strong>' +
      '<div>Pickup Showroom: ' + esc(getPickupAddress()) + '</div>' +
      '</div>' +
      '<label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;">Select Online Payment Method</label>' +
      '<div class="nch-pay-methods">' +
      '<button type="button" class="nch-pay-mbtn active" data-method="UPI (GPay / PhonePe / Paytm)">\ud83d\udcf1 UPI / QR</button>' +
      '<button type="button" class="nch-pay-mbtn" data-method="Card (Debit / Credit)">\ud83d\udcb3 Card</button>' +
      '<button type="button" class="nch-pay-mbtn" data-method="NetBanking">\ud83c\udfe6 NetBanking</button>' +
      '</div>' +
      '<div id="nch-pay-method-fields" style="margin-bottom:12px;">' +
      '<input id="nch-pay-identifier" placeholder="Enter UPI ID (e.g. name@okaxis) or UTR / Ref No." style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #d9d2c3;border-radius:6px;font:13px Montserrat,sans-serif;">' +
      '</div>' +
      '<p id="nch-pay-err" style="color:#b91c1c;font-size:12px;margin:0 0 10px;display:none;"></p>' +
      '<button type="button" id="nch-pay-confirm-btn" class="nch-go">Pay ' + amountInr + ' &amp; Generate Bill \u2192</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(modal);

    var methodBtns = modal.querySelectorAll('.nch-pay-mbtn');
    var fieldsWrap = modal.querySelector('#nch-pay-method-fields');
    methodBtns.forEach(function (mb) {
      mb.addEventListener('click', function () {
        methodBtns.forEach(function (b) { b.classList.remove('active'); });
        mb.classList.add('active');
        selectedMethod = mb.getAttribute('data-method');
        if (selectedMethod.indexOf('UPI') !== -1) {
          fieldsWrap.innerHTML = '<input id="nch-pay-identifier" placeholder="Enter UPI ID (e.g. name@upi) or UPI Ref No." style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #d9d2c3;border-radius:6px;font:13px Montserrat,sans-serif;">';
        } else if (selectedMethod.indexOf('Card') !== -1) {
          fieldsWrap.innerHTML = '<input id="nch-pay-identifier" placeholder="Card Holder Name / Last 4 Digits" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #d9d2c3;border-radius:6px;font:13px Montserrat,sans-serif;">';
        } else {
          fieldsWrap.innerHTML = '<input id="nch-pay-identifier" placeholder="Bank Name / NetBanking Ref" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #d9d2c3;border-radius:6px;font:13px Montserrat,sans-serif;">';
        }
      });
    });

    modal.querySelector('#nch-pay-close').addEventListener('click', function () {
      modal.remove();
      if (onCancel) onCancel();
    });

    modal.querySelector('#nch-pay-confirm-btn').addEventListener('click', function () {
      var confirmBtn = modal.querySelector('#nch-pay-confirm-btn');
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Verifying Payment & Generating Bill…';
      var refInput = modal.querySelector('#nch-pay-identifier');
      var userRef = refInput && refInput.value.trim();
      var txRef = 'RZP-' + Date.now().toString(36).toUpperCase() + (userRef ? '-' + userRef.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() : '');

      finalizeOrderOnBackend({
        billNumber: initData.billNumber,
        customerName: customer.customerName,
        companyName: customer.companyName,
        phone: customer.phone,
        email: customer.email,
        items: items,
        paymentMethod: selectedMethod,
        transactionRef: txRef
      }, function (bill) {
        modal.remove();
        showGeneratedBillInDrawer(bill);
      });
    });
  }

  ft.addEventListener('click', function (e) {
    if (e.target.id !== 'nch-go' && e.target.id !== 'nch-cash-go') return;
    var isCashOrder = e.target.id === 'nch-cash-go';
    var name = (ft.querySelector('#nch-name') || {}).value.trim();
    var phone = (ft.querySelector('#nch-phone') || {}).value.trim();
    var email = (ft.querySelector('#nch-email') || {}).value.trim();
    var company = (ft.querySelector('#nch-company') || {}).value.trim();

    if (!name || !/^[0-9+\-() ]{7,20}$/.test(phone)) {
      alert('Please enter your full name and a valid phone number.');
      return;
    }

    var itemsPayload = cart.map(function (c) {
      return {
        productName: c.name,
        productCode: c.code || null,
        quantity: c.qty,
        unitPrice: Number(c.price) || 0
      };
    });

    if (isCashOrder) {
      var cashBtn = e.target;
      cashBtn.disabled = true;
      cashBtn.textContent = 'Generating Cash Pickup Bill…';
      var cashRef = 'CASH-' + Date.now().toString(36).toUpperCase();
      finalizeOrderOnBackend({
        customerName: name,
        companyName: company || null,
        phone: phone,
        email: email || null,
        items: itemsPayload,
        paymentMethod: 'Cash at Store Pickup',
        transactionRef: cashRef
      }, function (bill) {
        showGeneratedBillInDrawer(bill);
      });
      return;
    }

    var goBtn = e.target;
    goBtn.disabled = true;
    goBtn.textContent = 'Initializing Online Payment…';

    var customer = {
      customerName: name,
      companyName: company || null,
      phone: phone,
      email: email || null
    };

    fetch(API + '/orders/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: name,
        phone: phone,
        email: email || null,
        items: itemsPayload
      })
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)); })
      .then(function (resp) {
        var initData = (resp && resp.data) || resp;
        if (initData && initData.mode === 'razorpay' && initData.razorpayKeyId && initData.razorpayOrderId) {
          loadRazorpaySdk(function (loaded) {
            if (!loaded || !window.Razorpay) {
              openOnlineGatewayModal(initData, customer, itemsPayload, function () {
                goBtn.disabled = false;
                goBtn.textContent = 'Pay Online & Generate Bill \u2192';
              });
              return;
            }
            var rzp = new window.Razorpay({
              key: initData.razorpayKeyId,
              amount: initData.amount,
              currency: initData.currency || 'INR',
              name: getBusinessName(),
              description: 'Store Pickup Order — Bill ' + initData.billNumber,
              order_id: initData.razorpayOrderId,
              prefill: {
                name: name,
                contact: phone,
                email: email || ''
              },
              notes: {
                billNumber: initData.billNumber,
                fulfillment: 'Store Pickup Only — No Delivery'
              },
              theme: { color: '#1a2744' },
              modal: {
                ondismiss: function () {
                  goBtn.disabled = false;
                  goBtn.textContent = 'Pay Online & Generate Bill \u2192';
                }
              },
              handler: function (response) {
                finalizeOrderOnBackend({
                  billNumber: initData.billNumber,
                  customerName: name,
                  companyName: company || null,
                  phone: phone,
                  email: email || null,
                  items: itemsPayload,
                  paymentMethod: 'Razorpay Online',
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature
                }, function (bill) {
                  showGeneratedBillInDrawer(bill);
                });
              }
            });
            rzp.open();
          });
          return;
        }

        openOnlineGatewayModal(
          initData || { billNumber: generateFallbackBillNumber(), totalAmount: total() },
          customer,
          itemsPayload,
          function () {
            goBtn.disabled = false;
            goBtn.textContent = 'Pay Online & Generate Bill \u2192';
          }
        );
      })
      .catch(function () {
        openOnlineGatewayModal(
          { billNumber: generateFallbackBillNumber(), totalAmount: total() },
          customer,
          itemsPayload,
          function () {
            goBtn.disabled = false;
            goBtn.textContent = 'Pay Online & Generate Bill \u2192';
          }
        );
      });
  });

  /* Add-to-cart buttons anywhere on the page (product cards and detail page) */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cart-add]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    add({
      slug: b.getAttribute('data-slug'),
      name: b.getAttribute('data-name'),
      code: b.getAttribute('data-code'),
      price: b.getAttribute('data-price'),
      img: b.getAttribute('data-img')
    });
  });

  window.NCHCart = { add: add, open: open, printBill: printBillWindow };
  render();
})();
