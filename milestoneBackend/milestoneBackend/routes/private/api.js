const db = require('../../connectors/db');
// check function getUser in milestone 3 description and session.js
const {getUser} = require('../../utils/session');
// getUser takes only one input of req 
// await getUser(req);

function handlePrivateBackendApi(app) {
  
  // insert all your private server side end points here
  app.get('/test' , async (req,res) => {
     try{
      return res.status(200).send("succesful connection");
     }catch(err){
      console.log("error message", err.message);
      return res.status(400).send(err.message)
     }    
  });
  //from this line these are the functions added for milestone 3
  const db = require('../../connectors/db');
const { getUser } = require('../../utils/session');

app.post('/api/v1/menu-item', async (req, res) => {
    try {
        const user = await getUser(req);

        if (user.role !== "truckOwner") {
            return res.status(403).send('Only truck owners can add menu items');
        }

        const truckId = user.truckId;

        if (!truckId) {
            return res.status(400).send('No truck associated with this owner');
        }

        const { name, description, price } = req.body;

        if (!name) {
            return res.status(400).send('Name is required');
        }
        if (price === undefined || price === null || price === '') {
            return res.status(400).send('Price is required');
        }

        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).send('Price must be a non-negative number');
        }

        await db('FoodTruck.MenuItems').insert({
            truckId,
            name,
            description: description || null,
            price: parsedPrice,
            category: req.body.category || 'general'
        });

        return res.status(200).send('menu item was created successfully');
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not create menu item');
    }
});

// Endpoint to create a truck for the authenticated truck owner
app.post('/api/v1/truck', async (req, res) => {
    try {
        const user = await getUser(req);
        if (user.role !== 'truckOwner') {
            return res.status(403).send('Only truck owners can create trucks');
        }

        const { truckName, truckLogo } = req.body;
        if (!truckName) {
            return res.status(400).send('truckName is required');
        }

        // ensure ownerId exists
        const ownerId = user.userId;
        if (!ownerId) return res.status(400).send('Invalid owner');

        // ensure truckName uniqueness
        const existing = await db.select('*').from('FoodTruck.Trucks').where('truckName', truckName);
        if (existing.length > 0) return res.status(400).send('truckName already exists');

        const [created] = await db('FoodTruck.Trucks').insert({
            truckName,
            truckLogo: truckLogo || null,
            ownerId
        }).returning('*');

        return res.status(200).json(created);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not create truck');
    }
});

// Get all available menu items for the authenticated truck owner
app.get('/api/v1/menu-items', async (req, res) => {
    try {
        const user = await getUser(req);

        if (user.role !== 'truckOwner') {
            return res.status(403).send('Only truck owners can view their menu items');
        }

        const truckId = user.truckId;
        if (!truckId) {
            // Owner has no truck yet — return empty array
            return res.status(200).json([]);
        }

        const items = await db.select('*')
            .from('FoodTruck.MenuItems')
            .where({ truckId, status: 'available' })
            .orderBy('itemId', 'asc');

        return res.status(200).json(items);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not retrieve menu items');
    }
});

// Get a specific menu item by itemId for the authenticated truck owner
app.get('/api/v1/menu-item/:itemId', async (req, res) => {
    try {
        const user = await getUser(req);

        if (user.role !== 'truckOwner') {
            return res.status(403).send('Only truck owners can view menu items');
        }

        const truckId = user.truckId;
        if (!truckId) {
            return res.status(400).send('No truck associated with this owner');
        }

        const itemId = req.params.itemId;
        if (!itemId) {
            return res.status(400).send('itemId is required');
        }

        const item = await db.select('*')
            .from('FoodTruck.MenuItems')
            .where({ itemId })
            .first();

        if (!item) {
            return res.status(404).send('Menu item not found');
        }

        // Ensure the item belongs to the owner's truck
        if (item.truckId !== truckId) {
            return res.status(403).send('You do not have access to this menu item');
        }

        return res.status(200).json(item);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not retrieve menu item');
    }
});

// Delete a menu item (set status to "unavailable") by itemId for the authenticated truck owner
app.delete('/api/v1/menu-item/:itemId', async (req, res) => {
    try {
        const user = await getUser(req);

        if (user.role !== 'truckOwner') {
            return res.status(403).send('Only truck owners can delete menu items');
        }

        const truckId = user.truckId;
        if (!truckId) {
            return res.status(400).send('No truck associated with this owner');
        }

        const itemId = req.params.itemId;
        if (!itemId) {
            return res.status(400).send('itemId is required');
        }

        const item = await db.select('*')
            .from('FoodTruck.MenuItems')
            .where({ itemId })
            .first();

        if (!item) {
            return res.status(404).send('Menu item not found');
        }

        // Ensure the item belongs to the owner's truck
        if (item.truckId !== truckId) {
            return res.status(403).send('You do not have access to this menu item');
        }

        // Update status to "unavailable" instead of deleting
        await db('FoodTruck.MenuItems')
            .where({ itemId })
            .update({ status: 'unavailable' });

        return res.status(200).send('menu item deleted successfully');
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not delete menu item');
    }
});























  




};



module.exports = {handlePrivateBackendApi};
