$(document).ready(function() {
  function capitalizeWords(str) {
    return str.replace(/\b\w/g, function(char) {
      return char.toUpperCase();
    });
  }

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
      $('#trucksList').html('<div class="no-trucks-message">🚫 No available trucks at the moment. Check back soon!</div>');
      return;
    }

    let html = '<div class="trucks-grid">';
    trucks.forEach(function(t) {
      html += '<div class="truck-card">' +
        '<div class="truck-card-image">';
      
      if (t.truckLogo) {
        html += '<img src="' + escapeHtml(t.truckLogo) + '" alt="' + escapeHtml(t.truckName) + '" />';
      } else {
        html += '<div class="truck-placeholder">🚚</div>';
      }
      
      var capitalizedName = capitalizeWords(escapeHtml(t.truckName));
      var capitalizedStatus = capitalizeWords(escapeHtml(t.truckStatus));
      var statusClass = t.truckStatus === 'available' ? 'available' : 'unavailable';
      
      html += '</div>' +
        '<div class="truck-card-content">' +
        '<div class="truck-card-title">' + capitalizedName + '</div>' +
        '<div class="truck-card-status ' + statusClass + '">' + 
        capitalizedStatus + '</div>';
      
      html += '<a class="truck-card-button" href="/menu?truckId=' + t.truckId + '">View Menu</a>' +
        '</div></div>';
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
