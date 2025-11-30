const db = require('../connectors/db');

function getSessionToken(req) {
  if (!req.headers || !req.headers.cookie) return null;
  const cookies = req.headers.cookie.split(';').map(c => c.trim());
  const tokenCookie = cookies.find(c => c.startsWith('session_token='));
  if (!tokenCookie) return null;
  const parts = tokenCookie.split('=');
  return parts.length > 1 ? parts.slice(1).join('=') : null;
}

async function getUser(req) {

  const sessionToken = getSessionToken(req);
  if (!sessionToken) {
    console.log("no session token is found");
    return null;
  }

  const user = await db.select('*')
    .from({ s: 'FoodTruck.Sessions' })
    .where('token', sessionToken)
    .innerJoin('FoodTruck.Users as u', 's.userId', 'u.userId')
    .first(); 

  // Check if user session exists
  if (!user) {
    console.log("User session not found");
    return null;
  }

  if(user.role == "truckOwner"){
    const TruckRecord = await db.select('*')
      .from('FoodTruck.Trucks')
      .where('ownerId', user.userId)
      .first();
    
    // has no FoodTrucks
    if(!TruckRecord){
      console.log(`This ${user.name} has no owned trucks despite his role`);
      console.log('user =>', user)
      return user; 
    }else{
      const truckOwnerUser = {...user, ...TruckRecord}
      console.log('truck Owner user =>', truckOwnerUser)
      return truckOwnerUser;
    }
  }

  // role of customer
  console.log('user =>', user)
  return user;  
}



module.exports = {getSessionToken , getUser};