// VIP-Luxer JavaScript İskeleti
// Amaç: Ürün listeleme, filtreleme, sepet ve temel auth etkileşimlerini yönetmek.

const PRODUCTS = [
  { id: 'p1', name: 'iPhone 14 Pro 128GB', price: 52999, category: 'new' },
  { id: 'p2', name: 'Samsung S23 256GB', price: 37999, category: 'new' },
  { id: 'p3', name: 'Xiaomi Redmi Note 12 (2.El)', price: 10999, category: 'used' },
  { id: 'p4', name: 'Type-C 67W Hızlı Şarj Adaptörü', price: 899, category: 'accessory' },
  { id: 'p5', name: 'Lightning Kablo Örgü', price: 349, category: 'accessory' }
];

const state = {
  products: [...PRODUCTS],
  cart: [],
  currentUser: null
};

const el = {
  productGrid: document.querySelector('#productGrid'),
  searchInput: document.querySelector('#searchInput'),
  categorySelect: document.querySelector('#categorySelect'),
  sortSelect: document.querySelector('#sortSelect'),
  cartCount: document.querySelector('#cartCount'),
  cartList: document.querySelector('#cartList'),
  cartTotal: document.querySelector('#cartTotal'),
  cartDrawer: document.querySelector('#cartDrawer'),
  cartToggleBtn: document.querySelector('#cartToggleBtn'),
  checkoutBtn: document.querySelector('#checkoutBtn'),
  feedbackText: document.querySelector('#feedbackText'),
  authDialog: document.querySelector('#authDialog'),
  authOpenBtn: document.querySelector('#authOpenBtn'),
  authCloseBtn: document.querySelector('#authCloseBtn'),
  authForm: document.querySelector('#authForm')
};

function formatPrice(value) {
  return new Intl.NumberFormat('tr-TR').format(value);
}

function categoryLabel(category) {
  if (category === 'new') return 'Sıfır';
  if (category === 'used') return '2.El';
  return 'Aksesuar';
}

function showFeedback(message, isError = false) {
  el.feedbackText.textContent = message;
  el.feedbackText.style.color = isError ? '#c53333' : '#0f8e4e';
}

function getVisibleProducts() {
  const query = el.searchInput.value.trim().toLowerCase();
  const selectedCategory = el.categorySelect.value;
  const sortType = el.sortSelect.value;

  let result = state.products.filter((item) => {
    const queryMatch = item.name.toLowerCase().includes(query);
    const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
    return queryMatch && categoryMatch;
  });

  if (sortType === 'priceAsc') result = result.sort((a, b) => a.price - b.price);
  if (sortType === 'priceDesc') result = result.sort((a, b) => b.price - a.price);

  return result;
}

function renderProducts() {
  const visibleProducts = getVisibleProducts();

  el.productGrid.innerHTML = visibleProducts
    .map(
      (item) => `
      <article class="product-card">
        <h4>${item.name}</h4>
        <span class="product-tag">${categoryLabel(item.category)}</span>
        <p>${formatPrice(item.price)} ₺</p>
        <button class="btn" data-add-cart="${item.id}">Sepete Ekle</button>
      </article>
    `
    )
    .join('');

  if (visibleProducts.length === 0) {
    el.productGrid.innerHTML = '<p>Aradığınız kriterde ürün bulunamadı.</p>';
  }
}

function renderCart() {
  el.cartCount.textContent = String(state.cart.length);

  if (state.cart.length === 0) {
    el.cartList.innerHTML = '<li>Sepetiniz boş.</li>';
    el.cartTotal.textContent = '0';
    return;
  }

  el.cartList.innerHTML = state.cart
    .map((item) => `<li>${item.name} - ${formatPrice(item.price)} ₺</li>`)
    .join('');

  const total = state.cart.reduce((sum, item) => sum + item.price, 0);
  el.cartTotal.textContent = formatPrice(total);
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  state.cart.push(product);
  renderCart();
  showFeedback(`${product.name} sepete eklendi.`);
}

function setupEvents() {
  el.searchInput.addEventListener('input', renderProducts);
  el.categorySelect.addEventListener('change', renderProducts);
  el.sortSelect.addEventListener('change', renderProducts);

  document.addEventListener('click', (event) => {
    const addBtn = event.target.closest('[data-add-cart]');
    if (!addBtn) return;
    addToCart(addBtn.dataset.addCart);
  });

  el.cartToggleBtn.addEventListener('click', () => {
    el.cartDrawer.classList.toggle('hidden');
  });

  el.checkoutBtn.addEventListener('click', () => {
    if (state.cart.length === 0) {
      showFeedback('Ödeme için sepetinize ürün ekleyin.', true);
      return;
    }
    state.cart = [];
    renderCart();
    showFeedback('Siparişiniz alındı. Teşekkür ederiz!');
  });

  el.authOpenBtn.addEventListener('click', () => el.authDialog.showModal());
  el.authCloseBtn.addEventListener('click', () => el.authDialog.close());

  el.authForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const action = event.submitter?.dataset.action;
    const email = document.querySelector('#emailInput').value.trim();
    const password = document.querySelector('#passwordInput').value.trim();

    if (!email || password.length < 8) {
      showFeedback('Geçerli e-posta ve minimum 8 karakter şifre girin.', true);
      return;
    }

    state.currentUser = { email };
    if (action === 'register') showFeedback(`Kayıt başarılı: ${email}`);
    if (action === 'login') showFeedback(`Giriş başarılı: ${email}`);

    el.authDialog.close();
    el.authForm.reset();
  });
}

function init() {
  renderProducts();
  renderCart();
  setupEvents();
  showFeedback('VIP-Luxer hazır: hızlı, modern ve mobil uyumlu.');
}

init();
