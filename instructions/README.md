# 🚚 GIU Food Truck Management System

A full-stack web application for managing food truck ordering operations.

## 🎯 Features

- **Customer Portal:** Browse trucks, view menus, place orders
- **Truck Owner Portal:** Create truck, manage menu items, view customer orders, track status
- **Real-time Order Management:** Live order updates
- **Role-Based Access Control:** Secure customer/owner separation
- **Session-Based Authentication:** Secure login with 30-minute expiry

## 🚀 Quick Start

### Prerequisites
- **Node.js** v14+ 
- **PostgreSQL** v12+ (running)
- **npm** v6+

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Setup Database
1. Start PostgreSQL service
2. Open pgAdmin
3. Run all SQL from `connectors/scripts.sql`

### 3️⃣ Configure Environment
Edit `.env` file:
```
PORT=3000
PASSWORD=<your-postgres-password>
```

### 4️⃣ Run Server
```bash
npm run server
```

Server runs at: **http://localhost:3000**

---

## 📚 Documentation

- **[Setup & Troubleshooting](SETUP_TROUBLESHOOTING_GUIDE.md)** - Complete setup guide and error fixes
- **[System Overview](SYSTEM_OVERVIEW_FOR_EVALUATION.md)** - Architecture & technical deep-dive
- **[Database Testing](DATABASE_TESTING_CHECKLIST.md)** - Test scenarios & SQL queries

---

## 📁 Project Structure

```
milestoneBackend/
├── server.js                 # Express server entry point
├── .env                      # Environment variables
├── package.json              # Dependencies
│
├── connectors/
│   ├── db.js                 # PostgreSQL connection
│   └── scripts.sql           # Database schema
│
├── middleware/
│   └── auth.js               # Session validation
│
├── utils/
│   └── session.js            # Cookie & user management
│
├── routes/
│   ├── public/               # Public routes (no auth)
│   │   ├── api.js            # Register/Login endpoints
│   │   └── view.js           # Login/Register pages
│   └── private/              # Private routes (auth required)
│       ├── api.js            # Business logic endpoints
│       └── view.js           # Protected pages
│
├── views/                    # Handlebars templates
│   ├── login.hjs
│   ├── register.hjs
│   ├── customerHomepage.hjs
│   ├── truckOwnerHomePage.hjs
│   ├── firstTimeSetup.hjs
│   ├── menu.hjs
│   ├── cart.hjs
│   └── ...
│
└── public/                   # Static assets
    ├── js/                   # JavaScript
    ├── styles/               # CSS
    └── images/               # SVG icons
```

---

## 🔑 Key Endpoints

### Public (No Auth)
- `POST /api/v1/user` - Register new user
- `POST /api/v1/user/login` - Login

### Private (Auth Required)
- `GET /dashboard` - Dashboard (customer/owner)
- `GET /truckOwnerHome` - Owner dashboard
- `GET /firstTimeSetup` - New owner onboarding
- `POST /api/v1/menuItem/new` - Create menu item
- `POST /api/v1/order/new` - Place order
- `GET /api/v1/order/myOrders` - View my orders

---

## 🗄️ Database

- **Schema:** FoodTruck (PostgreSQL)
- **Tables:** 7 (Users, Trucks, MenuItems, Orders, OrderItems, Carts, Sessions)
- **Security:** Foreign keys, cascade deletes, password hashing

---

## 🛡️ Security

✅ Password hashing with bcrypt
✅ Session tokens (UUID)
✅ SQL injection prevention (Knex.js)
✅ Role-based access control
✅ Automatic session expiry (30 min)

---

## 👥 User Roles

### Customer
- Browse available trucks
- View truck menus
- Add items to cart
- Place orders
- View order history

### Truck Owner
- Create truck 
- Create/edit menu items
- View incoming orders
- Update order status
- Toggle truck availability
- View order statistics

---

## ⚡ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, Handlebars (HJS), jQuery, Bootstrap |
| Backend | Node.js, Express.js |
| Database | PostgreSQL, Knex.js |
| Authentication | bcrypt, UUID, Sessions |
| Styling | Custom CSS (Glass Morphism) |

---

## 🚨 Common Issues

**Server won't start?**
→ See [Setup & Troubleshooting](SETUP_TROUBLESHOOTING_GUIDE.md)

**Port 3000 already in use?**
→ Change `PORT=3001` in `.env`

**Database connection failed?**
→ Check PostgreSQL is running and `.env` password is correct

---

## 📝 API Documentation

### User Registration
```
POST /api/v1/user
Body: { name, email, password }
Response: { message, sessionToken }
```

### Login
```
POST /api/v1/user/login
Body: { email, password }
Response: { message, sessionToken }
```

### Create Order
```
POST /api/v1/order/new
Headers: { session_token: cookie }
Body: { truckId, items: [{itemId, quantity}] }
Response: { message, orderId }
```

Full API docs in [System Overview](SYSTEM_OVERVIEW_FOR_EVALUATION.md)

---

## 🧪 Testing

Use **Thunder Client** (VS Code extension) or **Postman** to test APIs:

1. Install Thunder Client extension
2. Open "Collections" in Thunder Client
3. Create requests for each endpoint
4. Test authentication flows

---

## 📞 Support

For detailed information:
- **Setup Issues:** See `SETUP_TROUBLESHOOTING_GUIDE.md`
- **Architecture:** See `SYSTEM_OVERVIEW_FOR_EVALUATION.md`
- **Testing:** See `DATABASE_TESTING_CHECKLIST.md`

---

## 🎓 Learning Resources

This project demonstrates:
- Full-stack web development
- RESTful API design
- Database relationships & transactions
- Authentication & authorization
- Real-world application architecture


---

## 📄 License

Educational Project - GIU

---

**Last Updated:** December 14, 2025
