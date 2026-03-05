document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    const orderSummary = document.getElementById('checkout-order-summary');
    const paypalContainer = document.getElementById('paypal-button-container');
    const addressForm = document.getElementById('shipping-address');
    let cartData = null;

    // ─── Load cart for summary ───
    async function loadCheckoutData() {
        try {
            cartData = await apiFetch('/api/cart');

            if (cartData.items.length === 0) {
                showToast('Your cart is empty', 'error');
                window.location.href = '/cart.html';
                return;
            }

            renderOrderSummary(cartData);
            loadPayPalButtons(cartData);
        } catch (err) {
            showToast(err.message, 'error');
        }
    }

    function renderOrderSummary(data) {
        const shipping = data.total > 100 ? 0 : 9.99;
        const grandTotal = data.total + shipping;

        orderSummary.innerHTML = `
      ${data.items.map(item => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: var(--space-3); font-size: 0.875rem;">
          <div style="display:flex; align-items:center; gap: var(--space-3);">
            <img src="${item.image_url}" alt="" style="width:48px; height:48px; border-radius:8px; object-fit:cover;" onerror="this.src='https://via.placeholder.com/48'">
            <div>
              <div style="font-weight:500;">${item.name}</div>
              <div style="color: var(--text-muted);">Qty: ${item.quantity}</div>
            </div>
          </div>
          <span style="font-weight:600;">${formatPrice(item.price * item.quantity)}</span>
        </div>
      `).join('')}
      <hr style="border:none; border-top:1px solid var(--border-color); margin: var(--space-4) 0;">
      <div class="summary-row">
        <span>Subtotal</span>
        <span>${formatPrice(data.total)}</span>
      </div>
      <div class="summary-row">
        <span>Shipping</span>
        <span>${shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
      </div>
      <div class="summary-row total">
        <span>Total</span>
        <span class="amount">${formatPrice(grandTotal)}</span>
      </div>
    `;
    }

    // ─── PayPal Integration ───
    function loadPayPalButtons(data) {
        const shipping = data.total > 100 ? 0 : 9.99;
        const grandTotal = (data.total + shipping).toFixed(2);

        if (typeof paypal === 'undefined') {
            paypalContainer.innerHTML = `
        <div style="text-align:center; color: var(--text-muted); padding: var(--space-6);">
          <p>PayPal is loading...</p>
          <p style="font-size: 0.75rem; margin-top: 0.5rem;">If it doesn't load, please refresh the page.</p>
        </div>
      `;
            return;
        }

        paypalContainer.innerHTML = '';

        paypal.Buttons({
            style: {
                color: 'blue',
                shape: 'rect',
                label: 'paypal',
                height: 50
            },

            createOrder: function (data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: grandTotal
                        },
                        description: 'E-Commerce Store Purchase'
                    }]
                });
            },

            onApprove: async function (data, actions) {
                try {
                    const details = await actions.order.capture();
                    const address = addressForm?.value || '';

                    // Send to our backend
                    const order = await apiFetch('/api/orders', {
                        method: 'POST',
                        body: JSON.stringify({
                            payment_id: details.id,
                            payment_status: details.status,
                            shipping_address: address
                        })
                    });

                    // Store order info for success page
                    localStorage.setItem('lastOrder', JSON.stringify(order.order));

                    // Redirect to success page
                    window.location.href = '/order-success.html';
                } catch (err) {
                    showToast('Payment processing failed: ' + err.message, 'error');
                }
            },

            onError: function (err) {
                showToast('PayPal error. Please try again.', 'error');
                console.error('PayPal error:', err);
            },

            onCancel: function () {
                showToast('Payment cancelled.', 'info');
            }
        }).render('#paypal-button-container');
    }

    await loadCheckoutData();
});
