/**
 * MEESHO CLONE - CLIENT-SIDE ENGINE (Vanilla JS)
 * Handles LocalStorage Cart, Infinite Scroll, Buy 2 Get 1 Free,
 * Live Deal Timers, Meta Pixel tracking, and UPI Redirection.
 */

// ==============================================================================
// 1. CONFIGURATION & CONSTANTS
// ==============================================================================
const CONFIG = {
  merchantName: (window.UPI_CONFIG && window.UPI_CONFIG.merchantName) || 'Messho',
  paytmUpiId: (window.UPI_CONFIG && window.UPI_CONFIG.paytmUpiId) || 'Q98220817@ybl',
  onlineDiscount: 33,
  pixelId: '1516351766999973'
};

// ==============================================================================
// 2. TOAST NOTIFICATION
// ==============================================================================
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('meeshoToast');
  const text = document.getElementById('meeshoToastText');
  if (!toast || !text) return;
  
  text.textContent = message;
  toast.style.display = 'block';
  
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.display = 'none';
  }, 2600);
}

// ==============================================================================
// 3. CART MANAGEMENT (localStorage)
// ==============================================================================
const CART_STORAGE_KEY = 'meesho_cart_v1';

function getCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {}
  updateCartBadge();
  renderCartDrawer();
  if (typeof renderCheckoutCart === 'function') {
    renderCheckoutCart();
  }
}

function updateCartBadge() {
  const badge = document.getElementById('cartCountBadge');
  if (!badge) return;
  const cart = getCart();
  const total = cart.reduce((acc, item) => acc + (parseInt(item.qty) || 1), 0);
  badge.textContent = total;
  badge.style.display = total > 0 ? 'inline-block' : 'none';
}

// Buy 2 Get 1 Free Calculation
function calculateCartTotals(cart) {
  let totalQty = 0;
  cart.forEach(p => {
    totalQty += parseInt(p.qty || 1);
  });

  const freeCount = Math.floor(totalQty / 3);

  let flat = [];
  cart.forEach(p => {
    const q = parseInt(p.qty || 1);
    for (let i = 0; i < q; i++) {
      flat.push({ ...p });
    }
  });

  flat.sort((a, b) => a.price - b.price);
  const freeUnits = flat.slice(0, freeCount);

  let calculatedTotal = 0;
  const freeMap = {};

  cart.forEach(item => {
    const freeForItem = freeUnits.filter(f => f.id === item.id).length;
    freeMap[item.id] = freeForItem;
    const paidQty = (parseInt(item.qty || 1)) - freeForItem;
    calculatedTotal += item.price * paidQty;
  });

  const onlineDiscount = CONFIG.onlineDiscount;
  const finalPayable = Math.max(0, calculatedTotal - onlineDiscount);

  return {
    totalQty,
    freeCount,
    freeMap,
    totalAmount: calculatedTotal,
    onlineDiscount,
    finalPayable
  };
}

// Add To Cart
function addToCart(product, openDrawer = true) {
  // Meta Pixel AddToCart Event
  if (window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_name: product.title,
      content_ids: [String(product.id)],
      content_type: 'product',
      value: product.price,
      currency: 'INR'
    });
  }

  const cart = getCart();
  const existing = cart.find(item => item.id == product.id);
  if (existing) {
    existing.qty = (parseInt(existing.qty) || 1) + 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  saveCart(cart);
  showToast('Added to cart! 🛍️');
  if (openDrawer) {
    openCartDrawer();
  }
}

// Direct Buy Now
function buyNow(productOrId) {
  let product = productOrId;
  if (typeof productOrId === 'number' || typeof productOrId === 'string') {
    product = allProducts.find(item => item.id == productOrId);
  }
  if (!product) {
    window.location.href = typeof productOrId === 'number' || typeof productOrId === 'string'
      ? `product.php?id=${productOrId}`
      : 'checkout.php';
    return;
  }
  const cart = getCart();
  const existing = cart.find(item => item.id == product.id);
  if (!existing) {
    cart.push({ ...product, qty: 1 });
    saveCart(cart);
  }
  
  if (window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_name: product.title,
      content_ids: [String(product.id)],
      content_type: 'product',
      value: product.price,
      currency: 'INR'
    });
  }

  window.location.href = 'checkout.php?id=' + encodeURIComponent(product.id);
}

function updateCartQty(id, newQty) {
  let cart = getCart();
  if (newQty <= 0) {
    cart = cart.filter(item => item.id != id);
  } else {
    cart = cart.map(item => item.id == id ? { ...item, qty: newQty } : item);
  }
  saveCart(cart);
}

function removeFromCart(id) {
  let cart = getCart();
  cart = cart.filter(item => item.id != id);
  saveCart(cart);
}

// ==============================================================================
// 4. CART DRAWER UI
// ==============================================================================
function openCartDrawer() {
  const drawer = document.getElementById('mySidenav');
  const overlay = document.getElementById('cartOverlay');
  if (drawer && overlay) {
    drawer.classList.add('open');
    overlay.classList.add('active');
  }
  renderCartDrawer();
}

function closeCartDrawer() {
  const drawer = document.getElementById('mySidenav');
  const overlay = document.getElementById('cartOverlay');
  if (drawer && overlay) {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
  }
}

function renderCartDrawer() {
  const body = document.getElementById('cartDrawerBody');
  const footer = document.getElementById('cartDrawerFooter');
  if (!body) return;

  const cart = getCart();
  if (cart.length === 0) {
    body.innerHTML = `
      <div class="empty-cart-view">
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 450.391 450.391" fill="#cccccc">
          <path d="M143.673 350.322c-25.969 0-47.02 21.052-47.02 47.02 0 25.969 21.052 47.02 47.02 47.02 25.969 0 47.02-21.052 47.02-47.02.001-25.968-21.051-47.02-47.02-47.02zm0 73.143c-14.427 0-26.122-11.695-26.122-26.122s11.695-26.122 26.122-26.122 26.122 11.695 26.122 26.122c.001 14.427-11.695 26.122-26.122 26.122zM342.204 350.322c-25.969 0-47.02 21.052-47.02 47.02 0 25.969 21.052 47.02 47.02 47.02s47.02-21.052 47.02-47.02c0-25.968-21.051-47.02-47.02-47.02zm0 73.143c-14.427 0-26.122-11.695-26.122-26.122s11.695-26.122 26.122-26.122 26.122 11.695 26.122 26.122c.001 14.427-11.695 26.122-26.122 26.122zM448.261 76.037a13.064 13.064 0 0 0-8.359-4.18L99.788 67.155 90.384 38.42C83.759 19.211 65.771 6.243 45.453 6.028H10.449C4.678 6.028 0 10.706 0 16.477s4.678 10.449 10.449 10.449h35.004a27.17 27.17 0 0 1 25.078 18.286l66.351 200.098-5.224 12.016a50.154 50.154 0 0 0 4.702 45.453 48.588 48.588 0 0 0 39.184 21.943h203.233c5.771 0 10.449-4.678 10.449-10.449s-4.678-10.449-10.449-10.449H175.543a26.646 26.646 0 0 1-21.943-12.539 28.733 28.733 0 0 1-2.612-25.078l4.18-9.404 219.951-22.988c24.16-2.661 44.034-20.233 49.633-43.886L449.83 84.917a8.882 8.882 0 0 0-1.569-8.88zm-43.885 109.191c-3.392 15.226-16.319 26.457-31.869 27.69l-217.339 22.465-48.588-147.33 320.261 4.702-22.465 92.473z"/>
        </svg>
        <p class="empty-cart-text">Your cart is feeling lonely</p>
        <button type="button" class="start-shopping-btn" onclick="closeCartDrawer()">Start shopping</button>
      </div>
    `;
    if (footer) footer.style.display = 'none';
    return;
  }

  const { totalAmount, freeMap } = calculateCartTotals(cart);

  let html = '';
  cart.forEach(item => {
    const formattedQty = item.qty < 10 ? `0${item.qty}` : item.qty;
    const freeQty = freeMap[item.id] || 0;

    html += `
      <div class="cart-product">
        <div class="cart-product-img">
          <img src="${item.image}" alt="${escapeHtml(item.title)}">
        </div>
        <div class="cart-product-details">
          <div class="cart-product-title">
            <p>${escapeHtml(item.title)}</p>
            <button type="button" class="remove-cart-item-btn" onclick="removeFromCart('${item.id}')" title="Remove">
              <img src="trash-icon.png" alt="remove" class="remove-cart-icon">
            </button>
          </div>
          <div class="cart-product-pricing">
            <p class="cart-product-price">₹${item.price}.00</p>
            <span class="cart-product-mrp">₹${item.originalPrice}.00</span>
          </div>
          <div class="cart-product-description">
            <p class="cart-product-color">Qty : ${formattedQty}</p>
            <div class="cart-qty-wrapper">
              <span class="minus" onclick="updateCartQty('${item.id}', ${item.qty - 1})">-</span>
              <span class="num">${formattedQty}</span>
              <span class="plus" onclick="updateCartQty('${item.id}', ${item.qty + 1})">+</span>
            </div>
          </div>
          ${freeQty > 0 ? `
            <div class="cart-free-message">
              Offer: Buy 2 Get 1 Free 🎁 <br>
              You got <strong style="color: #ff0000">${freeQty}</strong> item(s) free!
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });

  body.innerHTML = html;
  if (footer) {
    footer.style.display = 'block';
    const amountEls = footer.querySelectorAll('.drawerCartTotalAmount');
    amountEls.forEach(el => el.textContent = `₹${totalAmount.toFixed(2)}`);
  }
}

// ==============================================================================
// 5. SIDE MENU HAMBURGER
// ==============================================================================
function openSideMenu() {
  const drawer = document.getElementById('sideMenuDrawer');
  const overlay = document.getElementById('sideMenuOverlay');
  if (drawer && overlay) {
    drawer.style.display = 'block';
    overlay.style.display = 'block';
  }
}

function closeSideMenu() {
  const drawer = document.getElementById('sideMenuDrawer');
  const overlay = document.getElementById('sideMenuOverlay');
  if (drawer && overlay) {
    drawer.style.display = 'none';
    overlay.style.display = 'none';
  }
}

// ==============================================================================
// 6. LIVE COUNTDOWN TIMER (Syncs all clock badges)
// ==============================================================================
function initLiveTimer() {
  function getTimerText() {
    const now = new Date();
    // End of day countdown or cyclic 2h 45m
    const totalSec = 3600 * 2 + 60 * 45 + (60 - now.getSeconds());
    const h = String(Math.floor((totalSec / 3600) % 24)).padStart(2, '0');
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return `${h}h ${m}m ${s}s`;
  }

  function updateTimers() {
    const timeStr = getTimerText();
    document.querySelectorAll('.card-offer-timer-text, .offer-timer-text').forEach(el => {
      el.textContent = timeStr;
    });
  }

  updateTimers();
  setInterval(updateTimers, 1000);
}

// ==============================================================================
// 7. INFINITE SCROLL (For Home Screen)
// ==============================================================================
let allProducts = [];
let filteredProducts = [];
let currentOffset = 30;
let isLoadingProducts = false;

function initInfiniteScroll(initialCategory = '', initialQuery = '') {
  const loader = document.getElementById('productLoader');
  const grid = document.getElementById('productListGrid');
  if (!loader || !grid) return;

  function onProductsReady(data) {
    allProducts = data;
    
    // Filter if category or search query was provided
    filteredProducts = allProducts.filter(item => {
      if (initialQuery && initialQuery.trim()) {
        const q = initialQuery.toLowerCase();
        const matchesTitle = (item.title || '').toLowerCase().includes(q);
        const matchesCat = (item.category || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat) return false;
      }
      if (initialCategory && item.category !== initialCategory) {
        return false;
      }
      return true;
    });

    // Make loader clickable so user can always tap to load more
    loader.style.cursor = 'pointer';
    loader.onclick = () => {
      loadNextProductsBatch();
    };

    // Setup IntersectionObserver
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !isLoadingProducts && currentOffset < filteredProducts.length) {
          loadNextProductsBatch();
        }
      }, { rootMargin: '400px' });

      observer.observe(loader);
    }

    // Scroll event fallback
    window.addEventListener('scroll', () => {
      const scrollPos = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 500;
      if (scrollPos >= threshold && !isLoadingProducts && currentOffset < filteredProducts.length) {
        loadNextProductsBatch();
      }
    }, { passive: true });

    // Initial check: if loader is visible immediately, load next batch
    setTimeout(() => {
      if (loader && loader.getBoundingClientRect().top < window.innerHeight + 300) {
        loadNextProductsBatch();
      }
    }, 100);
  }

  // 1. Instant load from embedded server products JSON (zero network delay)
  const embeddedDataEl = document.getElementById('embeddedProductsData');
  if (embeddedDataEl && embeddedDataEl.textContent.trim()) {
    try {
      const parsedData = JSON.parse(embeddedDataEl.textContent);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        onProductsReady(parsedData);
        return;
      }
    } catch (e) {
      console.warn('Embedded products JSON parse failed, falling back to fetch', e);
    }
  }

  // 2. Fallback fetch from data/products.json or products.json
  fetch('data/products.json')
    .then(res => res.ok ? res : fetch('products.json'))
    .then(res => res.json())
    .then(data => {
      onProductsReady(data);
    })
    .catch(err => {
      console.error('Error loading products.json:', err);
      if (loader) {
        loader.innerHTML = `
          <div style="text-align: center; padding: 18px 0; color: #8b8ba3; font-size: 13px;">
            <p style="margin-bottom: 8px;">Could not load more items</p>
            <button onclick="window.location.reload()" style="background: #9f2089; color: #fff; border: none; padding: 6px 14px; border-radius: 4px; font-weight: 600; cursor: pointer;">
              Tap to Retry
            </button>
          </div>
        `;
      }
    });
}

function loadNextProductsBatch() {
  if (isLoadingProducts || currentOffset >= filteredProducts.length) return;
  isLoadingProducts = true;

  const loader = document.getElementById('productLoader');
  const countSpan = document.getElementById('loaderCountText');
  const grid = document.getElementById('productListGrid');

  const nextBatch = filteredProducts.slice(currentOffset, currentOffset + 30);
  currentOffset += nextBatch.length;

  // Render cards
  nextBatch.forEach(product => {
    const card = createProductCardElement(product);
    grid.appendChild(card);
  });

  if (countSpan) {
    countSpan.textContent = `Loading more products (${currentOffset} of ${filteredProducts.length})...`;
  }

  // Refresh live timer for newly added cards
  initLiveTimer();

  setTimeout(() => {
    isLoadingProducts = false;
    if (currentOffset >= filteredProducts.length && loader) {
      loader.innerHTML = `
        <div style="text-align: center; padding: 28px 0 10px; color: #8b8ba3; font-size: 12px;">
          🎉 You have viewed all ${filteredProducts.length} products!
        </div>
      `;
    }
  }, 150);
}

function createProductCardElement(product) {
  const div = document.createElement('div');
  div.className = 'product-card';
  div.setAttribute('data-id', product.id);
  div.onclick = () => {
    window.location.href = `product.php?id=${product.id}`;
  };

  div.innerHTML = `
    <div class="product-img">
      <img src="${product.image}" alt="${escapeHtml(product.title)}" loading="lazy">
      <div class="hot-sell-badge">Hot Sell</div>
    </div>
    <div class="product-details">
      <h3 class="product-name" title="${escapeHtml(product.title)}">
        ${escapeHtml(product.title)}
      </h3>
      <div class="product-price">
        <span class="sell-price">₹${product.price}.00</span>
        <span class="mrp-price line-through">₹${product.originalPrice}.00</span>
        <span class="off-percentage m-0">${product.discount}</span>
      </div>
      <div class="card-offer-wrapper">
        <img alt="Offer clock icon" loading="lazy" width="14" height="14" src="clock-icon.png" class="card-clock-icon">
        <span class="card-offer-timer-text">02h 45m 12s</span>
      </div>
      <button type="button" class="buynow-button product-page-buy buy_now" onclick="event.stopPropagation(); buyNow(${escapeJsonAttr(product)})">
        <svg width="18" height="18" fill="#ffffff" xmlns="http://www.w3.org/2000/svg" style="margin-right: 6px;">
          <path d="M1.894 4.546v11.796a.5.5 0 0 0 .837.369l6.74-6.18a.5.5 0 0 0-.017-.752l-6.74-5.617a.5.5 0 0 0-.82.384ZM11.894 4.546v11.796a.5.5 0 0 0 .837.369l6.74-6.18a.5.5 0 0 0-.017-.752l-6.74-5.617a.5.5 0 0 0-.82.384Z" fill="#fff" />
        </svg>
        Buy Now
      </button>
      <div class="card-ratings-row">
        <div class="rating-section">
          <span class="rating-pill">
            <span class="rating-num">${product.rating}</span>
            <svg width="8" height="8" viewBox="0 0 20 20" fill="#ffffff" xmlns="http://www.w3.org/2000/svg" style="margin-left: 3px;">
              <path d="M19.5399 6.85L13.6199 5.5L10.5099 0.29C10.3999 0.11 10.2099 0 9.99993 0C9.78993 0 9.59993 0.11 9.48993 0.29L6.37993 5.5L0.45993 6.85C0.25993 6.9 0.0899297 7.05 0.0299297 7.25C-0.0300703 7.45 0.00992969 7.67 0.14993 7.83L4.13993 12.4L3.58993 18.44C3.56993 18.65 3.65993 18.85 3.82993 18.98C3.99993 19.1 4.21993 19.13 4.41993 19.05L9.99993 16.64L15.5799 19.03C15.6599 19.06 15.7399 19.08 15.8099 19.08C15.8099 19.08 15.8099 19.08 15.8199 19.08C16.1199 19.09 16.4199 18.82 16.4199 18.48C16.4199 18.42 16.4099 18.36 16.3899 18.31L15.8499 12.38L19.8399 7.81C19.9799 7.65 20.0199 7.43 19.9599 7.23C19.9099 7.04 19.7399 6.89 19.5399 6.85Z" fill="#ffffff" />
            </svg>
          </span>
          <span class="rating-count">(${product.reviewsCount})</span>
        </div>
        <svg width="55" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" class="meesho-trusted-svg">
          <path d="M9.901 5.496a2 2 0 0 1 2-2h41.6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-41.6a2 2 0 0 1-2-2v-9Z" fill="#FFE7FB"></path>
          <path d="M24.712 6H19.5v1.03h2.052v5.843h1.12V7.03h2.041V6ZM24.698 8.229v4.644h1.06v-2.17c0-1.09.52-1.532 1.228-1.532a.95.95 0 0 1 .353.06V8.198a.85.85 0 0 0-.363-.068c-.55 0-1.031.314-1.267.844h-.02v-.746h-.991ZM32.226 12.873V8.229h-1.07v2.67c0 .697-.481 1.188-1.09 1.188-.56 0-.884-.383-.884-1.1V8.23h-1.06v2.975c0 1.129.628 1.816 1.63 1.816.658 0 1.188-.314 1.443-.766h.05v.619h.981ZM35.25 13.02c1.1 0 1.846-.59 1.846-1.532 0-1.855-2.543-1.03-2.543-2.052 0-.304.236-.55.698-.55.422 0 .765.246.814.59l.992-.207c-.167-.706-.893-1.188-1.836-1.188-1.03 0-1.728.57-1.728 1.434 0 1.856 2.543 1.03 2.543 2.052 0 .393-.265.658-.756.658-.481 0-.874-.255-.992-.668l-.972.197c.226.795.943 1.266 1.934 1.266ZM40.083 12.97c.343 0 .638-.058.795-.136l-.118-.855a.992.992 0 0 1-.471.099c-.501 0-.747-.226-.747-.914V9.132h1.287v-.903h-1.287V6.746l-1.07.206V8.23h-.844v.903h.844v2.21c0 1.207.658 1.629 1.61 1.629ZM45.823 11.744l-.894-.265c-.206.422-.589.657-1.09.657-.746 0-1.256-.53-1.355-1.305h3.525v-.265c-.02-1.6-1.03-2.485-2.297-2.485-1.365 0-2.308 1.07-2.308 2.485 0 1.403.992 2.454 2.425 2.454.933 0 1.61-.442 1.994-1.276ZM43.73 8.906c.6 0 1.12.373 1.169 1.198h-2.406c.118-.766.56-1.198 1.237-1.198ZM46.776 10.556c0 1.463.923 2.464 2.17 2.464.619 0 1.237-.255 1.542-.854h.03v.707h.981V6h-1.07v2.828c-.246-.432-.766-.747-1.463-.747-1.247 0-2.19.992-2.19 2.475Zm1.07 0c0-.874.501-1.542 1.316-1.542.805 0 1.296.638 1.296 1.542 0 .893-.49 1.522-1.296 1.522-.795 0-1.315-.648-1.315-1.522Z" fill="#9F2089"></path>
          <path d="M16.5 3.239 9.027.059a.746.746 0 0 0-.585 0L.969 3.24a.782.782 0 0 0-.47.721v6.36c0 5.321 3.139 7.611 7.947 9.622a.746.746 0 0 0 .576 0c4.809-2.01 7.948-4.3 7.948-9.622V3.96c0-.316-.186-.6-.47-.721Z" fill="#FFE7FB"></path>
          <path d="m15.748 3.894-6.75-2.871a.673.673 0 0 0-.528 0l-6.75 2.87a.706.706 0 0 0-.424.652v5.745c0 4.806 2.835 6.874 7.178 8.69.167.07.353.07.52 0 4.343-1.816 7.178-3.884 7.178-8.69V4.545a.706.706 0 0 0-.424-.651Z" fill="#60014A"></path>
          <path d="M10.852 6.455c.804.006 1.482.28 2.04.817.565.54.843 1.185.837 1.946l-.023 3.58c-.003.426-.37.77-.824.77-.45-.003-.814-.35-.81-.777l.022-3.58a1.098 1.098 0 0 0-.367-.85 1.216 1.216 0 0 0-.885-.35 1.247 1.247 0 0 0-.921.372c-.23.227-.344.54-.347.856l-.02 3.528c-.003.432-.376.782-.833.78-.458-.004-.828-.357-.824-.79l.022-3.548c.004-.31-.11-.617-.334-.844a1.254 1.254 0 0 0-.918-.378 1.253 1.253 0 0 0-.892.34c-.24.23-.37.513-.37.845l-.022 3.576c-.004.43-.373.777-.827.774-.455-.003-.818-.353-.815-.783l.023-3.564c.003-.66.25-1.308.714-1.799.6-.632 1.34-.948 2.199-.942.82.006 1.521.285 2.082.853.578-.565 1.272-.835 2.093-.832Z" fill="#FF9D00"></path>
        </svg>
      </div>
    </div>
  `;
  return div;
}

// Helpers for escaping strings
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

function escapeJsonAttr(obj) {
  return JSON.stringify(obj).replace(/"/g, '&quot;');
}

// ==============================================================================
// 8. ON DOM READY
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // If cart is empty on first visit, initialize with sample product (matches React preview)
  const cart = getCart();
  if (cart.length === 0 && !localStorage.getItem('meesho_initialized')) {
    localStorage.setItem('meesho_initialized', 'true');
    // Fetch first product from products.json
    fetch('data/products.json')
      .then(res => res.ok ? res : fetch('products.json'))
      .then(res => res.json())
      .then(products => {
        if (products && products.length > 0) {
          saveCart([{ ...products[0], qty: 1 }]);
        }
      })
      .catch(() => {});
  } else {
    updateCartBadge();
  }

  // Start live timers
  initLiveTimer();
});
