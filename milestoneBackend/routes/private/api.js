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
  app.post('/api/v1/menuItem/new', async (req, res) => {
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
            category: req.body.category || 'general',
            status: 'available',
            createdAt: new Date()
        });

        return res.status(200).json({ message: 'menu item was created successfully' });
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
app.get('/api/v1/menuItem/view', async (req, res) => {
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
app.get('/api/v1/menuItem/view/:itemId', async (req, res) => {
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

// Edit a menu item by itemId for the authenticated truck owner
app.put('/api/v1/menuItem/edit/:itemId', async (req, res) => {
    try {
        const user = await getUser(req);

        if (user.role !== 'truckOwner') {
            return res.status(403).send('Only truck owners can edit menu items');
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

        // Extract editable fields from request body
        const { name, price, category, description } = req.body;
        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (price !== undefined) {
            const parsedPrice = parseFloat(price);
            if (isNaN(parsedPrice) || parsedPrice < 0) {
                return res.status(400).send('Price must be a non-negative number');
            }
            updateData.price = parsedPrice;
        }
        if (category !== undefined) updateData.category = category;
        if (description !== undefined) updateData.description = description;

        // Ensure at least one field is being updated
        if (Object.keys(updateData).length === 0) {
            return res.status(400).send('At least one field must be provided for update');
        }

        await db('FoodTruck.MenuItems')
            .where({ itemId })
            .update(updateData);

        return res.status(200).json({ message: 'menu item updated successfully' });
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not update menu item');
    }
});

// Delete a menu item (set status to "unavailable") by itemId for the authenticated truck owner
app.delete('/api/v1/menuItem/delete/:itemId', async (req, res) => {
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

        return res.status(200).json({ message: 'menu item deleted successfully' });
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not delete menu item');
    }
});























  




  // ========== CUSTOMER ENDPOINTS ==========

  // Get all available trucks
  app.get('/api/v1/trucks/view', async (req, res) => {
    try {
        const user = await getUser(req);

        const trucks = await db.select('*')
            .from('FoodTruck.Trucks')
            .where({ truckStatus: 'available', orderStatus: 'available' })
            .orderBy('truckId', 'asc');

        return res.status(200).json(trucks);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not retrieve trucks');
    }
  });

  // Get all available menu items for a specific truck
  app.get('/api/v1/menuItem/truck/:truckId', async (req, res) => {
    try {
        const user = await getUser(req);

        const truckId = req.params.truckId;
        if (!truckId) {
            return res.status(400).send('truckId is required');
        }

        // Verify truck exists and is available
        const truck = await db.select('*')
            .from('FoodTruck.Trucks')
            .where({ truckId, truckStatus: 'available', orderStatus: 'available' })
            .first();

        if (!truck) {
            return res.status(404).send('Truck not found or not available');
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

  // Add menu item to cart
  app.post('/api/v1/cart/new', async (req, res) => {
    try {
        const user = await getUser(req);

        const { itemId, quantity } = req.body;

        if (!itemId) {
            return res.status(400).send('itemId is required');
        }
        if (!quantity || quantity < 1) {
            return res.status(400).send('quantity must be at least 1');
        }

        // Get the menu item details
        const menuItem = await db.select('*')
            .from('FoodTruck.MenuItems')
            .where({ itemId, status: 'available' })
            .first();

        if (!menuItem) {
            return res.status(404).send('Menu item not found or not available');
        }

        const truckId = menuItem.truckId;

        // Check if user already has items in cart from a different truck
        const existingCartItems = await db.select('*')
            .from('FoodTruck.Cart')
            .where({ userId: user.userId })
            .first();

        if (existingCartItems && existingCartItems.truckId !== truckId) {
            return res.status(400).json({ message: 'Cannot order from multiple trucks' });
        }

        // Check if this item is already in the cart
        const existingItem = await db.select('*')
            .from('FoodTruck.Cart')
            .where({ userId: user.userId, itemId })
            .first();

        if (existingItem) {
            // Update quantity
            await db('FoodTruck.Cart')
                .where({ userId: user.userId, itemId })
                .update({ quantity: existingItem.quantity + quantity });
        } else {
            // Insert new cart item
            await db('FoodTruck.Cart').insert({
                userId: user.userId,
                itemId,
                truckId,
                quantity,
                addedAt: new Date()
            });
        }

        return res.status(200).json({ message: 'item added to cart successfully' });
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not add item to cart');
    }
  });

  // View all items in customer's cart
  app.get('/api/v1/cart/view', async (req, res) => {
    try {
        const user = await getUser(req);

        const cartItems = await db.select('*')
            .from('FoodTruck.Cart')
            .where({ userId: user.userId })
            .orderBy('cartId', 'asc');

        return res.status(200).json(cartItems);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not retrieve cart');
    }
  });

  // Delete item from cart
  app.delete('/api/v1/cart/delete/:cartId', async (req, res) => {
    try {
        const user = await getUser(req);

        const cartId = req.params.cartId;
        if (!cartId) {
            return res.status(400).send('cartId is required');
        }

        // Verify the cart item belongs to the user
        const cartItem = await db.select('*')
            .from('FoodTruck.Cart')
            .where({ cartId })
            .first();

        if (!cartItem) {
            return res.status(404).send('Cart item not found');
        }

        if (cartItem.userId !== user.userId) {
            return res.status(403).send('You do not have access to this cart item');
        }

        // Delete the cart item
        await db('FoodTruck.Cart')
            .where({ cartId })
            .delete();

        return res.status(200).json({ message: 'item removed from cart successfully' });
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not delete cart item');
    }
  });

  // Edit cart item quantity
  app.put('/api/v1/cart/edit/:cartId', async (req, res) => {
    try {
        const user = await getUser(req);

        const cartId = req.params.cartId;
        if (!cartId) {
            return res.status(400).send('cartId is required');
        }

        const { quantity } = req.body;
        if (!quantity || quantity < 1) {
            return res.status(400).send('quantity must be at least 1');
        }

        // Verify the cart item belongs to the user
        const cartItem = await db.select('*')
            .from('FoodTruck.Cart')
            .where({ cartId })
            .first();

        if (!cartItem) {
            return res.status(404).send('Cart item not found');
        }

        if (cartItem.userId !== user.userId) {
            return res.status(403).send('You do not have access to this cart item');
        }

        // Update the quantity
        await db('FoodTruck.Cart')
            .where({ cartId })
            .update({ quantity });

        return res.status(200).json({ message: 'cart updated successfully' });
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not update cart');
    }
  });

  // ========== ORDER ENDPOINTS ==========

  // Place an order from cart
  app.post('/api/v1/order/new', async (req, res) => {
    try {
        const user = await getUser(req);

        const { pickupTime } = req.body;
        if (!pickupTime) {
            return res.status(400).send('pickupTime is required');
        }

        // Get all cart items for the user
        const cartItems = await db.select('*')
            .from('FoodTruck.Cart')
            .where({ userId: user.userId });

        if (cartItems.length === 0) {
            return res.status(400).send('Cart is empty');
        }

        // Verify all items belong to the same truck
        const truckIds = new Set(cartItems.map(item => item.truckId));
        if (truckIds.size > 1) {
            return res.status(400).json({ error: 'Cannot order from multiple trucks' });
        }

        const truckId = cartItems[0].truckId;

        // Calculate total price
        let totalPrice = 0;
        for (const cartItem of cartItems) {
            const menuItem = await db.select('price')
                .from('FoodTruck.MenuItems')
                .where({ itemId: cartItem.itemId })
                .first();
            if (menuItem) {
                totalPrice += menuItem.price * cartItem.quantity;
            }
        }

        // Create order
        const [order] = await db('FoodTruck.Orders').insert({
            userId: user.userId,
            truckId,
            totalPrice,
            pickupTime: new Date(pickupTime),
            orderStatus: 'pending',
            createdAt: new Date()
        }).returning('*');

        const orderId = order.orderId;

        // Create order items from cart items
        const orderItems = cartItems.map(cartItem => ({
            orderId,
            itemId: cartItem.itemId,
            quantity: cartItem.quantity
        }));

        await db('FoodTruck.OrderItems').insert(orderItems);

        // Clear the cart
        await db('FoodTruck.Cart')
            .where({ userId: user.userId })
            .delete();

        return res.status(200).json({ message: 'order placed successfully' });
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not place order');
    }
  });

  // View all orders for the customer
  app.get('/api/v1/order/myOrders', async (req, res) => {
    try {
        const user = await getUser(req);

        const orders = await db.select(
            'o.orderId',
            'o.userId',
            'o.truckId',
            'o.totalPrice',
            'o.pickupTime',
            'o.orderStatus',
            'o.createdAt',
            't.truckName',
            't.truckLogo'
        )
            .from({ o: 'FoodTruck.Orders' })
            .join('FoodTruck.Trucks as t', 'o.truckId', 't.truckId')
            .where('o.userId', user.userId)
            .orderBy('o.orderId', 'desc');

        return res.status(200).json(orders);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not retrieve orders');
    }
  });

  // View order details for a specific order
  app.get('/api/v1/order/details/:orderId', async (req, res) => {
    try {
        const user = await getUser(req);

        const orderId = req.params.orderId;
        if (!orderId) {
            return res.status(400).send('orderId is required');
        }

        // Get order details
        const order = await db.select('*')
            .from('FoodTruck.Orders')
            .where({ orderId })
            .first();

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Verify ownership
        if (order.userId !== user.userId) {
            return res.status(403).send('You do not have access to this order');
        }

        // Get order items with menu item details
        const orderItems = await db.select(
            'oi.itemId',
            'oi.quantity',
            'mi.name',
            'mi.description',
            'mi.price',
            'mi.category'
        )
            .from({ oi: 'FoodTruck.OrderItems' })
            .join('FoodTruck.MenuItems as mi', 'oi.itemId', 'mi.itemId')
            .where('oi.orderId', orderId);

        const orderDetails = {
            ...order,
            items: orderItems
        };

        return res.status(200).json(orderDetails);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not retrieve order details');
    }
  });

  // ========== TRUCK OWNER ORDER ENDPOINTS ==========

  // View all orders for truck owner's truck
  app.get('/api/v1/order/truckOrders', async (req, res) => {
    try {
        const user = await getUser(req);

        if (user.role !== 'truckOwner') {
            return res.status(403).send('Only truck owners can view truck orders');
        }

        const truckId = user.truckId;
        if (!truckId) {
            return res.status(400).send('No truck associated with this owner');
        }

        const orders = await db.select(
            'o.orderId',
            'o.userId',
            'o.truckId',
            'o.totalPrice',
            'o.pickupTime',
            'o.orderStatus',
            'o.createdAt',
            'u.name',
            'u.email'
        )
            .from({ o: 'FoodTruck.Orders' })
            .join('FoodTruck.Users as u', 'o.userId', 'u.userId')
            .where('o.truckId', truckId)
            .orderBy('o.orderId', 'desc');

        return res.status(200).json(orders);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not retrieve truck orders');
    }
  });

  // Update order status (truck owner only)
  app.put('/api/v1/order/updateStatus/:orderId', async (req, res) => {
    try {
        const user = await getUser(req);

        if (user.role !== 'truckOwner') {
            return res.status(403).send('Only truck owners can update order status');
        }

        const truckId = user.truckId;
        if (!truckId) {
            return res.status(400).send('No truck associated with this owner');
        }

        const orderId = req.params.orderId;
        if (!orderId) {
            return res.status(400).send('orderId is required');
        }

        const { orderStatus } = req.body;
        if (!orderStatus) {
            return res.status(400).send('orderStatus is required');
        }

        // Validate status
        const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
        if (!validStatuses.includes(orderStatus)) {
            return res.status(400).send(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        // Get the order
        const order = await db.select('*')
            .from('FoodTruck.Orders')
            .where({ orderId })
            .first();

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Verify the order belongs to the truck owner's truck
        if (order.truckId !== truckId) {
            return res.status(403).send('You do not have access to this order');
        }

        // Update the order status
        await db('FoodTruck.Orders')
            .where({ orderId })
            .update({ orderStatus });

        return res.status(200).json({ message: 'order status updated successfully' });
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not update order status');
    }
  });

  // View order details for truck owner
  app.get('/api/v1/order/truckOwner/:orderId', async (req, res) => {
    try {
        const user = await getUser(req);

        if (user.role !== 'truckOwner') {
            return res.status(403).send('Only truck owners can view order details');
        }

        const truckId = user.truckId;
        if (!truckId) {
            return res.status(400).send('No truck associated with this owner');
        }

        const orderId = req.params.orderId;
        if (!orderId) {
            return res.status(400).send('orderId is required');
        }

        // Get order details
        const order = await db.select('*')
            .from('FoodTruck.Orders')
            .where({ orderId })
            .first();

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Verify the order belongs to the truck owner's truck
        if (order.truckId !== truckId) {
            return res.status(403).send('You do not have access to this order');
        }

        // Get order items with menu item details
        const orderItems = await db.select(
            'oi.itemId',
            'oi.quantity',
            'mi.name',
            'mi.description',
            'mi.price',
            'mi.category'
        )
            .from({ oi: 'FoodTruck.OrderItems' })
            .join('FoodTruck.MenuItems as mi', 'oi.itemId', 'mi.itemId')
            .where('oi.orderId', orderId);

        const orderDetails = {
            ...order,
            items: orderItems
        };

        return res.status(200).json(orderDetails);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not retrieve order details');
    }
  });

  // ========== TRUCK MANAGEMENT ENDPOINTS ==========

  // Update truck order availability status
  app.put('/api/v1/trucks/updateOrderStatus', async (req, res) => {
    try {
        const user = await getUser(req);

        if (user.role !== 'truckOwner') {
            return res.status(403).send('Only truck owners can update truck status');
        }

        const truckId = user.truckId;
        if (!truckId) {
            return res.status(400).send('No truck associated with this owner');
        }

        const { orderStatus } = req.body;
        if (!orderStatus) {
            return res.status(400).send('orderStatus is required');
        }

        // Validate orderStatus
        const validStatuses = ['available', 'unavailable'];
        if (!validStatuses.includes(orderStatus)) {
            return res.status(400).send(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        // Update the truck's order status
        await db('FoodTruck.Trucks')
            .where({ truckId })
            .update({ orderStatus });

        return res.status(200).json({ message: 'truck order status updated successfully' });
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not update truck status');
    }
  });

  // Search menu items by category for a specific truck
  app.get('/api/v1/menuItem/truck/:truckId/category/:category', async (req, res) => {
    try {
        const user = await getUser(req);

        const truckId = req.params.truckId;
        const category = req.params.category;

        if (!truckId) {
            return res.status(400).send('truckId is required');
        }
        if (!category) {
            return res.status(400).send('category is required');
        }

        // Verify truck exists and is available
        const truck = await db.select('*')
            .from('FoodTruck.Trucks')
            .where({ truckId, truckStatus: 'available', orderStatus: 'available' })
            .first();

        if (!truck) {
            return res.status(404).send('Truck not found or not available');
        }

        // Get menu items filtered by category
        const items = await db.select('*')
            .from('FoodTruck.MenuItems')
            .where({ truckId, category, status: 'available' })
            .orderBy('itemId', 'asc');

        return res.status(200).json(items);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not retrieve menu items');
    }
  });

  // View truck owner's own truck information
  app.get('/api/v1/trucks/myTruck', async (req, res) => {
    try {
        const user = await getUser(req);

        if (user.role !== 'truckOwner') {
            return res.status(403).send('Only truck owners can view their truck information');
        }

        const truckId = user.truckId;
        if (!truckId) {
            return res.status(400).send('No truck associated with this owner');
        }

        const truck = await db.select('*')
            .from('FoodTruck.Trucks')
            .where({ truckId })
            .first();

        if (!truck) {
            return res.status(404).send('Truck not found');
        }

        return res.status(200).json(truck);
    } catch (err) {
        console.log(err.message);
        return res.status(500).send('Could not retrieve truck information');
    }
  });

};



module.exports = {handlePrivateBackendApi};
