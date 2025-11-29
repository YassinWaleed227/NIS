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
      data: JSON.stringify(data),
      success: function(resp) {
        alert('Truck created successfully');
        // Optionally refresh the page to show truck info
        location.reload();
      },
      error: function(err) {
        const msg = err && err.responseText ? err.responseText : 'Could not create truck';
        alert('Error: ' + msg);
      }
    });
  });
});
