// db.js — Pure JS in-memory database for Healthys
// No native compilation needed. Data is kept in memory and saved to healthys-data.json

const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'healthys-data.json');

/* ═══════════════════════════════════════════
   DEFAULT SEED DATA
═══════════════════════════════════════════ */
const seedProducts = [
  // SPICES
  { id:1,  category:'spices', name:'Organic Turmeric Powder',       weight:'200g',            price:149, original:299, discount:50, rating:4.8, reviews:2341, icon:'🟡', color:'#fffbe6', description:'Pure farm-sourced turmeric, high curcumin content.',                       tags:'turmeric,haldi,organic,spice', in_stock:1 },
  { id:2,  category:'spices', name:'Premium Kashmiri Red Chili',    weight:'250g',            price:179, original:349, discount:49, rating:4.7, reviews:1876, icon:'🌶️', color:'#fff1f0', description:'Authentic Kashmiri mirch – bold color, medium heat.',                   tags:'chili,mirch,kashmiri,spice', in_stock:1 },
  { id:3,  category:'spices', name:'Pure Coriander Powder',         weight:'300g',            price:119, original:219, discount:46, rating:4.6, reviews:1423, icon:'🟢', color:'#f0fff4', description:'Stone-ground coriander with fresh aroma. FSSAI certified.',              tags:'coriander,dhania,spice,organic', in_stock:1 },
  { id:4,  category:'spices', name:'Garam Masala Special Blend',    weight:'150g',            price:199, original:389, discount:49, rating:4.9, reviews:3102, icon:'🍂', color:'#fff7ed', description:'Traditional 22-spice blend. Our most loved product.',                    tags:'garam masala,blend,spice,masala', in_stock:1 },
  { id:5,  category:'spices', name:'Black Pepper Whole',            weight:'100g',            price:229, original:399, discount:43, rating:4.8, reviews:987,  icon:'⚫', color:'#f5f5f5', description:'Kerala black pepper, full aromatic flavor.',                             tags:'black pepper,kali mirch,whole,spice', in_stock:1 },
  // TEA
  { id:6,  category:'tea',    name:'Immunity Boost Tulsi Tea',      weight:'100g (50 bags)',  price:249, original:499, discount:50, rating:4.9, reviews:4521, icon:'🫖', color:'#f0fff4', description:'7-herb blend with tulsi, ginger, clove.',                                tags:'tulsi,immunity,herbal tea,health', in_stock:1 },
  { id:7,  category:'tea',    name:'Premium Darjeeling Green Tea',  weight:'100g',            price:349, original:599, discount:42, rating:4.8, reviews:2876, icon:'🍵', color:'#f0fffe', description:'First flush Darjeeling green tea. Rich in antioxidants.',                tags:'green tea,darjeeling,antioxidant,wellness', in_stock:1 },
  { id:8,  category:'tea',    name:'Chamomile Sleep Blend Tea',     weight:'75g (30 bags)',   price:299, original:549, discount:46, rating:4.7, reviews:1654, icon:'🌼', color:'#fffef0', description:'Lavender & chamomile blend for deep, restful sleep.',                    tags:'chamomile,sleep,relax,herbal,tea', in_stock:1 },
  { id:9,  category:'tea',    name:'Ginger Lemon Detox Tea',        weight:'100g (40 bags)',  price:229, original:449, discount:49, rating:4.6, reviews:2103, icon:'🍋', color:'#ffffed', description:'Zingy ginger with real lemon peel. Great for digestion.',                tags:'ginger,lemon,detox,tea,digestive', in_stock:1 },
  { id:10, category:'tea',    name:'Ashwagandha Stress Relief Tea', weight:'80g (30 bags)',   price:349, original:599, discount:42, rating:4.8, reviews:1789, icon:'🌙', color:'#f5f0ff', description:'Adaptogenic ashwagandha + brahmi. Calms anxiety.',                       tags:'ashwagandha,stress,adaptogen,tea', in_stock:1 },
  // HEALTHY FOOD
  { id:11, category:'food',   name:'Raw Organic Honey',             weight:'500g',            price:399, original:699, discount:43, rating:4.9, reviews:5231, icon:'🍯', color:'#fffde7', description:'Unprocessed wildflower honey from the Himalayas.',                       tags:'honey,organic,raw,natural,sweetener', in_stock:1 },
  { id:12, category:'food',   name:'Almond Butter Crunchy',         weight:'300g',            price:449, original:799, discount:44, rating:4.7, reviews:3124, icon:'🥜', color:'#fdf6ec', description:'Roasted almond butter. No palm oil, no sugar added.',                   tags:'almond,butter,protein,nut,healthy', in_stock:1 },
  { id:13, category:'food',   name:'Chia Seeds Premium',            weight:'500g',            price:299, original:549, discount:46, rating:4.8, reviews:2876, icon:'⚪', color:'#f8f8f8', description:'Certified organic chia seeds. Omega-3 powerhouse.',                     tags:'chia,seeds,omega3,protein,superfood', in_stock:1 },
  { id:14, category:'food',   name:'Mixed Berry Granola',           weight:'400g',            price:349, original:599, discount:42, rating:4.6, reviews:1987, icon:'🫐', color:'#f5f0ff', description:'Oat-based granola with real dried berries. Low GI, no refined sugar.',  tags:'granola,berry,oats,breakfast,healthy', in_stock:1 },
  { id:15, category:'food',   name:'Flaxseed Powder',               weight:'400g',            price:199, original:349, discount:43, rating:4.7, reviews:2341, icon:'🌾', color:'#fdfaf0', description:'Cold-milled flaxseeds, preserving all omega-3 & lignans.',              tags:'flaxseed,omega3,fibre,powder,healthy', in_stock:1 },
  // HERBAL
  { id:16, category:'herbal', name:'Ashwagandha Root Powder',       weight:'200g',            price:349, original:699, discount:50, rating:4.9, reviews:6234, icon:'🌿', color:'#f0fff4', description:'KSM-66 standardized ashwagandha root extract.',                         tags:'ashwagandha,adaptogen,stress,stamina,herbal', in_stock:1 },
  { id:17, category:'herbal', name:'Moringa Leaf Powder',           weight:'250g',            price:299, original:549, discount:46, rating:4.8, reviews:4123, icon:'🌱', color:'#f0fff0', description:'Drumstick leaf powder with 92 nutrients.',                              tags:'moringa,superfood,nutrition,leaves,herbal', in_stock:1 },
  { id:18, category:'herbal', name:'Spirulina Superfood Powder',    weight:'150g',            price:449, original:849, discount:47, rating:4.7, reviews:2987, icon:'💚', color:'#e8fff2', description:'Lab-grown spirulina with 70% protein.',                                 tags:'spirulina,protein,algae,superfood,supplement', in_stock:1 },
  { id:19, category:'herbal', name:'Amla (Indian Gooseberry) Powder',weight:'200g',           price:249, original:449, discount:45, rating:4.8, reviews:3456, icon:'🫒', color:'#f0fdf4', description:'100x Vitamin C vs orange. Best for hair & immunity.',                  tags:'amla,gooseberry,vitamin c,hair,herbal', in_stock:1 },
  { id:20, category:'herbal', name:'Triphala Ayurvedic Powder',     weight:'150g',            price:199, original:349, discount:43, rating:4.7, reviews:2109, icon:'🍃', color:'#f4fff4', description:'Traditional 3-fruit formula. Supports digestion and detox.',            tags:'triphala,ayurveda,digestion,detox,herbal', in_stock:1 },
  // PERSONAL CARE
  { id:21, category:'care',   name:'Neem Herbal Face Wash',         weight:'150ml',           price:199, original:349, discount:43, rating:4.7, reviews:2876, icon:'🧴', color:'#f0fff4', description:'Neem + tea tree formula for oily and acne-prone skin.',                 tags:'neem,face wash,acne,skincare,herbal', in_stock:1 },
  { id:22, category:'care',   name:'Coconut Milk Shampoo',          weight:'250ml',           price:299, original:499, discount:40, rating:4.6, reviews:1987, icon:'🥥', color:'#fffef0', description:'Protein-rich coconut milk + argan oil shampoo.',                        tags:'coconut,shampoo,hair,organic,care', in_stock:1 },
  { id:23, category:'care',   name:'Natural Charcoal Soap',         weight:'100g',            price:149, original:249, discount:40, rating:4.8, reviews:3211, icon:'🖤', color:'#f5f5f5', description:'Activated charcoal + tea tree soap bar. Deep cleanses pores.',         tags:'charcoal,soap,deep cleanse,natural,care', in_stock:1 },
  { id:24, category:'care',   name:'Rose Water Face Toner',         weight:'200ml',           price:249, original:449, discount:45, rating:4.9, reviews:4102, icon:'🌹', color:'#fff0f3', description:'Pure Kannauj rose water. Alcohol-free, pH-balancing.',                  tags:'rose water,toner,skin,natural,face', in_stock:1 },
  { id:25, category:'care',   name:'Onion Hair Oil',                weight:'200ml',           price:349, original:599, discount:42, rating:4.8, reviews:5123, icon:'🧅', color:'#fffbf0', description:'Red onion extract + bhringraj oil for hair fall & regrowth.',          tags:'onion,hair oil,hair fall,growth,care', in_stock:1 }
];

/* ═══════════════════════════════════════════
   LOAD PERSISTED DATA OR USE SEED
═══════════════════════════════════════════ */
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      console.log('✅ Loaded existing data from healthys-data.json');
      return parsed;
    }
  } catch(e) {
    console.warn('⚠️  Could not load data file, using fresh seed data');
  }

  const fresh = {
    users:     [],
    products:  seedProducts,
    cart:      [],     // { id, session_id, product_id, quantity, added_at }
    wishlist:  [],     // { id, session_id, product_id, added_at }
    orders:    [],     // { id, user_id, session_id, items_json, ... }
    addresses: [],     // { id, user_id, label, name, phone, line1, line2, city, state, pincode, is_default }
    _seq: { users: 1, cart: 1, wishlist: 1, orders: 1, addresses: 1 }
  };
  saveData(fresh);
  console.log(`✅ Seeded ${seedProducts.length} products into fresh database`);
  return fresh;
}

let _data = loadData();

function saveData(d) {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(d || _data, null, 2)); } catch(e) {}
}

/* ═══════════════════════════════════════════
   DATABASE API (synchronous, like better-sqlite3)
═══════════════════════════════════════════ */
const db = {
  get data() { return _data; },

  // ── PRODUCTS ──
  getProducts({ category, q, sort, minPrice, maxPrice } = {}) {
    let list = [..._data.products];
    if (category && category !== 'all') list = list.filter(p => p.category === category);
    if (q) {
      const lq = q.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(lq) ||
        (p.tags || '').toLowerCase().includes(lq) ||
        (p.description || '').toLowerCase().includes(lq) ||
        p.category.toLowerCase().includes(lq)
      );
    }
    if (minPrice) list = list.filter(p => p.price >= Number(minPrice));
    if (maxPrice) list = list.filter(p => p.price <= Number(maxPrice));
    if (sort === 'price_asc')  list.sort((a,b) => a.price - b.price);
    else if (sort === 'price_desc') list.sort((a,b) => b.price - a.price);
    else if (sort === 'rating')     list.sort((a,b) => b.rating - a.rating);
    else if (sort === 'discount')   list.sort((a,b) => b.discount - a.discount);
    return list;
  },

  getProductById(id) { return _data.products.find(p => p.id === Number(id)) || null; },

  searchProducts(q, limit = 8) {
    if (!q || !q.trim()) return [];
    const lq = q.trim().toLowerCase();
    return _data.products.filter(p =>
      p.name.toLowerCase().includes(lq) ||
      (p.tags || '').toLowerCase().includes(lq) ||
      p.category.toLowerCase().includes(lq)
    ).slice(0, limit);
  },

  // ── CART ──
  getCart(sid) {
    const items = _data.cart.filter(c => c.session_id === sid);
    return items.map(c => {
      const p = _data.products.find(p => p.id === c.product_id) || {};
      return { cart_id: c.id, quantity: c.quantity, added_at: c.added_at, ...p };
    });
  },

  addToCart(sid, product_id, quantity = 1) {
    const pid = Number(product_id);
    const existing = _data.cart.find(c => c.session_id === sid && c.product_id === pid);
    if (existing) { existing.quantity += quantity; }
    else { _data.cart.push({ id: _data._seq.cart++, session_id: sid, product_id: pid, quantity, added_at: new Date().toISOString() }); }
    saveData();
    return _data.cart.filter(c => c.session_id === sid).reduce((s, c) => s + c.quantity, 0);
  },

  updateCartQty(sid, cartId, quantity) {
    const item = _data.cart.find(c => c.id === Number(cartId) && c.session_id === sid);
    if (!item) return;
    if (quantity < 1) { this.removeFromCart(sid, cartId); return; }
    item.quantity = quantity;
    saveData();
  },

  removeFromCart(sid, cartId) {
    _data.cart = _data.cart.filter(c => !(c.id === Number(cartId) && c.session_id === sid));
    saveData();
  },

  clearCart(sid) {
    _data.cart = _data.cart.filter(c => c.session_id !== sid);
    saveData();
  },

  cartCount(sid) { return _data.cart.filter(c => c.session_id === sid).reduce((s, c) => s + c.quantity, 0); },

  // ── WISHLIST ──
  getWishlist(sid) {
    const items = _data.wishlist.filter(w => w.session_id === sid);
    return items.map(w => {
      const p = _data.products.find(p => p.id === w.product_id) || {};
      return { wishlist_id: w.id, added_at: w.added_at, ...p };
    });
  },

  toggleWishlist(sid, product_id) {
    const pid = Number(product_id);
    const existing = _data.wishlist.find(w => w.session_id === sid && w.product_id === pid);
    if (existing) {
      _data.wishlist = _data.wishlist.filter(w => w !== existing);
      saveData();
      return false; // removed
    }
    _data.wishlist.push({ id: _data._seq.wishlist++, session_id: sid, product_id: pid, added_at: new Date().toISOString() });
    saveData();
    return true; // added
  },

  removeFromWishlist(sid, wishlistId) {
    _data.wishlist = _data.wishlist.filter(w => !(w.id === Number(wishlistId) && w.session_id === sid));
    saveData();
  },

  wishlistCount(sid) { return _data.wishlist.filter(w => w.session_id === sid).length; },

  // ── USERS ──
  getUserByEmail(email) { return _data.users.find(u => u.email === email) || null; },
  getUserById(id) { return _data.users.find(u => u.id === Number(id)) || null; },

  createUser(name, email, phone, password) {
    const user = { id: _data._seq.users++, name, email, phone: phone || '', password, avatar: '', created_at: new Date().toISOString() };
    _data.users.push(user);
    saveData();
    return user;
  },

  updateUser(id, fields) {
    const user = _data.users.find(u => u.id === Number(id));
    if (!user) return;
    Object.assign(user, fields);
    saveData();
  },

  // ── ADDRESSES ──
  getAddresses(userId) { return _data.addresses.filter(a => a.user_id === Number(userId)); },

  addAddress(userId, fields) {
    if (fields.is_default) _data.addresses.filter(a => a.user_id === Number(userId)).forEach(a => a.is_default = 0);
    const addr = { id: _data._seq.addresses++, user_id: Number(userId), ...fields };
    _data.addresses.push(addr);
    saveData();
    return addr.id;
  },

  deleteAddress(userId, addressId) {
    _data.addresses = _data.addresses.filter(a => !(a.id === Number(addressId) && a.user_id === Number(userId)));
    saveData();
  },

  // ── ORDERS ──
  getOrders(userId) { return _data.orders.filter(o => o.user_id === Number(userId)).slice(-10).reverse(); },

  createOrder(userId, sid, items, subtotal, discount, delivery, total, coupon, address) {
    const order = {
      id: _data._seq.orders++,
      user_id: userId || null,
      session_id: sid,
      items_json: JSON.stringify(items),
      subtotal, discount, delivery, total,
      status: 'confirmed',
      coupon: coupon || '',
      address_json: JSON.stringify(address || {}),
      placed_at: new Date().toISOString()
    };
    _data.orders.push(order);
    saveData();
    return order.id;
  }
};

module.exports = { db, saveData };
