// cart.js — Cart page logic
'use strict';

let cartData     = [];
let couponApplied = null;
const COUPONS    = { HEALTH20: 0.20, FIRST50: 0.50 };
const FREE_DELIVERY_MIN = 499;
const DELIVERY_FEE = 49;

document.addEventListener('DOMContentLoaded', async () => {
  updateHeaderBadges();
  await loadCart();
  bindCoupon();
});

async function loadCart() {
  document.getElementById('cartLoading').style.display = 'flex';
  try {
    const res = await API.get('/api/cart');
    cartData = res.items || [];
  } catch(e) {
    // Fallback: read from localStorage if server unreachable
    cartData = JSON.parse(localStorage.getItem('hCart') || '[]');
  }
  document.getElementById('cartLoading').style.display = 'none';
  renderCart();
}

function renderCart() {
  const emptyEl  = document.getElementById('emptyCart');
  const layoutEl = document.getElementById('cartLayout');
  if (!cartData.length) {
    emptyEl.classList.remove('hidden');
    layoutEl.classList.add('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  layoutEl.classList.remove('hidden');
  renderCartItems();
  updateSummary();
}

function renderCartItems() {
  const list = document.getElementById('cartItemsList');
  const count = cartData.reduce((s, i) => s + (i.quantity || 1), 0);
  document.getElementById('cartItemCount').textContent = `(${count} item${count !== 1 ? 's' : ''})`;

  list.innerHTML = cartData.map(item => `
    <div class="cart-item" id="ci-${item.cart_id}">
      <div class="cart-item-img" style="background:${item.color || '#f8f8f8'}">${item.icon || '🌿'}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-weight">${item.weight || ''}</div>
        <div class="cart-item-price-row">
          <span class="cart-item-price">₹${item.price}</span>
          <span class="cart-item-original">₹${item.original}</span>
          <span class="cart-item-badge">-${item.discount}%</span>
        </div>
      </div>
      <div class="cart-item-actions">
        <div class="qty-control">
          <button class="qty-btn" onclick="changeQty(${item.cart_id}, ${item.quantity - 1})">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" onclick="changeQty(${item.cart_id}, ${item.quantity + 1})">+</button>
        </div>
        <div class="item-total">₹${item.price * item.quantity}</div>
        <button class="remove-item-btn" onclick="removeItem(${item.cart_id})">
          <i class="fa-regular fa-trash-can"></i> Remove
        </button>
      </div>
    </div>`).join('');
}

async function changeQty(cartId, newQty) {
  const item = cartData.find(i => i.cart_id === cartId);
  if (!item) return;
  if (newQty < 1) { return removeItem(cartId); }
  item.quantity = newQty;
  try {
    await API.patch(`/api/cart/${cartId}`, { quantity: newQty });
  } catch(e) {
    syncLocalCart();
  }
  renderCart();
  updateHeaderBadges();
}

async function removeItem(cartId) {
  const el = document.getElementById(`ci-${cartId}`);
  if (el) { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; }
  await new Promise(r => setTimeout(r, 250));
  cartData = cartData.filter(i => i.cart_id !== cartId);
  try { await API.delete(`/api/cart/${cartId}`); } catch(e) { syncLocalCart(); }
  renderCart();
  updateHeaderBadges();
  showToast('Item removed from cart');
}

// Clear all
document.getElementById('clearCartBtn').addEventListener('click', async () => {
  if (!confirm('Clear all items from cart?')) return;
  cartData = [];
  try { await API.delete('/api/cart'); } catch(e) { localStorage.removeItem('hCart'); }
  renderCart();
  updateHeaderBadges();
});

/* ── SUMMARY ── */
function updateSummary() {
  const subtotal = cartData.reduce((s, i) => s + i.price * i.quantity, 0);
  let discount = 0;
  if (couponApplied && COUPONS[couponApplied]) discount = Math.round(subtotal * COUPONS[couponApplied]);
  const delivery = subtotal >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FEE;
  const total = subtotal - discount + delivery;

  document.getElementById('summarySubtotal').textContent = `₹${subtotal}`;
  document.getElementById('summaryDelivery').textContent = delivery === 0 ? '🎉 FREE' : `₹${delivery}`;
  document.getElementById('summaryTotal').textContent  = `₹${total}`;

  const discRow = document.getElementById('discountRow');
  if (discount > 0) {
    discRow.classList.remove('hidden');
    document.getElementById('summaryDiscount').textContent = `-₹${discount}`;
    document.getElementById('couponApplied').textContent   = couponApplied;
  } else {
    discRow.classList.add('hidden');
  }

  // Total savings (MRP - actual)
  const mrpTotal = cartData.reduce((s, i) => s + i.original * i.quantity, 0);
  const totalSaved = mrpTotal - total;
  const savingsNote = document.getElementById('savingsNote');
  if (totalSaved > 0) {
    savingsNote.classList.remove('hidden');
    document.getElementById('totalSavings').textContent = `₹${totalSaved}`;
  } else {
    savingsNote.classList.add('hidden');
  }

  // Delivery progress bar
  const pct = Math.min((subtotal / FREE_DELIVERY_MIN) * 100, 100);
  document.getElementById('deliveryFill').style.width = pct + '%';
  const gap = FREE_DELIVERY_MIN - subtotal;
  document.getElementById('deliveryText').innerHTML =
    gap > 0 ? `Add <strong>₹${gap}</strong> more for FREE delivery!` : '🎉 You qualify for FREE delivery!';
}

/* ── COUPON ── */
function bindCoupon() {
  document.getElementById('applyCouponBtn').addEventListener('click', applyCoupon);
  document.getElementById('couponInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') applyCoupon();
  });
}

function applyCoupon() {
  const code = document.getElementById('couponInput').value.trim().toUpperCase();
  const msgEl = document.getElementById('couponMsg');
  if (!code) { msgEl.textContent = 'Please enter a coupon code.'; msgEl.className = 'coupon-msg error'; return; }
  if (COUPONS[code]) {
    couponApplied = code;
    msgEl.textContent = `✅ Coupon "${code}" applied! ${COUPONS[code] * 100}% discount added.`;
    msgEl.className = 'coupon-msg success';
    updateSummary();
    showToast(`${COUPONS[code] * 100}% discount applied!`);
  } else {
    couponApplied = null;
    msgEl.textContent = '❌ Invalid coupon code. Try HEALTH20 or FIRST50.';
    msgEl.className = 'coupon-msg error';
    updateSummary();
  }
}

/* ── CHECKOUT ── */
async function handleCheckout() {
  if (!cartData.length) { showToast('Your cart is empty!', true); return; }
  const btn = document.getElementById('checkoutBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

  try {
    const res = await API.post('/api/orders', { coupon: couponApplied, address: {} });
    if (res.success) {
      cartData = [];
      document.getElementById('orderIdDisplay').textContent = '#' + String(res.orderId).padStart(6, '0');
      document.getElementById('checkoutModal').classList.remove('hidden');
      renderCart();
      updateHeaderBadges();
    } else {
      showToast(res.error || 'Checkout failed. Please try again.', true);
    }
  } catch(e) {
    // Fallback demo mode
    cartData = [];
    localStorage.removeItem('hCart');
    document.getElementById('orderIdDisplay').textContent = '#' + Math.floor(100000 + Math.random() * 900000);
    document.getElementById('checkoutModal').classList.remove('hidden');
    renderCart();
    updateHeaderBadges();
  }
  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-lock"></i> Proceed to Checkout';
}

// Helper: sync to localStorage as fallback
function syncLocalCart() {
  localStorage.setItem('hCart', JSON.stringify(cartData));
}
