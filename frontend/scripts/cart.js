/* Neha Crockery House - Cart & Order
 * Cart lives in the browser (localStorage). Placing an order saves it to the
 * real backend (POST /api/v1/enquiries, source "website-order" -> Prisma -> Supabase)
 * and then opens WhatsApp with the order summary. No online payment is taken.
 */
(function () {
  'use strict';
  var API = '/api/v1', KEY = 'nch_cart';
  var WA = (document.body && document.body.dataset.waNumber) || '918870413413';

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function inr(n) { return '\u20b9' + Number(n).toLocaleString('en-IN'); }

  var cart = load();

  function count() { return cart.reduce(function (a, i) { return a + i.qty; }, 0); }
  function total() { return cart.reduce(function (a, i) { return a + (i.price ? i.price * i.qty : 0); }, 0); }
  function hasUnpriced() { return cart.some(function (i) { return !i.price; }); }

  function add(item) {
    if (!item || !item.slug) return;
    var f = cart.filter(function (c) { return c.slug === item.slug; })[0];
    if (f) f.qty += 1; else cart.push({ slug: item.slug, name: item.name, code: item.code || '', price: Number(item.price) || 0, img: item.img || '', qty: 1 });
    save(cart); render(); open();
  }
  function setQty(slug, q) {
    cart = cart.map(function (c) { if (c.slug === slug) c.qty = q; return c; }).filter(function (c) { return c.qty > 0; });
    save(cart); render();
  }

  /* ---------- UI ---------- */
  var css = '.nch-cart-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border:1px solid #d9d2c3;border-radius:50%;background:#fff;color:#1a2744;cursor:pointer;margin-right:10px}' +
    '.nch-cart-btn:hover{border-color:#c8a84b}.nch-cart-count{position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#c8a84b;color:#fff;font:600 11px/18px Montserrat,sans-serif;text-align:center}' +
    '.nch-ov{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9998;display:none}.nch-ov.on{display:block}' +
    '.nch-dr{position:fixed;top:0;right:0;height:100%;width:min(420px,100%);background:#fff;z-index:9999;transform:translateX(100%);transition:transform .25s;display:flex;flex-direction:column;font-family:Montserrat,sans-serif;color:#1a2744}.nch-dr.on{transform:none}' +
    '.nch-hd{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #eee;font:600 20px "Cormorant Garamond",serif}' +
    '.nch-x{background:none;border:0;font-size:26px;cursor:pointer;color:#1a2744}.nch-bd{flex:1;overflow:auto;padding:12px 20px}' +
    '.nch-it{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #f0ece2}.nch-it img,.nch-ph{width:60px;height:60px;object-fit:cover;border-radius:6px;background:#f6f1e7;flex:none}' +
    '.nch-in{flex:1;font-size:13px}.nch-in b{display:block;font-weight:600;margin-bottom:2px}.nch-pr{color:#8a7a3b;font-size:12px}' +
    '.nch-q{display:inline-flex;align-items:center;gap:8px;margin-top:6px}.nch-q button{width:26px;height:26px;border:1px solid #d9d2c3;background:#fff;border-radius:4px;cursor:pointer}' +
    '.nch-ft{padding:14px 20px;border-top:1px solid #eee;font-size:13px}.nch-tot{display:flex;justify-content:space-between;font-weight:600;margin-bottom:10px}' +
    '.nch-ft input,.nch-ft textarea{width:100%;box-sizing:border-box;margin-bottom:8px;padding:9px 10px;border:1px solid #d9d2c3;border-radius:6px;font:13px Montserrat,sans-serif}' +
    '.nch-go{width:100%;padding:12px;border:0;border-radius:6px;background:#1a2744;color:#fff;font:600 13px Montserrat,sans-serif;cursor:pointer}.nch-go[disabled]{opacity:.6}' +
    '.nch-note{font-size:11px;color:#777;margin:8px 0 0}.nch-empty{text-align:center;color:#777;padding:40px 0;font-size:14px}.nch-ok{padding:30px 20px;text-align:center}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var ov = document.createElement('div'); ov.className = 'nch-ov';
  var dr = document.createElement('aside'); dr.className = 'nch-dr'; dr.setAttribute('aria-label', 'Shopping cart');
  dr.innerHTML = '<div class="nch-hd"><span>Your Cart</span><button class="nch-x" aria-label="Close cart">&times;</button></div><div class="nch-bd"></div><div class="nch-ft"></div>';
  document.body.appendChild(ov); document.body.appendChild(dr);
  var bd = dr.querySelector('.nch-bd'), ft = dr.querySelector('.nch-ft');

  var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'nch-cart-btn'; btn.setAttribute('aria-label', 'Open cart');
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.7 12.4a1 1 0 001 .8h8.9a1 1 0 001-.8L20 7H6"/></svg><span class="nch-cart-count">0</span>';
  var hc = document.querySelector('.header-controls');
  if (hc) hc.insertBefore(btn, hc.firstChild);
  var badge = btn.querySelector('.nch-cart-count');

  function open() { ov.classList.add('on'); dr.classList.add('on'); }
  function close() { ov.classList.remove('on'); dr.classList.remove('on'); }
  btn.addEventListener('click', open); ov.addEventListener('click', close); dr.querySelector('.nch-x').addEventListener('click', close);

  function render() {
    badge.textContent = count(); badge.style.display = count() ? '' : 'none';
    if (!cart.length) { bd.innerHTML = '<div class="nch-empty">Your cart is empty.</div>'; ft.innerHTML = ''; return; }
    bd.innerHTML = cart.map(function (c) {
      return '<div class="nch-it">' + (c.img ? '<img src="' + esc(c.img) + '" alt="">' : '<div class="nch-ph"></div>') +
        '<div class="nch-in"><b>' + esc(c.name) + '</b>' + (c.code ? '<span class="nch-pr">Code: ' + esc(c.code) + '</span><br>' : '') +
        '<span class="nch-pr">' + (c.price ? inr(c.price) + ' each' : 'Price on request') + '</span>' +
        '<div class="nch-q"><button data-d="-1" data-s="' + esc(c.slug) + '" aria-label="Decrease">&minus;</button><span>' + c.qty + '</span><button data-d="1" data-s="' + esc(c.slug) + '" aria-label="Increase">+</button>' +
        '<button data-d="0" data-s="' + esc(c.slug) + '" style="width:auto;padding:0 8px;margin-left:8px">Remove</button></div></div></div>';
    }).join('');
    ft.innerHTML = '<div class="nch-tot"><span>Total (MRP)</span><span>' + inr(total()) + (hasUnpriced() ? '+' : '') + '</span></div>' +
      '<input id="nch-name" placeholder="Your name *" autocomplete="name"><input id="nch-phone" placeholder="Phone number *" inputmode="tel" autocomplete="tel">' +
      '<input id="nch-email" placeholder="Email (optional)" type="email" autocomplete="email"><textarea id="nch-addr" rows="2" placeholder="Delivery address / notes"></textarea>' +
      '<button class="nch-go" id="nch-go">Place Order</button>' +
      '<p class="nch-note">No online payment. We confirm availability, final price and payment with you by phone/WhatsApp.' + (hasUnpriced() ? ' Items marked "Price on request" are not in the total.' : '') + '</p>';
  }

  bd.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-s]'); if (!b) return;
    var s = b.getAttribute('data-s'), d = Number(b.getAttribute('data-d'));
    var it = cart.filter(function (c) { return c.slug === s; })[0]; if (!it) return;
    setQty(s, d === 0 ? 0 : it.qty + d);
  });

  ft.addEventListener('click', function (e) {
    if (e.target.id !== 'nch-go') return;
    var name = ft.querySelector('#nch-name').value.trim(), phone = ft.querySelector('#nch-phone').value.trim();
    var email = ft.querySelector('#nch-email').value.trim(), addr = ft.querySelector('#nch-addr').value.trim();
    if (!name || !/^[0-9+\-() ]{7,20}$/.test(phone)) { alert('Please enter your name and a valid phone number.'); return; }
    var lines = cart.map(function (c, i) { return (i + 1) + '. ' + c.name + (c.code ? ' [' + c.code + ']' : '') + ' x ' + c.qty + (c.price ? ' @ ' + inr(c.price) : ' (price on request)'); });
    var summary = 'ORDER\n' + lines.join('\n') + '\nTotal (MRP): ' + inr(total()) + (hasUnpriced() ? ' + price-on-request items' : '') + (addr ? '\nAddress/notes: ' + addr : '');
    var goBtn = e.target; goBtn.disabled = true; goBtn.textContent = 'Placing order...';
    var waWin = window.open('', '_blank');
    var body = { name: name, phone: phone, message: summary.slice(0, 2000), source: 'website-order' };
    if (email) body.email = email;
    fetch(API + '/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return true; })
      .catch(function () { return false; })
      .then(function (ok) {
        var url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Hello, I would like to place an order.\n' + summary + '\nName: ' + name + '\nPhone: ' + phone);
        if (waWin) waWin.location.href = url;
        if (ok) { cart = []; save(cart); bd.innerHTML = ''; ft.innerHTML = ''; bd.innerHTML = '<div class="nch-ok"><h3>Order received</h3><p>Thank you, ' + esc(name) + '. Our team will contact you shortly to confirm availability and payment. Your order summary has also opened on WhatsApp.</p></div>'; badge.style.display = 'none'; badge.textContent = '0'; }
        else { goBtn.disabled = false; goBtn.textContent = 'Place Order'; alert('We could not save your order online. Please send the WhatsApp message that just opened so we receive it.'); }
      });
  });

  /* Add-to-cart buttons anywhere on the page (product cards and detail page) */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cart-add]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    add({ slug: b.getAttribute('data-slug'), name: b.getAttribute('data-name'), code: b.getAttribute('data-code'), price: b.getAttribute('data-price'), img: b.getAttribute('data-img') });
  });

  window.NCHCart = { add: add, open: open };
  render();
})();

