const db = require('../../connectors/db');
const { getUser } = require('../../utils/session');

function handlePrivateBackendApi(app) {
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

      if (!name || price === undefined) {
        return res.status(400).json({ error: 'Name and price are required' });
      }

      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ error: 'Price must be a non-negative number' });
      }

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
          truckId: user.truckId
        })
        .orderBy('itemId', 'asc');

      const itemsWithNumbers = items.map((item, index) => {
        return {
          itemId: item.itemId,
          itemNumber: index + 1,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          status: item.status,
          truckId: item.truckId,
          createdAt: item.createdAt
        };
      });

      return res.status(200).json(itemsWithNumbers);
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

      const itemId = parseInt(req.params.itemId, 10);
      if (isNaN(itemId)) {
        return res.status(400).json({ error: 'Invalid item ID' });
      }

      const item = await db('FoodTruck.MenuItems')
        .where('itemId', itemId)
        .where('truckId', user.truckId)
        .first();

      if (!item) {
        console.error(`Item ${itemId} not found for truck ${user.truckId}`);
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

      // Hard delete - actually remove the item
      const result = await db('FoodTruck.MenuItems')
        .where({
          itemId: req.params.itemId,
          truckId: user.truckId
        })
        .del();

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

      // Add sequential item number
      const itemsWithNumbers = items.map((item, index) => ({
        ...item,
        itemNumber: index + 1
      }));

      return res.status(200).json(itemsWithNumbers);
    } catch (err) {
      console.error('Error fetching menu items:', err);
      return res.status(500).json({ error: 'Could not retrieve menu items' });
    }
  });

  // =======================================
  // 7.5 View Menu Items by Truck & Category
  // =======================================
  app.get('/api/v1/menuItem/truck/:truckId/category/:category', async (req, res) => {
    try {
      const { truckId, category } = req.params;

      const items = await db('FoodTruck.MenuItems')
        .where({ 
          truckId,
          category,
          status: 'available' 
        })
        .orderBy('itemId', 'asc');

      return res.status(200).json(items);
    } catch (err) {
      console.error('Error fetching menu items by category:', err);
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
    try {
      const user = await getUser(req);
      if (!user || user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customers can place orders' });
      }
      
      const trx = await db.transaction();
      
      try {

        const { scheduledPickupTime } = req.body;
        
        if (!scheduledPickupTime) {
          await trx.rollback();
          return res.status(400).json({ error: 'scheduledPickupTime is required' });
        }

        const cartItems = await trx('FoodTruck.Carts')
          .where({ userId: user.userId })
          .join('FoodTruck.MenuItems', 'FoodTruck.Carts.itemId', 'FoodTruck.MenuItems.itemId')
          .select(
            'FoodTruck.Carts.cartId',
            'FoodTruck.Carts.itemId',
            'FoodTruck.Carts.quantity',
            'FoodTruck.Carts.price',
            'FoodTruck.MenuItems.truckId'
          );

        if (!cartItems || cartItems.length === 0) {
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
        
        // Check if truck is available
        const truck = await trx('FoodTruck.Trucks')
          .where('truckId', truckId)
          .first();
        
        if (!truck) {
          await trx.rollback();
          return res.status(404).json({ error: 'Truck not found' });
        }
        
        if (truck.truckStatus !== 'available') {
          await trx.rollback();
          return res.status(400).json({ error: 'This truck does not process orders at the moment' });
        }
        
        // Calculate total price
        const totalPrice = cartItems.reduce((sum, item) => {
          return sum + (parseFloat(item.price) * parseInt(item.quantity));
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
          })
          .returning('orderId');
        
        // Get the inserted order ID
        if (!orderResult || orderResult.length === 0) {
          await trx.rollback();
          return res.status(500).json({ error: 'Failed to create order - no ID returned' });
        }

        const orderId = orderResult[0].orderId || orderResult[0];
        if (!orderId) {
          await trx.rollback();
          return res.status(500).json({ error: 'Failed to get order ID' });
        }

        // Create order items
        const orderItems = cartItems.map(item => ({
          orderId: orderId,
          itemId: item.itemId,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price)
        }));

        await trx('FoodTruck.OrderItems').insert(orderItems);

        // Clear the cart
        await trx('FoodTruck.Carts')
          .where({ userId: user.userId })
          .del();

        await trx.commit();
        
        return res.status(200).json({ 
          message: 'Order placed successfully',
          orderId: orderId
        });
      } catch (err) {
        await trx.rollback();
        console.error('Error placing order:', err);
        return res.status(500).json({ error: 'Could not place order: ' + err.message });
      }
    } catch (err) {
      console.error('Error placing order (outer):', err);
      return res.status(500).json({ error: 'Could not place order: ' + err.message });
    }
  });

  // =====================
  // 13. Delete a menu item (soft delete)
  // =====================
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

  // Get truck statistics (for dashboard)
  app.get('/api/v1/truck/stats', async (req, res) => {
    try {
      const user = await getUser(req);
      
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can view stats' });
      }

      // Get truck info
      const truck = await db('FoodTruck.Trucks')
        .where('ownerId', user.userId)
        .first();

      if (!truck) {
        return res.status(404).json({ error: 'No truck found for this owner' });
      }

      // Get menu item count
      const menuItems = await db('FoodTruck.MenuItems')
        .where({ truckId: truck.truckId, status: 'available' })
        .count('itemId as count')
        .first();

      // Get pending orders count
      const pendingOrders = await db('FoodTruck.Orders')
        .where({ truckId: truck.truckId, orderStatus: 'pending' })
        .count('orderId as count')
        .first();

      // Get completed orders count
      const completedOrders = await db('FoodTruck.Orders')
        .where({ truckId: truck.truckId, orderStatus: 'completed' })
        .count('orderId as count')
        .first();

      return res.status(200).json({
        truckName: truck.truckName,
        ownerName: user.name,
        truckStatus: truck.truckStatus,
        orderStatus: truck.orderStatus,
        menuItemCount: parseInt(menuItems?.count || 0),
        pendingOrderCount: parseInt(pendingOrders?.count || 0),
        completedOrderCount: parseInt(completedOrders?.count || 0)
      });
    } catch (err) {
      console.error('Error fetching truck stats:', err);
      return res.status(500).json({ error: 'Could not retrieve truck statistics' });
    }
  });

  // Update truck status (availability)
  app.put('/api/v1/truck/updateStatus', async (req, res) => {
    try {
      const user = await getUser(req);
      
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Only truck owners can update status' });
      }

      const { orderStatus } = req.body;
      
      if (!orderStatus || (orderStatus !== 'available' && orderStatus !== 'unavailable')) {
        return res.status(400).json({ error: 'Invalid order status' });
      }

      const result = await db('FoodTruck.Trucks')
        .where('ownerId', user.userId)
        .update({ truckStatus: orderStatus });

      if (result === 0) {
        return res.status(404).json({ error: 'No truck found for this owner' });
      }

      return res.status(200).json({
        message: 'Truck status updated successfully',
        orderStatus
      });
    } catch (err) {
      console.error('Error updating truck status:', err);
      return res.status(500).json({ error: 'Could not update truck status' });
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
        .orderBy('orderId', 'asc');

      // Map database column names to API format and add user order number based on creation order
      const mappedOrders = orders.map((order, index) => ({
        orderId: order.orderId,
        userId: order.userId,
        truckId: order.truckId,
        orderStatus: order.orderStatus,
        totalPrice: order.totalPrice,
        scheduledPickupTime: order.scheduledPickupTime,
        orderDate: order.orderDate,
        createdAt: order.createdAt,
        truckName: order.truckName,
        userOrderNumber: index + 1
      }));

      // Sort by date descending for display (newest first) but keep order numbers
      mappedOrders.sort((a, b) => b.orderDate - new Date(a.orderDate).getTime() ? -1 : 1);

      return res.status(200).json(mappedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      return res.status(500).json({ error: 'Could not retrieve orders' });
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
          'u.name as customerName',
          'u.email as email'
        )
        .orderBy('orderId', 'asc');

      // Map database column names to API format and add truck order number based on creation order
      const mappedOrders = orders.map((order, index) => ({
        orderId: order.orderId,
        userId: order.userId,
        truckId: order.truckId,
        status: order.orderStatus,
        totalAmount: order.totalPrice,
        pickupTime: order.scheduledPickupTime,
        orderDate: order.orderDate,
        createdAt: order.createdAt,
        customerName: order.customerName,
        email: order.email,
        truckOrderNumber: index + 1
      }));

      // Sort by date descending for display (newest first) but keep order numbers
      mappedOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

      return res.status(200).json(mappedOrders);
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

      // Accept both 'status' and 'orderStatus' from request body
      const newStatus = req.body.status || req.body.orderStatus;
      const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
      
      if (!newStatus) {
        return res.status(400).json({ error: 'Status is required' });
      }

      if (!validStatuses.includes(newStatus)) {
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
        orderStatus: newStatus
      };

      const result = await db('FoodTruck.Orders')
        .where({
          orderId: req.params.orderId,
          truckId: truck.truckId
        })
        .update(updates)
        .returning('*');

      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'Order not found or not associated with your truck' });
      }

      const updatedOrder = result[0];

      return res.status(200).json({ 
        message: 'Order status updated successfully',
        order: {
          orderId: updatedOrder.orderId,
          status: updatedOrder.orderStatus,
          totalAmount: updatedOrder.totalPrice
        }
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

  // ========================
  // Get Order Details
  // ========================
  app.get('/api/v1/order/details/:orderId', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: 'Invalid order ID' });
      }

      const order = await db('FoodTruck.Orders')
        .where('FoodTruck.Orders.orderId', orderId)
        .innerJoin('FoodTruck.Trucks', 'FoodTruck.Orders.truckId', 'FoodTruck.Trucks.truckId')
        .innerJoin('FoodTruck.Users as u', 'FoodTruck.Orders.userId', 'u.userId')
        .select(
          'FoodTruck.Orders.*',
          'FoodTruck.Trucks.truckName',
          'FoodTruck.Trucks.truckLogo',
          'u.name as customerName',
          'u.email'
        )
        .first();

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Verify user can see this order
      if (user.role === 'customer' && order.userId !== user.userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (user.role === 'truckOwner' && order.truckId !== user.truckId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const items = await db('FoodTruck.OrderItems')
        .where('FoodTruck.OrderItems.orderId', orderId)
        .innerJoin('FoodTruck.MenuItems', 'FoodTruck.OrderItems.itemId', 'FoodTruck.MenuItems.itemId')
        .select(
          'FoodTruck.OrderItems.*',
          'FoodTruck.MenuItems.name',
          'FoodTruck.MenuItems.category'
        );

      const mappedOrder = {
        orderId: order.orderId,
        userId: order.userId,
        truckId: order.truckId,
        status: order.orderStatus,
        totalAmount: order.totalPrice,
        pickupTime: order.scheduledPickupTime,
        orderDate: order.orderDate,
        createdAt: order.createdAt,
        truckName: order.truckName,
        truckLogo: order.truckLogo,
        customerName: order.customerName,
        items: items.map(item => ({
          orderItemId: item.orderItemId,
          orderId: item.orderId,
          itemId: item.itemId,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          category: item.category
        }))
      };

      return res.status(200).json(mappedOrder);
    } catch (err) {
      console.error('Error fetching order details:', err);
      return res.status(500).json({ error: 'Could not fetch order details' });
    }
  });

  return app;
}

module.exports = {handlePrivateBackendApi};