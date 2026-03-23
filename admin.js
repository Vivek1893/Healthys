// admin.js — Healthys Admin Panel Frontend
'use strict';

const ADMIN_PASSWORD = 'admin123';
let allProducts = [];
let editingId    = null;

/* ── LOGIN GATE ── */
function verifyAdmin() {
  const pwd = document.getElementById('adminPwdInput').value;
  if (pwd === ADMIN_PASSWORD || pwd === (localStorage.getItem('hAdminPwd') || ADMIN_PASSWORD)) {
    localStorage.setItem('hAdminLoggedIn', '1');
    document.getElementById('adminLoginGate').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    loadProducts();
  } else {
    document.getElementById('adminPwdInput').style.borderColor = '#ef4444';
    document.getElementById('adminPwdInput').placeholder = '❌ Wrong password!';
    setTimeout(() => {
      document.getElementById('adminPwdInput').style.borderColor = '';
      document.getElementById('adminPwdInput').placeholder = 'Admin Password';
    }, 2000);
  }
}

function adminLogout() {
  localStorage.removeItem('hAdminLoggedIn');
  document.getElementById('adminLoginGate').classList.remove('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
  document.getElementById('adminPwdInput').value = '';
}

// Auto-login if recently authenticated
if (localStorage.getItem('hAdminLoggedIn') === '1') {
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('adminLoginGate').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    loadProducts();
  });
}

/* ── TAB SWITCHING ── */
function switchAdminTab(name) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`tab-${name}`).classList.add('active');
  const navEl = document.getElementById(`nav-${name}`);
  if (navEl) navEl.classList.add('active');
  if (name === 'stats') renderStats();
}

/* ── LOAD PRODUCTS ── */
async function loadProducts() {
  document.getElementById('productsLoading').style.display = 'flex';
  try {
    const res = await API.get('/api/products');
    allProducts = res.products || [];
  } catch(e) { showAdminToast('Server offline – using fallback', 'error'); }
  document.getElementById('productsLoading').style.display = 'none';
  renderTable(allProducts);
  updateStats(allProducts);
}

function updateStats(list) {
  document.getElementById('statTotal').textContent     = list.length;
  document.getElementById('statInStock').textContent   = list.filter(p => p.in_stock).length;
  document.getElementById('statCategories').textContent = [...new Set(list.map(p => p.category))].length;
  const avgDisc = list.length ? Math.round(list.reduce((s, p) => s + p.discount, 0) / list.length) : 0;
  document.getElementById('statAvgDiscount').textContent = avgDisc + '%';
}

function renderTable(list) {
  const tbody = document.getElementById('productsTableBody');
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--admin-sub)">No products found</td></tr>`; return; }
  tbody.innerHTML = list.map(p => `
    <tr>
      <td class="product-icon-cell">${p.icon || '📦'}</td>
      <td class="product-name-cell">${p.name}</td>
      <td><span class="cat-badge cat-${p.category}">${catLabel(p.category)}</span></td>
      <td>${p.weight || '–'}</td>
      <td class="price-cell">₹${p.price}</td>
      <td class="mrp-cell">₹${p.original}</td>
      <td class="discount-cell">-${p.discount}%</td>
      <td>${p.rating}⭐</td>
      <td><span class="stock-badge ${p.in_stock ? 'in' : 'out'}">${p.in_stock ? '● In Stock' : '● Out'}</span></td>
      <td class="actions-cell">
        <button class="admin-btn admin-btn-edit" onclick="editProduct(${p.id})"><i class="fa-solid fa-pen"></i> Edit</button>
        <button class="admin-btn admin-btn-danger" onclick="deleteProduct(${p.id})" style="padding:6px 10px;font-size:.78rem;">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>`).join('');
}

function catLabel(cat) {
  return { spices:'🌶 Spices', tea:'🫖 Tea', food:'🥗 Food', herbal:'🌿 Herbal', care:'🧴 Care' }[cat] || cat;
}

function filterProducts(query) {
  const cat = document.getElementById('categoryFilter').value;
  let filtered = allProducts;
  if (cat) filtered = filtered.filter(p => p.category === cat);
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.tags||'').toLowerCase().includes(q));
  }
  renderTable(filtered);
}

/* ── ADD / EDIT ── */
function editProduct(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  document.getElementById('editProductId').value = id;
  document.getElementById('addEditTitle').textContent = '✏️ Edit Product';
  document.getElementById('addEditSub').textContent   = `Editing: ${p.name}`;
  document.getElementById('pName').value        = p.name;
  document.getElementById('pCategory').value    = p.category;
  document.getElementById('pWeight').value      = p.weight || '';
  document.getElementById('pDescription').value = p.description || '';
  document.getElementById('pTags').value        = p.tags || '';
  document.getElementById('pPrice').value       = p.price;
  document.getElementById('pOriginal').value    = p.original;
  document.getElementById('pRating').value      = p.rating;
  document.getElementById('pReviews').value     = p.reviews || 0;
  document.getElementById('pIcon').value        = p.icon || '🌿';
  document.getElementById('pColor').value       = p.color || '#f0fff4';
  document.getElementById('pColorPicker').value = p.color || '#f0fff4';
  document.getElementById('pInStock').checked   = !!p.in_stock;
  calcDiscount();
  updatePreview();
  switchAdminTab('add');
}

function resetForm() {
  editingId = null;
  document.getElementById('editProductId').value = '';
  document.getElementById('productForm').reset();
  document.getElementById('addEditTitle').textContent = 'Add New Product';
  document.getElementById('addEditSub').textContent   = 'Fill in the details below to add a new product';
  document.getElementById('discountDisplay').textContent = 'Auto-calculated';
  document.getElementById('pIcon').value  = '🌿';
  document.getElementById('pColor').value = '#f0fff4';
  document.getElementById('pColorPicker').value = '#f0fff4';
  document.getElementById('pInStock').checked = true;
  document.getElementById('adminMsg').classList.add('hidden');
  updatePreview();
}

function cancelEdit() { resetForm(); switchAdminTab('products'); }

async function handleSaveProduct(e) {
  e.preventDefault();
  const btn = document.getElementById('saveProductBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

  const price    = parseInt(document.getElementById('pPrice').value);
  const original = parseInt(document.getElementById('pOriginal').value);
  const discount = original > 0 ? Math.round((1 - price/original)*100) : 0;

  const body = {
    name:        document.getElementById('pName').value.trim(),
    category:    document.getElementById('pCategory').value,
    weight:      document.getElementById('pWeight').value.trim(),
    description: document.getElementById('pDescription').value.trim(),
    tags:        document.getElementById('pTags').value.trim(),
    price, original, discount,
    rating:      parseFloat(document.getElementById('pRating').value) || 4.5,
    reviews:     parseInt(document.getElementById('pReviews').value) || 0,
    icon:        document.getElementById('pIcon').value.trim() || '🌿',
    color:       document.getElementById('pColor').value.trim() || '#f0fff4',
    in_stock:    document.getElementById('pInStock').checked ? 1 : 0
  };

  const isEdit = !!editingId;
  let res;
  try {
    res = isEdit
      ? await API.patch(`/api/admin/products/${editingId}`, body)
      : await API.post('/api/admin/products', body);
  } catch(err) {
    showAdminToast('Server error. Is the server running?', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-save"></i> Save Product';
    return;
  }

  if (res.success) {
    showAdminMsg(isEdit ? '✅ Product updated successfully!' : '✅ Product added successfully!', 'success');
    showAdminToast(isEdit ? 'Product updated!' : 'Product added!');
    await loadProducts();
    setTimeout(() => {
      cancelEdit();
      switchAdminTab('products');
    }, 1200);
  } else {
    showAdminMsg('❌ ' + (res.error || 'Failed to save'), 'error');
  }
  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-save"></i> Save Product';
}

async function deleteProduct(id) {
  const p = allProducts.find(x => x.id === id);
  if (!confirm(`Delete "${p?.name}"? This cannot be undone.`)) return;
  try {
    const res = await API.delete(`/api/admin/products/${id}`);
    if (res.success) {
      showAdminToast('Product deleted');
      await loadProducts();
    }
  } catch(e) { showAdminToast('Delete failed', 'error'); }
}

/* ── DISCOUNT CALC ── */
function calcDiscount() {
  const price = parseInt(document.getElementById('pPrice').value);
  const orig  = parseInt(document.getElementById('pOriginal').value);
  if (price > 0 && orig > 0 && orig >= price) {
    const disc = Math.round((1 - price / orig) * 100);
    document.getElementById('discountDisplay').textContent = `-${disc}%`;
    document.getElementById('discountDisplay').style.color = disc > 40 ? '#22c55e' : '#f59e0b';
  } else {
    document.getElementById('discountDisplay').textContent = 'Invalid';
    document.getElementById('discountDisplay').style.color = '#ef4444';
  }
  updatePreview();
}

/* ── LIVE PREVIEW ── */
function updatePreview() {
  const name   = document.getElementById('pName')?.value      || 'Product Name';
  const weight = document.getElementById('pWeight')?.value    || '200g';
  const price  = document.getElementById('pPrice')?.value     || '149';
  const orig   = document.getElementById('pOriginal')?.value  || '299';
  const icon   = document.getElementById('pIcon')?.value      || '🌿';
  const color  = document.getElementById('pColor')?.value     || '#f0fff4';
  const disc   = (orig > 0 && price > 0) ? Math.round((1 - price/orig)*100) : 50;

  const imgWrap = document.getElementById('previewImgWrap');
  if (imgWrap) imgWrap.style.background = color;
  if (document.getElementById('previewIcon')) document.getElementById('previewIcon').textContent = icon;
  if (document.getElementById('previewName')) document.getElementById('previewName').textContent = name || 'Product Name';
  if (document.getElementById('previewWeight')) document.getElementById('previewWeight').textContent = weight;
  if (document.getElementById('previewPrice')) document.getElementById('previewPrice').textContent = price ? `₹${price}` : '₹149';
  if (document.getElementById('previewOriginal')) document.getElementById('previewOriginal').textContent = orig ? `₹${orig}` : '₹299';
  if (document.getElementById('previewDiscount')) document.getElementById('previewDiscount').textContent = `-${disc}%`;
}

// Attach live preview listeners
document.addEventListener('DOMContentLoaded', () => {
  ['pName','pWeight','pPrice','pOriginal','pIcon','pColor'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updatePreview);
  });
  updatePreview();
});

/* ── EMOJI & COLOR HELPERS ── */
function setEmoji(e) { document.getElementById('pIcon').value = e; updatePreview(); }
function setColor(c) {
  document.getElementById('pColor').value = c;
  document.getElementById('pColorPicker').value = c;
  updatePreview();
}

/* ── STATS TAB ── */
function renderStats() {
  const categories = ['spices','tea','food','herbal','care'];
  const labels = { spices:'🌶️ Spices', tea:'🫖 Tea', food:'🥗 Food', herbal:'🌿 Herbal', care:'🧴 Care' };
  const grid = document.getElementById('statsGrid');
  grid.innerHTML = categories.map(cat => {
    const prods = allProducts.filter(p => p.category === cat);
    const avgP  = prods.length ? Math.round(prods.reduce((s,p) => s+p.price, 0) / prods.length) : 0;
    return `<div class="stats-cat-card">
      <div class="stats-cat-icon">${labels[cat].split(' ')[0]}</div>
      <div class="stats-cat-name">${labels[cat].split(' ')[1]}</div>
      <div class="stats-cat-count">${prods.length}</div>
      <div class="stats-cat-sub">Avg ₹${avgP}</div>
    </div>`;
  }).join('');
}

/* ── MESSAGES ── */
function showAdminMsg(msg, type = 'success') {
  const el = document.getElementById('adminMsg');
  el.textContent = msg;
  el.className = `admin-msg ${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

function showAdminToast(msg, type = 'success') {
  const toast = document.getElementById('adminToast');
  toast.textContent = msg;
  toast.className = `admin-toast show ${type}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2800);
}
