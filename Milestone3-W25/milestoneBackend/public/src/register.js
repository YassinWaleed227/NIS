$(document).ready(function(){

    // Handle Registration Button Click
    $("#register").click(function() {
      const name = $('#name').val();
      const email = $('#email').val();
      const password = $('#password').val();
      const birthDate = $('#birthDate').val();
      const role = $('#role').val();

      if(!name || !email || !password){
          const errorAlert = $('#errorAlert');
          errorAlert.text("Name, Email, and Password are required").show();
          return;
      }

      const nameParts = name.trim().split(/\s+/);
      if(nameParts.length < 2){
          const errorAlert = $('#errorAlert');
          errorAlert.text("Please enter both first and last name").show();
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
            const successAlert = $('<div class="alert alert-success" style="background: rgba(40, 167, 69, 0.2); border: 1px solid #28a745; color: #155724; padding: 15px; border-radius: 8px; margin-bottom: 20px;">Successfully registered user</div>');
            $('#registerForm').before(successAlert);
            setTimeout(() => {
              location.href = '/';
            }, 1500);
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