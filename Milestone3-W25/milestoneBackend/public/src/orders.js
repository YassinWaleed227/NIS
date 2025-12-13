// orders.js - orders UI and interactions
async function loadOrders() {
    try {
        const res = await fetch('/api/v1/order/myOrders');
        if (!res.ok) {
            console.log('Could not load orders');
            $('#ordersPanel').html('<div class="no-orders-message"><h2>📦 No Orders Yet</h2><p>You haven\'t placed any orders yet. Start ordering delicious food!</p><a href="/trucks" class="btn-browse">Browse Trucks</a></div>');
            return;
        }
        const orders = await res.json();
        renderOrders(orders);
    } catch (err) {
        console.error(err);
        $('#ordersPanel').html('<p>Error loading orders.</p>');
    }
}

function renderOrders(orders) {
    const panel = $('#ordersPanel');
    panel.empty();

    if (!orders || orders.length === 0) {
        panel.html('<div class="no-orders-message"><h2>📦 No Orders Yet</h2><p>You haven\'t placed any orders yet. Start ordering delicious food!</p><a href="/trucks" class="btn-browse">Browse Trucks</a></div>');
        return;
    }

    let html = '<div class="orders-list">';

    orders.forEach((order, index) => {
        const orderDate = new Date(order.orderDate);
        const pickupDate = new Date(order.scheduledPickupTime);
        const statusClass = 'status-' + order.orderStatus;
        const displayOrderNumber = order.userOrderNumber || (index + 1);

        html += '<div class="order-card">' +
            '<div class="order-header">' +
            '<div>' +
            '<div class="order-id">Order #' + displayOrderNumber + '</div>' +
            '<div class="order-truck-name">' + capitalizeWords(escapeHtml(order.truckName)) + '</div>' +
            '</div>' +
            '<span class="order-status ' + statusClass + '">' + capitalizeWords(order.orderStatus) + '</span>' +
            '</div>' +
            '<div class="order-details">' +
            '<div class="detail-item">' +
            '<div class="detail-label">Order Date</div>' +
            '<div class="detail-value">' + orderDate.toLocaleDateString() + '</div>' +
            '</div>' +
            '<div class="detail-item">' +
            '<div class="detail-label">Pickup Time</div>' +
            '<div class="detail-value">' + pickupDate.toLocaleString() + '</div>' +
            '</div>' +
            '<div class="detail-item">' +
            '<div class="detail-label">Total Price</div>' +
            '<div class="detail-value price">$' + Number(order.totalPrice).toFixed(2) + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="order-footer">' +
            '<div class="order-date">Placed: ' + orderDate.toLocaleDateString() + '</div>' +
            '<button class="btn-view-details view-details-btn" data-order-id="' + order.orderId + '" data-order-number="' + displayOrderNumber + '">View Details</button>' +
            '</div>' +
            '</div>';
    });

    html += '</div>';
    panel.html(html);

    // Attach click handlers
    $('.view-details-btn').on('click', async function () {
        const orderId = $(this).data('order-id');
        const orderNumber = $(this).data('order-number');
        await showOrderDetails(orderId, orderNumber);
    });
}

async function showOrderDetails(orderId, orderNumber) {
    try {
        const res = await fetch('/api/v1/order/details/' + orderId);
        if (!res.ok) {
            if (window.showSuccessMessage) {
                window.showSuccessMessage('Could not load order details', true);
            } else {
                alert('Could not load order details');
            }
            return;
        }
        const orderData = await res.json();

        let html = '<div>';
        html += '<div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(212, 166, 87, 0.2);">';
        html += '<div style="font-size: 0.9em; color: #6d6d6d; margin-bottom: 10px;">Order #' + (orderNumber || orderData.orderId) + ' from ' + capitalizeWords(escapeHtml(orderData.truckName)) + '</div>';
        html += '<div style="font-size: 1.2em; font-weight: 600; color: #4a4a4a; margin-bottom: 10px;">Status: <span class="order-status status-' + orderData.status + '" style="display: inline-block;">' + capitalizeWords(orderData.status) + '</span></div>';
        html += '<div style="color: #6d6d6d; font-size: 0.95em;">Ordered: ' + new Date(orderData.orderDate).toLocaleDateString() + '</div>';
        html += '<div style="color: #6d6d6d; font-size: 0.95em;">Pickup: ' + new Date(orderData.pickupTime).toLocaleString() + '</div>';
        html += '</div>';

        // Order items
        if (orderData.items && orderData.items.length > 0) {
            html += '<div style="margin-bottom: 20px;">';
            html += '<h4 style="margin-bottom: 15px; color: #4a4a4a; font-weight: 600;">Order Items</h4>';
            orderData.items.forEach(item => {
                const lineTotal = item.price * item.quantity;
                html += '<div class="order-item">' +
                    '<div>' +
                    '<div class="order-item-name">' + escapeHtml(item.name) + '</div>';
                if (item.category) {
                    html += '<div class="order-item-qty">Category: ' + escapeHtml(item.category) + '</div>';
                }
                html += '</div>' +
                    '<div style="text-align: right;">' +
                    '<div class="order-item-qty">Qty: ' + item.quantity + '</div>' +
                    '<div class="order-item-price">$' + Number(lineTotal).toFixed(2) + '</div>' +
                    '</div>' +
                    '</div>';
            });
            html += '</div>';
        }

        // Total
        html += '<div style="background: rgba(212, 166, 87, 0.1); padding: 15px; border-radius: 8px; text-align: right;">';
        html += '<div style="font-size: 1.3em; font-weight: 700; color: #d4a657;">Total: $' + Number(orderData.totalAmount).toFixed(2) + '</div>';
        html += '</div>';

        html += '</div>';

        $('#modalBody').html(html);
        $('#detailsModal').addClass('show');
    } catch (err) {
        console.error(err);
        if (window.showSuccessMessage) {
            window.showSuccessMessage('Error loading order details', true);
        } else {
            alert('Error loading order details');
        }
    }
}

function capitalizeWords(str) {
    return str.replace(/\b\w/g, function(char) {
        return char.toUpperCase();
    });
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&"'<>]/g, function (m) { return ({'&':'&amp;','"':'&quot;',"'":"&#39;",'<':'&lt;','>':'&gt;'})[m]; });
}

// expose for other scripts
window.loadOrders = loadOrders;
