// Capitalize first letter of each word
function toTitleCase(str) {
  if (!str) return '';
  return str.split(' ').map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

// Load truck data, statistics, and recent orders
async function loadTruckData() {
  try {
    const response = await fetch('/api/v1/truck/stats');
    if (!response.ok) {
      throw new Error(`Failed to fetch truck stats: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const truckName = toTitleCase(data.truckName || 'Your Truck');
    $('#truckName').text(truckName);
    
    const ownerName = toTitleCase(data.ownerName || 'Owner');
    $('#welcomeMsg').text(`Welcome ${ownerName}! Manage your food truck.`);
    
    $('#menuItemCount').text(data.menuItemCount || 0);
    $('#pendingOrderCount').text(data.pendingOrderCount || 0);
    $('#completedOrderCount').text(data.completedOrderCount || 0);
    
    loadRecentOrders();
  } catch (err) {
    console.error('Error loading truck data:', err);
    $('#menuItemCount').text('0');
    $('#pendingOrderCount').text('0');
    $('#completedOrderCount').text('0');
  }
}

// Load recent orders for the truck
async function loadRecentOrders() {
  try {
    const response = await fetch('/api/v1/order/truckOrders');
    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }
    
    const orders = await response.json();
    
    if (!orders || orders.length === 0) {
      $('#recentOrdersPanel').html(`
        <div class="no-orders">
          <p>No orders yet. Your orders will appear here.</p>
        </div>
      `);
      return;
    }
    
    const recentOrders = orders.slice(0, 5);
    let ordersHTML = '';
    
    recentOrders.forEach(order => {
      const orderDate = new Date(order.orderDate);
      const pickupTime = new Date(order.pickupTime);
      const statusClass = `status-${order.status}`;
      const pickupTimeStr = !isNaN(pickupTime.getTime()) ? pickupTime.toLocaleString() : 'Not scheduled';
      
      ordersHTML += `
        <div class="order-item">
          <div class="order-top">
            <div>
              <div class="order-id">Order #${order.truckOrderNumber}</div>
              <div class="order-details-text">Customer: ${order.customerName || 'N/A'}</div>
            </div>
            <span class="order-status-badge ${statusClass}">${capitalizeWords(order.status)}</span>
          </div>
          <div class="order-details-text">📞 ${order.email || 'N/A'}</div>
          <div class="order-details-text">💰 Total: $${parseFloat(order.totalAmount).toFixed(2)}</div>
          <div class="order-details-text">🕐 Pickup: ${pickupTimeStr}</div>
          <div class="order-details-text">📅 Ordered: ${orderDate.toLocaleString()}</div>
        </div>
      `;
    });
    
    $('#recentOrdersPanel').html(ordersHTML);
  } catch (err) {
    console.error('Error loading recent orders:', err);
    $('#recentOrdersPanel').html(`
      <div class="no-orders">
        <p>Error loading orders. Please try again.</p>
      </div>
    `);
  }
}

// Capitalize first letter of each word
function capitalizeWords(str) {
  if (!str) return '';
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

// Handle availability toggle
$(document).on('click', '#availabilityToggle', function() {
  $(this).toggleClass('active');
  const isOpen = $(this).hasClass('active');
  
  if (isOpen) {
    $('#statusBadge').removeClass('status-closed').addClass('status-open').text('OPEN');
  } else {
    $('#statusBadge').removeClass('status-open').addClass('status-closed').text('CLOSED');
  }
  
  updateTruckAvailability(isOpen);
});

// Update truck availability status
async function updateTruckAvailability(isAvailable) {
  try {
    const response = await fetch('/api/v1/truck/updateStatus', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderStatus: isAvailable ? 'available' : 'unavailable'
      })
    });
    
    if (!response.ok) {
      console.error('Failed to update truck status');
      $('#availabilityToggle').toggleClass('active');
    }
  } catch (err) {
    console.error('Error updating truck availability:', err);
  }
}

// Handle add menu item button

