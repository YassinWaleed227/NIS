# GIU Food Truck Management System - Complete Technical Review

## 📋 Executive Summary

This is a **full-stack Node.js/Express web application** for managing a food truck ordering system. It enables **customers** to browse and order from food trucks, and allows **truck owners** to create and manage their trucks, menus, and orders in real-time.

**Technology Stack:**
- Backend: Node.js + Express.js
- Frontend: HTML + Handlebars (HJS) + jQuery + Bootstrap
- Database: PostgreSQL with Knex.js query builder
- Authentication: Session-based with UUID tokens
- Styling: Custom CSS with glass morphism effects

---

## 🏗️ Architecture Overview

### Route Structure (4-Layer Architecture)
```
server.js (Entry Point)
├── Public Routes (No Auth Required)
│   ├── Public View Routes (Login/Register pages)
│   └── Public API Routes (User registration/login)
├── Auth Middleware (Session Validation)
└── Private Routes (Auth Required)
    ├── Private View Routes (Dashboard, Menus, Orders pages)
    └── Private API Routes (Business logic endpoints)
```

### Request Flow Example (User Registration):
```
1. User fills registration form on /register page
2. Form POSTs to /api/v1/user (Public API)
3. Backend validates input & hashes password with bcrypt
4. Creates user record in FoodTruck.Users table
5. Generates UUID session token
6. Stores session in FoodTruck.Sessions table with 30-min expiry
7. Returns session_token cookie to client
8. Client redirected to /dashboard based on role
```

---

## 🗄️ Database Schema

### Tables (All in "FoodTruck" PostgreSQL Schema):

**1. Users Table**
```sql
CREATE TABLE "FoodTruck"."Users" (
  userId (PK), name, email, password, 
  role (customer|truckOwner), birthDate, createdAt
)
```
- **Purpose:** Store user accounts and authentication
- **Key Field:** `role` determines access level

**2. Trucks Table**
```sql
CREATE TABLE "FoodTruck"."Trucks" (
  truckId (PK), truckName, truckLogo, ownerId (FK),
  truckStatus (available|unavailable), orderStatus, createdAt
)
```
- **Purpose:** Food truck metadata and status
- **Relationship:** Many trucks can be owned by ONE user
- **Key Feature:** Trucks can toggle between available/unavailable

**3. MenuItems Table**
```sql
CREATE TABLE "FoodTruck"."MenuItems" (
  itemId (PK), truckId (FK), name, description,
  price, category, status (available|unavailable), createdAt
)
```
- **Purpose:** Menu items for each truck
- **Feature:** Sequential numbering system (1, 2, 3...) instead of raw IDs
- **Status:** Items can be marked unavailable without deletion

**4. Orders Table**
```sql
CREATE TABLE "FoodTruck"."Orders" (
  orderId (PK), userId (FK), truckId (FK),
  orderStatus, totalPrice, scheduledPickupTime, 
  orderDate, createdAt
)
```
- **Purpose:** Track customer orders
- **Relationship:** One order belongs to ONE customer and ONE truck

**5. OrderItems Table** (Junction Table)
```sql
CREATE TABLE "FoodTruck"."OrderItems" (
  orderItemId (PK), orderId (FK), itemId (FK),
  quantity, price
)
```
- **Purpose:** Stores individual line items for an order
- **Design Pattern:** Denormalized price field (snapshot of price at order time)

**6. Carts Table**
```sql
CREATE TABLE "FoodTruck"."Carts" (
  cartId (PK), userId (FK), itemId (FK),
  quantity, price
)
```
- **Purpose:** Temporary shopping cart per customer

**7. Sessions Table**
```sql
CREATE TABLE "FoodTruck"."Sessions" (
  id (PK), userId (FK), token (UUID), expiresAt
)
```
- **Purpose:** Track active login sessions
- **Security:** Tokens expire after 30 minutes

---

## 🔐 Authentication System (Advanced)

### How It Works:

1. **Registration Flow:**
   - User submits name (must have 2+ parts: "John Smith" ✅ vs "John" ❌)
   - Password hashed using **bcrypt** (library for password hashing)
   - User stored in database with role='customer' by default
   - OR role='truckOwner' if they select that option

2. **Login Flow:**
   - User submits email + password
   - Password compared against stored hash using bcrypt.compare()
   - If valid: Generate UUID token (unique 36-char string)
   - Store in FoodTruck.Sessions with 30-minute expiry
   - Send token as `session_token` cookie to client

3. **Authorization/Protected Routes:**
   - **Auth Middleware** (`middleware/auth.js`) runs BEFORE private routes
   - Extracts session_token from request cookies
   - Queries FoodTruck.Sessions to find matching session
   - Checks if session has expired
   - If expired/invalid: Returns 401 Unauthorized or redirects to /login
   - If valid: Calls `next()` to allow request to proceed

4. **User Lookup** (`utils/session.js`):
   - Function `getUser(req)` performs intelligent lookup
   - **Joins Sessions table with Users table** to get full user data
   - **For Truck Owners:** Also joins with Trucks table to get truck details
   - Returns enriched user object with all relevant fields

### Security Considerations:
- Passwords never stored in plain text (bcrypt hashing)
- Sessions automatically invalidate after 30 minutes
- UUID tokens are cryptographically random (virtually impossible to guess)
- Middleware validates session before ANY private route access

---

## 🎯 Core Features & Advanced Implementations

### 1. Role-Based Access Control (RBAC)

```javascript
// Example: Only truck owners can add menu items
app.post('/api/v1/menuItem/new', async (req, res) => {
  const user = await getUser(req);
  if (user.role !== 'truckOwner') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  // Proceed with operation...
});
```

**Two Roles:**
- **Customer:** Can browse trucks, view menus, add to cart, place orders
- **Truck Owner:** Can manage truck, add/edit menu items, view orders

---

### 2. Sequential Item Numbering System (Advanced)

**Problem:** Customers see database IDs (#47, #3, #89) which is confusing

**Solution:** Frontend displays sequential numbers (#1, #2, #3) mapped to database IDs

```javascript
// Backend API response includes both:
itemsWithNumbers = items.map((item, index) => ({
  itemId: item.itemId,           // Database ID (used internally)
  itemNumber: index + 1,          // Display ID (shown to customer)
  name: item.name,
  price: item.price,
  // ...
}));

// Frontend template:
// Display: "Item #1"
// On click: Use itemId to fetch/edit/delete
```

**Why Advanced:** Maintains data integrity while improving UX

---

### 3. First-Time Onboarding Page (Advanced)

**Problem:** New truck owners land on dashboard with no truck → error

**Solution:** Dedicated onboarding flow

```
New Truck Owner Registration
         ↓
/firstTimeSetup page (Welcome + form)
         ↓
Create Truck form submitted
         ↓
API creates truck in database
         ↓
Redirect to /truckOwnerHome (normal dashboard)
         ↓
Can now add menu items
```

**Implementation:**
- Route checks: `if (no truck) redirect /firstTimeSetup`
- If user already has truck, auto-redirect to dashboard
- Beautiful UX with step indicators (1. Create Truck → 2. Add Menu → 3. Start Orders)

---

### 4. Order Management with Status Tracking (Advanced)

**Order Lifecycle:**
```
Customer adds items to cart
         ↓
Customer places order
         ↓
System creates Order record + OrderItems records
         ↓
Truck owner sees order with status "pending"
         ↓
Truck owner can update status (confirmed/preparing/ready/completed)
         ↓
Customer can view order status in real-time
```

**Database Design Pattern:**
- **Denormalization:** OrderItems stores price snapshot
  - Why? Price might change later but order must preserve original price
  - Prevents: Old orders showing wrong price if menu item price updated

```sql
-- Example: Customer orders item #1 at $5.99
INSERT INTO OrderItems (orderId, itemId, quantity, price)
VALUES (123, 1, 2, 5.99);  -- Stores price at time of order
-- Later: Item #1 price changes to $7.99
-- ^^ Order still shows $5.99 (correct behavior)
```

---

### 5. Smart Field Mapping Layer (Advanced)

**Problem:** Database column names don't match API response format

**Solution:** Map database columns to API response

```javascript
// Database returns:
{
  orderId: 1,
  orderStatus: 'pending',
  totalPrice: 25.50,
  scheduledPickupTime: '2025-12-13...'
}

// API returns:
{
  orderId: 1,
  status: 'pending',           // Renamed
  totalAmount: 25.50,          // Renamed
  pickupTime: '2025-12-13...'  // Renamed
}
```

**Why Advanced:** 
- Database uses snake_case + verbose names
- API uses camelCase + concise names
- Improves code consistency and API usability
- Single place to change mapping (easy maintenance)

---

### 6. Truck Owner Order Numbering (Advanced)

**Problem:** Truck owner sees 1000+ orders from different days, hard to find today's orders

**Solution:** Sequential numbering per session

```javascript
// Backend queries all orders for truck
const orders = await db.select('*').from('FoodTruck.Orders')
  .where('truckId', user.truckId);

// Map to include order number
const mappedOrders = orders.map((order, index) => ({
  ...order,
  truckOrderNumber: index + 1  // #1, #2, #3...
}));

// Sort by date (newest first) but keep order numbers
mappedOrders.sort((a, b) => 
  new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
);
```

**Result:** Truck owner sees "Order #1, Order #2..." (refreshes each session)

---

### 7. Real-Time Cart Management (Advanced)

**Endpoints:**
```
POST   /api/v1/cart/new      → Add item to cart
GET    /api/v1/cart/view     → Get all cart items
PUT    /api/v1/cart/edit/:id → Update quantity
DELETE /api/v1/cart/delete   → Remove from cart
```

**Transaction Logic:**
```javascript
app.post('/api/v1/order/new', async (req, res) => {
  // 1. Start transaction
  // 2. Create Order record
  // 3. Loop through cart items, create OrderItems records
  // 4. Clear FoodTruck.Carts for user
  // 5. Commit transaction
  // If error at any step: Rollback (undo all changes)
});
```

**Why Advanced:** Ensures data consistency - order and items created together

---

### 8. Menu Item Edit with Modal (Advanced Frontend)

**Flow:**
```javascript
1. User clicks "Edit" button on menu item #2
2. Button links to /editMenuItem/5 (itemId=5, displays as #2)
3. Backend route passes itemId to Handlebars template
4. Frontend AJAX calls /api/v1/menuItem/view/5
5. Modal pops up with pre-filled form
6. User edits fields
7. AJAX POST to /api/v1/menuItem/edit/5
8. Modal closes, menu list refreshes
```

**Advanced Technique:** Template variable interpolation
```handlebars
// In editMenuItem.hjs template:
<script>
  const itemId = '{{{ itemId }}}';  // Handlebars syntax (not <%= %>)
  $.ajax({
    url: '/api/v1/menuItem/view/' + itemId,
    // ...
  });
</script>
```

---

### 9. Truck Status Toggle (Advanced)

**Feature:** Truck owners can toggle truck between available/unavailable

```javascript
app.put('/api/v1/truck/updateStatus', async (req, res) => {
  const { newStatus } = req.body;  // 'available' or 'unavailable'
  
  // Update database
  await db('FoodTruck.Trucks')
    .where('truckId', user.truckId)
    .update({ truckStatus: newStatus });
  
  // Result: 
  // - If unavailable: Appears grayed-out/red on customer list
  // - Customers cannot view menu or place orders
  // - Reduces confusion
});
```

---

### 10. Glass Morphism UI (Advanced Frontend)

**Modern CSS Design Pattern:**
```css
background: rgba(255, 255, 255, 0.55);      /* Transparent */
backdrop-filter: blur(18px);                /* Blur background */
border: 1px solid rgba(255, 255, 255, 0.8); /* Subtle border */
box-shadow: 0 8px 25px rgba(150, 150, 150, 0.2);

/* Result: Frosted glass effect on top of gradient background */
```

**Why Advanced:** Professional modern UI (trendy in 2024-2025)

---

## 📊 API Endpoints Summary

### Public Endpoints (No Auth):
```
POST   /api/v1/user           → Register new user
POST   /api/v1/user/login     → Login user
GET    /                      → Home page
GET    /register              → Registration form
GET    /login                 → Login form
```

### Private Endpoints (Auth Required):

**Menu Management:**
```
POST   /api/v1/menuItem/new                        → Create item
GET    /api/v1/menuItem/view                       → Get all items (owner's truck)
GET    /api/v1/menuItem/view/:itemId              → Get single item
PUT    /api/v1/menuItem/edit/:itemId              → Update item
DELETE /api/v1/menuItem/delete/:itemId            → Delete item
GET    /api/v1/menu-item/truck/:truckId           → Get truck menu
GET    /api/v1/menuItem/truck/:truckId/category/:cat → Get items by category
```

**Cart Management:**
```
POST   /api/v1/cart/new               → Add to cart
GET    /api/v1/cart/view              → View cart
PUT    /api/v1/cart/edit/:cartId      → Update quantity
DELETE /api/v1/cart/delete/:cartId    → Remove item
```

**Order Management:**
```
POST   /api/v1/order/new              → Place order (customer)
GET    /api/v1/order/myOrders         → Get my orders
GET    /api/v1/truck/orders           → Get truck orders (owner)
```

**Truck Management:**
```
POST   /api/v1/truck/new              → Create truck
GET    /api/v1/truck/myTruck          → Get my truck info
PUT    /api/v1/truck/updateStatus     → Toggle available/unavailable
PUT    /api/v1/truck/order-status     → Update order status (owner)
GET    /api/v1/truck/stats            → Get truck statistics
```

---

## 🎨 Frontend Pages

| Page | Route | User Type | Purpose |
|------|-------|-----------|---------|
| Login | /login | Public | User authentication |
| Register | /register | Public | New user signup |
| Customer Home | /dashboard | Customer | Browse trucks |
| Truck List | /trucks | Owner | View available trucks |
| Menu | /menu | Customer | View truck menu items |
| First-Time Setup | /firstTimeSetup | New Owner | Onboard & create truck |
| Truck Owner Home | /truckOwnerHome | Owner | Dashboard with stats |
| Menu Management | /truckMenu | Owner | Add/edit/delete items |
| Add Menu Item | /addMenuItem | Owner | Create new item form |
| Edit Menu Item | /editMenuItem/:id | Owner | Edit existing item |
| Orders | /orders | Customer | View my orders |
| Truck Orders | /truckOrders | Owner | View orders for truck |
| Cart | /cart | Customer | Shopping cart + checkout |

---

## 🔧 Advanced Technical Patterns Used

### Pattern 1: Middleware Chain
```javascript
// server.js order matters:
handlePublicFrontEndView(app);      // No auth needed
handlePublicBackendApi(app);        // No auth needed
app.use(authMiddleware);            // ← Auth check here
handlePrivateFrontEndView(app);     // Auth required
handlePrivateBackendApi(app);       // Auth required
```

### Pattern 2: Async/Await for Database Operations
```javascript
// Clean, synchronous-looking code that's actually asynchronous
const user = await db.select('*').from('FoodTruck.Users')
  .where('email', email)
  .first();
// ^ Waits for database response before proceeding
```

### Pattern 3: Query Builder (Knex.js)
```javascript
// Instead of string concatenation (SQL injection risk):
// ❌ DANGEROUS: const query = `SELECT * FROM Users WHERE email = '${email}'`;

// ✅ SAFE: Uses parameterized queries
const user = await db('FoodTruck.Users').where('email', email).first();
// ^ Prevents SQL injection attacks
```

### Pattern 4: Transaction for Multi-Step Operations
```javascript
// Ensures all-or-nothing: Either all succeed or all fail
await db.transaction(async (trx) => {
  await trx('FoodTruck.Orders').insert(orderData);
  await trx('FoodTruck.OrderItems').insert(itemsData);
  await trx('FoodTruck.Carts').delete().where('userId', userId);
});
```

### Pattern 5: Error Handling with Try/Catch
```javascript
try {
  // Attempt operation
  const result = await someDbOperation();
  return res.status(200).json(result);
} catch (err) {
  console.error('Error:', err);  // Log for debugging
  return res.status(500).json({ error: 'Internal server error' });
}
```

---

## 📁 File Structure Overview

```
milestoneBackend/
├── server.js                    (25 lines) - Express setup & route registration
├── package.json                 - Dependencies
├── .env                        - SECRET: Password for postgres
│
├── connectors/
│   ├── db.js                   (20 lines) - Knex.js connection singleton
│   └── scripts.sql             (111 lines) - Database schema
│
├── middleware/
│   └── auth.js                 (30 lines) - Session validation middleware
│
├── utils/
│   └── session.js              (57 lines) - Cookie parsing & user lookup
│
├── routes/
│   ├── public/
│   │   ├── api.js              (100 lines) - Register/Login endpoints
│   │   └── view.js             (50 lines) - Login/Register pages
│   └── private/
│       ├── api.js              (1118 lines) - Business logic endpoints
│       └── view.js             (239 lines) - Protected page routes
│
├── views/                       (14 .hjs template files)
│   ├── login.hjs               - Login form
│   ├── register.hjs            - Registration form
│   ├── customerHomepage.hjs    - Browse trucks
│   ├── truckOwnerHomePage.hjs  - Owner dashboard
│   ├── firstTimeSetup.hjs      - Onboarding page (NEW)
│   ├── menu.hjs                - Customer menu view
│   ├── truckMenu.hjs           - Owner menu management
│   ├── cart.hjs                - Shopping cart
│   ├── orders.hjs              - Customer orders
│   ├── truckOrders.hjs         - Owner orders
│   └── ...
│
├── public/
│   ├── js/
│   │   ├── jquery, bootstrap   (Libraries)
│   │   └── src/
│   │       ├── login.js        - Login form validation
│   │       ├── register.js     - Registration validation
│   │       ├── orders.js       - Customer order management
│   │       ├── cart.js         - Cart operations
│   │       └── truck.js        - Truck browsing
│   │
│   ├── styles/
│   │   └── style.css           - Global styling
│   │
│   └── images/                 - SVG icons & logos
```

---

## ⚡ Performance Considerations

### Optimizations Implemented:
1. **Query Optimization:** Use of `.first()` to get single row (vs `.select()` for all)
2. **Indexing:** Primary keys auto-indexed for fast lookups
3. **Caching:** Session data stays in browser (no re-query on every request)
4. **Connection Pooling:** Knex.js manages database connection pool

### Potential Improvements:
1. Add pagination for large order lists
2. Cache truck list (changes infrequently)
3. Use database indexes on frequently-searched fields (email, truckId)
4. Implement request rate limiting (prevent DoS attacks)

---

## 🛡️ Security Features

| Feature | How It Works | Why Important |
|---------|-------------|-----------------|
| **Password Hashing** | bcrypt library | Passwords stored securely, not plain text |
| **Session Tokens** | UUID (36-char random) | Impossible to guess valid token |
| **Session Expiry** | 30-min timeout | Limits damage if device stolen |
| **SQL Injection Prevention** | Knex parameterized queries | Prevents database hacks |
| **Role-Based Access** | Check user.role before action | Customers can't edit owner data |
| **Auth Middleware** | Validates token on private routes | Protects sensitive endpoints |
| **CORS** | Not explicitly set (same-origin only) | Basic CSRF protection |

---

## 🧪 Testing Scenarios (Quality Assurance)

To verify everything works:

```markdown
1. **Registration Flow**
   - Register as customer
   - Register as truck owner
   - Try invalid email (should fail)
   - Try weak password (should fail)

2. **First-Time Setup**
   - New truck owner should see /firstTimeSetup
   - Create truck should save to database
   - Should redirect to dashboard
   - Revisiting /firstTimeSetup should redirect to dashboard

3. **Menu Management**
   - Create menu item #1, #2, #3
   - Edit item #2
   - Delete item #1
   - Verify numbers stay sequential (#1, #2 after deletion)

4. **Customer Ordering**
   - View trucks (see unavailable ones grayed out)
   - Add items to cart
   - Modify quantities
   - Place order
   - Check order appears in Orders page

5. **Truck Owner Orders**
   - View all orders for truck
   - Manually refresh to see new orders
   - Update order status
   - Verify customer sees status change
```

---

## 📝 Key Database Operations

### Creating a New Order (Complex Transaction):
```javascript
1. User calls POST /api/v1/order/new with cartItems
2. Validate user has items in cart
3. START TRANSACTION:
   a. Calculate total price
   b. INSERT into FoodTruck.Orders
   c. Get new orderId from INSERT
   d. For EACH item in cart:
      - INSERT into FoodTruck.OrderItems with quantity & price snapshot
   e. DELETE all items from FoodTruck.Carts for this user
4. COMMIT (all steps succeed or all fail)
5. Return success response
```

### Editing Menu Item (Simple Update):
```javascript
1. User clicks Edit on item #2 (database itemId = 47)
2. Page loads /editMenuItem/47
3. Template renders with itemId = 47
4. User submits form
5. AJAX POST to /api/v1/menuItem/edit/47
6. UPDATE FoodTruck.MenuItems SET name='...', price='...' WHERE itemId=47
7. Return success
8. Frontend refreshes menu list (still shows as #2)
```

---

## 🎓 Key Concepts for Your Evaluation

### Things to Know About This System:

1. **Session-Based Auth, Not JWT:** 
   - Sessions stored in database (allows invalidation)
   - Tokens stored as cookies (browser-managed)
   - Server validates token on each private request

2. **Role-Based Access Control:**
   - Fine-grained permissions per endpoint
   - Prevents customer from accessing owner features

3. **Denormalization in OrderItems:**
   - Stores price snapshot (advanced database design)
   - Protects historical data from future changes

4. **Sequential Numbering:**
   - UX improvement (users see #1, #2, #3 not #47, #3, #89)
   - Database IDs still used internally for CRUD operations

5. **Middleware Pattern:**
   - Clean separation of concerns
   - Auth middleware runs BEFORE all private routes
   - Order of registration matters

6. **Knex.js Query Builder:**
   - SQL injection prevention
   - Database-agnostic (easy to switch from PostgreSQL to MySQL)
   - Chain methods for readability

---

## 🚀 Deployment Readiness

### What's Production-Ready:
✅ Authentication system
✅ Database schema and relationships
✅ API error handling
✅ Role-based access control
✅ Session management with expiry

### What Needs Improvement for Production:
❌ Input validation (use joi/yup library)
❌ Logging system (use winston/pino)
❌ Rate limiting (prevent abuse)
❌ HTTPS/SSL (all traffic encrypted)
❌ Environment config (separate dev/prod settings)
❌ Database connection pooling (optimize for load)
❌ Error tracking (Sentry integration)

---

## 📞 Support for Evaluation Questions

### Q: "What's the most complex part of this system?"
**A:** The order management system - it involves creating multiple database records atomically (all-or-nothing), denormalizing prices, and maintaining sequential numbering.

### Q: "How does security work?"
**A:** Three layers:
1. Passwords hashed with bcrypt (one-way encryption)
2. Login generates UUID token (impossible to guess)
3. Middleware validates token on every protected request

### Q: "Why use Knex.js instead of raw SQL?"
**A:** Prevents SQL injection attacks by using parameterized queries, and makes code database-agnostic (could switch to MySQL tomorrow).

### Q: "What happens if a user's session expires?"
**A:** The auth middleware checks session expiry. If expired (>30 min), it returns 401 or redirects to /login. User must re-login.

### Q: "Why does the order have both price fields?"
**A:** 
- `totalPrice` in Orders = Total for entire order
- `price` in OrderItems = Per-item price (snapshot at order time)
- If menu item price changes later, old orders still show correct price

### Q: "How do you prevent a customer from editing another customer's order?"
**A:** API checks `user.userId` matches `order.userId` before allowing edit. If not, returns 403 Forbidden.

---

## 🎯 Summary

This system demonstrates:
- ✅ Full-stack web development (frontend + backend)
- ✅ Database design with relationships and integrity
- ✅ Authentication & authorization
- ✅ RESTful API design
- ✅ Real-time data updates
- ✅ Advanced patterns (field mapping, denormalization, transactions)
- ✅ Professional UI/UX (glass morphism, responsive design)
- ✅ Error handling & validation

**Perfect for showcasing:** Real-world web application skills in your evaluation!

