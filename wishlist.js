// wishlist.js — Wishlist page logic
'use strict';

let wishlistData = [];

document.addEventListener('DOMContentLoaded', async () => {
  updateHeaderBadges();
  await loadWishlist();
  bindActions();
});

async function loadWishlist() {
  document.getElementById('wishlistLoading').style.display = 'flex';
  try {
    const res = await API.get('/api/wishlist');
    wishlistData = res.items || [];
  } catch(e) {
    wishlistData = JSON.parse(localStorage.getItem('hWishlist') || '[]');
  }
  document.getElementById('wishlistLoading').style.display = 'none';
  renderWishlist();
}

function renderWishlist() {
  const emptyEl   = document.getElementById('emptyWishlist');
  const layoutEl  = document.getElementById('wishlistLayout');
  if (!wishlistData.length) {
    emptyEl.classList.remove('hidden');
    layoutEl.classList.add('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  layoutEl.classList.remove('hidden');
  document.getElementById('wishlistCount').textContent = `(${wishlistData.length} item${wishlistData.length !== 1 ? 's' : ''})`;

  const grid = document.getElementById('wishlistGrid');
  grid.innerHTML = wishlistData.map(item => `
    <article class="product-card" aria-label="${item.name}">
      <div class="product-img-wrap" style="background:${item.color || '#f8f8f8'};">
        <span class="discount-tag">-${item.discount}%</span>
        <div class="product-icon-placeholder">${item.icon || '🌿'}</div>
      </div>
      <div class="product-body">
        <div class="product-name">${item.name}</div>
        <div class="product-weight">${item.weight || ''}</div>
        <div class="product-price-row">
          <span class="price-current">₹${item.price}</span>
          <span class="price-original">₹${item.original}</span>
          <span class="price-save">Save ₹${item.original - item.price}</span>
        </div>
        <div class="wishlist-card-footer">
          <button class="move-to-cart-btn" onclick="moveToCart(${item.wishlist_id}, ${item.id})">
            <i class="fa-solid fa-bag-shopping"></i> Move to Cart
          </button>
          <button class="remove-wishlist-btn" onclick="removeFromWishlist(${item.wishlist_id})" title="Remove from wishlist">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>
    </article>`).join('');
}

async function moveToCart(wishlistId, productId) {
  try {
    const [cartRes] = await Promise.all([
      API.post('/api/cart', { product_id: productId }),
      API.delete(`/api/wishlist/${wishlistId}`)
    ]);
    showToast('Moved to cart!');
    wishlistData = wishlistData.filter(i => i.wishlist_id !== wishlistId);
    renderWishlist();
    updateHeaderBadges();
  } catch(e) {
    showToast('Action failed. Please try again.', true);
  }
}

async function removeFromWishlist(wishlistId) {
  try {
    await API.delete(`/api/wishlist/${wishlistId}`);
  } catch(e) { /* offline */ }
  wishlistData = wishlistData.filter(i => i.wishlist_id !== wishlistId);
  renderWishlist();
  updateHeaderBadges();
  showToast('Removed from wishlist');
}

function bindActions() {
  // Add All to Cart
  document.getElementById('addAllToCartBtn').addEventListener('click', async () => {
    if (!wishlistData.length) return;
    for (const item of wishlistData) {
      try { await API.post('/api/cart', { product_id: item.id }); } catch(e) {}
    }
    showToast(`${wishlistData.length} items added to cart!`);
    updateHeaderBadges();
  });

  // Clear All
  document.getElementById('clearWishlistBtn').addEventListener('click', async () => {
    if (!wishlistData.length || !confirm('Remove all items from wishlist?')) return;
    for (const item of wishlistData) {
      try { await API.delete(`/api/wishlist/${item.wishlist_id}`); } catch(e) {}
    }
    wishlistData = [];
    renderWishlist();
    updateHeaderBadges();
    showToast('Wishlist cleared');
  });
}
