// server.js — Healthys Express API Server
const express  = require('express');
const session  = require('express-session');
const cors     = require('cors');
const bcrypt   = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path     = require('path');
const { db }   = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ═════════════════════════════════════════
   MIDDLEWARE
═════════════════════════════════════════ */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'assets')));

app.use(session({
  secret: 'healthys-secret-key-2024',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.use((req, res, next) => {
  if (!req.session.sessionId) req.session.sessionId = uuidv4();
  next();
});

/* ═════════════════════════════════════════
   HELPERS
═════════════════════════════════════════ */
const ok   = (res, data)            => res.json({ success: true, ...data });
const fail = (res, msg, code = 400) => res.status(code).json({ success: false, error: msg });
function requireAuth(req, res, next) {
  if (!req.session.userId) return fail(res, 'Not authenticated', 401);
  next();
}

/* ═════════════════════════════════════════
   PRODUCTS
═════════════════════════════════════════ */
app.get('/api/products', (req, res) => {
  const products = db.getProducts(req.query);
  ok(res, { products });
});

app.get('/api/products/:id', (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) return fail(res, 'Product not found', 404);
  ok(res, { product });
});

app.get('/api/search', (req, res) => {
  const products = db.searchProducts(req.query.q, 8);
  ok(res, { products });
});

/* ═════════════════════════════════════════
   CART
═════════════════════════════════════════ */
app.get('/api/cart', (req, res) => {
  const sid   = req.session.sessionId;
  const items = db.getCart(sid);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  ok(res, { items, subtotal, count: items.reduce((s, i) => s + i.quantity, 0) });
});

app.post('/api/cart', (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return fail(res, 'product_id required');
  if (!db.getProductById(product_id)) return fail(res, 'Product not found', 404);
  const count = db.addToCart(req.session.sessionId, product_id, quantity);
  ok(res, { message: 'Added to cart', count });
});

app.patch('/api/cart/:id', (req, res) => {
  db.updateCartQty(req.session.sessionId, req.params.id, req.body.quantity);
  ok(res, { message: 'Updated' });
});

app.delete('/api/cart/:id', (req, res) => {
  db.removeFromCart(req.session.sessionId, req.params.id);
  ok(res, { message: 'Removed' });
});

app.delete('/api/cart', (req, res) => {
  db.clearCart(req.session.sessionId);
  ok(res, { message: 'Cart cleared' });
});

/* ═════════════════════════════════════════
   WISHLIST
═════════════════════════════════════════ */
app.get('/api/wishlist', (req, res) => {
  const sid   = req.session.sessionId;
  const items = db.getWishlist(sid);
  ok(res, { items, count: items.length });
});

app.post('/api/wishlist', (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return fail(res, 'product_id required');
  const inWishlist = db.toggleWishlist(req.session.sessionId, product_id);
  ok(res, { inWishlist, message: inWishlist ? 'Added to wishlist' : 'Removed from wishlist' });
});

app.delete('/api/wishlist/:id', (req, res) => {
  db.removeFromWishlist(req.session.sessionId, req.params.id);
  ok(res, { message: 'Removed' });
});

/* ═════════════════════════════════════════
   USER AUTH
═════════════════════════════════════════ */
app.post('/api/user/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) return fail(res, 'Name, email and password are required');
  if (password.length < 6) return fail(res, 'Password must be at least 6 characters');
  if (db.getUserByEmail(email)) return fail(res, 'Email already registered');
  const hash = await bcrypt.hash(password, 10);
  const user = db.createUser(name, email, phone, hash);
  req.session.userId = user.id;
  req.session.userName = user.name;
  const { password: _, ...safe } = user;
  ok(res, { message: 'Registered successfully', user: safe });
});

app.post('/api/user/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, 'Email and password required');
  const user = db.getUserByEmail(email);
  if (!user) return fail(res, 'Invalid email or password', 401);
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return fail(res, 'Invalid email or password', 401);
  req.session.userId = user.id;
  req.session.userName = user.name;
  const { password: _, ...safe } = user;
  ok(res, { message: 'Logged in successfully', user: safe });
});

app.post('/api/user/logout', (req, res) => {
  req.session.destroy(() => ok(res, { message: 'Logged out' }));
});

app.get('/api/user/profile', (req, res) => {
  if (!req.session.userId) return ok(res, { user: null, loggedIn: false });
  const raw  = db.getUserById(req.session.userId);
  if (!raw) return ok(res, { user: null, loggedIn: false });
  const { password: _, ...user } = raw;
  const addresses = db.getAddresses(req.session.userId);
  const orders    = db.getOrders(req.session.userId);
  ok(res, { user, addresses, orders, loggedIn: true });
});

app.patch('/api/user/profile', requireAuth, (req, res) => {
  db.updateUser(req.session.userId, { name: req.body.name, phone: req.body.phone });
  ok(res, { message: 'Profile updated' });
});

app.patch('/api/user/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = db.getUserById(req.session.userId);
  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return fail(res, 'Current password incorrect');
  if (!newPassword || newPassword.length < 6) return fail(res, 'New password must be at least 6 characters');
  const hash = await bcrypt.hash(newPassword, 10);
  db.updateUser(req.session.userId, { password: hash });
  ok(res, { message: 'Password changed successfully' });
});

/* ═════════════════════════════════════════
   ADDRESSES
═════════════════════════════════════════ */
app.get('/api/user/addresses', requireAuth, (req, res) => {
  ok(res, { addresses: db.getAddresses(req.session.userId) });
});

app.post('/api/user/addresses', requireAuth, (req, res) => {
  const { label, name, phone, line1, line2, city, state, pincode, is_default } = req.body;
  if (!line1 || !city || !state || !pincode) return fail(res, 'Required address fields missing');
  const id = db.addAddress(req.session.userId, { label: label||'Home', name: name||'', phone: phone||'', line1, line2: line2||'', city, state, pincode, is_default: is_default ? 1 : 0 });
  ok(res, { message: 'Address added', id });
});

app.delete('/api/user/addresses/:id', requireAuth, (req, res) => {
  db.deleteAddress(req.session.userId, req.params.id);
  ok(res, { message: 'Address deleted' });
});

/* ═════════════════════════════════════════
   ORDERS
═════════════════════════════════════════ */
app.post('/api/orders', (req, res) => {
  const sid   = req.session.sessionId;
  const items = db.getCart(sid);
  if (!items.length) return fail(res, 'Cart is empty');
  const { coupon, address } = req.body;
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = coupon === 'HEALTH20' ? Math.round(subtotal * 0.2) : coupon === 'FIRST50' ? Math.round(subtotal * 0.5) : 0;
  const delivery = subtotal >= 499 ? 0 : 49;
  const total    = subtotal - discount + delivery;
  const orderId  = db.createOrder(req.session.userId, sid, items, subtotal, discount, delivery, total, coupon, address);
  db.clearCart(sid);
  ok(res, { message: 'Order placed!', orderId, total });
});

/* ═════════════════════════════════════════
   LOCATION / CITIES
═════════════════════════════════════════ */
const CITIES = ['Mumbai','Delhi','Bengaluru','Hyderabad','Ahmedabad','Chennai','Kolkata','Surat','Pune','Jaipur','Lucknow','Kanpur','Nagpur','Indore','Thane','Bhopal','Visakhapatnam','Patna','Vadodara','Ghaziabad','Ludhiana','Agra','Nashik','Faridabad','Meerut','Rajkot','Allahabad','Ranchi','Howrah','Coimbatore','Jabalpur','Gwalior','Vijayawada','Jodhpur','Madurai','Raipur','Kota','Chandigarh','Guwahati','Solapur','Mysuru','Tiruchirappalli','Bareilly','Aligarh','Tiruppur','Moradabad','Jalandhar','Bhubaneswar','Salem','Warangal','Guntur','Bhiwandi','Gorakhpur','Bikaner','Noida','Jamshedpur','Cuttack','Kochi','Dehradun','Nanded','Kolhapur','Ajmer','Jamnagar','Ujjain','Siliguri','Jhansi','Mangalore','Erode','Belgaum','Jammu','Udaipur'];

app.get('/api/location/cities', (req, res) => {
  const { q } = req.query;
  const cities = q ? CITIES.filter(c => c.toLowerCase().startsWith(q.toLowerCase())).slice(0, 8) : CITIES.slice(0, 10);
  ok(res, { cities });
});

/* ═════════════════════════════════════════
   GOOGLE LOGIN (simulated — no OAuth key required)
═════════════════════════════════════════ */
app.post('/api/auth/google', async (req, res) => {
  const { name, email, googleId, avatar } = req.body;
  if (!email || !name) return fail(res, 'Name and email required');

  let user = db.getUserByEmail(email);
  if (!user) {
    // Auto-create account for Google users (no password needed)
    user = db.createUser(name, email, '', 'GOOGLE_OAUTH_NO_PASSWORD');
    db.updateUser(user.id, { avatar: avatar || '', google_id: googleId || '' });
    user = db.getUserById(user.id);
  }
  req.session.userId   = user.id;
  req.session.userName = user.name;
  const { password: _, ...safe } = user;
  ok(res, { message: 'Google login successful', user: safe, isNewUser: !db.getUserByEmail(email) });
});

/* ═════════════════════════════════════════
   ADMIN — PRODUCT CRUD
   (Admin password checked server-side via header)
═════════════════════════════════════════ */
const ADMIN_PWD = process.env.ADMIN_PASSWORD || 'admin123';
function requireAdmin(req, res, next) {
  const pwd = req.headers['x-admin-password'] || req.body?.adminPwd;
  if (pwd !== ADMIN_PWD) return fail(res, 'Admin access denied', 403);
  next();
}

// GET all products (admin — no filter limit)
app.get('/api/admin/products', requireAdmin, (req, res) => {
  ok(res, { products: db.data.products });
});

// POST — add new product
app.post('/api/admin/products', requireAdmin, (req, res) => {
  const { name, category, weight, price, original, discount, rating, reviews, icon, color, description, tags, in_stock } = req.body;
  if (!name || !category || !price || !original) return fail(res, 'name, category, price, original are required');

  const newId = Math.max(0, ...db.data.products.map(p => p.id)) + 1;
  const product = {
    id: newId, name, category, weight: weight||'', price: Number(price),
    original: Number(original), discount: Number(discount) || Math.round((1 - price/original)*100),
    rating: Number(rating) || 4.5, reviews: Number(reviews) || 0,
    icon: icon||'🌿', color: color||'#f0fff4',
    description: description||'', tags: tags||'',
    in_stock: in_stock ? 1 : 0
  };
  db.data.products.push(product);
  const { saveData } = require('./db');
  saveData();
  ok(res, { message: 'Product added', product });
});

// PATCH — update existing product
app.patch('/api/admin/products/:id', requireAdmin, (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) return fail(res, 'Product not found', 404);
  const fields = ['name','category','weight','price','original','discount','rating','reviews','icon','color','description','tags','in_stock'];
  fields.forEach(f => { if (req.body[f] !== undefined) product[f] = req.body[f]; });
  if (req.body.price && req.body.original) {
    product.discount = Math.round((1 - Number(req.body.price) / Number(req.body.original)) * 100);
  }
  const { saveData } = require('./db');
  saveData();
  ok(res, { message: 'Product updated', product });
});

// DELETE product
app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const idx = db.data.products.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return fail(res, 'Product not found', 404);
  db.data.products.splice(idx, 1);
  const { saveData } = require('./db');
  saveData();
  ok(res, { message: 'Product deleted' });
});

/* ═════════════════════════════════════════
   SERVE PAGES
═════════════════════════════════════════ */
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

/* ═════════════════════════════════════════
   START
═════════════════════════════════════════ */
app.listen(PORT, () => {
  console.log(`\n🌿 Healthys server running at http://localhost:${PORT}`);
  console.log(`📦 Products: http://localhost:${PORT}/api/products`);
  console.log(`🛒 Cart:     http://localhost:${PORT}/api/cart`);
  console.log(`❤️  Wishlist: http://localhost:${PORT}/api/wishlist`);
  console.log(`👤 Profile:  http://localhost:${PORT}/api/user/profile`);
  console.log(`🔧 Admin:    http://localhost:${PORT}/admin.html  (password: admin123)\n`);
});

