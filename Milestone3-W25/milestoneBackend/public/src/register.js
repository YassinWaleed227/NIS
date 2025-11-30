$(document).ready(function(){

    // Handle Registration Button Click
    $("#register").click(function() {
      const name = $('#name').val();
      const email = $('#email').val();
      const password = $('#password').val();
      const birthDate = $('#birthDate').val();
      const role = $('#role').val();

      if(!name || !email || !password){
          alert("Name, Email, and Password are required")
          return;
      }

      const data = {
        name,
        email,
        password,
        birthDate: birthDate || null,
        role: role || 'customer'
      };

      $.ajax({
        type: "POST",
        url: '/api/v1/user',
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(data),
        success: function(serverResponse) {
            alert("successfully registered user")
            location.href = '/';
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