$(document).ready(function() {
  $('#addMenuItem').click(function() {
    const name = $('#itemName').val();
    const description = $('#itemDescription').val();
    const price = $('#itemPrice').val();
    const category = $('#itemCategory').val();

    if (!name) {
      alert('Name is required');
      return;
    }
    if (price === null || price === undefined || price === '') {
      alert('Price is required');
      return;
    }
    const parsed = parseFloat(price);
    if (isNaN(parsed) || parsed < 0) {
      alert('Price must be a non-negative number');
      return;
    }

    const data = { name, description, price: parsed, category: category || 'general' };

    $.ajax({
      type: 'POST',
      url: '/api/v1/menu-item',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success: function(resp) {
        alert(resp || 'menu item was created successfully');
        // clear form
        $('#itemName').val('');
        $('#itemDescription').val('');
        $('#itemPrice').val('');
        $('#itemCategory').val('');
        if (typeof window.loadMenuItems === 'function') {
          window.loadMenuItems();
        }
      },
      error: function(err) {
        const msg = err && err.responseText ? err.responseText : 'Could not create menu item';
        alert('Error: ' + msg);
      }
    });

  });
});
