// cart.js - cart UI and interactions
async function loadCart() {
    try {
        const res = await fetch('/api/v1/cart/view');
        if (!res.ok) {
            console.log('Could not load cart');
            $('#cartPanel').html('<div class="empty-cart-message"><h2>🛒 Your Cart is Empty</h2><p>Looks like you haven\'t added any items yet!</p><a href="/trucks" class="btn-browse">Browse Trucks</a></div>');
            return;
        }
        const items = await res.json();
        renderCart(items);
    } catch (err) {
        console.error(err);
        $('#cartPanel').html('<p>Error loading cart.</p>');
    }
}

function renderCart(items) {
    const panel = $('#cartPanel');
    panel.empty();

    if (!items || items.length === 0) {
        panel.html('<div class="empty-cart-message"><h2>🛒 Your Cart is Empty</h2><p>Looks like you haven\'t added any items yet!</p><a href="/trucks" class="btn-browse">Browse Trucks</a></div>');
        return;
    }

    let total = 0;
    let html = '<div class="cart-items">';

    items.forEach(it => {
        const lineTotal = Number(it.price) * Number(it.quantity);
        total += lineTotal;

        html += '<div class="cart-item">' +
            '<div class="cart-item-info">' +
            '<div class="cart-item-name">' + escapeHtml(it.name) + '</div>';

        if (it.description) {
            html += '<div class="cart-item-description">' + escapeHtml(it.description) + '</div>';
        }

        html += '<div class="cart-item-price">$' + Number(it.price).toFixed(2) + '</div>' +
            '</div>' +
            '<div class="cart-item-actions">' +
            '<div class="quantity-selector">' +
            '<button class="qty-minus" data-cart-id="' + it.cartId + '">−</button>' +
            '<input type="number" min="1" value="' + it.quantity + '" class="cart-update-qty" data-cart-id="' + it.cartId + '" readonly>' +
            '<button class="qty-plus" data-cart-id="' + it.cartId + '">+</button>' +
            '</div>' +
            '<span style="font-weight: 600; color: #d4a657; min-width: 80px; text-align: right;">$' + Number(lineTotal).toFixed(2) + '</span>' +
            '<button class="btn-remove remove-cart-item" data-cart-id="' + it.cartId + '">Remove</button>' +
            '</div>' +
            '</div>';
    });

    html += '</div>';

    // Add summary
    html += '<div class="cart-summary">' +
        '<div class="summary-row total"><span>Total:</span><span>$' + Number(total).toFixed(2) + '</span></div>' +
        '</div>';

    // Add checkout section
    html += '<div>' +
        '<div class="pickup-time-section">' +
        '<h3>📍 Schedule Your Pickup</h3>' +
        '<div class="form-group">' +
        '<label for="pickupTime">Select Pickup Date & Time:</label>' +
        '<input type="datetime-local" id="pickupTime" class="form-control" required>' +
        '</div>' +
        '</div>' +
        '<div class="action-buttons">' +
        '<button id="placeOrderBtn" class="btn-place-order">Place Order</button>' +
        '<button id="clearCartBtn" class="btn-clear-cart">Clear Cart</button>' +
        '</div>' +
        '</div>';

    panel.html(html);


    panel.find('.qty-plus').on('click', async function () {
        const cartId = $(this).data('cart-id');
        const input = panel.find('.cart-update-qty[data-cart-id="' + cartId + '"]');
        const newQty = parseInt(input.val()) + 1;
        await updateQuantity(cartId, newQty);
    });

    panel.find('.qty-minus').on('click', async function () {
        const cartId = $(this).data('cart-id');
        const input = panel.find('.cart-update-qty[data-cart-id="' + cartId + '"]');
        const newQty = parseInt(input.val()) - 1;
        if (newQty < 1) {
            if (window.showSuccessMessage) {
                window.showSuccessMessage('Quantity must be at least 1');
            }
            return;
        }
        await updateQuantity(cartId, newQty);
    });

    panel.find('.remove-cart-item').on('click', async function () {
        const cartId = $(this).data('cart-id');
        if (!confirm('Remove this item from cart?')) return;
        try {
            const res = await fetch('/api/v1/cart/delete/' + cartId, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to remove');
            if (window.showSuccessMessage) {
                window.showSuccessMessage(data.message || 'Item removed from cart');
            }
            loadCart();
        } catch (err) {
            if (window.showSuccessMessage) {
                window.showSuccessMessage(err.message);
            } else {
                alert(err.message);
            }
        }
    });

    $('#placeOrderBtn').on('click', async function () {
        const pickupTime = $('#pickupTime').val();
        if (!pickupTime) {
            if (window.showSuccessMessage) {
                window.showSuccessMessage('Please select a pickup time');
            } else {
                alert('Please select a pickup time');
            }
            return;
        }

        const scheduledPickupTime = new Date(pickupTime).toISOString();
        
        try {
            $(this).prop('disabled', true);
            const res = await fetch('/api/v1/order/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheduledPickupTime })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to place order');
            
            if (window.showSuccessMessage) {
                window.showSuccessMessage(data.message || 'Order placed successfully!');
            } else {
                alert(data.message || 'Order placed successfully');
            }
            setTimeout(() => {
                window.location.href = '/orders';
            }, 1500);
        } catch (err) {
            if (window.showSuccessMessage) {
                window.showSuccessMessage(err.message, true);
            } else {
                alert(err.message);
            }
        } finally {
            $('#placeOrderBtn').prop('disabled', false);
        }
    });

    $('#clearCartBtn').on('click', async function () {
        if (!confirm('Are you sure you want to clear your cart?')) {
            return;
        }
        try {
            const res = await fetch('/api/v1/cart/view');
            const cartItems = await res.json();
            for (let item of cartItems) {
                await fetch('/api/v1/cart/delete/' + item.cartId, { method: 'DELETE' });
            }
            if (window.showSuccessMessage) {
                window.showSuccessMessage('Cart cleared successfully');
            } else {
                alert('Cart cleared successfully');
            }
            loadCart();
        } catch (err) {
            if (window.showSuccessMessage) {
                window.showSuccessMessage('Error clearing cart: ' + err.message);
            } else {
                alert('Error clearing cart: ' + err.message);
            }
        }
    });
}

async function updateQuantity(cartId, qty) {
    try {
        const res = await fetch('/api/v1/cart/edit/' + cartId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: qty })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update');
        if (window.showSuccessMessage) {
            window.showSuccessMessage('Quantity updated');
        }
        loadCart();
    } catch (err) {
        if (window.showSuccessMessage) {
            window.showSuccessMessage(err.message);
        } else {
            alert(err.message);
        }
    }
}

// helper to escape html
function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"]/g, function (m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]); });
}

// expose for other scripts
window.loadCart = loadCart;
