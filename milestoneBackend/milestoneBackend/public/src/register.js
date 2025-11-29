$(document).ready(function(){

    // Handle Registration Button Click
    $("#register").click(function() {
      const name = $('#name').val();
      const email = $('#email').val();
      const password = $('#password').val();

      if(!name || !email || !password){
          alert("Name, Email, and Password are required")
          return;
      }

      const data = {
        name,
        email,
        password,
        role: 'customer'
      };

      $.ajax({
        type: "POST",
        url: '/api/v1/user',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(serverResponse) {
            alert("successfully registered user")
            location.href = '/';
        },
        error: function(errorResponse) {
            alert(`Error Register User: ${errorResponse.responseText}`);
        }
      });
    });      
  });