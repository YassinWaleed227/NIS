const db = require('../connectors/db');
const {getSessionToken} = require('../utils/session');

async function authMiddleware(req, res, next) {
  const sessionToken = getSessionToken(req);

  if (!sessionToken) {
    if (req.path && req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.redirect(302, '/');
  }

  const userSession = await db.select('*').from('FoodTruck.Sessions').where('token', sessionToken).first();
  if (!userSession) {
    if (req.path && req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.redirect(302, '/');
  }

  // Check if session has expired
  if (new Date() > new Date(userSession.expiresAt)) {
    if (req.path && req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Session expired' });
    }
    return res.redirect(302, '/');
  }

  next();
};


module.exports = {authMiddleware}