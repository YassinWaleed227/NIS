const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const {handlePrivateBackendApi} = require('./routes/private/api');
const {handlePublicBackendApi} = require('./routes/public/api');
const {handlePublicFrontEndView} = require('./routes/public/view');
const {handlePrivateFrontEndView} = require('./routes/private/view');
const {authMiddleware} = require('./middleware/auth');
require('dotenv').config();
const PORT = process.env.PORT || 3000;


// view engine setup
app.set('views', './views');
app.set('view engine', 'hjs');
app.use(express.static('./public'));

// Handle post requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

handlePublicFrontEndView(app);
handlePublicBackendApi(app);

// Logout route MUST be before auth middleware so it can clear the session
const { getSessionToken } = require('./utils/session');
const db = require('./connectors/db');
app.get('/logout', async (req, res) => {
  try {
    const sessionToken = getSessionToken(req);
    if (sessionToken) {
      // Delete session from database
      await db('FoodTruck.Sessions').where('token', sessionToken).delete();
    }
    // Clear cookie with all possible options
    res.clearCookie('session_token');
    res.clearCookie('session_token', { path: '/' });
    res.clearCookie('session_token', { path: '/', httpOnly: true, sameSite: 'lax' });
    
    // Set response header to prevent caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.redirect('/');
  } catch (error) {
    console.error('Logout error:', error);
    res.clearCookie('session_token');
    res.clearCookie('session_token', { path: '/' });
    return res.redirect('/');
  }
});

app.use(authMiddleware);
handlePrivateFrontEndView(app);
handlePrivateBackendApi(app);

// 404 catch-all route - must be last
app.use((req, res) => {
    return res.status(404).render('error', { message: 'The resource requested could not be found on this server!' });
});

app.listen(PORT, () => {
    console.log(`Server is now listening at port ${PORT} on http://localhost:${PORT}/`);
});







