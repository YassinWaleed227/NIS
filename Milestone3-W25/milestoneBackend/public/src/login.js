$(document).ready(function(){
    $("#submit").click(function() {
      const email = $('#email').val();
      const password = $('#password').val();

      if(!email || !password){
          const errorAlert = $('#errorAlert');
          errorAlert.text("Email and Password are required").show();
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
          // Add small delay to ensure cookie is set before redirect
          setTimeout(function() {
            window.location.href = '/dashboard';
          }, 500);
        },
        error: function(errorResponse) {
          try {
            const data = JSON.parse(errorResponse.responseText);
            const errorAlert = $('#errorAlert');
            errorAlert.text(data.error).show();
          } catch (e) {
            const errorAlert = $('#errorAlert');
            errorAlert.text(errorResponse.responseText).show();
          }
        }
      });
    });
  });