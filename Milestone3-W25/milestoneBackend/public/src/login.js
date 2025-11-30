$(document).ready(function(){
    $("#submit").click(function() {
      const email = $('#email').val();
      const password = $('#password').val();

      if(!email || !password){
          alert("Email and Password are required")
          return;
      }

      const data = {
        email,
        password,
      };

      $.ajax({
        type: "POST",
        url: '/api/v1/user/login',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(data),
        success: function(serverResponse) {
          alert(serverResponse.message || "Login successful");
          // Add small delay to ensure cookie is set before redirect
          setTimeout(function() {
            window.location.href = '/dashboard';
          }, 500);
        },
        error: function(errorResponse) {
          try {
            const data = JSON.parse(errorResponse.responseText);
            alert(data.error);
          } catch (e) {
            alert(errorResponse.responseText);
          }
        }
      });
    });
  });