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
    // Do not attempt to use `res` here — utilities should return null and
    // let middleware/routes handle redirects or 403 responses.
    return null;
  }


  const user = await db.select('*')
    .from({ s: 'FoodTruck.Sessions' })
    .where('token', sessionToken)
    .innerJoin('FoodTruck.Users as u', 's.userId', 'u.userId')
    .first(); 

  if(user.role == "truckOwner"){
    const TruckRecord = await db.select('*')
    .from({ u: 'FoodTruck.Trucks' })
    .where('ownerId', user.userId)
    // has no FoodTrucks
    if(TruckRecord.length == 0){
      console.log(`This ${user.name} has no owned trucks despite his role`);
      console.log('user =>', user)
      return user; 
    }else{
      const firstRecord = TruckRecord[0];
      const truckOwnerUser =  {...user, ...firstRecord}
      console.log('truck Owner user =>', truckOwnerUser)
      return truckOwnerUser;
    }
  }

  // role of customer
  console.log('user =>', user)
  return user;  
}



module.exports = {getSessionToken , getUser};