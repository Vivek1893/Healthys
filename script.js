/* =========================================
   HEALTHYS – Main script.js
   Updated with API integration, live search, location picker
   ========================================= */
'use strict';

/* ========== DATA (fallback if server offline) ========== */
const fallbackProducts = {
  spices: [
    { id:1, name: "Organic Turmeric Powder", weight: "200g", price: 149, original: 299, discount: 50, rating: 4.8, reviews: 2341, icon: "🟡", color: "#fffbe6" },
    { id:2, name: "Premium Kashmiri Red Chili", weight: "250g", price: 179, original: 349, discount: 49, rating: 4.7, reviews: 1876, icon: "🌶️", color: "#fff1f0" },
    { id:3, name: "Pure Coriander Powder", weight: "300g", price: 119, original: 219, discount: 46, rating: 4.6, reviews: 1423, icon: "🟢", color: "#f0fff4" },
    { id:4, name: "Garam Masala Special Blend", weight: "150g", price: 199, original: 389, discount: 49, rating: 4.9, reviews: 3102, icon: "🍂", color: "#fff7ed" },
    { id:5, name: "Black Pepper Whole", weight: "100g", price: 229, original: 399, discount: 43, rating: 4.8, reviews: 987, icon: "⚫", color: "#f5f5f5" }
  ],
  tea: [
    { id:6, name: "Immunity Boost Tulsi Tea", weight: "100g (50 bags)", price: 249, original: 499, discount: 50, rating: 4.9, reviews: 4521, icon: "🫖", color: "#f0fff4" },
    { id:7, name: "Premium Darjeeling Green Tea", weight: "100g", price: 349, original: 599, discount: 42, rating: 4.8, reviews: 2876, icon: "🍵", color: "#f0fffe" },
    { id:8, name: "Chamomile Sleep Blend Tea", weight: "75g (30 bags)", price: 299, original: 549, discount: 46, rating: 4.7, reviews: 1654, icon: "🌼", color: "#fffef0" },
    { id:9, name: "Ginger Lemon Detox Tea", weight: "100g (40 bags)", price: 229, original: 449, discount: 49, rating: 4.6, reviews: 2103, icon: "🍋", color: "#ffffed" },
    { id:10, name: "Ashwagandha Stress Relief Tea", weight: "80g (30 bags)", price: 349, original: 599, discount: 42, rating: 4.8, reviews: 1789, icon: "🌙", color: "#f5f0ff" }
  ],
  food: [
    { id:11, name: "Raw Organic Honey", weight: "500g", price: 399, original: 699, discount: 43, rating: 4.9, reviews: 5231, icon: "🍯", color: "#fffde7" },
    { id:12, name: "Almond Butter Crunchy", weight: "300g", price: 449, original: 799, discount: 44, rating: 4.7, reviews: 3124, icon: "🥜", color: "#fdf6ec" },
    { id:13, name: "Chia Seeds Premium", weight: "500g", price: 299, original: 549, discount: 46, rating: 4.8, reviews: 2876, icon: "⚪", color: "#f8f8f8" },
    { id:14, name: "Mixed Berry Granola", weight: "400g", price: 349, original: 599, discount: 42, rating: 4.6, reviews: 1987, icon: "🫐", color: "#f5f0ff" },
    { id:15, name: "Flaxseed Powder", weight: "400g", price: 199, original: 349, discount: 43, rating: 4.7, reviews: 2341, icon: "🌾", color: "#fdfaf0" }
  ],
  herbal: [
    { id:16, name: "Ashwagandha Root Powder", weight: "200g", price: 349, original: 699, discount: 50, rating: 4.9, reviews: 6234, icon: "🌿", color: "#f0fff4" },
    { id:17, name: "Moringa Leaf Powder", weight: "250g", price: 299, original: 549, discount: 46, rating: 4.8, reviews: 4123, icon: "🌱", color: "#f0fff0" },
    { id:18, name: "Spirulina Superfood Powder", weight: "150g", price: 449, original: 849, discount: 47, rating: 4.7, reviews: 2987, icon: "💚", color: "#e8fff2" },
    { id:19, name: "Amla Powder", weight: "200g", price: 249, original: 449, discount: 45, rating: 4.8, reviews: 3456, icon: "🫒", color: "#f0fdf4" },
    { id:20, name: "Triphala Ayurvedic Powder", weight: "150g", price: 199, original: 349, discount: 43, rating: 4.7, reviews: 2109, icon: "🍃", color: "#f4fff4" }
  ],
  care: [
    { id:21, name: "Neem Herbal Face Wash", weight: "150ml", price: 199, original: 349, discount: 43, rating: 4.7, reviews: 2876, icon: "🧴", color: "#f0fff4" },
    { id:22, name: "Coconut Milk Shampoo", weight: "250ml", price: 299, original: 499, discount: 40, rating: 4.6, reviews: 1987, icon: "🥥", color: "#fffef0" },
    { id:23, name: "Natural Charcoal Soap", weight: "100g", price: 149, original: 249, discount: 40, rating: 4.8, reviews: 3211, icon: "🖤", color: "#f5f5f5" },
    { id:24, name: "Rose Water Face Toner", weight: "200ml", price: 249, original: 449, discount: 45, rating: 4.9, reviews: 4102, icon: "🌹", color: "#fff0f3" },
    { id:25, name: "Onion Hair Oil", weight: "200ml", price: 349, original: 599, discount: 42, rating: 4.8, reviews: 5123, icon: "🧅", color: "#fffbf0" }
  ]
};

const reviews = [
  { name: "Priya Sharma", location: "Mumbai, Maharashtra", initials: "PS", rating: 5, text: "Love the Ashwagandha powder! My energy levels are through the roof after 3 months.", product: "Ashwagandha Root Powder", color: "#2d7a4f" },
  { name: "Rajesh Kumar", location: "Delhi, NCR", initials: "RK", rating: 5, text: "The turmeric powder is genuinely pure – you can tell the difference in taste and color.", product: "Organic Turmeric Powder", color: "#1a6b8a" },
  { name: "Anita Nair", location: "Bengaluru, Karnataka", initials: "AN", rating: 5, text: "The Tulsi tea is now part of my morning ritual. Amazing quality and beautiful packaging!", product: "Immunity Boost Tulsi Tea", color: "#7c3aed" },
  { name: "Vikram Singh", location: "Pune, Maharashtra", initials: "VS", rating: 4, text: "Great products and super fast delivery. The Moringa powder is excellent quality.", product: "Moringa Leaf Powder", color: "#0369a1" },
  { name: "Sunita Patel", location: "Ahmedabad, Gujarat", initials: "SP", rating: 5, text: "The raw honey is absolutely delicious – you can taste the purity. No artificial sweetness!", product: "Raw Organic Honey", color: "#b45309" },
  { name: "Mohammed Ali", location: "Hyderabad, Telangana", initials: "MA", rating: 5, text: "The neem face wash is a game changer for my oily skin. My skin has improved so much!", product: "Neem Herbal Face Wash", color: "#c2410c" },
  { name: "Deepa Menon", location: "Chennai, Tamil Nadu", initials: "DM", rating: 5, text: "Incredible product quality and premium packaging. Sharing with all my friends!", product: "Garam Masala Special Blend", color: "#0f766e" }
];

/* ========== STATE ========== */
let cartCount = 0;
let wishlistCount = 0;
let currentSlide = 0;
let slideTimer = null;
const totalSlides = 3;
let searchDebounce = null;
let currentLocation = localStorage.getItem('hLocation') || '';

/* ========== DOM READY ========== */
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initHeroSlider();
  loadAndRenderProducts();
  renderReviews();
  initSearch();
  initBackToTop();
  initMobileMenu();
  initAnnouncement();
  initScrollAnimations();
  initReviewNav();
  initLocationPicker();
  loadBadgeCounts();
  if (currentLocation) document.getElementById('locationCity').textContent = currentLocation;
});

/* ========== LOAD BADGE COUNTS ON INIT ========== */
async function loadBadgeCounts() {
  try {
    const [cartRes, wishRes] = await Promise.all([
      API.get('/api/cart'),
      API.get('/api/wishlist')
    ]);
    cartCount     = cartRes.count    || 0;
    wishlistCount = wishRes.count    || 0;
    updateBadgeUI();
  } catch(e) { /* server offline – fallback to 0 */ }
}

function updateBadgeUI() {
  const cb = document.getElementById('cartBadge');
  const wb = document.getElementById('wishlistBadge');
  if (cb) cb.textContent = cartCount;
  if (wb) wb.textContent = wishlistCount;
}

/* ========== HEADER ========== */
function initHeader() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

/* ========== ANNOUNCEMENT ========== */
function initAnnouncement() {
  document.getElementById('closeAnnounce').addEventListener('click', () => {
    document.getElementById('announcementBar').classList.add('hidden');
  });
}

/* ========== MOBILE MENU ========== */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('mobileNav');
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    nav.classList.toggle('open');
  });
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      nav.classList.remove('open');
    });
  });
}

/* ========== HERO SLIDER ========== */
function initHeroSlider() {
  showSlide(0);
  document.getElementById('heroNext').addEventListener('click', () => goSlide(1));
  document.getElementById('heroPrev').addEventListener('click', () => goSlide(-1));
  document.querySelectorAll('.hero-dot').forEach((dot, i) => {
    dot.addEventListener('click', () => showSlide(i));
  });
  startAutoSlide();
  document.querySelector('.hero-slider').addEventListener('mouseenter', stopAutoSlide);
  document.querySelector('.hero-slider').addEventListener('mouseleave', startAutoSlide);
}
function goSlide(dir) { let next = (currentSlide + dir + totalSlides) % totalSlides; showSlide(next); }
function showSlide(index) {
  document.querySelectorAll('.hero-slide').forEach((s, i) => s.classList.toggle('active', i === index));
  document.querySelectorAll('.hero-dot').forEach((d, i)  => d.classList.toggle('active', i === index));
  currentSlide = index;
}
function startAutoSlide() { stopAutoSlide(); slideTimer = setInterval(() => goSlide(1), 4500); }
function stopAutoSlide()  { clearInterval(slideTimer); }

/* ========== RENDER PRODUCTS (with API fallback) ========== */
async function loadAndRenderProducts() {
  const categoryMap = {
    spices: { gridId: 'spices-grid',  category: 'spices' },
    tea:    { gridId: 'tea-grid',     category: 'tea'    },
    food:   { gridId: 'food-grid',    category: 'food'   },
    herbal: { gridId: 'herbal-grid',  category: 'herbal' },
    care:   { gridId: 'care-grid',    category: 'care'   }
  };

  for (const [key, cfg] of Object.entries(categoryMap)) {
    let items = fallbackProducts[key];
    try {
      const res = await API.get(`/api/products?category=${cfg.category}`);
      if (res.products && res.products.length) items = res.products;
    } catch(e) { /* use fallback */ }

    const grid = document.getElementById(cfg.gridId);
    if (!grid) continue;
    // Sort newest-first (highest id = most recently added by admin), then show 4
    const sorted  = [...items].sort((a, b) => b.id - a.id);
    const display = sorted.slice(0, 4);
    grid.innerHTML = display.map((p, i) => createProductCard(p, key, i)).join('');
    attachProductEvents(grid);
  }
  initScrollAnimations();
}

function createProductCard(p, category, index) {
  const starHtml = '★'.repeat(Math.floor(p.rating)) + (p.rating % 1 >= 0.5 ? '½' : '');
  return `
    <article class="product-card" style="animation-delay:${index * 0.08}s" aria-label="${p.name}">
      <div class="product-img-wrap" style="background:${p.color || '#f8f8f8'};">
        <span class="discount-tag">-${p.discount}%</span>
        <button class="card-wishlist-btn" data-id="${p.id}" aria-label="Add to wishlist"><i class="fa-regular fa-heart"></i></button>
        <div class="product-icon-placeholder">${p.icon || '🌿'}</div>
      </div>
      <div class="product-body">
        <div class="product-name">${p.name}</div>
        <div class="product-weight">${p.weight || ''}</div>
        <div class="product-rating"><span class="stars">${starHtml}</span><span>${p.rating} (${(p.reviews||0).toLocaleString()})</span></div>
        <div class="product-price-row">
          <span class="price-current">₹${p.price}</span>
          <span class="price-original">₹${p.original}</span>
          <span class="price-save">Save ₹${p.original - p.price}</span>
        </div>
        <button class="add-to-cart-btn" data-id="${p.id}" data-name="${p.name}">
          <i class="fa-solid fa-plus"></i> Add to Cart
        </button>
      </div>
    </article>`;
}

function attachProductEvents(grid) {
  grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); addToCart(btn, Number(btn.dataset.id), btn.dataset.name); });
  });
  grid.querySelectorAll('.card-wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); toggleWishlist(btn, Number(btn.dataset.id)); });
  });
}

/* ========== CART / WISHLIST ========== */
async function addToCart(btn, productId, name) {
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  try {
    const res = await API.post('/api/cart', { product_id: productId, quantity: 1 });
    if (res.success) cartCount = res.count || cartCount + 1;
  } catch(e) { cartCount++; }

  updateBadgeUI();
  animateBadge('cartBadge');
  btn.classList.add('added');
  btn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
  setTimeout(() => { btn.classList.remove('added'); btn.innerHTML = '<i class="fa-solid fa-plus"></i> Add to Cart'; btn.disabled = false; }, 2000);
  showToast(`"${name.substring(0,22)}..." added to cart`);
}

async function toggleWishlist(btn, productId) {
  const active = btn.classList.contains('active');
  btn.classList.toggle('active');
  btn.querySelector('i').className = !active ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
  try {
    const res = await API.post('/api/wishlist', { product_id: productId });
    wishlistCount = Math.max(0, res.inWishlist ? wishlistCount + 1 : wishlistCount - 1);
  } catch(e) { wishlistCount += !active ? 1 : -1; if (wishlistCount < 0) wishlistCount = 0; }
  updateBadgeUI();
  animateBadge('wishlistBadge');
}

function animateBadge(id) {
  const b = document.getElementById(id);
  if (!b) return;
  b.classList.add('bump');
  setTimeout(() => b.classList.remove('bump'), 300);
}

/* ========== TOAST ========== */
function showToast(msg) {
  const toast = document.getElementById('cartToast');
  document.getElementById('cartToastMsg').textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ========== LIVE SEARCH ========== */
function initSearch() {
  const input       = document.getElementById('searchInput');
  const suggestions = document.getElementById('searchSuggestions');
  const resultsList = document.getElementById('searchResultsList');
  if (!input || !suggestions) return;

  input.addEventListener('focus', () => {
    if (input.value.trim() === '') { showStaticSuggestions(resultsList); suggestions.classList.add('visible'); }
  });

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (!q) { showStaticSuggestions(resultsList); suggestions.classList.add('visible'); return; }
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => performLiveSearch(q, resultsList, suggestions), 280);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) suggestions.classList.remove('visible');
  });
}

function showStaticSuggestions(container) {
  container.querySelectorAll('[data-static]').forEach(el => el.style.display = 'flex');
  container.querySelectorAll('[data-api]').forEach(el => el.remove());
}

async function performLiveSearch(q, container, suggestionsEl) {
  container.querySelectorAll('[data-static]').forEach(el => el.style.display = 'none');
  container.querySelectorAll('[data-api]').forEach(el => el.remove());
  suggestionsEl.classList.add('visible');

  try {
    const res = await API.get(`/api/search?q=${encodeURIComponent(q)}`);
    container.querySelectorAll('[data-api]').forEach(el => el.remove());
    if (!res.products || !res.products.length) {
      const el = document.createElement('div');
      el.className = 'suggestion-item no-results'; el.setAttribute('data-api','1');
      el.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> No results for "<strong>${q}</strong>"`;
      container.appendChild(el);
      return;
    }
    res.products.forEach(p => {
      const el = document.createElement('div');
      el.className = 'suggestion-item'; el.setAttribute('data-api','1');
      el.innerHTML = `<span style="font-size:1.1rem">${p.icon}</span>
        <span style="flex:1">${p.name}</span>
        <span class="search-price">₹${p.price}</span>`;
      el.addEventListener('click', () => {
        document.getElementById('searchInput').value = p.name;
        suggestionsEl.classList.remove('visible');
        smoothScrollTo(p.category);
      });
      container.appendChild(el);
    });
  } catch(e) {
    // Fallback: search in local data
    const all = Object.values(fallbackProducts).flat();
    const matches = all.filter(p => p.name.toLowerCase().includes(q.toLowerCase())).slice(0.6);
    matches.forEach(p => {
      const el = document.createElement('div');
      el.className = 'suggestion-item'; el.setAttribute('data-api','1');
      el.innerHTML = `<span>${p.icon}</span> <span style="flex:1">${p.name}</span> <span class="search-price">₹${p.price}</span>`;
      container.appendChild(el);
    });
  }
}

function smoothScrollTo(category) {
  const catIdMap = { spices: 'spices', tea: 'tea', food: 'healthy-food', herbal: 'herbal', care: 'personal-care' };
  const id = catIdMap[category];
  if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function runSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (q) document.getElementById('searchSuggestions').classList.add('visible');
}

/* ========== LOCATION PICKER ========== */
function initLocationPicker() {
  const btn      = document.getElementById('locationBtn');
  const dropdown = document.getElementById('locationDropdown');
  const input    = document.getElementById('locationSearchInput');
  const results  = document.getElementById('locationResults');
  if (!btn) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dropdown.classList.toggle('open');
    document.getElementById('locationChevron').style.transform = open ? 'rotate(180deg)' : '';
    if (open && input) setTimeout(() => input.focus(), 100);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#locationWrap')) {
      dropdown.classList.remove('open');
      document.getElementById('locationChevron').style.transform = '';
    }
  });

  if (input) {
    let locDebounce;
    input.addEventListener('input', () => {
      clearTimeout(locDebounce);
      locDebounce = setTimeout(() => fetchCities(input.value.trim(), results), 250);
    });
  }
}

async function fetchCities(q, resultsEl) {
  resultsEl.innerHTML = '';
  if (!q) return;
  try {
    const res = await API.get(`/api/location/cities?q=${encodeURIComponent(q)}`);
    if (res.cities && res.cities.length) {
      resultsEl.innerHTML = res.cities.map(c =>
        `<button class="pop-city-btn loc-result-btn" onclick="selectCity('${c}')">${c}</button>`
      ).join('');
    } else {
      resultsEl.innerHTML = '<p class="muted-text" style="padding:8px 12px;font-size:.82rem;">No cities found</p>';
    }
  } catch(e) {
    // Fallback: filter local list
    const cities = ['Mumbai','Delhi','Bengaluru','Hyderabad','Ahmedabad','Chennai','Kolkata','Surat','Pune','Jaipur','Lucknow','Indore','Bhopal','Patna','Vadodara'];
    const filtered = cities.filter(c => c.toLowerCase().startsWith(q.toLowerCase()));
    resultsEl.innerHTML = filtered.map(c => `<button class="pop-city-btn loc-result-btn" onclick="selectCity('${c}')">${c}</button>`).join('');
  }
}

function selectCity(city) {
  currentLocation = city;
  localStorage.setItem('hLocation', city);
  document.getElementById('locationCity').textContent = city;
  const dropdown = document.getElementById('locationDropdown');
  dropdown.classList.remove('open');
  document.getElementById('locationChevron').style.transform = '';
  showToast(`📍 Delivery location set to ${city}`);
}

/* ========== REVIEWS ========== */
function renderReviews() {
  const track = document.getElementById('reviewsTrack');
  if (!track) return;
  track.innerHTML = reviews.map((r, i) => `
    <article class="review-card">
      <div class="review-header">
        <div class="reviewer-avatar" style="background: linear-gradient(135deg, ${r.color}, ${r.color}aa);">${r.initials}</div>
        <div class="reviewer-info">
          <div class="reviewer-name">${r.name}</div>
          <div class="reviewer-location"><i class="fa-solid fa-location-dot" style="color:${r.color};font-size:.7rem;"></i> ${r.location}</div>
        </div>
      </div>
      <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
      <p class="review-text">${r.text}</p>
      <div class="review-product">✅ Verified Purchase: ${r.product}</div>
      <div class="review-verified"><i class="fa-solid fa-circle-check"></i> Verified Buyer</div>
    </article>`).join('');
}

function initReviewNav() {
  const track   = document.getElementById('reviewsTrack');
  const prevBtn = document.getElementById('reviewPrev');
  const nextBtn = document.getElementById('reviewNext');
  if (!track || !prevBtn || !nextBtn) return;
  nextBtn.addEventListener('click', () => track.scrollBy({ left: 320, behavior: 'smooth' }));
  prevBtn.addEventListener('click', () => track.scrollBy({ left: -320, behavior: 'smooth' }));
}

/* ========== BACK TO TOP ========== */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => { btn.classList.toggle('visible', window.scrollY > 400); }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ========== NEWSLETTER ========== */
function handleNewsletter(e) {
  e.preventDefault();
  const input = e.target.querySelector('input[type="email"]');
  const btn = e.target.querySelector('button');
  const orig = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-check"></i> Subscribed!';
  btn.style.background = '#22c55e'; btn.style.color = 'white';
  setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; btn.style.color = ''; input.value = ''; }, 3000);
}

/* ========== SCROLL ANIMATIONS ========== */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  const targets = ['.cat-card', '.value-card', '.marketplace-card', '.product-card', '.trust-item'];
  targets.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      if (el.style.opacity === '') {
        el.style.opacity = '0';
        el.style.transform = 'translateY(22px)';
        el.style.transition = `opacity 0.45s ease ${i * 0.06}s, transform 0.45s ease ${i * 0.06}s`;
        observer.observe(el);
      }
    });
  });
}
