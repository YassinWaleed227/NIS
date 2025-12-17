const db = require('../../connectors/db');
const { getSessionToken, getUser } = require('../../utils/session');
require('dotenv').config();

function handlePrivateFrontEndView(app) {
    // Dashboard route
    app.get('/dashboard', async (req, res) => {
        try {
            const user = await getUser(req);
            if (!user) {
                return res.redirect('/login');
            }
            
            if (user.role === 'truckOwner') {
                const truck = await db('FoodTruck.Trucks')
                    .where('ownerId', user.userId)
                    .first();
                
                if (!truck) {
                    return res.redirect('/firstTimeSetup');
                }
                
                return res.render('truckOwnerHomePage', { 
                    name: user.name,
                    role: 'truckOwner' 
                });
            }
            
            return res.render('customerHomepage', { 
                name: user.name,
                role: 'customer' 
            });
        } catch (error) {
            console.error('Dashboard error:', error);
            return res.status(500).render('error', { message: 'Internal server error' });
        }
    });

    // First-time setup (onboarding for new truck owners)
    app.get('/firstTimeSetup', async (req, res) => {
        try {
            const user = await getUser(req);
            if (!user) {
                return res.redirect('/login');
            }
            
            if (user.role !== 'truckOwner') {
                return res.status(403).render('error', { message: 'Only truck owners can access this page' });
            }
            
            const truck = await db('FoodTruck.Trucks')
                .where('ownerId', user.userId)
                .first();
            
            if (truck) {
                // User already has a truck, redirect to dashboard
                return res.redirect('/truckOwnerHome');
            }
            
            return res.render('firstTimeSetup', { 
                name: user.name,
                role: 'truckOwner'
            });
        } catch (error) {
            console.error('First-time setup error:', error);
            return res.status(500).render('error', { message: 'Error loading setup page' });
        }
    });

    // Menu management
    app.get('/menu', async (req, res) => {
        try {
            const user = await getUser(req);
            if (!user) {
                return res.redirect('/login');
            }
            return res.render('menu', { 
                name: user.name,
                role: user.role
            });
        } catch (error) {
            console.error('Menu error:', error);
            return res.status(500).render('error', { message: 'Error loading menu' });
        }
    });

    // Trucks listing
    app.get('/trucks', async (req, res) => {
        try {
            const user = await getUser(req);
            if (!user) {
                return res.redirect('/login');
            }
            return res.render('trucks', { 
                name: user.name,
                role: user.role,
                isOwner: user.role === 'truckOwner'
            });
        } catch (error) {
            console.error('Trucks error:', error);
            return res.status(500).render('error', { message: 'Error loading trucks' });
        }
    });

    // Cart view
    app.get('/cart', async (req, res) => {
        try {
            const user = await getUser(req);
            if (!user) {
                return res.redirect('/login');
            }
            return res.render('cart', { 
                name: user.name,
                role: user.role
            });
        } catch (error) {
            console.error('Cart error:', error);
            return res.status(500).render('error', { message: 'Error loading cart' });
        }
    });

    // Orders view
    app.get('/orders', async (req, res) => {
        try {
            const user = await getUser(req);
            if (!user) {
                return res.redirect('/login');
            }
            return res.render('orders', { 
                name: user.name,
                role: user.role,
                isOwner: user.role === 'truckOwner'
            });
        } catch (error) {
            console.error('Orders error:', error);
            return res.status(500).render('error', { message: 'Error loading orders' });
        }
    });

    // Truck management (for owners)
    app.get('/my-truck', async (req, res) => {
        try {
            const user = await getUser(req);
            if (!user || user.role !== 'truckOwner') {
                return res.status(403).render('error', { message: 'Access denied' });
            }
            return res.render('trucks', { 
                name: user.name,
                role: 'truckOwner'
            });
        } catch (error) {
            console.error('Truck management error:', error);
            return res.status(500).render('error', { message: 'Error loading truck management' });
        }
    });

    // Truck owner home
    app.get('/truckOwnerHome', async (req, res) => {
        try {
            const user = await getUser(req);
            if (!user || user.role !== 'truckOwner') {
                return res.status(403).render('error', { message: 'Access denied' });
            }
            

            const truck = await db('FoodTruck.Trucks')
                .where('ownerId', user.userId)
                .first();
            
            if (!truck) {
                // No truck found, redirect to trucks page to create one
                return res.redirect('/trucks');
            }
            
            return res.render('truckOwnerHomePage', { 
                name: user.name,
                role: 'truckOwner'
            });
        } catch (error) {
            console.error('Truck owner home error:', error);
            return res.status(500).render('error', { message: 'Error loading dashboard' });
        }
    });

    // Truck orders view
    app.get('/truckOrders', async (req, res) => {
        try {
            const user = await getUser(req);
            if (!user || user.role !== 'truckOwner') {
                return res.status(403).render('error', { message: 'Access denied' });
            }
            return res.render('truckOrders', { 
                name: user.name,
                role: 'truckOwner'
            });
        } catch (error) {
            console.error('Truck orders error:', error);
            return res.status(500).render('error', { message: 'Error loading orders' });
        }
    });

    // Truck menu management
    app.get('/truckMenu', async (req, res) => {
        try {
            const user = await getUser(req);
            if (!user || user.role !== 'truckOwner') {
                return res.status(403).render('error', { message: 'Access denied' });
            }
            return res.render('truckMenuManagement', { 
                name: user.name,
                role: 'truckOwner'
            });
        } catch (error) {
            console.error('Truck menu error:', error);
            return res.status(500).render('error', { message: 'Error loading menu management' });
        }
    });

    // Add menu item page
    app.get('/addMenuItem', async (req, res) => {
        try {
            const user = await getUser(req);
            if (!user || user.role !== 'truckOwner') {
                return res.status(403).render('error', { message: 'Access denied' });
            }
            return res.render('addMenuItem', { 
                name: user.name,
                role: 'truckOwner'
            });
        } catch (error) {
            console.error('Add menu item error:', error);
            return res.status(500).render('error', { message: 'Error loading add menu item page' });
        }
    });

    // Edit menu item page
    app.get('/editMenuItem/:itemId', async (req, res) => {
        try {
            const user = await getUser(req);
            if (!user || user.role !== 'truckOwner') {
                return res.status(403).render('error', { message: 'Access denied' });
            }
            const itemId = req.params.itemId;
            return res.render('editMenuItem', { 
                name: user.name,
                role: 'truckOwner',
                itemId: itemId
            });
        } catch (error) {
            console.error('Edit menu item error:', error);
            return res.status(500).render('error', { message: 'Error loading edit menu item page' });
        }
    });

}

module.exports = { handlePrivateFrontEndView };   