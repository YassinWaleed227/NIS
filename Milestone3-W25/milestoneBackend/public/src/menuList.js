$(document).ready(function() {
  window.loadMenuItems = function() {
    const params = new URLSearchParams(window.location.search);
    const truckId = params.get('truckId');

    if (truckId) {
      // Customer view for a specific truck
      // Hide the owner's add form if present
      if ($('#menuItemForm').length) {
        $('#menuItemForm').hide();
      }
      $.ajax({
        type: 'GET',
        url: '/api/v1/menuItem/truck/' + encodeURIComponent(truckId),
        success: function(items) {
          renderMenuItems(items, true);
        },
        error: function(err) {
          const msg = err && err.responseText ? err.responseText : 'Could not load menu items';
          $('#menuItemsList').html('<div class="alert alert-danger">' + msg + '</div>');
        }
      });
      return;
    }

    // Owner view: load items for authenticated owner's truck
    if ($('#menuItemForm').length) {
      $('#menuItemForm').show();
    }
    $.ajax({
      type: 'GET',
      url: '/api/v1/menuItem/view',
      success: function(items) {
        renderMenuItems(items, false);
      },
      error: function(err) {
        const msg = err && err.responseText ? err.responseText : 'Could not load menu items';
        $('#menuItemsList').html('<div class="alert alert-danger">' + msg + '</div>');
      }
    });
  }

  function renderMenuItems(items, customerView) {
    if (!items || items.length === 0) {
      $('#menuItemsList').html('<p>No available menu items.</p>');
      return;
    }
    let html = '<table class="table table-striped"><thead><tr><th>Item ID</th><th>Name</th><th>Description</th><th>Price</th><th>Category</th><th>Action</th>';
    html += '</tr></thead><tbody>';
    items.forEach(function(it) {
      html += '<tr>' +
        '<td>' + it.itemId + '</td>' +
        '<td>' + escapeHtml(it.name) + '</td>' +
        '<td>' + (it.description ? escapeHtml(it.description) : '') + '</td>' +
        '<td>' + Number(it.price).toFixed(2) + '</td>' +
        '<td>' + (it.category || '') + '</td>';
      if (!customerView) {
        html += '<td>' +
          '<button class="btn btn-sm btn-primary edit-item-btn" data-item-id="' + it.itemId + '">Edit</button> ' +
          '<button class="btn btn-sm btn-danger delete-item-btn" data-item-id="' + it.itemId + '">Delete</button>' +
        '</td>';
      } else {
        // add to cart controls
        html += '<td>' +
          '<div class="input-group" style="max-width:160px;">' +
            '<input type="number" min="1" value="1" class="form-control form-control-sm cart-quantity" data-id="' + it.itemId + '">' +
            '<button class="btn btn-sm btn-primary add-to-cart" data-id="' + it.itemId + '">Add</button>' +
          '</div>' +
        '</td>';
      }
      html += '</tr>';
    });
    html += '</tbody></table>';

    $('#menuItemsList').html(html);

    // Attach delete and edit button click handlers
    $('.delete-item-btn').click(function() {
      const itemId = $(this).data('item-id');
      if (confirm('Are you sure you want to delete this menu item?')) {
        deleteMenuItem(itemId);
      }
    });

    $('.edit-item-btn').click(function() {
      const itemId = $(this).data('item-id');
      // Prompt user for new values (simple UI)
      const newName = prompt('New name (leave blank to keep current):');
      const newDescription = prompt('New description (leave blank to keep current):');
      const newPrice = prompt('New price (leave blank to keep current):');
      const newCategory = prompt('New category (leave blank to keep current):');

      const body = {};
      if (newName !== null && newName !== '') body.name = newName;
      if (newDescription !== null && newDescription !== '') body.description = newDescription;
      if (newCategory !== null && newCategory !== '') body.category = newCategory;
      if (newPrice !== null && newPrice !== '') body.price = newPrice;

      if (Object.keys(body).length === 0) {
        // nothing to update
        return;
      }

      updateMenuItem(itemId, body);
    });
    // Attach add to cart button click handlers for customers
    if (customerView) {
      $('.add-to-cart').click(async function () {
        const id = $(this).data('id');
        const qty = $(this).closest('.input-group').find('.cart-quantity').val() || 1;
        try {
          const res = await fetch('/api/v1/cart/new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: id, quantity: qty })
          });
          const text = await res.text();
          alert(text);
          // refresh cart UI if present
          if (window.loadCart) window.loadCart();
        } catch (err) {
          console.error(err);
          alert('Could not add to cart');
        }
      });
    }
  }

  function deleteMenuItem(itemId) {
    $.ajax({
      type: 'DELETE',
      url: '/api/v1/menuItem/delete/' + itemId,
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

  function updateMenuItem(itemId, body) {
    $.ajax({
      type: 'PUT',
      url: '/api/v1/menuItem/edit/' + itemId,
      contentType: 'application/json',
      data: JSON.stringify(body),
      success: function(resp) {
        alert(resp || 'menu item updated successfully');
        window.loadMenuItems();
      },
      error: function(err) {
        const msg = err && err.responseText ? err.responseText : 'Could not update menu item';
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
