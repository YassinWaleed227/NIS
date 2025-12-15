const { v4 } = require('uuid');
const db = require('../../connectors/db');
const bcrypt = require('bcrypt');

function handlePublicBackendApi(app) {

    // Register HTTP endpoint to create new user
    app.post('/api/v1/user', async function(req, res) {
      const { name, email, password, birthDate } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }
      
      // Validate that name has at least first and last name
      const nameParts = name.trim().split(/\s+/);
      if (nameParts.length < 2) {
        return res.status(400).json({ error: 'Please enter both first and last name' });
      }
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }
      
      // Validate password strength (minimum 6 characters)
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      // Check if user already exists in the system
      const userExists = await db.select('*').from('FoodTruck.Users').where('email', email);
      if (userExists.length > 0) {
        return res.status(400).json({ error: 'user exists' });
      }
      
      try {
        // Hash the password with bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = {
          name,
          email,
          password: hashedPassword,
          role: req.body.role || 'customer',
          birthDate: birthDate || null
        };
        await db('FoodTruck.Users').insert(newUser);
        return res.status(201).json({ message: 'User registered successfully' });
      } catch (e) {
        console.log('Registration error:', e.message);
        return res.status(400).json({ error: 'Could not register user' });
      }
    });

    // Login HTTP endpoint
    app.post('/api/v1/user/login', async function(req, res) {
      // get users credentials from the JSON body
      const { email, password } = req.body
      if (!email) {
        // If the email is not present, return an HTTP unauthorized code
        return res.status(400).json({ error: 'email is required' });
      }
      if (!password) {
        // If the password is not present, return an HTTP unauthorized code
        return res.status(400).json({ error: 'Password is required' });
      }

      // validate the provided password against the password in the database
      // if invalid, send an unauthorized code
      let user = await db.select('*').from('FoodTruck.Users').where('email', email);
      if (user.length == 0) {
        return res.status(400).json({ error: 'user does not exist' });
      }
      user = user[0];
      
      // Compare hashed password using bcrypt
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(400).json({ error: 'Password does not match' });
      }

      // set the expiry time as 30 minutes after the current time
      const token = v4();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // create a session containing information about the user and expiry time
      const session = {
        userId: user.userId,
        token,
        expiresAt
      };
      try {
        await db('FoodTruck.Sessions').insert(session);
        // Set cookie with session token
        res.cookie('session_token', token, { httpOnly: true, expires: expiresAt, sameSite: 'lax' });
        return res.status(200).json({ message: 'Login successful', token });
      } catch (e) {
        console.log(e.message);
        return res.status(400).json({ error: 'Could not login' });
      }
    });

}

module.exports = {handlePublicBackendApi};

