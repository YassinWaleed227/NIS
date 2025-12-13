// Load truck orders
async function loadTruckOrders() {
  try {
    const response = await fetch('/api/v1/order/truckOrders');
    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }
    
    const orders = await response.json();
    
    if (!orders || orders.length === 0) {
      $('#ordersPanel').html(`
        <div class="no-orders">
          <h2>No Orders Yet</h2>
          <p>When customers place orders, they will appear here.</p>
        </div>
      `);
      return;
    }
    
    let ordersHTML = '';
    
    orders.forEach(order => {
      const orderDate = new Date(order.orderDate);
      const pickupTime = new Date(order.scheduledPickupTime);
      const statusClass = `status-${order.orderStatus}`;
      
      ordersHTML += `
        <div class="order-card">
          <div class="order-header">
            <div class="order-id">Order #${order.orderId}</div>
            <span class="order-status-badge ${statusClass}">${capitalizeWords(order.orderStatus)}</span>
          </div>
          
          <div class="order-details">
            <div class="detail-item">
              <div class="detail-label">Customer</div>
              <div class="detail-value">${order.customerName || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Email</div>
              <div class="detail-value" style="font-size: 0.95em;">${order.email || 'N/A'}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Total</div>
              <div class="detail-value price">$${parseFloat(order.totalPrice).toFixed(2)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Ordered</div>
              <div class="detail-value" style="font-size: 0.9em;">${orderDate.toLocaleString()}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Pickup Time</div>
              <div class="detail-value" style="font-size: 0.9em;">${pickupTime.toLocaleString()}</div>
            </div>
          </div>
          
          <div class="status-control">
            <label>Update Status:</label>
            <select class="status-select order-status-${order.orderId}" data-order-id="${order.orderId}">
              <option value="">Choose status...</option>
              <option value="pending" ${order.orderStatus === 'pending' ? 'selected' : ''}>📋 Pending</option>
              <option value="preparing" ${order.orderStatus === 'preparing' ? 'selected' : ''}>👨‍🍳 Preparing</option>
              <option value="ready" ${order.orderStatus === 'ready' ? 'selected' : ''}>✅ Ready</option>
              <option value="completed" ${order.orderStatus === 'completed' ? 'selected' : ''}>🎉 Completed</option>
              <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
            </select>
            <button class="btn-update" onclick="updateOrderStatus(${order.orderId})">Update</button>
          </div>
        </div>
      `;
    });
    
    $('#ordersPanel').html(ordersHTML);
  } catch (err) {
    console.error('Error loading orders:', err);
    $('#ordersPanel').html(`
      <div class="error-message">
        <strong>Error:</strong> Could not load orders. Please try again.
      </div>
    `);
  }
}

// Update order status
async function updateOrderStatus(orderId) {
  try {
    const statusSelect = $(`.order-status-${orderId}`);
    const newStatus = statusSelect.val();
    
    if (!newStatus) {
      alert('Please select a status');
      return;
    }
    
    // Disable button during update
    const btn = statusSelect.next('.btn-update');
    btn.disabled = true;
    btn.textContent = 'Updating...';
    
    const response = await fetch(`/api/v1/order/updateStatus/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderStatus: newStatus
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update order: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // Show success message
    const card = statusSelect.closest('.order-card');
    const successMsg = $(`
      <div class="success-message">
        ✅ Order status updated to <strong>${capitalizeWords(newStatus)}</strong>!
      </div>
    `);
    
    card.prepend(successMsg);
    
    // Remove success message after 3 seconds
    setTimeout(() => {
      successMsg.fadeOut(300, function() {
        $(this).remove();
      });
    }, 3000);
    
    // Update badge
    const badge = card.find('.order-status-badge');
    badge.removeClass().addClass(`order-status-badge status-${newStatus}`);
    badge.text(capitalizeWords(newStatus));
    
    // Re-enable button
    btn.disabled = false;
    btn.textContent = 'Update';
  } catch (err) {
    console.error('Error updating order status:', err);
    alert('Failed to update order status. Please try again.');
    
    // Re-enable button
    const btn = $(`.order-status-${orderId}`).next('.btn-update');
    btn.disabled = false;
    btn.textContent = 'Update';
  }
}

// Capitalize first letter of each word
function capitalizeWords(str) {
  if (!str) return '';
  return str.replace(/\b\w/g, char => char.toUpperCase());
}
