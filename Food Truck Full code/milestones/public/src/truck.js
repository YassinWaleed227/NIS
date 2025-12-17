$(document).ready(function() {
  $('#createTruck').click(function() {
    const truckName = $('#truckName').val();
    const truckLogo = $('#truckLogo').val();

    if (!truckName) {
      alert('Truck name is required');
      return;
    }

    const data = { truckName, truckLogo };

    $.ajax({
      type: 'POST',
      url: '/api/v1/truck/new',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify(data),
      success: function(resp) {
        alert('Truck created successfully');
        // Optionally refresh the page to show truck info
        location.reload();
      },
      error: function(err) {
        try {
          const data = JSON.parse(err.responseText);
          alert(data.error || 'Could not create truck');
        } catch (e) {
          alert('Could not create truck');
        }
      }
    });
  });
});
