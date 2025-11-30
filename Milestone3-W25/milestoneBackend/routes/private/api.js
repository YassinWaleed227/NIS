const db = require('../../connectors/db');
const { getUser } = require('../../utils/session');

function handlePrivateBackendApi(app) {
  // Test endpoint
  app.get('/test', async (req, res) => {
    try {
      return res.status(200).json({ message: 'Successful connection' });
    } catch (err) {
      console.error('Test endpoint error:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ==================
  // 1. Create Menu Item
  // ==================
  app.post('/api/v1/menuItem/new', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user || user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can add menu items' });
      }

      const { name, price, description, category } = req.body;

      // Input validation
      if (!name || price === undefined) {
        return res.status(400).json({ error: 'Name and price are required' });
      }

      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ error: 'Price must be a non-negative number' });
      }

      // Create new menu item with default status and createdAt
      await db('FoodTruck.MenuItems').insert({
        truckId: user.truckId,
        name,
        price: parsedPrice,
        description: description || null,
        category: category || 'general',
        status: 'available',
        createdAt: new Date()
      });

      return res.status(201).json({ 
        message: 'Menu item was created successfully' 
      });
    } catch (err) {
      console.error('Error creating menu item:', err);
      return res.status(500).json({ error: 'Could not create menu item' });
    }
  });

  // ============================
  // 2. View My Truck's Menu Items
  // ============================
  app.get('/api/v1/menuItem/view', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user || user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can view menu items' });
      }

      const items = await db('FoodTruck.MenuItems')
        .where({ 
          truckId: user.truckId,
          status: 'available' 
        })
        .orderBy('itemId', 'asc');

      return res.status(200).json(items);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      return res.status(500).json({ error: 'Could not retrieve menu items' });
    }
  });

  // =========================
  // 3. View Specific Menu Item
  // =========================
  app.get('/api/v1/menuItem/view/:itemId', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user || user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can view menu items' });
      }

      const item = await db('FoodTruck.MenuItems')
        .where({
          itemId: req.params.itemId,
          truckId: user.truckId,
          status: 'available'
        })
        .first();

      if (!item) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      return res.status(200).json(item);
    } catch (err) {
      console.error('Error fetching menu item:', err);
      return res.status(500).json({ error: 'Could not retrieve menu item' });
    }
  });

  // =======================
  // 4. Edit Menu Item
  // =======================
  app.put('/api/v1/menuItem/edit/:itemId', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user || user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can edit menu items' });
      }

      const { name, price, category, description } = req.body;
      const updates = {};

      // Only update fields that are provided
      if (name !== undefined) updates.name = name;
      if (price !== undefined) {
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          return res.status(400).json({ error: 'Price must be a non-negative number' });
        }
        updates.price = parsedPrice;
      }
      if (category !== undefined) updates.category = category;
      if (description !== undefined) updates.description = description;

      // Update the menu item
      const result = await db('FoodTruck.MenuItems')
        .where({
          itemId: req.params.itemId,
          truckId: user.truckId,
          status: 'available'
        })
        .update(updates);

      if (result === 0) {
        return res.status(404).json({ error: 'Menu item not found or not owned by you' });
      }

      return res.status(200).json({ 
        message: 'Menu item updated successfully' 
      });
    } catch (err) {
      console.error('Error updating menu item:', err);
      return res.status(500).json({ error: 'Could not update menu item' });
    }
  });

  // =========================
  // 5. Delete Menu Item
  // =========================
  app.delete('/api/v1/menuItem/delete/:itemId', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user || user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can delete menu items' });
      }

      // Soft delete by updating status to 'unavailable'
      const result = await db('FoodTruck.MenuItems')
        .where({
          itemId: req.params.itemId,
          truckId: user.truckId,
          status: 'available'
        })
        .update({ status: 'unavailable' });

      if (result === 0) {
        return res.status(404).json({ error: 'Menu item not found or not owned by you' });
      }

      return res.status(200).json({ 
        message: 'Menu item deleted successfully' 
      });
    } catch (err) {
      console.error('Error deleting menu item:', err);
      return res.status(500).json({ error: 'Could not delete menu item' });
    }
  });

  // =========================
  // 6. View All Available Trucks
  // =========================
  app.get('/api/v1/trucks/view', async (req, res) => {
    try {
      const trucks = await db('FoodTruck.Trucks')
        .where('truckStatus', 'available')
        .orderBy('truckId', 'asc');

      return res.status(200).json(trucks);
    } catch (err) {
      console.error('Error fetching trucks:', err);
      return res.status(500).json({ error: 'Could not retrieve trucks' });
    }
  });

  // =================================
  // 7. View Menu Items for Specific Truck
  // =================================
  app.get('/api/v1/menu-item/truck/:truckId', async (req, res) => {
    try {
      const truckId = req.params.truckId;

      const items = await db('FoodTruck.MenuItems')
        .where({ 
          truckId,
          status: 'available' 
        })
        .orderBy('itemId', 'asc');

      return res.status(200).json(items);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      return res.status(500).json({ error: 'Could not retrieve menu items' });
    }
  });

  // ===============================
  // 8. Add Menu Item to Cart
  // ===============================
  app.post('/api/v1/cart/new', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user || user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can add items to cart' });
      }

      const { itemId, quantity, price } = req.body;
      
      // Input validation
      if (!itemId || quantity === undefined || price === undefined) {
        return res.status(400).json({ error: 'itemId, quantity, and price are required' });
      }

      // Validate quantity is positive
      const parsedQuantity = parseInt(quantity);
      if (isNaN(parsedQuantity) || parsedQuantity < 1) {
        return res.status(400).json({ error: 'Quantity must be at least 1' });
      }

      // Check if the item exists and is available
      const menuItem = await db('FoodTruck.MenuItems')
        .where({ 
          itemId,
          status: 'available' 
        })
        .first();

      if (!menuItem) {
        return res.status(404).json({ error: 'Menu item not found or not available' });
      }

      // Check if cart is empty or has items from the same truck
      const existingCartItems = await db('FoodTruck.Carts')
        .where({ userId: user.userId })
        .select('itemId');

      if (existingCartItems.length > 0) {
        // Get truck ID of the item being added
        const itemTruckId = menuItem.truckId;
        
        // Get truck ID of items already in cart
        const existingItem = await db('FoodTruck.MenuItems')
          .where('itemId', existingCartItems[0].itemId)
          .first();
        
        if (existingItem && existingItem.truckId !== itemTruckId) {
          return res.status(400).json({ 
            error: 'Cannot order from multiple trucks. Please clear your cart first.' 
          });
        }
      }

      // Add item to cart
      await db('FoodTruck.Carts').insert({
        userId: user.userId,
        itemId,
        quantity: parsedQuantity,
        price
      });

      return res.status(200).json({ 
        message: 'Item added to cart successfully' 
      });
    } catch (err) {
      console.error('Error adding item to cart:', err);
      return res.status(500).json({ error: 'Could not add item to cart' });
    }
  });

  // =====================
  // 9. View Cart
  // =====================
  app.get('/api/v1/cart/view', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user || user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can view their cart' });
      }

      const cartItems = await db('FoodTruck.Carts')
        .where({ userId: user.userId })
        .join('FoodTruck.MenuItems', 'Carts.itemId', 'MenuItems.itemId')
        .select(
          'Carts.cartId',
          'Carts.itemId',
          'MenuItems.name',
          'Carts.quantity',
          'Carts.price',
          'MenuItems.description',
          'MenuItems.category'
        )
        .orderBy('Carts.cartId', 'asc');

      return res.status(200).json(cartItems);
    } catch (err) {
      console.error('Error fetching cart:', err);
      return res.status(500).json({ error: 'Could not retrieve cart items' });
    }
  });

  // ==========================
  // 10. Delete Item from Cart
  // ==========================
  app.delete('/api/v1/cart/delete/:cartId', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user || user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can modify their cart' });
      }

      const cartId = req.params.cartId;
      
      // Delete only if the cart item belongs to the user
      const result = await db('FoodTruck.Carts')
        .where({
          cartId,
          userId: user.userId
        })
        .del();

      if (result === 0) {
        return res.status(404).json({ error: 'Cart item not found or not owned by you' });
      }

      return res.status(200).json({ 
        message: 'Item removed from cart successfully' 
      });
    } catch (err) {
      console.error('Error removing item from cart:', err);
      return res.status(500).json({ error: 'Could not remove item from cart' });
    }
  });

  // ==============================
  // 11. Edit Cart Item Quantity
  // ==============================
  app.put('/api/v1/cart/edit/:cartId', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user || user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can modify their cart' });
      }

      const cartId = req.params.cartId;
      const { quantity } = req.body;

      if (quantity === undefined || quantity < 1) {
        return res.status(400).json({ error: 'Valid quantity is required' });
      }

      // Update only if the cart item belongs to the user
      const result = await db('FoodTruck.Carts')
        .where({
          cartId,
          userId: user.userId
        })
        .update({ quantity });

      if (result === 0) {
        return res.status(404).json({ error: 'Cart item not found or not owned by you' });
      }

      return res.status(200).json({ 
        message: 'Cart updated successfully' 
      });
    } catch (err) {
      console.error('Error updating cart:', err);
      return res.status(500).json({ error: 'Could not update cart' });
    }
  });

  // =====================
  // 12. Place an Order
  // =====================
  app.post('/api/v1/order/new', async (req, res) => {
    const trx = await db.transaction();
    
    try {
      const user = await getUser(req);
      if (!user || user.role !== 'customer') {
        await trx.rollback();
        return res.status(403).json({ error: 'Only customers can place orders' });
      }

      const { scheduledPickupTime } = req.body;
      
      if (!scheduledPickupTime) {
        await trx.rollback();
        return res.status(400).json({ error: 'scheduledPickupTime is required' });
      }

      // Get cart items
      const cartItems = await trx('FoodTruck.Carts')
        .where({ userId: user.userId })
        .join('FoodTruck.MenuItems', 'Carts.itemId', 'MenuItems.itemId')
        .select(
          'Carts.cartId',
          'Carts.itemId',
          'Carts.quantity',
          'Carts.price',
          'MenuItems.truckId'
        );

      if (cartItems.length === 0) {
        await trx.rollback();
        return res.status(400).json({ error: 'Cart is empty' });
      }

      // Check if all items are from the same truck
      const truckIds = [...new Set(cartItems.map(item => item.truckId))];
      if (truckIds.length > 1) {
        await trx.rollback();
        return res.status(400).json({ 
          error: 'Cannot order from multiple trucks. Please adjust your cart.' 
        });
      }

      const truckId = truckIds[0];
      
      // Calculate total price
      const totalPrice = cartItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      // Create order
      const orderResult = await trx('FoodTruck.Orders')
        .insert({
          userId: user.userId,
          truckId,
          totalPrice,
          orderStatus: 'pending',
          scheduledPickupTime: new Date(scheduledPickupTime),
          orderDate: new Date()
        });
      
      // Get the inserted order ID
      const order = { orderId: orderResult[0] };

      // Create order items
      const orderItems = cartItems.map(item => ({
        orderId: order.orderId,
        itemId: item.itemId,
        quantity: item.quantity,
        price: item.price
      }));

      await trx('FoodTruck.OrderItems').insert(orderItems);

      // Clear the cart
      await trx('FoodTruck.Carts')
        .where({ userId: user.userId })
        .del();

      await trx.commit();
      
      return res.status(200).json({ 
        message: 'Order placed successfully',
        orderId: order.orderId
      });
    } catch (err) {
      await trx.rollback();
      console.error('Error placing order:', err);
      return res.status(500).json({ error: 'Could not place order' });
    }
  });

  // Delete a menu item (soft delete)
  app.delete('/api/v1/menu-item/:itemId', async (req, res) => {
    try {
      const user = await getUser(req);
      
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can delete menu items' });
      }

      const truckId = user.truckId;
      if (!truckId) {
        return res.status(400).json({ error: 'No truck associated with this owner' });
      }

      const itemId = parseInt(req.params.itemId, 10);
      if (isNaN(itemId)) {
        return res.status(400).json({ error: 'Invalid item ID' });
      }

      // Soft delete by setting status to 'unavailable'
      const result = await db('FoodTruck.MenuItems')
        .where({ 
          itemId,
          truckId
        })
        .update({ 
          status: 'unavailable'
        });

      if (result === 0) {
        return res.status(404).json({ error: 'Menu item not found' });
      }

      return res.status(200).json({
        message: 'Menu item deleted successfully'
      });
    } catch (err) {
      console.error('Error deleting menu item:', err);
      return res.status(500).json({ error: 'Could not delete menu item' });
    }
  });

  // Truck Endpoints
  // ==============

  // Create a new truck
  app.post('/api/v1/truck/new', async (req, res) => {
    try {
      const user = await getUser(req);
      
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can create trucks' });
      }

      const { truckName, truckLogo } = req.body;

      if (!truckName) {
        return res.status(400).json({ error: 'Truck name is required' });
      }

      // Check if truck name already exists
      const existingTruck = await db('FoodTruck.Trucks')
        .where('truckName', truckName)
        .first();
      
      if (existingTruck) {
        return res.status(400).json({ error: 'Truck name already exists' });
      }

      // Create new truck
      await db('FoodTruck.Trucks')
        .insert({
          truckName,
          truckLogo: truckLogo || null,
          ownerId: user.userId,
          truckStatus: 'available',
          orderStatus: 'available',
          createdAt: new Date()
        });

      return res.status(201).json({
        message: 'Truck created successfully'
      });
    } catch (err) {
      console.error('Error creating truck:', err);
      return res.status(500).json({ error: 'Could not create truck' });
    }
  });

  // Get current user's truck
  app.get('/api/v1/truck/myTruck', async (req, res) => {
    try {
      const user = await getUser(req);
      
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can view their truck' });
      }

      const truck = await db('FoodTruck.Trucks')
        .where('ownerId', user.userId)
        .first();

      if (!truck) {
        return res.status(404).json({ error: 'No truck found for this owner' });
      }

      return res.status(200).json(truck);
    } catch (err) {
      console.error('Error fetching truck:', err);
      return res.status(500).json({ error: 'Could not retrieve truck information' });
    }
  });

  // Update truck order status
  app.put('/api/v1/truck/order-status', async (req, res) => {
    try {
      const user = await getUser(req);
      
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can update order status' });
      }

      const { orderStatus } = req.body;
      
      if (orderStatus !== 'available' && orderStatus !== 'unavailable') {
        return res.status(400).json({ error: 'Invalid order status' });
      }

      const [updatedTruck] = await db('FoodTruck.Trucks')
        .where('ownerId', user.userId)
        .update({ 
          orderStatus
        })
        .returning('*');

      if (!updatedTruck) {
        return res.status(404).json({ error: 'No truck found for this owner' });
      }

      return res.status(200).json({
        message: 'Order status updated successfully',
        data: updatedTruck
      });
    } catch (err) {
      console.error('Error updating order status:', err);
      return res.status(500).json({ error: 'Could not update order status' });
    }
  });

  // =========================
  // 13. View My Orders (Customer)
  // =========================
  app.get('/api/v1/order/myOrders', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user || user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can view their orders' });
      }

      const orders = await db('FoodTruck.Orders')
        .where('userId', user.userId)
        .join('FoodTruck.Trucks', 'Orders.truckId', 'Trucks.truckId')
        .select(
          'Orders.*',
          'Trucks.truckName'
        )
        .orderBy('orderDate', 'desc');

      return res.status(200).json(orders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      return res.status(500).json({ error: 'Could not retrieve orders' });
    }
  });

  // ================================
  // 14. View Order Details (Customer)
  // ================================
  app.get('/api/v1/order/details/:orderId', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user || user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can view order details' });
      }

      const orderId = req.params.orderId;

      // Get order details
      const order = await db('FoodTruck.Orders')
        .where({
          orderId,
          userId: user.userId
        })
        .join('FoodTruck.Trucks', 'Orders.truckId', 'Trucks.truckId')
        .select(
          'Orders.*',
          'Trucks.truckName',
          'Trucks.truckLogo'
        )
        .first();

      if (!order) {
        return res.status(404).json({ error: 'Order not found or not owned by you' });
      }

      // Get order items
      const items = await db('FoodTruck.OrderItems')
        .where('orderId', orderId)
        .join('FoodTruck.MenuItems', 'OrderItems.itemId', 'MenuItems.itemId')
        .select(
          'OrderItems.*',
          'MenuItems.name',
          'MenuItems.description',
          'MenuItems.category'
        );

      return res.status(200).json({
        ...order,
        items
      });
    } catch (err) {
      console.error('Error fetching order details:', err);
      return res.status(500).json({ error: 'Could not retrieve order details' });
    }
  });

  // ===============================
  // 15. View Orders for My Truck
  // ===============================
  app.get('/api/v1/order/truckOrders', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user || user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can view truck orders' });
      }

      // Get the truck owned by this user
      const truck = await db('FoodTruck.Trucks')
        .where('ownerId', user.userId)
        .first();

      if (!truck) {
        return res.status(404).json({ error: 'No truck found for this owner' });
      }

      // Get all orders for this truck
      const orders = await db('FoodTruck.Orders')
        .where('truckId', truck.truckId)
        .join('FoodTruck.Users as u', 'Orders.userId', 'u.userId')
        .select(
          'Orders.*',
          'u.firstName as firstName',
          'u.lastName as lastName',
          'u.email as email'
        )
        .orderBy('orderDate', 'desc');

      return res.status(200).json(orders);
    } catch (err) {
      console.error('Error fetching truck orders:', err);
      return res.status(500).json({ error: 'Could not retrieve truck orders' });
    }
  });

  // =================================
  // 16. Update Order Status (Truck Owner)
  // =================================
  app.put('/api/v1/order/updateStatus/:orderId', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user || user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can update order status' });
      }

      const { orderStatus, estimatedEarliestPickup } = req.body;
      const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
      
      if (!validStatuses.includes(orderStatus)) {
        return res.status(400).json({ error: 'Invalid order status' });
      }

      // Get the truck owned by this user
      const truck = await db('FoodTruck.Trucks')
        .where('ownerId', user.userId)
        .first();

      if (!truck) {
        return res.status(404).json({ error: 'No truck found for this owner' });
      }

      // Update the order status
      const updates = { 
        orderStatus
      };

      // Add estimated pickup time if provided
      if (estimatedEarliestPickup) {
        updates.estimatedEarliestPickup = new Date(estimatedEarliestPickup);
      }

      const [updatedOrder] = await db('FoodTruck.Orders')
        .where({
          orderId: req.params.orderId,
          truckId: truck.truckId
        })
        .update(updates)
        .returning('*');

      if (!updatedOrder) {
        return res.status(404).json({ error: 'Order not found or not associated with your truck' });
      }

      return res.status(200).json({ 
        message: 'order status updated successfully',
        order: updatedOrder
      });
    } catch (err) {
      console.error('Error updating order status:', err);
      return res.status(500).json({ error: 'Could not update order status' });
    }
  });

  // ====================================
  // 17. View Order Details (Truck Owner)
  // ====================================
  app.get('/api/v1/order/truckOwner/:orderId', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user || user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can view order details' });
      }

      // Get the truck owned by this user
      const truck = await db('FoodTruck.Trucks')
        .where('ownerId', user.userId)
        .first();

      if (!truck) {
        return res.status(404).json({ error: 'No truck found for this owner' });
      }

      // Get order details
      const order = await db('FoodTruck.Orders')
        .where({
          orderId: req.params.orderId,
          truckId: truck.truckId
        })
        .join('FoodTruck.Users as u', 'Orders.userId', 'u.userId')
        .select(
          'Orders.*',
          'u.firstName as firstName',
          'u.lastName as lastName',
          'u.email as email',
          'u.phone as phone'
        )
        .first();

      if (!order) {
        return res.status(404).json({ error: 'Order not found or not associated with your truck' });
      }

      // Get order items
      const items = await db('FoodTruck.OrderItems')
        .where('orderId', order.orderId)
        .join('FoodTruck.MenuItems', 'OrderItems.itemId', 'MenuItems.itemId')
        .select(
          'OrderItems.*',
          'MenuItems.name',
          'MenuItems.description',
          'MenuItems.category'
        );

      return res.status(200).json({
        ...order,
        items
      });
    } catch (err) {
      console.error('Error fetching order details:', err);
      return res.status(500).json({ error: 'Could not retrieve order details' });
    }
  });

  return app;
}

module.exports = {handlePrivateBackendApi};