$(document).ready(function() {
  let allItems = [];

  window.loadMenuItems = function() {
    const params = new URLSearchParams(window.location.search);
    const truckId = params.get('truckId');

    if (truckId) {
      if ($('#menuItemForm').length) {
        $('#menuItemForm').hide();
      }
      $.ajax({
        type: 'GET',
        url: '/api/v1/menu-item/truck/' + encodeURIComponent(truckId),
        success: function(items) {
          allItems = items;
          renderMenuItems(items, true);
          buildCategoryFilter(items);
        },
        error: function(err) {
          let msg = 'Could not load menu items';
          try {
            const data = JSON.parse(err.responseText);
            msg = data.error || msg;
          } catch (e) {
            msg = msg;
          }
          $('#menuItemsList').html('<div class="alert alert-danger">' + msg + '</div>');
        }
      });
      return;
    }

    if ($('#menuItemForm').length) {
      $('#menuItemForm').show();
    }
    $.ajax({
      type: 'GET',
      url: '/api/v1/menuItem/view',
      success: function(items) {
        allItems = items;
        renderMenuItems(items, false);
        buildCategoryFilter(items);
      },
      error: function(err) {
        let msg = 'Could not load menu items';
        try {
          const data = JSON.parse(err.responseText);
          msg = data.error || msg;
        } catch (e) {
          msg = msg;
        }
        $('#menuItemsList').html('<div class="alert alert-danger">' + msg + '</div>');
      }
    });
  }

  function renderMenuItems(items, customerView) {
    if (!items || items.length === 0) {
      $('#menuItemsList').html('<div class="no-items-message">No available menu items.</div>');
      return;
    }

    // For customer view, group by category
    if (customerView) {
      const grouped = {};
      items.forEach(function(it) {
        const category = (it.category || 'Other').trim().toLowerCase();
        const displayCategory = it.category ? it.category.trim() : 'Other';
        
        if (!grouped[category]) {
          grouped[category] = {
            displayName: displayCategory,
            items: []
          };
        }
        grouped[category].items.push(it);
      });

      let html = '';
      const sortedCategories = Object.keys(grouped).sort();
      
      sortedCategories.forEach(function(category) {
        const categoryData = grouped[category];
        html += '<div class="category-section">';
        html += '<h3 class="category-title">' + escapeHtml(categoryData.displayName) + '</h3>';
        html += '<div class="menu-grid">';
        
        categoryData.items.forEach(function(it) {
          html += '<div class="menu-card">' +
            '<div class="menu-card-content">' +
            '<div class="menu-card-title">' + escapeHtml(it.name) + '</div>';
          
          if (it.description) {
            html += '<div class="menu-card-description">' + escapeHtml(it.description) + '</div>';
          }
          
          html += '<div class="menu-card-price">$' + Number(it.price).toFixed(2) + '</div>' +
            '<div class="menu-card-actions">' +
              '<input type="number" min="1" value="1" class="cart-quantity" data-id="' + it.itemId + '">' +
              '<button class="add-to-cart" data-id="' + it.itemId + '">Add</button>' +
            '</div>' +
            '</div>' +
            '</div>';
        });
        
        html += '</div></div>';
      });
      
      $('#menuItemsList').html(html);
    } else {
      let html = '<div class="table-container"><table class="table table-striped"><thead><tr><th>Item ID</th><th>Name</th><th>Description</th><th>Price</th><th>Category</th><th>Action</th>';
      html += '</tr></thead><tbody>';
      items.forEach(function(it) {
        html += '<tr>' +
          '<td>' + it.itemId + '</td>' +
          '<td>' + escapeHtml(it.name) + '</td>' +
          '<td>' + (it.description ? escapeHtml(it.description) : '') + '</td>' +
          '<td>$' + Number(it.price).toFixed(2) + '</td>' +
          '<td>' + (it.category || '') + '</td>' +
          '<td>' +
          '<button class="btn btn-sm btn-primary edit-item-btn" data-item-id="' + it.itemId + '">Edit</button> ' +
          '<button class="btn btn-sm btn-danger delete-item-btn" data-item-id="' + it.itemId + '">Delete</button>' +
          '</td>' +
          '</tr>';
      });
      html += '</tbody></table></div>';
      $('#menuItemsList').html(html);
    }

    $('.delete-item-btn').click(function() {
      const itemId = $(this).data('item-id');
      if (confirm('Are you sure you want to delete this menu item?')) {
        deleteMenuItem(itemId);
      }
    });

    $('.edit-item-btn').click(function() {
      const itemId = $(this).data('item-id');
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
        return;
      }

      updateMenuItem(itemId, body);
    });
    attachAddToCartHandlers(customerView);
  }

  function deleteMenuItem(itemId) {
    $.ajax({
      type: 'DELETE',
      url: '/api/v1/menuItem/delete/' + itemId,
      dataType: 'json',
      success: function(resp) {
        alert(resp.message || 'menu item deleted successfully');
        window.loadMenuItems();
      },
      error: function(err) {
        let msg = 'Could not delete menu item';
        try {
          const data = JSON.parse(err.responseText);
          msg = data.error || msg;
        } catch (e) {
          msg = msg;
        }
        alert(msg);
      }
    });
  }

  function updateMenuItem(itemId, body) {
    $.ajax({
      type: 'PUT',
      url: '/api/v1/menuItem/edit/' + itemId,
      contentType: 'application/json',
      data: JSON.stringify(body),
      dataType: 'json',
      success: function(resp) {
        alert(resp.message || 'menu item updated successfully');
        window.loadMenuItems();
      },
      error: function(err) {
        let msg = 'Could not update menu item';
        try {
          const data = JSON.parse(err.responseText);
          msg = data.error || msg;
        } catch (e) {
          msg = msg;
        }
        alert(msg);
      }
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&"'<>]/g, function (m) { return ({'&':'&amp;','"':'&quot;',"'":"&#39;",'<':'&lt;','>':'&gt;'})[m]; });
  }

  function buildCategoryFilter(items) {
    const params = new URLSearchParams(window.location.search);
    const truckId = params.get('truckId');
    
    if (!truckId) return;

    const categoriesMap = {};
    items.forEach(item => {
      if (item.category) {
        const normalizedKey = item.category.trim().toLowerCase();
        const displayName = item.category.trim();
        if (!categoriesMap[normalizedKey]) {
          categoriesMap[normalizedKey] = displayName;
        }
      }
    });

    if (Object.keys(categoriesMap).length === 0) {
      $('#categoryFilter').html('');
      return;
    }

    let filterHtml = '<button class="category-btn active" data-category="all">All</button>';
    Object.keys(categoriesMap).sort().forEach(normalizedKey => {
      const displayName = categoriesMap[normalizedKey];
      filterHtml += '<button class="category-btn" data-category="' + escapeHtml(normalizedKey) + '">' + escapeHtml(displayName) + '</button>';
    });

    $('#categoryFilter').html(filterHtml);

    $('.category-btn').click(function() {
      $('.category-btn').removeClass('active');
      $(this).addClass('active');
      
      const selectedCategory = $(this).data('category');
      let filteredItems = allItems;

      if (selectedCategory !== 'all') {
        filteredItems = allItems.filter(item => {
          const itemCategoryNormalized = (item.category || '').trim().toLowerCase();
          return itemCategoryNormalized === selectedCategory;
        });
      }

      renderMenuItems(filteredItems, true);
      attachAddToCartHandlers(true);
    });
  }

  function attachAddToCartHandlers(customerView) {
    if (customerView) {
      $('.add-to-cart').off('click').click(async function () {
        const id = $(this).data('id');
        const qty = parseInt($(this).closest('.menu-card-actions').find('.cart-quantity').val()) || 1;
        const card = $(this).closest('.menu-card');
        const price = parseFloat(card.find('.menu-card-price').text().replace('$', ''));
        try {
          const res = await fetch('/api/v1/cart/new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: parseInt(id), quantity: qty, price: price })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Could not add to cart');
          if (window.showSuccessMessage) {
            window.showSuccessMessage(data.message || 'Item added to cart successfully!');
          } else {
            alert(data.message || 'Item added to cart successfully');
          }
          if (window.loadCart) window.loadCart();
        } catch (err) {
          console.error(err);
          alert(err.message);
        }
      });
    }
  }

  if (typeof window.loadMenuItems === 'function') {
    window.loadMenuItems();
  } else {
    window.loadMenuItems();
  }
});
