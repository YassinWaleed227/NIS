$(document).ready(function() {
  window.loadMenuItems = function() {
    $.ajax({
      type: 'GET',
      url: '/api/v1/menu-items',
      success: function(items) {
        renderMenuItems(items);
      },
      error: function(err) {
        const msg = err && err.responseText ? err.responseText : 'Could not load menu items';
        $('#menuItemsList').html('<div class="alert alert-danger">' + msg + '</div>');
      }
    });
  }

  function renderMenuItems(items) {
    if (!items || items.length === 0) {
      $('#menuItemsList').html('<p>No available menu items.</p>');
      return;
    }

    let html = '<table class="table table-striped"><thead><tr><th>Item ID</th><th>Name</th><th>Description</th><th>Price</th><th>Category</th><th>Action</th></tr></thead><tbody>';
    items.forEach(function(it) {
      html += '<tr>' +
        '<td>' + it.itemId + '</td>' +
        '<td>' + escapeHtml(it.name) + '</td>' +
        '<td>' + (it.description ? escapeHtml(it.description) : '') + '</td>' +
        '<td>' + Number(it.price).toFixed(2) + '</td>' +
        '<td>' + (it.category || '') + '</td>' +
        '<td><button class="btn btn-sm btn-danger delete-item-btn" data-item-id="' + it.itemId + '">Delete</button></td>' +
        '</tr>';
    });
    html += '</tbody></table>';

    $('#menuItemsList').html(html);

    // Attach delete button click handlers
    $('.delete-item-btn').click(function() {
      const itemId = $(this).data('item-id');
      if (confirm('Are you sure you want to delete this menu item?')) {
        deleteMenuItem(itemId);
      }
    });
  }

  function deleteMenuItem(itemId) {
    $.ajax({
      type: 'DELETE',
      url: '/api/v1/menu-item/' + itemId,
      success: function(resp) {
        alert(resp || 'menu item deleted successfully');
        window.loadMenuItems();
      },
      error: function(err) {
        const msg = err && err.responseText ? err.responseText : 'Could not delete menu item';
        alert('Error: ' + msg);
      }
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&"'<>]/g, function (m) { return ({'&':'&amp;','"':'&quot;',"'":"&#39;",'<':'&lt;','>':'&gt;'})[m]; });
  }

  // Initial load
  if (typeof window.loadMenuItems === 'function') {
    window.loadMenuItems();
  } else {
    // define then call
    window.loadMenuItems();
  }
});
