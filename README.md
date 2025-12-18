# 🚚 GIU Food Truck Management System

## 📋 Project Title and Description

**GIU Food Truck Management System** is a full-stack web application that enables customers to browse and order from food trucks, while allowing truck owners to manage their inventory, process orders, and track business operations in real-time.

### Team Members
 
	Adham tamer	16001452	Tut 12
	Abdallah Mohamed	16001304	T12
 Ahmed wael	16002044	T12	 
 Martin maged	16002180	T07	
  Loai syam	16001400	T7
 Moustafa moataz	16003548	T11
 Yassin waleed	16001410	T8	
 Yehia farahat	16002749	T7

---

## ✨ Features

### 🛒 Customer Features
- **Browse Food Trucks**: View all available food trucks with real-time availability status
- **View Menus**: Browse truck-specific menus with items organized by category
- **Shopping Cart**: Add/remove items, adjust quantities before checkout
- **Place Orders**: Schedule pickup time and confirm orders with total price calculation
- **Order History**: View past orders with status tracking (pending, completed, cancelled)
- **Category Filtering**: Filter menu items by food category for better discovery

### 🏪 Truck Owner Features
- **Truck Management**: Create and manage food truck profile with logo
- **Menu Management**: Create, edit, and delete menu items with pricing
- **Order Management**: View incoming customer orders in real-time
- **Order Status Updates**: Update order status (pending → in-progress → completed)
- **Truck Availability**: Toggle truck status (open/closed) to control order acceptance
- **Analytics Dashboard**: View order counts, completed orders, and menu item statistics
- **First-Time Onboarding**: Dedicated setup page for new truck owners

### 🔐 Security Features
- **Session-Based Authentication**: Secure login with UUID tokens
- **Password Hashing**: bcrypt encryption for all passwords
- **Role-Based Access Control**: Separate customer and truck owner permissions
- **Session Expiry**: Automatic logout after 30 minutes of inactivity
- **Input Validation**: Email, password, and quantity validation on all inputs

---

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **Handlebars (HJS)** - Server-side templating engine
- **jQuery** - DOM manipulation and AJAX requests
- **Bootstrap 4** - Responsive CSS framework
- **Custom CSS** - Glass morphism design effects

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework (v4.21.2)
- **Knex.js** - SQL query builder (v2.5.1)
- **bcrypt** - Password hashing library (v6.0.0)
- **UUID** - Session token generation (v9.0.1)
- **dotenv** - Environment variable management (v16.6.1)

### Database
- **PostgreSQL** - Relational database (v12+)
- **FoodTruck Schema** - Custom database schema with 7 tables
- **Foreign Keys** - Referential integrity with cascade deletes

---

## 📊 Entity Relationship Diagram (ERD)

### Database Tables

#### Users Table
```
UserID (PK) | Name | Email (UNIQUE) | Password (Hashed) | Role | BirthDate | CreatedAt
```
- Role: 'customer' or 'truckOwner'
- Stores all user authentication data

#### Trucks Table
```
TruckID (PK) | TruckName (UNIQUE) | TruckLogo | OwnerID (FK) | TruckStatus | OrderStatus | CreatedAt
```
- OwnerID references Users table (ON DELETE CASCADE)
- Status: 'available' or 'unavailable'

#### MenuItems Table
```
ItemID (PK) | TruckID (FK) | Name | Price | Description | Category | Status | CreatedAt
```
- TruckID references Trucks table (ON DELETE CASCADE)
- Status: 'available' or 'unavailable'

#### Orders Table
```
OrderID (PK) | UserID (FK) | TruckID (FK) | OrderStatus | TotalPrice | ScheduledPickupTime | OrderDate | CreatedAt
```
- UserID references Users (customer) (ON DELETE CASCADE)
- TruckID references Trucks (ON DELETE CASCADE)
- Status: 'pending', 'in-progress', 'completed', 'cancelled'

#### OrderItems Table
```
OrderItemID (PK) | OrderID (FK) | ItemID (FK) | Quantity | Price
```
- Links Orders with MenuItems (many-to-many)
- Stores quantity and price at time of order

#### Carts Table
```
CartID (PK) | UserID (FK) | ItemID (FK) | Quantity | Price
```
- Temporary storage for user shopping carts
- Cleared after order placement

#### Sessions Table
```
SessionID (PK) | UserID (FK) | Token (UNIQUE) | ExpiresAt | CreatedAt
```
- Manages active user sessions
- 30-minute expiry time

### Relationships
```
Users 1---M Trucks
Users 1---M Orders
Users 1---M Carts
Trucks 1---M MenuItems
Trucks 1---M Orders
Orders 1---M OrderItems
MenuItems M---M Orders (through OrderItems)
```

---

## 🚀 Installation and Setup

### Prerequisites
- **Node.js** v14+ ([Download](https://nodejs.org))
- **PostgreSQL** v12+ ([Download](https://www.postgresql.org))
- **npm** v6+ (comes with Node.js)
- **VS Code** with Thunder Client extension (optional, for API testing)

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd milestoneBackend
```

### Step 2: Install Dependencies
```bash
npm install
```

This installs all required packages:
- express, knex, pg (backend)
- bcrypt, uuid, dotenv (security)
- hjs (templating)
- nodemon (development)

### Step 3: Setup Database

1. **Start PostgreSQL Service**
    Services app → Pgadmin → Start

2. **Create Database**
   - Create new database named `backendProject` under postgres

3. **Run SQL Schema**
   - Open Query Tool in pgAdmin
   - Copy entire contents of `connectors/scripts.sql`
   - Paste and execute
   - Verify 7 tables created: Users, Trucks, MenuItems, Orders, OrderItems, Carts, Sessions

### Step 4: Configure
Create `.env` file in project root:
```env
PORT=3000
PASSWORD= your_postgres_password
```

Replace `your_postgres_password` with your PostgreSQL password.

### Step 5: Start Server
in the terminal type 
npm run server
Expected output:
```
Server is now listening at port 3000 on http://localhost:3000/
```

### Step 6: Access Application
- **Homepage/Login**: http://localhost:3000
- **Registration**: http://localhost:3000/register
- **Test with credentials below**

---

## 🧪 Test Credentials

### Customer Account
```
Email: test@example.com
Password: adham123
```
- Browse trucks and menus
- Place test orders
- View order history

### Truck Owner Account
```
Email: marwan@example.com
Password: marwan
```
- Create/manage truck profile
- Add menu items (max 20 items)
- View incoming orders
- Update order statuses

### Create New Test Account
1. Go to http://localhost:3000/register
2. Enter details:
   - Name: First Last (required)
   - Email: any@email.com
   - Password: min 6 characters
   - Role: Select 'Truck Owner' or 'Customer'
3. Click Register

---

## 📡 API Endpoints Summary

### Public Endpoints (No Authentication)

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/` | Home/Login page | - |
| GET | `/register` | Registration page | - |
| POST | `/api/v1/user` | Register new user | `{name, email, password, birthDate?, role?}` |
| POST | `/api/v1/user/login` | User login | `{email, password}` |

### Private Endpoints (Authentication Required)

#### Menu Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|-------|
| POST | `/api/v1/menuItem/new` | Create menu item | ✅ Owner |
| GET | `/api/v1/menuItem/view` | View all owner's items | ✅ Owner |
| GET | `/api/v1/menuItem/view/:itemId` | View specific item | ✅ Owner |
| PUT | `/api/v1/menuItem/edit/:itemId` | Edit menu item | ✅ Owner |
| DELETE | `/api/v1/menuItem/delete/:itemId` | Delete menu item | ✅ Owner |
| GET | `/api/v1/menu-item/truck/:truckId` | Get truck's menu (customer) | ✅ Customer |

#### Shopping Cart
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|-------|
| POST | `/api/v1/cart/new` | Add item to cart | ✅ Customer |
| GET | `/api/v1/cart/view` | View user's cart | ✅ Customer |
| DELETE | `/api/v1/cart/delete/:cartId` | Remove cart item | ✅ Customer |
| PUT | `/api/v1/cart/edit/:cartId` | Update item quantity | ✅ Customer |
| DELETE | `/api/v1/cart/clear` | Clear entire cart | ✅ Customer |

#### Orders
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|-------|
| POST | `/api/v1/order/new` | Place new order | ✅ Customer |
| GET | `/api/v1/order/myOrders` | Get customer's orders | ✅ Customer |
| GET | `/api/v1/order/details/:orderId` | Get order details | ✅ Any |
| GET | `/api/v1/order/truckOrders` | Get owner's orders | ✅ Owner |
| PUT | `/api/v1/order/updateStatus` | Update order status | ✅ Owner |

#### Truck Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|-------|
| POST | `/api/v1/truck/new` | Create new truck | ✅ Owner |
| GET | `/api/v1/truck/myTruck` | Get owner's truck | ✅ Owner |
| GET | `/api/v1/truck/stats` | Get truck statistics | ✅ Owner |
| PUT | `/api/v1/truck/updateStatus` | Update truck status | ✅ Owner |
| GET | `/api/v1/trucks` | Get all trucks | ✅ Any |

#### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|-------|
| GET | `/logout` | Logout user | ✅ Any |

### Protected Views (Authentication Required)

| Path | Description | Access |
|------|-------------|--------|
| `/dashboard` | Main dashboard (redirects based on role) | ✅ Authenticated |
| `/firstTimeSetup` | Onboarding for new truck owners | ✅ Owner (no truck) |
| `/menu` | Menu view/management | ✅ Both |
| `/trucks` | Browse or create trucks | ✅ Both |
| `/cart` | Shopping cart interface | ✅ Customer |
| `/orders` | View orders | ✅ Both |
| `/truckOwnerHome` | Owner dashboard | ✅ Owner |

---

## 📁 Project Structure

```
milestoneBackend/
├── server.js                    # Express server entry point
├── .env                         # Environment variables
├── package.json                 # Dependencies
├── README.md                    # This file
│
├── connectors/
│   ├── db.js                    # PostgreSQL connection singleton
│   └── scripts.sql              # Database schema definition
│
├── middleware/
│   └── auth.js                  # Session authentication middleware
│
├── utils/
│   └── session.js               # Cookie and session utilities
│
├── routes/
│   ├── public/
│   │   ├── api.js               # Register/Login endpoints
│   │   └── view.js              # Login/Register pages
│   └── private/
│       ├── api.js               # Business logic endpoints (1096 lines)
│       └── view.js              # Protected page routes
│
├── views/                       # Handlebars templates (14 files)
│   ├── login.hjs
│   ├── register.hjs
│   ├── customerHomepage.hjs
│   ├── truckOwnerHomePage.hjs
│   ├── firstTimeSetup.hjs
│   ├── menu.hjs
│   ├── cart.hjs
│   ├── orders.hjs
│   └── ...
│
└── public/                      # Static assets
    ├── js/
    │   ├── jquery-2.2.0.min.js
    │   ├── bootstrap.min.js
    │   └── src/                 # Custom JavaScript (8 files)
    ├── styles/
    │   ├── bootstrap.min.css
    │   ├── style.css
    │   └── style.less
    └── images/                  # SVG icons
```
## Login page 

![Login](<milestones/public/images/Screenshot (13).png>)


## Register page 
![Register](<milestones/public/images/Screenshot (14).png>)

## Dashboard of the customer 

![Dashboard](<milestones/public/images/Screenshot (15).png>)

![Dashboard](<milestones/public/images/Screenshot (16).png>)
Food Truck Full code
## Browse Trucks of the customer
![Browse](<Food Truck Full code/milestones/public/images/Screenshot (17).png>)

## View Menu 
![Menu](<Food Truck Full code/milestones/public/images/Screenshot (20).png>)

## Cart Page
![Cart](<Food Truck Full code/milestones/public/images/Screenshot (21).png>)

## Orders Page 
![Orders](<Food Truck Full code/milestones/public/images/Screenshot (31).png>)

## Create truck Page for first time truck owners 

![First](<Food Truck Full code/milestones/public/images/Screenshot (32).png>)

## Home Dashboard of the Truck Owner 
![Home](<Food Truck Full code/milestones/public/images/Screenshot (33).png>)

## Add Menu Item 
![Browse](<Food Truck Full code/milestones/public/images/Screenshot (34).png>)

## Menu Managment Page 
![Managment](<Food Truck Full code/milestones/public/images/Screenshot (35).png>)

Order Page 
![Order](<Food Truck Full code/milestones/public/images/Screenshot (36).png>)

ERD 
![ERD](<Food Truck Full code/milestones/public/images/Screenshot (37).png>)


## 👥 Contributors

Backend

Adham tamer	16001452	Tut 12 :   linking server to database with and doing Customer Endpoints till 5

	Abdallah Mohamed	16001304	T12:  Customer Endpoints from  5 to 10 

 Ahmed wael	16002044	T12	  :  Truck Owner Endpoints till 5 

 Martin maged	16002180	T07	: Truck Owner Endpoints from 5 to 10 

Frontend 

 Loai syam	16001400	T7 : Integrating the front end with the backend and doing the  Public Pages

 Moustafa moataz	16003548	T11 : Customer Pages 

 Yassin waleed	16001410	T8	: initialzing github and doing Truck Owner Page 1  

 Yehia farahat	16002749	T7 : ERD & SRS documents  with Truck Owner pages 2,3 and 4 


## 🎓 Learning Outcomes

This project demonstrates proficiency in:
- **Full-stack development** (frontend to database)
- **REST API design** with proper status codes and responses
- **Database design** with relationships and constraints
- **Authentication & Authorization** with sessions
- **Transaction management** for order placement
- **Input validation** and error handling
- **Responsive web design** with modern CSS
- **Security best practices** (password hashing, SQL injection prevention)
