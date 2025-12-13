$(document).ready(function() {
  let currentItemId = null;

  console.log('Page loaded, initializing menu management...');
  
  // Load menu items on page load
  loadMenuItems();

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
  }

  // Load menu items function
  function loadMenuItems() {
    console.log('Starting to load menu items...');
    
    let requestTimeout = setTimeout(function() {
      console.error('TIMEOUT: Menu items took more than 10 seconds');
      showAlert('Menu items are taking too long to load. Please refresh the page.', 'danger');
    }, 10000);

    $.ajax({
      url: '/api/v1/menuItem/view',
      type: 'GET',
      dataType: 'json',
      xhrFields: {
        withCredentials: true
      },
      success: function(items) {
        clearTimeout(requestTimeout);
        console.log('SUCCESS: Menu items loaded:', items);
        console.log('Number of items:', Array.isArray(items) ? items.length : 'not an array');
        displayMenuItems(items);
      },
      error: function(err) {
        clearTimeout(requestTimeout);
        console.error('ERROR loading menu items');
        console.error('XHR Status:', err.status);
        console.error('XHR Response:', err.responseText);
        console.error('Error:', err);
        let errorMsg = 'Error loading menu items';
        if (err.responseJSON && err.responseJSON.error) {
          errorMsg = err.responseJSON.error;
        } else if (err.statusText) {
          errorMsg = 'Error: ' + err.statusText;
        }
        console.error('Final error message:', errorMsg);
        showAlert(errorMsg, 'danger');
        $('#tableContainer').html(`<div class="empty-state"><div style="color: red;">Failed to load menu items. ${errorMsg}</div></div>`);
      }
    });
  }

  // Display menu items in table
  function displayMenuItems(items) {
    let html = '';

    // Handle null or undefined items
    if (!items || !Array.isArray(items)) {
      items = [];
    }

    if (items.length === 0) {
      html = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <p>No menu items yet.</p>
          <a href="/addMenuItem" class="add-btn">Add Your First Item</a>
        </div>
      `;
    } else {
      html = `
        <table class="table table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Description</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
      `;

      items.forEach(item => {
        const statusClass = item.status === 'available' ? 'status-available' : 'status-unavailable';
        const statusText = item.status === 'available' ? 'Available' : 'Unavailable';
        const description = item.description || '';
        const descriptionPreview = description.length > 40 
          ? description.substring(0, 40) + '...' 
          : description;

        html += `
          <tr>
            <td>#${item.itemNumber}</td>
            <td><strong>${escapeHtml(item.name)}</strong></td>
            <td><span style="background: rgba(212, 166, 87, 0.15); padding: 4px 10px; border-radius: 6px;">${escapeHtml(item.category)}</span></td>
            <td><small>${escapeHtml(descriptionPreview)}</small></td>
            <td><strong>$${parseFloat(item.price).toFixed(2)}</strong></td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
              <div class="action-buttons">
                <a href="/editMenuItem/${item.itemId}" class="btn-action btn-edit">✏️ Edit</a>
                <button class="btn-action btn-delete" onclick="deleteItem(${item.itemId}, '${item.name.replace(/'/g, "\\'")}')" style="text-decoration: none;">🗑️ Delete</button>
              </div>
            </td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;
    }

    $('#tableContainer').html(html);
  }

  // Delete item
  window.deleteItem = function(itemId, itemName) {
    currentItemId = itemId;
    $('#deleteItemName').text(itemName);
    $('#deleteConfirmModal').modal('show');
  };

  // Confirm delete
  $('#confirmDeleteBtn').click(function() {
    if (!currentItemId) return;

    $.ajax({
      url: `/api/v1/menuItem/delete/${currentItemId}`,
      type: 'DELETE',
      dataType: 'json',
      xhrFields: {
        withCredentials: true
      },
      success: function(response) {
        showAlert('Menu item deleted successfully', 'success');
        $('#deleteConfirmModal').modal('hide');
        currentItemId = null;
        setTimeout(loadMenuItems, 1000);
      },
      error: function(err) {
        const errorMsg = err.responseJSON?.error || 'Error deleting menu item';
        showAlert(errorMsg, 'danger');
        console.error('Error:', err);
      }
    });
  });

  // Show alert
  function showAlert(message, type) {
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const alertHtml = `
      <div class="alert ${alertClass} alert-dismissible fade in" role="alert">
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
