// cart.js - simple cart UI and interactions
async function loadCart() {
    try {
        const res = await fetch('/api/v1/cart/view');
        if (!res.ok) {
            console.log('Could not load cart');
            $('#cartPanel').html('<p>Unable to load cart.</p>');
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
        panel.html('<p>Your Cart is empty.</p>');
        return;
    }
    let total = 0;
    const list = $('<ul class="list-group mb-2"></ul>');
    items.forEach(it => {
        const lineTotal = Number(it.price) * Number(it.quantity);
        total += lineTotal;
        const li = $(`<li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
                <strong>${escapeHtml(it.name)}</strong><br>
                <small>${escapeHtml(it.description || '')}</small>
            </div>
            <div style="min-width:140px;">
                <input type="number" min="1" value="${it.quantity}" class="form-control form-control-sm cart-update-qty" data-cart-id="${it.cartId}">
                <div class="mt-1 text-end">
                    <button class="btn btn-sm btn-danger remove-cart-item" data-cart-id="${it.cartId}">Remove</button>
                </div>
            </div>
        </li>`);
        list.append(li);
    });
    panel.append(list);
    panel.append(`<div class="text-end"><strong>Total: $${Number(total).toFixed(2)}</strong></div>`);

    // attach handlers
    panel.find('.cart-update-qty').on('change', async function () {
        const cartId = $(this).data('cart-id');
        const qty = $(this).val();
        try {
            const res = await fetch('/api/v1/cart/edit/' + cartId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: qty })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update');
            alert(data.message);
            loadCart();
        } catch (err) {
            alert(err.message);
        }
    });

    panel.find('.remove-cart-item').on('click', async function () {
        const cartId = $(this).data('cart-id');
        try {
            const res = await fetch('/api/v1/cart/delete/' + cartId, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to remove');
            alert(data.message);
            loadCart();
        } catch (err) {
            alert(err.message);
        }
    });
}

// helper to escape html
function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"]/g, function (m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]); });
}

// expose for other scripts
window.loadCart = loadCart;
