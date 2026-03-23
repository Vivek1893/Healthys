// api.js — Shared API helper for all pages
// Detects whether we're running via the Express server or file:// protocol
const BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

function _adminHeaders(path) {
  const h = { 'Content-Type': 'application/json' };
  if (path.startsWith('/api/admin')) {
    h['x-admin-password'] = localStorage.getItem('hAdminPwd') || 'admin123';
  }
  return h;
}

const API = {
  async get(path) {
    const r = await fetch(BASE + path, {
      credentials: 'include',
      headers: path.startsWith('/api/admin') ? { 'x-admin-password': localStorage.getItem('hAdminPwd') || 'admin123' } : {}
    });
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(BASE + path, {
      method: 'POST',
      headers: _adminHeaders(path),
      credentials: 'include',
      body: JSON.stringify(body)
    });
    return r.json();
  },
  async patch(path, body) {
    const r = await fetch(BASE + path, {
      method: 'PATCH',
      headers: _adminHeaders(path),
      credentials: 'include',
      body: JSON.stringify(body)
    });
    return r.json();
  },
  async delete(path) {
    const r = await fetch(BASE + path, {
      method: 'DELETE',
      credentials: 'include',
      headers: path.startsWith('/api/admin') ? { 'x-admin-password': localStorage.getItem('hAdminPwd') || 'admin123' } : {}
    });
    return r.json();
  }
};

// Shared: update header badge counts
async function updateHeaderBadges() {
  try {
    const [cartRes, wishRes] = await Promise.all([
      API.get('/api/cart'),
      API.get('/api/wishlist')
    ]);
    const cartBadge  = document.getElementById('cartBadge');
    const wishBadge  = document.getElementById('wishlistBadge');
    if (cartBadge)  cartBadge.textContent  = cartRes.count  || 0;
    if (wishBadge)  wishBadge.textContent  = wishRes.count  || 0;
  } catch(e) { /* server may not be running in file: mode */ }
}

// Show toast notification
function showToast(msg, isError = false) {
  const toast = document.getElementById('cartToast');
  if (!toast) return;
  const msgEl = document.getElementById('cartToastMsg');
  const icon  = toast.querySelector('i');
  if (msgEl)  msgEl.textContent = msg;
  if (icon)   icon.className = isError ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-check-circle';
  toast.style.background = isError ? '#1f1928' : '#1a1a2e';
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
}
