const { v4 } = require('uuid');
const db = require('../../connectors/db');
const axios = require('axios');

function handlePublicBackendApi(app) {

    // Register HTTP endpoint to create new user
    app.post('/api/v1/user', async function(req, res) {
      const { name, email, password } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).send('Name is required');
      }
      if (!email) {
        return res.status(400).send('Email is required');
      }
      if (!password) {
        return res.status(400).send('Password is required');
      }

      // Check if user already exists in the system
      const userExists = await db.select('*').from('FoodTruck.Users').where('email', email);
      if (userExists.length > 0) {
        return res.status(400).send('user exists');
      }
      
      try {
        const newUser = {
          name,
          email,
          password,
          role: req.body.role || 'customer'
        };
        const user = await db('FoodTruck.Users').insert(newUser).returning('*');
        return res.status(200).json(user);
      } catch (e) {
        console.log(e.message);
        return res.status(400).send('Could not register user');
      }
    });

    // Register HTTP endpoint to create new user
    app.post('/api/v1/user/login', async function(req, res) {
      // get users credentials from the JSON body
      const { email, password } = req.body
      if (!email) {
        // If the email is not present, return an HTTP unauthorized code
        return res.status(400).send('email is required');
      }
      if (!password) {
        // If the password is not present, return an HTTP unauthorized code
        return res.status(400).send('Password is required');
      }

      // validate the provided password against the password in the database
      // if invalid, send an unauthorized code
      let user = await db.select('*').from('FoodTruck.Users').where('email', email);
      if (user.length == 0) {
        return res.status(400).send('user does not exist');
      }
      user = user[0];
      if (user.password !== password) {
        return res.status(400).send('Password does not match');
      }

      // set the expiry time as 30 minutes after the current time
      const token = v4();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // create a session containing information about the user and expiry time
      const session = {
        userId: user.userId,
        token,
        expiresAt,
      };
      try {
        await db('FoodTruck.Sessions').insert(session);
        // Set cookie with session token
        res.cookie('session_token', token, { httpOnly: true, expires: expiresAt, sameSite: 'lax' });
        return res.status(200).json({ message: 'Login successful', token });
      } catch (e) {
        console.log(e.message);
        return res.status(400).send('Could not login');
      }
    });

}

module.exports = {handlePublicBackendApi};

