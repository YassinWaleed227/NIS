const db = require('../../connectors/db');
const { getSessionToken, getUser } = require('../../utils/session');
const axios = require('axios');
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
            return res.render('truckManagement', { 
                name: user.name,
                role: 'truckOwner'
            });
        } catch (error) {
            console.error('Truck management error:', error);
            return res.status(500).render('error', { message: 'Error loading truck management' });
        }
    });

    // Testing Axios route
    app.get('/testingAxios', async (req, res) => {
        try {
            const result = await axios.get(`http://localhost:${process.env.PORT || 3000}/test`);
            return res.status(200).send(result.data);
        } catch (error) {
            console.error('Axios error:', error);
            return res.status(400).send(error.message);
        }
    });
}

module.exports = { handlePrivateFrontEndView };