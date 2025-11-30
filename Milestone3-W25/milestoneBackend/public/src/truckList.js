$(document).ready(function() {
  function loadTrucks() {
    // If truck owner, load only their truck
    if (typeof userRole !== 'undefined' && userRole === 'truckOwner') {
      $.ajax({
        type: 'GET',
        url: '/api/v1/truck/myTruck',
        success: function(truck) {
          renderTrucks([truck]);
        },
        error: function(err) {
          let msg = 'Could not load your truck';
          try {
            const data = JSON.parse(err.responseText);
            msg = data.error || msg;
          } catch (e) {
            msg = msg;
          }
          $('#trucksList').html('<div class="alert alert-warning">' + msg + '</div>');
        }
      });
    } else {
      // If customer, load all available trucks
      $.ajax({
        type: 'GET',
        url: '/api/v1/trucks/view',
        success: function(trucks) {
          renderTrucks(trucks);
        },
        error: function(err) {
          let msg = 'Could not load trucks';
          try {
            const data = JSON.parse(err.responseText);
            msg = data.error || msg;
          } catch (e) {
            msg = msg;
          }
          if (err && err.status === 403) msg = 'Only customers can view available trucks';
          $('#trucksList').html('<div class="alert alert-warning">' + msg + '</div>');
        }
      });
    }
  }

  function renderTrucks(trucks) {
    if (!trucks || trucks.length === 0) {
      $('#trucksList').html('<p>No available trucks.</p>');
      return;
    }

    let html = '<div class="row">';
    trucks.forEach(function(t) {
      html += '<div class="col-md-4" style="margin-bottom: 15px;">' +
        '<div class="panel panel-default">' +
        '<div class="panel-heading"><strong>' + escapeHtml(t.truckName) + '</strong></div>' +
        '<div class="panel-body">' +
        (t.truckLogo ? '<img src="' + escapeHtml(t.truckLogo) + '" style="max-width:100%" />' : '') +
        '<p>Status: ' + escapeHtml(t.truckStatus) + '</p>' +
        '<p>Order Status: ' + escapeHtml(t.orderStatus) + '</p>' +
        '<a class="btn btn-primary" href="/menu?truckId=' + t.truckId + '">View Menu</a>' +
        '</div></div></div>';
    });
    html += '</div>';

    $('#trucksList').html(html);
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&"'<>]/g, function (m) { return ({'&':'&amp;','"':'&quot;',"'":"&#39;",'<':'&lt;','>':'&gt;'})[m]; });
  }

  loadTrucks();
});
