document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  const cartList = document.getElementById('cart-items');
  const summaryEl = document.getElementById('cart-summary-content');
  const emptyState = document.getElementById('cart-empty');

  async function loadCart() {
    try {
      const data = await apiFetch('/api/cart');

      if (data.items.length === 0) {
        cartList.style.display = 'none';
        document.querySelector('.cart-summary').style.display = 'none';
        emptyState.style.display = 'block';
        return;
      }

      emptyState.style.display = 'none';
      cartList.style.display = 'flex';
      document.querySelector('.cart-summary').style.display = 'block';

      renderCartItems(data.items);
      renderSummary(data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function renderCartItems(items) {
    cartList.innerHTML = items.map((item, i) => `
      <div class="cart-item fade-in-up" style="animation-delay: ${i * 0.05}s" data-id="${item.id}">
        <img src="${item.image_url}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
          <div>
            <h3 class="cart-item-title">${item.name}</h3>
            <span class="cart-item-price">${formatPrice(item.price)} each</span>
          </div>
          <div class="cart-item-actions">
            <div class="quantity-controls">
              <button class="qty-change-btn" data-cart-id="${item.id}" data-new-qty="${item.quantity - 1}">−</button>
              <input type="number" value="${item.quantity}" readonly>
              <button class="qty-change-btn" data-cart-id="${item.id}" data-new-qty="${item.quantity + 1}">+</button>
            </div>
            <span class="cart-item-subtotal">${formatPrice(item.price * item.quantity)}</span>
            <button class="btn btn-sm btn-danger remove-item-btn" data-cart-id="${item.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              Remove
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Attach event listeners via delegation
    cartList.addEventListener('click', async (e) => {
      const qtyBtn = e.target.closest('.qty-change-btn');
      const removeBtn = e.target.closest('.remove-item-btn');

      if (qtyBtn) {
        const cartId = qtyBtn.dataset.cartId;
        const newQty = parseInt(qtyBtn.dataset.newQty);

        if (newQty < 1) {
          await removeItem(cartId);
        } else {
          await updateQty(cartId, newQty);
        }
      }

      if (removeBtn) {
        const cartId = removeBtn.dataset.cartId;
        await removeItem(cartId);
      }
    });
  }

  function renderSummary(data) {
    const shipping = data.total > 100 ? 0 : 9.99;
    const grandTotal = data.total + shipping;

    summaryEl.innerHTML = `
      <div class="summary-row">
        <span>Subtotal (${data.count} items)</span>
        <span>${formatPrice(data.total)}</span>
      </div>
      <div class="summary-row">
        <span>Shipping</span>
        <span>${shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
      </div>
      ${shipping === 0 ? '<div class="summary-row" style="color: var(--accent-success);">✓ Free shipping on orders over $100</div>' : ''}
      <div class="summary-row total">
        <span>Total</span>
        <span class="amount">${formatPrice(grandTotal)}</span>
      </div>
      <a href="/checkout.html" class="btn btn-primary btn-lg" style="width:100%; margin-top: var(--space-6);">
        Proceed to Checkout
      </a>
      <a href="/" class="btn btn-secondary" style="width:100%; margin-top: var(--space-3);">
        Continue Shopping
      </a>
    `;
  }

  async function updateQty(id, newQty) {
    try {
      await apiFetch(`/api/cart/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: newQty })
      });
      await loadCart();
      updateCartBadge();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function removeItem(id) {
    try {
      await apiFetch(`/api/cart/${id}`, { method: 'DELETE' });
      showToast('Item removed', 'info');
      await loadCart();
      updateCartBadge();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  await loadCart();
});
