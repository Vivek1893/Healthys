// profile.js — Profile page logic
'use strict';

let currentUser    = null;
let userAddresses  = [];
let userOrders     = [];
let activeTab      = 'overview';

document.addEventListener('DOMContentLoaded', async () => {
  updateHeaderBadges();
  await checkAuth();
  // Handle hash for deep linking (e.g. profile.html#addresses)
  if (location.hash) {
    const tabName = location.hash.replace('#', '');
    if (['overview','orders','addresses','edit','security'].includes(tabName)) {
      setTimeout(() => showTab(tabName), 100);
    }
  }
});

async function checkAuth() {
  try {
    const res = await API.get('/api/user/profile');
    if (res.loggedIn && res.user) {
      currentUser   = res.user;
      userAddresses = res.addresses || [];
      userOrders    = res.orders    || [];
      showProfileSection();
    } else {
      showAuthSection();
    }
  } catch(e) {
    showAuthSection();
  }
}

function showAuthSection() {
  document.getElementById('authSection').classList.remove('hidden');
  document.getElementById('profileSection').classList.add('hidden');
}
function showProfileSection() {
  document.getElementById('authSection').classList.add('hidden');
  document.getElementById('profileSection').classList.remove('hidden');
  populateProfile();
}

function populateProfile() {
  const initials = currentUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('avatarInitials').textContent  = initials;
  document.getElementById('sidebarName').textContent     = currentUser.name;
  document.getElementById('sidebarEmail').textContent    = currentUser.email;
  // Edit form pre-fill
  document.getElementById('editName').value  = currentUser.name;
  document.getElementById('editEmail').value = currentUser.email;
  document.getElementById('editPhone').value = currentUser.phone || '';
  // Overview stats
  document.getElementById('ovOrders').textContent    = userOrders.length;
  document.getElementById('ovAddresses').textContent = userAddresses.length;
  updateHeaderBadges().then(async () => {
    try {
      const [cartRes, wishRes] = await Promise.all([API.get('/api/cart'), API.get('/api/wishlist')]);
      document.getElementById('ovCart').textContent     = cartRes.count    || 0;
      document.getElementById('ovWishlist').textContent = wishRes.count   || 0;
    } catch(e) {}
  });
  renderRecentOrders();
  renderAddresses();
}

/* ── TAB SWITCHING ── */
function showTab(name) {
  activeTab = name;
  document.querySelectorAll('.profile-tab').forEach(t => t.classList.add('hidden'));
  document.querySelectorAll('.profile-nav-item').forEach(n => n.classList.remove('active'));
  const tabEl = document.getElementById(`tab-${name}`);
  const navEl = document.getElementById(`nav-${name}`);
  if (tabEl) tabEl.classList.remove('hidden');
  if (navEl) navEl.classList.add('active');
  if (name === 'orders')    renderOrders();
  if (name === 'addresses') renderAddresses();
}

/* ── AUTH ── */
function switchTab(tab) {
  document.getElementById('loginForm').classList.toggle('hidden',    tab !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
  document.getElementById('loginTab').classList.toggle('active',    tab === 'login');
  document.getElementById('registerTab').classList.toggle('active', tab === 'register');
}

async function handleLogin(e) {
  e.preventDefault();
  const errEl = document.getElementById('loginError');
  errEl.classList.add('hidden');
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';
  try {
    const res = await API.post('/api/user/login', {
      email:    document.getElementById('loginEmail').value,
      password: document.getElementById('loginPassword').value
    });
    if (res.success) {
      currentUser   = res.user;
      userAddresses = [];
      userOrders    = [];
      // fetch full profile
      const profile = await API.get('/api/user/profile');
      if (profile.addresses) userAddresses = profile.addresses;
      if (profile.orders)    userOrders    = profile.orders;
      showProfileSection();
      showToast('Welcome back, ' + currentUser.name + '!');
    } else {
      errEl.textContent = res.error || 'Login failed';
      errEl.classList.remove('hidden');
    }
  } catch(err) {
    errEl.textContent = 'Could not connect to server. Please make sure the server is running.';
    errEl.classList.remove('hidden');
  }
  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
}

async function handleRegister(e) {
  e.preventDefault();
  const errEl = document.getElementById('registerError');
  errEl.classList.add('hidden');
  const btn = document.getElementById('registerBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating account...';
  try {
    const res = await API.post('/api/user/register', {
      name:     document.getElementById('regName').value,
      email:    document.getElementById('regEmail').value,
      phone:    document.getElementById('regPhone').value,
      password: document.getElementById('regPassword').value
    });
    if (res.success) {
      currentUser   = res.user;
      userAddresses = [];
      userOrders    = [];
      showProfileSection();
      showToast('Account created! Welcome, ' + currentUser.name + '!');
    } else {
      errEl.textContent = res.error || 'Registration failed';
      errEl.classList.remove('hidden');
    }
  } catch(err) {
    errEl.textContent = 'Could not connect to server.';
    errEl.classList.remove('hidden');
  }
  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create Account';
}

async function handleLogout() {
  if (!confirm('Are you sure you want to logout?')) return;
  try { await API.post('/api/user/logout', {}); } catch(e) {}
  currentUser = null;
  showToast('Logged out successfully');
  setTimeout(() => { showAuthSection(); }, 500);
}

/* ── PROFILE EDIT ── */
async function handleUpdateProfile(e) {
  e.preventDefault();
  const errEl = document.getElementById('editProfileError');
  const sucEl = document.getElementById('editProfileSuccess');
  errEl.classList.add('hidden'); sucEl.classList.add('hidden');
  try {
    const res = await API.patch('/api/user/profile', {
      name:  document.getElementById('editName').value,
      phone: document.getElementById('editPhone').value
    });
    if (res.success) {
      currentUser.name  = document.getElementById('editName').value;
      currentUser.phone = document.getElementById('editPhone').value;
      document.getElementById('sidebarName').textContent    = currentUser.name;
      document.getElementById('avatarInitials').textContent = currentUser.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
      sucEl.textContent = 'Profile updated successfully!';
      sucEl.classList.remove('hidden');
      showToast('Profile updated!');
    } else {
      errEl.textContent = res.error || 'Update failed';
      errEl.classList.remove('hidden');
    }
  } catch(err) {
    errEl.textContent = 'Server not reachable.';
    errEl.classList.remove('hidden');
  }
}

/* ── PASSWORD CHANGE ── */
async function handleChangePassword(e) {
  e.preventDefault();
  const errEl = document.getElementById('pwdError');
  const sucEl = document.getElementById('pwdSuccess');
  errEl.classList.add('hidden'); sucEl.classList.add('hidden');
  try {
    const res = await API.patch('/api/user/password', {
      currentPassword: document.getElementById('currentPwd').value,
      newPassword:     document.getElementById('newPwd').value
    });
    if (res.success) {
      sucEl.textContent = '✅ Password changed successfully!';
      sucEl.classList.remove('hidden');
      document.getElementById('changePasswordForm').reset();
      showToast('Password changed!');
    } else {
      errEl.textContent = res.error || 'Failed to change password.';
      errEl.classList.remove('hidden');
    }
  } catch(err) {
    errEl.textContent = 'Server not reachable.';
    errEl.classList.remove('hidden');
  }
}

/* ── ORDERS ── */
function renderOrders() {
  const el = document.getElementById('ordersContent');
  if (!userOrders.length) { el.innerHTML = '<p class="muted-text">No orders yet. <a href="index.html">Start shopping!</a></p>'; return; }
  el.innerHTML = userOrders.map(order => {
    let items = [];
    try { items = JSON.parse(order.items_json); } catch(e) {}
    const statusClass = { confirmed: 'status-confirmed', pending: 'status-pending', delivered: 'status-delivered' }[order.status] || 'status-pending';
    const date = new Date(order.placed_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
    return `<div class="order-item">
      <div class="order-meta">
        <div class="order-id">Order #${String(order.id).padStart(6,'0')}</div>
        <div class="order-date">${date}</div>
        <div class="order-items-preview">${items.slice(0,2).map(i=>i.name).join(', ')}${items.length > 2 ? ` +${items.length-2} more` : ''}</div>
      </div>
      <div class="order-status">
        <span class="status-badge ${statusClass}">${order.status}</span>
        <span class="order-total">₹${order.total}</span>
      </div>
    </div>`;
  }).join('');
}

function renderRecentOrders() {
  const el = document.getElementById('recentOrders');
  if (!userOrders.length) { el.innerHTML = '<p class="muted-text">No orders yet. <a href="index.html">Start shopping!</a></p>'; return; }
  const recent = userOrders.slice(0, 3);
  el.innerHTML = recent.map(order => {
    const statusClass = { confirmed:'status-confirmed', pending:'status-pending', delivered:'status-delivered' }[order.status] || 'status-pending';
    const date = new Date(order.placed_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
    return `<div class="order-item">
      <div class="order-meta">
        <div class="order-id">Order #${String(order.id).padStart(6,'0')}</div>
        <div class="order-date">${date}</div>
      </div>
      <div class="order-status">
        <span class="status-badge ${statusClass}">${order.status}</span>
        <span class="order-total">₹${order.total}</span>
      </div>
    </div>`;
  }).join('');
}

/* ── ADDRESSES ── */
function renderAddresses() {
  const el = document.getElementById('addressesContent');
  document.getElementById('ovAddresses').textContent = userAddresses.length;
  if (!userAddresses.length) { el.innerHTML = '<p class="muted-text">No addresses saved yet.</p>'; return; }
  el.innerHTML = userAddresses.map(addr => `
    <div class="address-card ${addr.is_default ? 'default' : ''}">
      <div>
        <span class="address-label-badge">${addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '🏢' : '📍'} ${addr.label}</span>
        ${addr.is_default ? '<span class="default-badge">Default</span>' : ''}
      </div>
      <div class="address-text">
        <strong>${addr.name || ''}</strong>${addr.phone ? ` · ${addr.phone}` : ''}<br/>
        ${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}<br/>
        ${addr.city}, ${addr.state} – ${addr.pincode}
      </div>
      <div class="address-card-actions">
        <button class="addr-action-btn" onclick="deleteAddress(${addr.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`).join('');
}

function openAddressModal()  { document.getElementById('addressModal').classList.remove('hidden'); }
function closeAddressModal() { document.getElementById('addressModal').classList.add('hidden'); document.getElementById('addAddressForm').reset(); }

async function handleAddAddress(e) {
  e.preventDefault();
  const errEl = document.getElementById('addrError');
  errEl.classList.add('hidden');
  const body = {
    label:      document.getElementById('addrLabel').value,
    name:       document.getElementById('addrName').value,
    phone:      document.getElementById('addrPhone').value,
    line1:      document.getElementById('addrLine1').value,
    line2:      document.getElementById('addrLine2').value,
    city:       document.getElementById('addrCity').value,
    state:      document.getElementById('addrState').value,
    pincode:    document.getElementById('addrPincode').value,
    is_default: document.getElementById('addrDefault').checked ? 1 : 0
  };
  try {
    const res = await API.post('/api/user/addresses', body);
    if (res.success) {
      userAddresses.push({ id: res.id, ...body });
      renderAddresses();
      closeAddressModal();
      showToast('Address added!');
      document.getElementById('ovAddresses').textContent = userAddresses.length;
    } else {
      errEl.textContent = res.error; errEl.classList.remove('hidden');
    }
  } catch(err) {
    errEl.textContent = 'Server not reachable.'; errEl.classList.remove('hidden');
  }
}

async function deleteAddress(id) {
  if (!confirm('Delete this address?')) return;
  try { await API.delete(`/api/user/addresses/${id}`); } catch(e) {}
  userAddresses = userAddresses.filter(a => a.id !== id);
  renderAddresses();
  showToast('Address deleted');
}

/* ── PASSWORD TOGGLE ── */
function togglePwd(inputId, btn) {
  const input = document.getElementById(inputId);
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  btn.querySelector('i').className = isText ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
}

/* ── TOAST ── */
function showToast(msg) {
  const t = document.getElementById('cartToast');
  document.getElementById('cartToastMsg').textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ═══════════════════════════════════════════
   GOOGLE SIGN-IN
═══════════════════════════════════════════ */
function handleGoogleSignIn() {
  document.getElementById('googlePopup').classList.remove('hidden');
}

function closeGooglePopup() {
  document.getElementById('googlePopup').classList.add('hidden');
  document.getElementById('gpEmailInput').classList.add('hidden');
  document.getElementById('gpAccounts').classList.remove('hidden');
}

function showGoogleEmailInput() {
  document.getElementById('gpAccounts').classList.add('hidden');
  document.getElementById('gpEmailInput').classList.remove('hidden');
  document.getElementById('gpName').focus();
}

async function googleLoginWith(email, name) {
  closeGooglePopup();
  await doGoogleLogin(name, email);
}

async function googleLoginFromInput() {
  const name  = document.getElementById('gpName')?.value.trim();
  const email = document.getElementById('gpEmail')?.value.trim();
  if (!name || !email) { alert('Please enter your name and Gmail address.'); return; }
  closeGooglePopup();
  await doGoogleLogin(name, email);
}

async function doGoogleLogin(name, email) {
  try {
    const res = await API.post('/api/auth/google', {
      name, email,
      googleId: 'google_' + btoa(email).replace(/=/g,''),
      avatar: ''
    });
    if (res.success) {
      currentUser   = res.user;
      userAddresses = [];
      userOrders    = [];
      const profile = await API.get('/api/user/profile');
      if (profile.addresses) userAddresses = profile.addresses;
      if (profile.orders)    userOrders    = profile.orders;
      showProfileSection();
      showToast('🎉 Signed in with Google as ' + currentUser.name + '!');
    } else {
      alert('Google login failed: ' + (res.error || 'Unknown error'));
    }
  } catch(e) {
    alert('Could not connect to server. Make sure the server is running.');
  }
}

// Close Google popup when clicking overlay
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('googlePopup');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeGooglePopup();
    });
  }
});

