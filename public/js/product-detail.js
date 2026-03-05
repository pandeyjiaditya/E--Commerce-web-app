document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        window.location.href = '/';
        return;
    }

    const container = document.getElementById('product-detail');
    let product = null;
    let quantity = 1;

    try {
        product = await apiFetch(`/api/products/${productId}`);
        renderProduct(product);
    } catch (err) {
        container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <h2>Product not found</h2>
        <p>${err.message}</p>
        <a href="/" class="btn btn-primary" style="margin-top:1rem;">Back to Shop</a>
      </div>
    `;
    }

    function renderProduct(p) {
        let stockClass, stockText;
        if (p.stock === 0) { stockClass = 'out-of-stock'; stockText = '✕ Out of Stock'; }
        else if (p.stock < 10) { stockClass = 'low-stock'; stockText = `⚠ Only ${p.stock} left`; }
        else { stockClass = 'in-stock'; stockText = `✓ ${p.stock} in stock`; }

        container.innerHTML = `
      <div class="product-image-main fade-in-up">
        <img src="${p.image_url}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/600x500?text=No+Image'">
      </div>
      <div class="product-info fade-in-up" style="animation-delay: 0.1s">
        <span class="category-badge">${p.category}</span>
        <h1>${p.name}</h1>
        <div class="price">${formatPrice(p.price)}</div>
        <span class="stock-badge ${stockClass}">${stockText}</span>
        <p class="description">${p.description}</p>
        ${p.stock > 0 ? `
          <div class="quantity-selector">
            <label>Quantity:</label>
            <div class="quantity-controls">
              <button id="qty-minus">−</button>
              <input type="number" id="qty-input" value="1" min="1" max="${p.stock}" readonly>
              <button id="qty-plus">+</button>
            </div>
          </div>
          <div class="add-to-cart-actions">
            <button class="btn btn-primary btn-lg" id="add-to-cart-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
              Add to Cart
            </button>
            <a href="/" class="btn btn-secondary btn-lg">Continue Shopping</a>
          </div>
        ` : `
          <div class="add-to-cart-actions">
            <button class="btn btn-primary btn-lg" disabled>Out of Stock</button>
            <a href="/" class="btn btn-secondary btn-lg">Continue Shopping</a>
          </div>
        `}
      </div>
    `;

        // Quantity controls
        const qtyInput = document.getElementById('qty-input');
        document.getElementById('qty-minus')?.addEventListener('click', () => {
            if (quantity > 1) {
                quantity--;
                qtyInput.value = quantity;
            }
        });
        document.getElementById('qty-plus')?.addEventListener('click', () => {
            if (quantity < p.stock) {
                quantity++;
                qtyInput.value = quantity;
            }
        });

        // Add to cart
        document.getElementById('add-to-cart-btn')?.addEventListener('click', async () => {
            if (!requireAuth()) return;

            const btn = document.getElementById('add-to-cart-btn');
            btn.disabled = true;
            btn.innerHTML = 'Adding...';

            try {
                await apiFetch('/api/cart', {
                    method: 'POST',
                    body: JSON.stringify({ product_id: p.id, quantity })
                });
                showToast('Added to cart!', 'success');
                updateCartBadge();
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
          Add to Cart
        `;
            }
        });
    }
});
