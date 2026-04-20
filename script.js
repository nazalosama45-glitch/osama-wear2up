// ============================================================
//  osama.wear — Main App Logic
// ============================================================

// ── CONFIGURATION ──────────────────────────────────────────
const CONFIG = {
  testMode: true, // Set to false when going live
  orderUrls: {
    test: 'https://osamanazal14.app.n8n.cloud/webhook-test/osama-wear-order',
    prod: 'https://osamanazal14.app.n8n.cloud/webhook/osama-wear-order'
  },
  webhookUrl: 'https://osamanazal14.app.n8n.cloud/webhook/test-osama-ocr',
  statsUrl:   'https://osamanazal14.app.n8n.cloud/webhook/osama-wear-stats',
  trackOrderUrls: {
    test: 'https://osamanazal14.app.n8n.cloud/webhook-test/osama-wear-order-track',
    prod: 'https://osamanazal14.app.n8n.cloud/webhook/osama-wear-order-track'
  },
  currency: 'JOD ',
  cliqAlias: 'osamawear', // Replace with your actual CliQ Alias
};

// ── DEFAULT DATA ────────────────────────────────────────────
const DEFAULT_ADMINS = [
  { email: 'nazalosama45@gmail.com', password: 'kaan0499', role: 'Owner' }
];

const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Premium Oversized Hoodie', category: 'Hoodies', price: 45, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop', description: 'Heavyweight premium fleece. Relaxed modern fit.', badge: 'Best Seller' },
  { id: 2, name: 'Classic Streetwear Tee', category: 'T-Shirts', price: 25, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop', description: 'Premium cotton oversized fit. Perfect for everyday wear.', badge: 'New' },
  { id: 3, name: 'Utility Cargo Pants', category: 'Bottoms', price: 55, image: 'https://images.unsplash.com/photo-1624378439575-d1ead6bbd7bd?q=80&w=800&auto=format&fit=crop', description: 'Utility-style cargo pants with multiple pockets and perfect drape.', badge: '' },
  { id: 4, name: 'Signature Logo Cap', category: 'Accessories', price: 15, image: 'https://images.unsplash.com/photo-1588850561407-ed78c281ef5f?q=80&w=800&auto=format&fit=crop', description: 'Structured 6-panel cap with minimalist embroidered logo.', badge: 'Hot' },
];

const DEFAULT_HERO = {
  badge: '✦ PREMIUM EDITION',
  title: 'OSAMA WEAR',
  desc: 'Premium Streetwear in Jordan. Elevate your everyday style with high-end minimal fashion.'
};

// ── STATE ───────────────────────────────────────────────────
let cart = [];
let products = [];
let admins = [];
let contact = {};
let hero = {};
let currentFilter = 'All';
let currentAdmin = null;
let editingProductId = null;

// ── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderProducts();
  renderContactLinks();
  renderHero();
  initEnterNavigation();
  document.getElementById('footer-year').textContent = new Date().getFullYear();
  animateStatNumber('stat-products', products.length);
});

// ── PERSISTENCE ─────────────────────────────────────────────
function loadState() {
  // FORCE CACHE CLEAR FOR PREMIUM REDESIGN
  if (!localStorage.getItem('ow_premium_v1')) {
    localStorage.removeItem('ow_products');
    localStorage.removeItem('ow_hero');
    localStorage.setItem('ow_premium_v1', 'true');
  }

  try {
    const rawProducts = JSON.parse(localStorage.getItem('ow_products'));
    products = Array.isArray(rawProducts) ? rawProducts : [...DEFAULT_PRODUCTS];
    
    const rawAdmins = JSON.parse(localStorage.getItem('ow_admins'));
    admins = Array.isArray(rawAdmins) ? rawAdmins : [...DEFAULT_ADMINS];
    
    const rawHero = JSON.parse(localStorage.getItem('ow_hero'));
    hero = (rawHero && typeof rawHero === 'object') ? rawHero : { ...DEFAULT_HERO };

    contact = JSON.parse(localStorage.getItem('ow_contact') || '{}');
    cart = JSON.parse(localStorage.getItem('ow_cart') || '[]');
  } catch (err) {
    console.warn('Error loading state from localStorage:', err);
    products = [...DEFAULT_PRODUCTS];
    admins   = [...DEFAULT_ADMINS];
    hero     = { ...DEFAULT_HERO };
  }
  updateCartBadge();
  renderFilters(currentFilter);
}

function saveHero() { localStorage.setItem('ow_hero', JSON.stringify(hero)); }

function saveProducts() { localStorage.setItem('ow_products', JSON.stringify(products)); }
function saveAdmins() { localStorage.setItem('ow_admins', JSON.stringify(admins)); }
function saveContact() { localStorage.setItem('ow_contact', JSON.stringify(contact)); }
function saveCart() { localStorage.setItem('ow_cart', JSON.stringify(cart)); }

// ── PRODUCTS ─────────────────────────────────────────────────
function getCategories() {
  return ['All', ...new Set(products.map(p => p.category))];
}

function renderProducts(filter = currentFilter) {
  currentFilter = filter;
  const grid = document.getElementById('products-grid');
  const filtered = filter === 'All' ? products : products.filter(p => p.category === filter);

  updateFilterActiveState(filter);

  // Render cards
  grid.innerHTML = '';
  if (filtered.length === 0) {
    grid.innerHTML = '<div style="text-align:center;color:var(--gray);padding:4rem;grid-column:1/-1;">No products in this category yet.</div>';
    return;
  }
  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = p.id;
    card.innerHTML = `
      ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
      <div class="product-image-wrapper">
        <img src="${p.image || 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop'}" alt="${p.name}" class="product-image-render" loading="lazy" />
      </div>
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-desc">${p.description || ''}</div>
        <div class="product-footer">
          <div class="product-price">${CONFIG.currency}${parseFloat(p.price).toFixed(2)}</div>
          <button class="btn-add" onclick="addToCart(${p.id})" aria-label="Add ${p.name} to cart" title="Add to cart">+</button>
        </div>
      </div>
      <div class="card-admin-bar">
        <button class="btn-card-edit" onclick="openProductModal(${p.id})">✏️ Edit</button>
        <button class="btn-card-delete" onclick="deleteProduct(${p.id})">🗑 Delete</button>
      </div>
    `;
    grid.appendChild(card);
  });

  document.getElementById('stat-products').textContent = products.length;
  animateStatNumber('stat-products', products.length);
}

function filterProducts(cat, btn) {
  renderProducts(cat);
}

function renderFilters(current) {
  const filterBar = document.getElementById('category-filter');
  if (!filterBar) return;
  filterBar.innerHTML = '';
  getCategories().forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn' + (cat === current ? ' active' : '');
    btn.textContent = cat;
    btn.onclick = () => filterProducts(cat, btn);
    filterBar.appendChild(btn);
  });
}

function updateFilterActiveState(current) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === current);
  });
}

// ── CART ─────────────────────────────────────────────────────
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty += 1;
    showToast(`${existing.qty}x "${product.name}" in your cart!`, 'success');
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty: 1 });
    showToast(`"${product.name}" added to cart!`, 'success');
  }
  
  saveCart();
  updateCartBadge();
  renderCartItems();

  // brief bounce on cart icon
  const cartIcon = document.querySelector('.btn-icon');
  cartIcon.style.transform = 'scale(1.2)';
  setTimeout(() => cartIcon.style.transform = '', 200);
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  updateCartBadge();
  renderCartItems();
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(productId);
  else {
    saveCart();
    updateCartBadge();
    renderCartItems();
  }
}

function getCartTotal() {
  return cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
}
function getCartCount() {
  return cart.reduce((sum, i) => sum + i.qty, 0);
}

function updateCartBadge() {
  const count = getCartCount();
  const badge = document.getElementById('cart-count');
  badge.textContent = count;
  badge.classList.toggle('visible', count > 0);
  document.getElementById('cart-count-label').textContent = `${count} item${count !== 1 ? 's' : ''}`;
  document.getElementById('cart-subtotal').textContent = `${CONFIG.currency}${getCartTotal().toFixed(2)}`;
  document.getElementById('cart-total').textContent = `${CONFIG.currency}${getCartTotal().toFixed(2)}`;
}

function renderCartItems() {
  const container = document.getElementById('cart-items');
  const empty = document.getElementById('cart-empty');

  if (cart.length === 0) {
    container.innerHTML = '';
    container.appendChild(empty);
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  // Remove old items (keep empty element)
  [...container.children].forEach(c => { if (!c.classList.contains('cart-empty')) c.remove(); });

  cart.forEach(item => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.id = `cart-item-${item.id}`;
    el.innerHTML = `
      <div class="cart-item-image"><img src="${item.image}" alt="" style="width:50px; height:50px; object-fit:cover; border-radius:4px; border:1px solid var(--border);" /></div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${CONFIG.currency}${(item.price * item.qty).toFixed(2)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)" aria-label="Decrease quantity">−</button>
        <span class="qty-value">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)" aria-label="Increase quantity">+</button>
        <button class="qty-btn" onclick="removeFromCart(${item.id})" aria-label="Remove item" style="margin-left: 6px; color: var(--danger); border-color: rgba(192,57,43,0.3);"><i class="fa fa-trash"></i></button>
      </div>
    `;
    container.appendChild(el);
  });
  updateCartBadge();
}

function openCart() {
  renderCartItems();
  document.getElementById('cart-overlay').classList.add('open');
  document.getElementById('cart-sidebar').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cart-overlay').classList.remove('open');
  document.getElementById('cart-sidebar').classList.remove('open');
  document.body.style.overflow = '';
}

// ── CHECKOUT ─────────────────────────────────────────────────
function openCheckout() {
  if (cart.length === 0) { showToast('Your cart is empty!', 'error'); return; }
  closeCart();

  // Render order summary
  const summaryItems = document.getElementById('checkout-summary-items');
  summaryItems.innerHTML = '';
  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'order-summary-row';
    row.innerHTML = `<span style="display:flex;align-items:center;gap:8px;"><img src="${item.image}" style="width:24px;height:24px;object-fit:cover;border-radius:4px;">${item.name} ×${item.qty}</span><span>${CONFIG.currency}${(item.price * item.qty).toFixed(2)}</span>`;
    summaryItems.appendChild(row);
  });
  document.getElementById('checkout-total-price').textContent = `${CONFIG.currency}${getCartTotal().toFixed(2)}`;

  // Show form, hide success
  document.getElementById('checkout-form').style.display = '';
  document.getElementById('checkout-success').style.display = 'none';
  document.querySelector('#checkout-modal .modal-header').style.display = '';

  document.getElementById('checkout-modal').classList.add('open');
  document.body.style.overflow = 'hidden';

  // Set default CliQ alias from config
  document.getElementById('cliq-alias').textContent = CONFIG.cliqAlias;
  
  // Ensure button state is correct (COD by default)
  updatePlaceOrderButton();
}
function closeCheckout() {
  document.getElementById('checkout-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function updatePaymentMethod(method) {
  // Show/Hide CliQ Box
  document.getElementById('cliq-info').style.display = (method === 'cliq') ? 'block' : 'none';
  
  // Show/Hide Card Box
  document.getElementById('card-info').style.display = (method === 'card') ? 'block' : 'none';

  if (method !== 'cliq') resetCliQFile();
  updatePlaceOrderButton();
}

function handleCliQFile(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('cliq-preview').src = e.target.result;
    document.getElementById('cliq-preview-container').style.display = 'block';
    updatePlaceOrderButton();
  };
  reader.readAsDataURL(file);
}

function resetCliQFile() {
  const input = document.getElementById('cliq-file');
  input.value = '';
  document.getElementById('cliq-preview').src = '';
  document.getElementById('cliq-preview-container').style.display = 'none';
  updatePlaceOrderButton();
}

function updatePlaceOrderButton() {
  const btn = document.getElementById('btn-place-order');
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
  const fileUploaded = document.getElementById('cliq-file').files.length > 0;

  if (paymentMethod === 'cliq' && !fileUploaded) {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.innerHTML = '<i class="fa fa-info-circle"></i>&nbsp; Upload Receipt to Continue';
  } else {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.innerHTML = '<i class="fa fa-check"></i>&nbsp; Place Order';
  }
}

function copyCliQAlias() {
  const alias = document.getElementById('cliq-alias').textContent;
  navigator.clipboard.writeText(alias).then(() => {
    showToast('CliQ Alias copied to clipboard!', 'info');
  });
}

let cliqFailCount = 0;

async function submitOrder(e) {
  e.preventDefault();
  
  if (!validateCheckoutForm()) return;
  
  const btn = document.getElementById('btn-place-order');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>&nbsp; Verifying Payment...';

  const customerName = document.getElementById('cust-name').value.trim();
  const customerEmail = document.getElementById('cust-email').value.trim();
  const customerPhone = document.getElementById('cust-phone').value.trim();
  const deliveryAddress = document.getElementById('cust-address').value.trim();
  const notes = document.getElementById('cust-notes').value.trim();
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
  const cliqFile = document.getElementById('cliq-file').files[0];

  const orderPayload = {
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    delivery_address: deliveryAddress,
    notes: notes,
    payment_method: paymentMethod,
    payment_proof: '',
    order_date: new Date().toISOString().split('T')[0],
    order_time: new Date().toLocaleTimeString(),
    items: cart.map(i => ({
      product_name: i.name,
      quantity: i.qty,
      unit_price: i.price,
      total_price: parseFloat((i.price * i.qty).toFixed(2)),
    })),
    grand_total: parseFloat(getCartTotal().toFixed(2)),
  };

  try {
    if (paymentMethod === 'cliq') {
      if (!cliqFile) throw new Error('No receipt uploaded');
      orderPayload.payment_proof = await fileToBase64(cliqFile);
    }

    if (paymentMethod !== 'card') {
      const targetWebhook = paymentMethod === 'cliq' 
        ? CONFIG.webhookUrl 
        : (CONFIG.testMode ? CONFIG.orderUrls.test : CONFIG.orderUrls.prod);

      const res = await fetch(targetWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      
      if (!res.ok) throw new Error(`Server returned ${res.status}.`);
      
      // Attempt to parse the n8n response test for failures
      const responseText = await res.text();
      let n8nResponse = {};
      try { n8nResponse = JSON.parse(responseText); } catch(e) {}
      
      const responseStr = (n8nResponse[0]?.text || n8nResponse.text || responseText || '').toLowerCase();
      const isFailedStatus = n8nResponse.status === 'failed';
      
      if (paymentMethod === 'cliq' && (isFailedStatus || responseStr.includes('failed'))) {
        cliqFailCount++;
        let errorMsg = "Payment validation failed. We could not verify the receipt.";
        
        if (cliqFailCount >= 2) {
          errorMsg += " Still having trouble? Please email us at support@osamawear.com to manually confirm your order.";
        }
        
        resetCliQFile(); // Remove the "putted" picture
        showToast(errorMsg, 'error');
        return; // Stop the process, do not complete checkout!
      }
      
      if (n8nResponse.checkout_url) {
        window.location.href = n8nResponse.checkout_url;
        return;
      }
    }
    
    // Success flow
    cliqFailCount = 0; // Reset on success
    cart = [];
    saveCart();
    updateCartBadge();
    document.getElementById('checkout-form').style.display = 'none';
    document.querySelector('#checkout-modal .modal-header').style.display = 'none';
    document.getElementById('checkout-success').style.display = 'block';
    
    document.getElementById('cc-number').value = '';
    document.getElementById('cc-expiry').value = '';
    document.getElementById('cc-cvc').value = '';
    document.getElementById('cust-email').value = '';
    
  } catch (err) {
    showToast('Could not process order. Connection error.', 'error');
  } finally {
    btn.disabled = false;
    updatePlaceOrderButton();
  }
}

// ── CARD HELPERS ─────────────────────────────────────────────
function formatCC(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length > 16) v = v.substring(0, 16);
  input.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
  updateCCBrand(v);
}
function updateCCBrand(v) {
  const icon = document.getElementById('cc-brand-icon');
  if (v.startsWith('4')) {
    icon.innerHTML = '<i class="fa-brands fa-cc-visa" style="color:#1a1aff"></i>';
  } else if (v.startsWith('5')) {
    icon.innerHTML = '<i class="fa-brands fa-cc-mastercard" style="color:#eb001b"></i>';
  } else {
    icon.innerHTML = '<i class="fa fa-credit-card"></i>';
  }
}
function formatExpiry(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length > 4) v = v.substring(0, 4);
  if (v.length > 2) input.value = v.substring(0, 2) + ' / ' + v.substring(2);
  else input.value = v;
}
function formatCVC(input) {
  input.value = input.value.replace(/\D/g, '');
}

// ── UTILS ──────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]); // Only get the base64 data
    reader.onerror = error => reject(error);
  });
}

/**
 * Navigation: Enter key moves focus to the next field
 */
function initEnterNavigation() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const active = document.activeElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);
      
      if (isInput) {
        // If it's a textarea, allow shift+enter for new lines
        if (active.tagName === 'TEXTAREA' && e.shiftKey) return;
        
        // Don't move if it's a button or submit type (let them trigger naturally)
        if (active.type === 'submit' || active.type === 'button') return;

        const form = active.form;
        if (!form) return;

        e.preventDefault();

        // Find all focusable elements in the form
        const elements = Array.from(form.elements).filter(el => {
          const isVisible = el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
          return !el.disabled && 
                 el.type !== 'hidden' && 
                 isVisible &&
                 !el.readOnly;
        });

        const currentIndex = elements.indexOf(active);
        
        if (currentIndex > -1 && currentIndex < elements.length - 1) {
          // Move to next field
          const nextElement = elements[currentIndex + 1];
          nextElement.focus();
          if (nextElement.select) nextElement.select(); // Select text if possible
        } else {
          // Last field, attempt to submit the form
          const submitBtn = form.querySelector('[type="submit"]') || form.querySelector('.btn-gold, .btn-primary');
          if (submitBtn) {
            submitBtn.click();
          } else {
            form.requestSubmit();
          }
        }
      }
    }
  });
}

// ── ADMIN AUTH ───────────────────────────────────────────────
function openAdminLogin() {
  if (currentAdmin) {
    openAdminPanel();
    return;
  }
  document.getElementById('admin-login-modal').classList.add('open');
  document.getElementById('admin-email').value = '';
  document.getElementById('admin-pass').value = '';
  document.getElementById('admin-login-error').style.display = 'none';
}
function closeAdminLogin() {
  document.getElementById('admin-login-modal').classList.remove('open');
}

function doAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('admin-email').value.trim().toLowerCase();
  const pass = document.getElementById('admin-pass').value;
  const match = admins.find(a => a.email.toLowerCase() === email && a.password === pass);
  if (match) {
    currentAdmin = match;
    closeAdminLogin();
    openAdminPanel();
    showToast(`Welcome back, ${currentAdmin.email}!`, 'success');
  } else {
    document.getElementById('admin-login-error').style.display = 'block';
  }
}

function openAdminPanel() {
  try {
    if (!currentAdmin) throw new Error('No user logged in.');
    
    document.body.classList.add('admin-active');
    document.getElementById('admin-panel').classList.add('open');
    
    const toggle = document.getElementById('btn-admin-toggle');
    if (toggle) {
      toggle.classList.add('logged-in');
      toggle.innerHTML = '<i class="fa fa-lock-open"></i>&nbsp; Admin';
    }
    
    const welcome = document.getElementById('admin-welcome-text');
    if (welcome) welcome.textContent = `Logged in as ${currentAdmin.email} (${currentAdmin.role || 'Admin'})`;
    
    renderAdminProducts();
    renderAdminsList();
    loadContactForm();
    loadHeroForm();
    updateAdminStats();
    switchAdminTab('dashboard', document.getElementById('tab-dashboard'));
    
    console.log('Admin Panel opened successfully.');
  } catch (err) {
    console.error('Failed to open admin panel:', err);
    showToast('Critical error opening Admin Panel. Check console.', 'error');
  }
}

function adminLogout() {
  currentAdmin = null;
  document.body.classList.remove('admin-active');
  document.getElementById('admin-panel').classList.remove('open');
  document.getElementById('btn-admin-toggle').classList.remove('logged-in');
  document.getElementById('btn-admin-toggle').innerHTML = '<i class="fa fa-lock"></i>&nbsp; Admin';
  showToast('Logged out successfully.', 'info');
}

// ── ADMIN TABS ───────────────────────────────────────────────
function switchAdminTab(name, btn) {
  document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-content-${name}`).classList.add('active');
  if (btn) btn.classList.add('active');
}

// ── ADMIN STATS ──────────────────────────────────────────────
function updateAdminStats() {
  document.getElementById('stat-total-products').textContent = products.length;
  document.getElementById('stat-admin-count').textContent = admins.length;
}

async function loadDailyStats() {
  document.getElementById('stats-info-text').textContent = 'Fetching stats...';
  try {
    const res = await fetch(CONFIG.statsUrl, { method: 'POST' });
    if (!res.ok) throw new Error();
    const data = await res.json();
    document.getElementById('stat-today-orders').textContent = data.totalOrders ?? '—';
    document.getElementById('stat-today-profit').textContent = data.totalProfit != null ? `${CONFIG.currency}${data.totalProfit.toFixed(2)}` : '—';
    document.getElementById('stats-info-text').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  } catch {
    document.getElementById('stats-info-text').textContent = 'Could not reach n8n. Make sure your workflow is active.';
  }
}

// ── ADMIN PRODUCTS ───────────────────────────────────────────
function renderAdminProducts() {
  const tbody = document.getElementById('admin-products-tbody');
  tbody.innerHTML = '';
  products.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align:center;"><img src="${p.image}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;" /></td>
      <td class="td-name">${p.name}</td>
      <td><span class="td-category">${p.category}</span></td>
      <td class="td-price">${CONFIG.currency}${parseFloat(p.price).toFixed(2)}</td>
      <td style="color:var(--gray);max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.description || '—'}</td>
      <td class="td-actions">
        <button class="btn-card-edit" onclick="openProductModal(${p.id})" style="padding:6px 14px;">✏️ Edit</button>
        <button class="btn-card-delete" onclick="deleteProduct(${p.id})" style="padding:6px 14px;">🗑 Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  updateAdminStats();
}

function openProductModal(productId = null) {
  editingProductId = productId;
  const title = document.getElementById('product-modal-title');
  const sub = document.getElementById('product-modal-sub');

  if (productId) {
    const p = products.find(x => x.id === productId);
    if (!p) return;
    title.textContent = 'Edit Product';
    sub.textContent = 'Update the product details below';
    document.getElementById('product-id').value = p.id;
    document.getElementById('product-name').value = p.name;
    document.getElementById('product-category').value = p.category;
    document.getElementById('product-price').value = p.price;
    document.getElementById('product-image').value = p.image || '';
    document.getElementById('product-desc').value = p.description || '';
    document.getElementById('product-badge').value = p.badge || '';
  } else {
    title.textContent = 'Add Product';
    sub.textContent = 'Fill in the product details';
    document.getElementById('product-form').reset();
  }
  document.getElementById('product-modal').classList.add('open');
}
function closeProductModal() { document.getElementById('product-modal').classList.remove('open'); }

function saveProduct(e) {
  e.preventDefault();
  const name = document.getElementById('product-name').value.trim();
  const category = document.getElementById('product-category').value.trim();
  const price = parseFloat(document.getElementById('product-price').value);
  const image = document.getElementById('product-image').value.trim();
  const desc = document.getElementById('product-desc').value.trim();
  const badge = document.getElementById('product-badge').value.trim();

  if (editingProductId) {
    const idx = products.findIndex(p => p.id === editingProductId);
    if (idx !== -1) products[idx] = { ...products[idx], name, category, price, image, description: desc, badge };
    showToast('Product updated!', 'success');
  } else {
    const newId = Math.max(0, ...products.map(p => p.id)) + 1;
    products.push({ id: newId, name, category, price, image, description: desc, badge });
    showToast('Product added!', 'success');
  }
  saveProducts();
  closeProductModal();
  renderFilters(currentFilter);
  renderProducts();
  renderAdminProducts();
}

function deleteProduct(productId) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  products = products.filter(p => p.id !== productId);
  saveProducts();
  renderFilters(currentFilter);
  renderProducts();
  renderAdminProducts();
  showToast('Product deleted.', 'info');
}

// ── CONTACT METHODS ──────────────────────────────────────────
function loadContactForm() {
  const fields = ['instagram', 'whatsapp', 'phone', 'email', 'facebook', 'tiktok', 'website'];
  fields.forEach(f => {
    const el = document.getElementById(`contact-${f}`);
    if (el) el.value = contact[f] || '';
  });
}

function saveContactInfo() {
  const fields = ['instagram', 'whatsapp', 'phone', 'email', 'facebook', 'tiktok', 'website'];
  fields.forEach(f => {
    const el = document.getElementById(`contact-${f}`);
    if (el) contact[f] = el.value.trim();
  });
  saveContact();
  renderContactLinks();
  showToast('Contact info saved!', 'success');
}

// ── HERO MANAGEMENT ──────────────────────────────────────────
function renderHero() {
  const badge = document.getElementById('hero-badge');
  const title = document.getElementById('hero-title');
  const desc = document.getElementById('hero-desc');
  if (badge) badge.innerHTML = hero.badge || DEFAULT_HERO.badge;
  if (title) title.innerHTML = hero.title || DEFAULT_HERO.title;
  if (desc) desc.textContent = hero.desc || DEFAULT_HERO.desc;
}

function loadHeroForm() {
  document.getElementById('hero-badge-input').value = hero.badge || '';
  document.getElementById('hero-title-input').value = hero.title || '';
  document.getElementById('hero-desc-input').value = hero.desc || '';
}

function saveHeroData() {
  const badge = document.getElementById('hero-badge-input').value.trim();
  const title = document.getElementById('hero-title-input').value.trim();
  const desc = document.getElementById('hero-desc-input').value.trim();
  
  if (!title) { showToast('Title is required!', 'error'); return; }
  
  hero = { badge, title, desc };
  saveHero();
  renderHero();
  showToast('Hero section updated!', 'success');
}

function renderContactLinks() {
  const section = document.getElementById('contact-section');
  const container = document.getElementById('contact-links');
  container.innerHTML = '';

  const links = [
    {
      key: 'instagram', icon: 'fa-brands fa-instagram', label: 'Instagram', color: '#e1306c',
      href: v => `https://instagram.com/${v.replace('@', '')}`, display: v => v
    },
    {
      key: 'whatsapp', icon: 'fa-brands fa-whatsapp', label: 'WhatsApp', color: '#25d366',
      href: v => `https://wa.me/${v.replace(/\D/g, '')}`, display: v => v
    },
    {
      key: 'phone', icon: 'fa fa-phone', label: 'Call Us', color: 'var(--gold)',
      href: v => `tel:${v}`, display: v => v
    },
    {
      key: 'email', icon: 'fa fa-envelope', label: 'Email', color: 'var(--gold)',
      href: v => `mailto:${v}`, display: v => v
    },
    {
      key: 'facebook', icon: 'fa-brands fa-facebook', label: 'Facebook', color: '#1877f2',
      href: v => v, display: v => 'Facebook Page'
    },
    {
      key: 'tiktok', icon: 'fa-brands fa-tiktok', label: 'TikTok', color: 'var(--white)',
      href: v => `https://tiktok.com/@${v.replace('@', '')}`, display: v => v
    },
    {
      key: 'website', icon: 'fa fa-globe', label: 'Website', color: 'var(--gold)',
      href: v => v, display: v => 'Visit Website'
    },
  ];

  let hasAny = false;
  links.forEach(l => {
    const value = contact[l.key];
    if (!value) return;
    hasAny = true;
    const a = document.createElement('a');
    a.href = l.href(value);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.cssText = `
      display:inline-flex;align-items:center;gap:0.6rem;
      background:var(--bg-card);border:1px solid var(--border);
      color:${l.color};padding:12px 22px;border-radius:30px;
      font-family:'Inter',sans-serif;font-size:0.88rem;
      text-decoration:none;transition:all 0.3s;
    `;
    a.innerHTML = `<i class="${l.icon}"></i> ${l.display(value)}`;
    a.addEventListener('mouseenter', () => { a.style.transform = 'translateY(-2px)'; a.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'; });
    a.addEventListener('mouseleave', () => { a.style.transform = ''; a.style.boxShadow = ''; });
    container.appendChild(a);
  });

  section.style.display = hasAny ? 'block' : 'none';
}

// ── ADMINS MANAGEMENT ────────────────────────────────────────
function renderAdminsList() {
  const list = document.getElementById('admins-list');
  list.innerHTML = '';
  admins.forEach((a, idx) => {
    const div = document.createElement('div');
    div.className = 'admin-entry';
    const initial = a.email.charAt(0).toUpperCase();
    const isOwner = a.role === 'Owner';
    div.innerHTML = `
      <div class="admin-avatar">${initial}</div>
      <div class="admin-info">
        <div class="admin-email">${a.email}</div>
        <div class="admin-role">${a.role || 'Admin'}</div>
      </div>
      ${!isOwner ? `<button class="admin-remove" onclick="removeAdmin(${idx})" title="Remove admin" aria-label="Remove ${a.email}">✕</button>` : ''}
    `;
    list.appendChild(div);
  });
  updateAdminStats();
}

function addAdmin(e) {
  e.preventDefault();
  const email = document.getElementById('new-admin-email').value.trim().toLowerCase();
  const pass = document.getElementById('new-admin-pass').value;
  if (admins.find(a => a.email.toLowerCase() === email)) {
    showToast('This email is already an admin.', 'error'); return;
  }
  admins.push({ email, password: pass, role: 'Admin' });
  saveAdmins();
  renderAdminsList();
  document.getElementById('add-admin-form').reset();
  showToast(`Admin "${email}" added.`, 'success');
}

function removeAdmin(idx) {
  if (admins[idx].role === 'Owner') { showToast("Can't remove the owner.", 'error'); return; }
  if (!confirm(`Remove ${admins[idx].email} as admin?`)) return;
  if (currentAdmin.email === admins[idx].email) {
    showToast("Can't remove yourself.", 'error'); return;
  }
  admins.splice(idx, 1);
  saveAdmins();
  renderAdminsList();
  showToast('Admin removed.', 'info');
}

// ── TOAST ────────────────────────────────────────────────────
let currentToastTimeout;

function showToast(message, type = 'info') {
  const icons = { 
    success: '<i class="fa fa-circle-check" style="color:var(--success)"></i>', 
    error:   '<i class="fa fa-circle-exclamation" style="color:var(--danger)"></i>', 
    info:    '<i class="fa fa-circle-info" style="color:var(--gold)"></i>' 
  };
  
  const container = document.getElementById('toast-container');
  let toast = container.querySelector('.toast');
  
  if (toast) {
    // Update existing toast without re-triggering entrance animation
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
    toast.style.animation = ''; // Cancel any exit animation currently running
  } else {
    // Create new toast
    toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);
  }
  
  // Clear previous timeout so it doesn't close prematurely
  if (currentToastTimeout) clearTimeout(currentToastTimeout);
  
  currentToastTimeout = setTimeout(() => {
    toast.style.animation = 'toastExit 0.5s ease forwards';
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 500);
  }, 3000);
}

// ── FORM VALIDATION ──────────────────────────────────────────
function formatPhone(input) {
  let val = input.value.replace(/\D/g, ''); // strip non-numeric
  if (val.length === 0) {
    input.value = '';
    return;
  }
  
  if (val.length === 1 && val !== '0') {
    val = '07' + val;
  } else if (val.length >= 2 && !val.startsWith('07')) {
    val = '07' + val.substring(1);
  }
  
  input.value = val.substring(0, 10);
}

function validateCheckoutForm() {
  const name = document.getElementById('cust-name');
  const email = document.getElementById('cust-email');
  const phone = document.getElementById('cust-phone');
  const address = document.getElementById('cust-address');
  
  if (!name.value.trim()) { showToast('Please enter your full name.', 'error'); name.focus(); return false; }
  
  const emailVal = email.value.trim();
  if (!emailVal || !emailVal.includes('@')) { 
    showToast('Please enter a valid email address.', 'error'); 
    email.focus(); 
    return false; 
  }
  
  const phoneVal = phone.value.trim();
  if (phoneVal.length !== 10 || !phoneVal.startsWith('07')) { 
    showToast('Phone number must be exactly 10 digits starting with 07.', 'error'); 
    phone.focus(); 
    return false; 
  }
  
  if (!address.value.trim()) { showToast('Please enter your delivery address.', 'error'); address.focus(); return false; }
  
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
  if (paymentMethod === 'cliq' && document.getElementById('cliq-file').files.length === 0) {
    showToast('Please upload your CliQ transfer receipt.', 'error');
    return false;
  }
  
  if (paymentMethod === 'card') {
    const cc = document.getElementById('cc-number').value.replace(/\s/g, '');
    const exp = document.getElementById('cc-expiry').value;
    const cvc = document.getElementById('cc-cvc').value;
    if (cc.length < 13) { showToast('Please enter a valid card number.', 'error'); return false; }
    if (exp.length < 4) { showToast('Please enter a valid expiry date.', 'error'); return false; }
    if (cvc.length < 3) { showToast('Please enter your CVC code.', 'error'); return false; }
  }
  
  return true;
}

// ── HELPERS ──────────────────────────────────────────────────
function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

function animateStatNumber(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let start = 0;
  const duration = 800;
  const step = timestamp => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    el.textContent = Math.floor(progress * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

// Close modals on overlay click
document.getElementById('checkout-modal').addEventListener('click', function (e) {
  if (e.target === this) closeCheckout();
});
document.getElementById('admin-login-modal').addEventListener('click', function (e) {
  if (e.target === this) closeAdminLogin();
});
document.getElementById('product-modal').addEventListener('click', function (e) {
  if (e.target === this) closeProductModal();
});
document.getElementById('history-modal').addEventListener('click', function (e) {
  if (e.target === this) closeOrderHistory();
});

// ESC key closes open modals
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  closeCart();
  closeCheckout();
  closeAdminLogin();
  closeProductModal();
  closeOrderHistory();
});

// ── ORDER HISTORY ────────────────────────────────────────────
function openOrderHistory() {
  document.getElementById('history-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  document.getElementById('history-phone').focus();
}
function closeOrderHistory() {
  document.getElementById('history-modal').classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('history-results').style.display = 'none';
  document.getElementById('history-empty').style.display = 'none';
}

async function searchOrders() {
  const phone = document.getElementById('history-phone').value.trim();
  if (phone.length !== 10 || !phone.startsWith('07')) {
    showToast('Please enter a valid phone (07XXXXXXXX).', 'error');
    return;
  }

  const resultsDiv = document.getElementById('history-results');
  const emptyDiv = document.getElementById('history-empty');
  const loadingDiv = document.getElementById('history-loading');
  const btn = document.getElementById('btn-search-history');

  // UI States
  resultsDiv.style.display = 'none';
  emptyDiv.style.display = 'none';
  loadingDiv.style.display = 'block';
  btn.disabled = true;

  try {
    const targetUrl = CONFIG.testMode ? CONFIG.trackOrderUrls.test : CONFIG.trackOrderUrls.prod;
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });

    if (!res.ok) throw new Error('Search failed');
    let orders = await res.json();
    
    // Debug: Log results to console
    console.log('Order Search Results:', orders);

    // Ensure it's an array (n8n sometimes returns a single object)
    if (orders && !Array.isArray(orders)) {
      orders = [orders];
    }

    if (!orders || orders.length === 0) {
      emptyDiv.style.display = 'block';
    } else {
      renderOrderHistory(orders);
    }
  } catch (err) {
    console.error('Track Search Error:', err);
    showToast('Could not search for orders. Please try again.', 'error');
  } finally {
    loadingDiv.style.display = 'none';
    btn.disabled = false;
  }
}

function renderOrderHistory(orders) {
  const container = document.getElementById('history-results');
  container.innerHTML = '';
  container.style.display = 'block';

  try {
    // Sort orders by most recent first
    orders.sort((a,b) => {
      const dateA = new Date(a.order_date || a.Date || 0);
      const dateB = new Date(b.order_date || b.Date || 0);
      return dateB - dateA;
    });

    orders.forEach(order => {
      const dateStr = order.order_date || order.Date || 'N/A';
      const totalRaw = order.grand_total || order.total_price || order['Grand Total'] || order.Total;
      const total = totalRaw ? `${CONFIG.currency}${parseFloat(totalRaw).toFixed(2)}` : 'N/A';
      const status = order.status || order.Status || 'Pending';
    
    // Status color logic
    let statusColor = 'var(--gray)';
    if (status.toLowerCase().includes('delivered')) statusColor = 'var(--success)';
    if (status.toLowerCase().includes('canceled')) statusColor = 'var(--danger)';
    if (status.toLowerCase().includes('shipping')) statusColor = 'var(--gold)';

      const card = document.createElement('div');
      card.style.cssText = `
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 1.25rem;
        margin-bottom: 1rem;
        animation: fadeIn 0.4s ease forwards;
      `;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
          <div>
            <div style="font-size: 0.75rem; color: var(--gray); text-transform: uppercase; letter-spacing: 0.5px;">Date: ${dateStr}</div>
            <div style="font-weight: 600; color: var(--white); margin-top: 2px;">Total: ${total}</div>
          </div>
          <div style="background: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}40; padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase;">
            ${status}
          </div>
        </div>
        <div style="font-size: 0.85rem; color: var(--gray); line-height: 1.4;">
          ${order.items_summary || order.Items || (order.items ? order.items.map(i => `${i.product_name || i.name} x${i.quantity || i.qty}`).join(', ') : 'No items listed')}
        </div>
        ${(order.tracking_number || order['Tracking Number']) ? `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); font-size: 0.75rem; color: var(--gold);"><i class="fa fa-truck"></i> Tracking: ${order.tracking_number || order['Tracking Number']}</div>` : ''}
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Render History Error:', err);
    container.innerHTML = '<div style="text-align:center;color:var(--danger);padding:2rem;">Error displaying orders. Please check console.</div>';
  }
}
