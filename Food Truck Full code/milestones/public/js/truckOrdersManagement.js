$(document).ready(function() {
  let allOrders = [];
  let currentFilter = 'all';
  let currentOrderId = null;

  console.log('Truck orders page loaded, initializing...');

  // Load orders on page load
  loadOrders();

  // Filter tab click handlers
  $('.filter-tab').click(function() {
    $('.filter-tab').removeClass('active');
    $(this).addClass('active');
    currentFilter = $(this).data('filter');
    displayOrders();
  });

  // Check for new orders button
  $('#refreshOrdersBtn').click(function() {
    loadOrders();
  });

  // Load orders from API
  function loadOrders() {
    console.log('Loading orders...');
    let requestTimeout = setTimeout(function() {
      console.error('TIMEOUT: Orders took more than 10 seconds');
      showAlert('Orders are taking too long to load. Please refresh the page.', 'danger');
    }, 10000);

    $.ajax({
      url: '/api/v1/order/truckOrders',
      type: 'GET',
      dataType: 'json',
      xhrFields: {
        withCredentials: true
      },
      success: function(orders) {
        clearTimeout(requestTimeout);
        console.log('SUCCESS: Orders loaded:', orders);
        allOrders = orders || [];
        displayOrders();
      },
      error: function(err) {
        clearTimeout(requestTimeout);
        console.error('ERROR loading orders');
        console.error('XHR Status:', err.status);
        console.error('XHR Response:', err.responseText);
        console.error('Error:', err);
        showAlert('Error loading orders', 'danger');
        allOrders = [];
        $('#ordersPanel').html('<div class="empty-orders"><p>Failed to load orders. Please try again.</p></div>');
      }
    });
  }

  // Display orders based on current filter
  function displayOrders() {
    let filteredOrders = allOrders;

    // Apply filter
    if (currentFilter !== 'all') {
      filteredOrders = allOrders.filter(order => order.status === currentFilter);
    }

    // Sort by orderId descending (newest first)
    filteredOrders.sort((a, b) => b.orderId - a.orderId);

    if (filteredOrders.length === 0) {
      $('#ordersPanel').html(`
        <div class="empty-orders">
          <div style="font-size: 3rem; margin-bottom: 15px;">📭</div>
          <p>No orders found for this status.</p>
        </div>
      `);
      return;
    }

    let html = '';
    filteredOrders.forEach((order, index) => {
      const statusBadge = getStatusBadge(order.status);
      const total = order.totalAmount ? parseFloat(order.totalAmount).toFixed(2) : '0.00';
      const pickupTime = order.pickupTime ? new Date(order.pickupTime).toLocaleTimeString() : 'Not set';
      const customerName = order.customerName || 'Unknown';
      const displayOrderNumber = order.truckOrderNumber || (index + 1);

      html += `
        <div class="order-item" data-order-id="${order.orderId}">
          <div class="order-row">
            <div class="order-info">
              <div class="order-label">Order ID</div>
              <div class="order-value">#${displayOrderNumber}</div>
            </div>
            <div class="order-info">
              <div class="order-label">Customer</div>
              <div class="order-value">${customerName}</div>
            </div>
            <div class="order-info">
              <div class="order-label">Status</div>
              <div>${statusBadge}</div>
            </div>
            <div class="order-info">
              <div class="order-label">Total</div>
              <div class="order-value" style="color: #d4a657;">$${total}</div>
            </div>
            <div class="order-info">
              <div class="order-label">Pickup Time</div>
              <div class="order-value">${pickupTime}</div>
            </div>
          </div>

          <div class="order-controls">
            <div style="display: flex; gap: 10px; align-items: center;">
              <label style="margin: 0; font-weight: 600; color: #4a4a4a;">Update Status:</label>
              <select class="status-dropdown" data-order-id="${order.orderId}">
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
                <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>👨‍🍳 Preparing</option>
                <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>✅ Ready</option>
                <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>🎉 Completed</option>
                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
              </select>
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="btn-view-details" onclick="viewOrderDetails(${order.orderId})">👁️ Details</button>
              <button class="btn-update-status" onclick="updateOrderStatus(${order.orderId})">Update</button>
            </div>
          </div>
        </div>
      `;
    });

    $('#ordersPanel').html(html);
  }

  // Get status badge HTML
  function getStatusBadge(status) {
    const statusConfig = {
      pending: { text: '⏳ Pending', class: 'status-pending' },
      preparing: { text: '👨‍🍳 Preparing', class: 'status-preparing' },
      ready: { text: '✅ Ready', class: 'status-ready' },
      completed: { text: '🎉 Completed', class: 'status-completed' },
      cancelled: { text: '❌ Cancelled', class: 'status-cancelled' }
    };

    const config = statusConfig[status] || { text: status, class: 'status-pending' };
    return `<span class="order-status-badge ${config.class}">${config.text}</span>`;
  }

  // View order details
  window.viewOrderDetails = function(orderId) {
    const order = allOrders.find(o => o.orderId === orderId);
    if (!order) {
      showAlert('Order not found', 'danger');
      return;
    }

    // Fetch full order details with items
    $.ajax({
      url: `/api/v1/order/details/${orderId}`,
      type: 'GET',
      dataType: 'json',
      xhrFields: {
        withCredentials: true
      },
      success: function(details) {
        displayOrderDetailsModal(details, order.truckOrderNumber);
        $('#orderDetailsModal').modal('show');
      },
      error: function(err) {
        console.error('Error loading order details:', err);
        showAlert('Error loading order details', 'danger');
      }
    });
  };

  // Display order details in modal
  function displayOrderDetailsModal(order, displayOrderNumber) {
    const statusBadge = getStatusBadge(order.status);
    const total = order.totalAmount ? parseFloat(order.totalAmount).toFixed(2) : '0.00';
    const pickupTime = order.pickupTime ? new Date(order.pickupTime).toLocaleString() : 'Not set';
    const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown';
    const customerName = order.customerName || 'Unknown';

    // Build order items HTML
    let itemsHtml = '<table class="table table-sm" style="margin-top: 15px;">';
    itemsHtml += '<thead><tr><th>Item Name</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead><tbody>';

    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        const itemPrice = item.price ? parseFloat(item.price).toFixed(2) : '0.00';
        const itemSubtotal = (item.quantity * parseFloat(itemPrice)).toFixed(2);
        itemsHtml += `
          <tr>
            <td>${item.itemName || item.name}</td>
            <td>${item.quantity}</td>
            <td>$${itemPrice}</td>
            <td>$${itemSubtotal}</td>
          </tr>
        `;
      });
    } else {
      itemsHtml += '<tr><td colspan="4" style="text-align: center; color: #999;">No items found</td></tr>';
    }

    itemsHtml += '</tbody></table>';

    const html = `
      <div>
        <div style="margin-bottom: 20px;">
          <p style="margin: 10px 0;">
            <span style="font-weight: 600; color: #d4a657;">Customer:</span> ${customerName}
          </p>
          <p style="margin: 10px 0;">
            <span style="font-weight: 600; color: #d4a657;">Status:</span> ${statusBadge}
          </p>
          <p style="margin: 10px 0;">
            <span style="font-weight: 600; color: #d4a657;">Pickup Time:</span> ${pickupTime}
          </p>
          <p style="margin: 10px 0;">
            <span style="font-weight: 600; color: #d4a657;">Order Date:</span> ${createdAt}
          </p>
        </div>

        <hr style="border: 1px solid rgba(212, 166, 87, 0.2);">

        <h5 style="color: #d4a657; margin-top: 15px; font-weight: 700;">Order Items</h5>
        ${itemsHtml}

        <hr style="border: 1px solid rgba(212, 166, 87, 0.2); margin-top: 15px;">

        <div style="text-align: right; margin-top: 15px;">
          <p style="margin: 0; font-size: 1.3em; font-weight: 700; color: #d4a657;">
            Total: $${total}
          </p>
        </div>
      </div>
    `;

    $('#orderIdTitle').text(`Order #${displayOrderNumber}`);
    $('#orderDetailsBody').html(html);
  }

  // Update order status
  window.updateOrderStatus = function(orderId) {
    const dropdown = $(`.status-dropdown[data-order-id="${orderId}"]`);
    const newStatus = dropdown.val();

    $.ajax({
      url: `/api/v1/order/updateStatus/${orderId}`,
      type: 'PUT',
      dataType: 'json',
      data: JSON.stringify({ status: newStatus }),
      contentType: 'application/json',
      xhrFields: {
        withCredentials: true
      },
      success: function(response) {
        showAlert(`Order status updated to ${newStatus}`, 'success');
        loadOrders(); // Reload orders
      },
      error: function(err) {
        const errorMsg = err.responseJSON?.error || 'Error updating order status';
        showAlert(errorMsg, 'danger');
        loadOrders(); // Reload to reset dropdown
        console.error('Error:', err);
      }
    });
  };

  // Show alert
  function showAlert(message, type) {
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const alertHtml = `
      <div class="alert ${alertClass} alert-dismissible fade in" role="alert" style="border-radius: 12px; border: none; backdrop-filter: blur(10px); margin-bottom: 20px;">
        <button type="button" class="close" data-dismiss="alert">
          <span>&times;</span>
        </button>
        ${message}
      </div>
    `;

    $('#alertContainer').html(alertHtml);

    // Auto-close alert after 5 seconds
    setTimeout(function() {
      $('#alertContainer').fadeOut(function() {
        $('#alertContainer').html('').show();
      });
    }, 5000);
  }
});
