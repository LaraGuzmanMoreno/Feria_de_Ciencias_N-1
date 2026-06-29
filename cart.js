// ──────────────────────────────────────────────
//  PoP Market · cart.js
//  Carrito compartido entre todas las páginas
//  via localStorage
// ──────────────────────────────────────────────

const WHATSAPP_NUMBER = '5493512070696';
const FREE_THRESHOLD  = 30000;
const STORAGE_KEY     = 'popmarket_cart';

// ── Estado ──
let cart = loadCart();

// ── Persistencia ──
function loadCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

// ── Utilidades ──
function formatPrice(n) {
  return '$' + n.toLocaleString('es-AR') + ' <small>ARS</small>';
}

// ── Render carrito ──
function renderCart() {
  const cartItemsEl = document.getElementById('cart-items');
  const cartEmpty   = document.getElementById('cart-empty');
  const cartFooter  = document.getElementById('cart-footer');
  const cartTotal   = document.getElementById('cart-total');
  const cartCountEl = document.getElementById('cart-count');
  const shippingBar = document.getElementById('shipping-bar');

  if (!cartItemsEl) return;

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);

  // Contador nav
  cartCountEl.textContent = totalItems;
  cartCountEl.classList.toggle('visible', totalItems > 0);

  if (cart.length === 0) {
    cartEmpty.style.display = '';
    cartFooter.style.display = 'none';
    cartItemsEl.innerHTML = '';
    cartItemsEl.appendChild(cartEmpty);
    return;
  }

  cartEmpty.style.display = 'none';
  cartFooter.style.display = '';

  cartItemsEl.innerHTML = '';
  cart.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <div class="cart-item-emoji" style="background:${item.bg}">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-char">${item.char}</div>
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" data-idx="${idx}" data-action="dec" aria-label="Quitar uno de ${item.name}">−</button>
        <span class="qty-num" aria-label="Cantidad: ${item.qty}">${item.qty}</span>
        <button class="qty-btn" data-idx="${idx}" data-action="inc" aria-label="Agregar uno más de ${item.name}">+</button>
      </div>
    `;
    cartItemsEl.appendChild(el);
  });

  cartTotal.innerHTML = formatPrice(totalPrice);

  if (totalPrice >= FREE_THRESHOLD) {
    shippingBar.innerHTML = '🎉 ¡Conseguiste <strong>envío gratis</strong>!';
  } else {
    const diff = FREE_THRESHOLD - totalPrice;
    shippingBar.innerHTML = `Te faltan <strong>${formatPrice(diff)}</strong> para envío gratis`;
  }
}

// ── Agregar producto ──
function addToCart(btn) {
  const { name, char, price, emoji, bg } = btn.dataset;
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name, char, price: parseInt(price), emoji, bg, qty: 1 });
  }
  saveCart();
  renderCart();

  // Feedback visual
  const orig = btn.textContent;
  btn.textContent = '✓';
  btn.style.background = 'var(--mint)';
  btn.style.transform = 'translate(1px,1px)';
  setTimeout(() => {
    btn.textContent = orig;
    btn.style.background = '';
    btn.style.transform = '';
  }, 900);

  openCart();
}

// ── Abrir / cerrar drawer ──
function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-overlay').classList.add('open');
  document.getElementById('cart-overlay').setAttribute('aria-hidden', 'false');
  document.getElementById('cart-close').focus();
}
function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
  document.getElementById('cart-overlay').setAttribute('aria-hidden', 'true');
  const toggle = document.getElementById('cart-toggle');
  if (toggle) toggle.focus();
}

// ── Modal confirmar pedido ──
function openModal() {
  const modalSummary = document.getElementById('modal-summary');
  const modalTotalEl = document.getElementById('modal-total');
  const orderName    = document.getElementById('order-name');
  const orderPhone   = document.getElementById('order-phone');
  const modalError   = document.getElementById('modal-error');

  modalSummary.innerHTML = '';
  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'modal-summary-item';
    div.innerHTML = `
      <span>${item.qty}× ${item.emoji} ${item.name}</span>
      <span>$${(item.price * item.qty).toLocaleString('es-AR')}</span>
    `;
    modalSummary.appendChild(div);
  });

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  modalTotalEl.textContent = '$' + total.toLocaleString('es-AR') + ' ARS';

  selectedPayment  = '';
  selectedDelivery = '';
  document.querySelectorAll('.modal-option').forEach(b => b.classList.remove('selected', 'error-border'));
  orderName.value  = '';
  orderPhone.value = '';
  orderName.classList.remove('error');
  orderPhone.classList.remove('error');
  modalError.style.display = 'none';

  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById('order-modal').classList.add('open');
  document.getElementById('modal-overlay').setAttribute('aria-hidden', 'false');
  document.getElementById('order-modal').setAttribute('aria-hidden', 'false');
  setTimeout(() => document.getElementById('modal-close').focus(), 100);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.getElementById('order-modal').classList.remove('open');
  document.getElementById('modal-overlay').setAttribute('aria-hidden', 'true');
  document.getElementById('order-modal').setAttribute('aria-hidden', 'true');
}

let selectedPayment  = '';
let selectedDelivery = '';

// ── Init (se llama al cargar cada página) ──
document.addEventListener('DOMContentLoaded', () => {

  // Render inicial
  renderCart();

  // Toggle carrito
  const toggle = document.getElementById('cart-toggle');
  if (toggle) toggle.addEventListener('click', openCart);

  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.getElementById('cart-overlay').addEventListener('click', closeCart);

  // Controles cantidad
  document.getElementById('cart-items').addEventListener('click', e => {
    const btn = e.target.closest('.qty-btn');
    if (!btn) return;
    const idx = parseInt(btn.dataset.idx);
    if (btn.dataset.action === 'inc') {
      cart[idx].qty++;
    } else {
      cart[idx].qty--;
      if (cart[idx].qty <= 0) cart.splice(idx, 1);
    }
    saveCart();
    renderCart();
  });

  // Botones agregar
  document.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      addToCart(this);
    });
  });

  // Checkout
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) return;
      closeCart();
      openModal();
    });
  }

  // Modal cerrar
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeCart(); closeModal(); }
  });

  // Opciones pago / entrega
  document.querySelectorAll('.modal-option').forEach(btn => {
    btn.addEventListener('click', function() {
      const group = this.dataset.group;
      document.querySelectorAll(`.modal-option[data-group="${group}"]`).forEach(b => {
        b.classList.remove('selected', 'error-border');
      });
      this.classList.add('selected');
      if (group === 'payment')  selectedPayment  = this.dataset.value;
      if (group === 'delivery') selectedDelivery = this.dataset.value;
    });
  });

  // Enviar por WhatsApp
  const sendBtn = document.getElementById('modal-send-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', function() {
      let valid = true;
      const modalError = document.getElementById('modal-error');
      const orderName  = document.getElementById('order-name');
      const orderPhone = document.getElementById('order-phone');

      modalError.style.display = 'none';

      if (!orderName.value.trim())  { orderName.classList.add('error');  valid = false; }
      else orderName.classList.remove('error');

      if (!orderPhone.value.trim()) { orderPhone.classList.add('error'); valid = false; }
      else orderPhone.classList.remove('error');

      if (!selectedPayment) {
        document.querySelectorAll('.modal-option[data-group="payment"]').forEach(b => b.classList.add('error-border'));
        valid = false;
      }
      if (!selectedDelivery) {
        document.querySelectorAll('.modal-option[data-group="delivery"]').forEach(b => b.classList.add('error-border'));
        valid = false;
      }

      if (!valid) { modalError.style.display = ''; return; }

      const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
      let msg = '¡Hola! Quiero hacer el siguiente pedido 🛍️\n\n';
      cart.forEach(item => {
        msg += `${item.emoji} *${item.name}* (${item.char})\n`;
        msg += `   ${item.qty} × $${item.price.toLocaleString('es-AR')} = $${(item.price * item.qty).toLocaleString('es-AR')} ARS\n\n`;
      });
      msg += `━━━━━━━━━━━━━━\n`;
      msg += `💰 *Total: $${total.toLocaleString('es-AR')} ARS*\n`;
      msg += `📦 Envío: ${total >= FREE_THRESHOLD ? 'Gratis 🎉' : selectedDelivery}\n`;
      msg += `💳 Pago: ${selectedPayment}\n`;
      msg += `━━━━━━━━━━━━━━\n\n`;
      msg += `👤 *Nombre:* ${orderName.value.trim()}\n`;
      msg += `📱 *Teléfono:* ${orderPhone.value.trim()}\n\n`;
      msg += '¡Gracias! Espero su confirmación ✨';

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

      this.querySelector('span').textContent = 'Abriendo WhatsApp... ✓';
      this.style.background = '#128C4B';
      setTimeout(() => {
        window.open(url, '_blank');
        cart = [];
        saveCart();
        renderCart();
        closeModal();
        this.querySelector('span').textContent = '📲 Enviar pedido por WhatsApp →';
        this.style.background = '';
      }, 700);
    });
  }

});
