# Database Testing Checklist - Food Truck Management System

## Server Status
✅ **Server Running** on http://localhost:3000

---

## Test Cases to Verify

### 1. User Registration & Authentication
- [ ] **Customer Registration**
  - Navigate to /register
  - Enter: name (with 2+ parts), email, password
  - Should save to FoodTruck.Users table with role='customer'
  - Should create session in FoodTruck.Sessions table
  - Should redirect to /dashboard

- [ ] **Truck Owner Registration**
  - Register with first and last name
  - Should save to FoodTruck.Users with role='truckOwner'
  - Should redirect to /firstTimeSetup (since no truck yet)

- [ ] **Login**
  - Login with correct credentials
  - Should create session in FoodTruck.Sessions with 30-min expiry
  - Should set session_token cookie
  - Should show user name in navbar

### 2. First-Time Setup Flow (Truck Owner)
- [ ] **Access /firstTimeSetup**
  - New truck owner should see welcome page
  - Should show step indicator (1. Create Truck, 2. Add Menu Items, 3. Start Taking Orders)
  - Should display owner's name

- [ ] **Create Truck**
  - Enter truck name and optional logo URL
  - Click "Create My Food Truck"
  - Should save to FoodTruck.Trucks with:
    - truckName
    - truckLogo (if provided)
    - ownerId = logged in user's userId
    - truckStatus = 'available'
    - orderStatus = 'available'
  - Should redirect to /truckOwnerHome

- [ ] **Already Has Truck**
  - If truck owner has truck, should redirect from /firstTimeSetup to /truckOwnerHome

### 3. Truck Owner Dashboard
- [ ] **Truck Owner Home**
  - Should display truck information
  - Should show "Manage Menu" link
  - Should show "Orders" link
  - Should display truck status

### 4. Menu Item Management
- [ ] **Create Menu Item**
  - Click "Add Menu Item"
  - Enter: name, price, category, description
  - Should save to FoodTruck.MenuItems with:
    - truckId = owner's truck
    - name, price, category, description
    - status = 'available'
  - Should display with sequential number (#1, #2, #3, etc.)

- [ ] **View Menu Items**
  - Should list all items for owner's truck
  - Should display itemNumber (not itemId)
  - Should show name, price, category

- [ ] **Edit Menu Item**
  - Click Edit on an item
  - Should load item details via API
  - Should populate form fields
  - Should allow updating: name, price, category, description
  - Should save changes to database

- [ ] **Delete Menu Item**
  - Click Delete on an item
  - Should remove from FoodTruck.MenuItems
  - Should update list immediately

### 5. Order Management
- [ ] **Customer View Trucks**
  - Customer should see all available trucks
  - Unavailable trucks should appear grayed out/red
  - Should display truck name and status

- [ ] **Customer View Menu**
  - Click on truck to see menu
  - Should display all available items
  - Should show sequential item numbers (#1, #2, #3)
  - Should show name, price, description

- [ ] **Customer Add to Cart**
  - Click on menu item
  - Select quantity
  - Should save to FoodTruck.Carts with:
    - userId = customer's userId
    - itemId
    - quantity
    - price

- [ ] **View Cart**
  - Should display all items in FoodTruck.Carts for user
  - Should show subtotal
  - Should allow modify/remove items

- [ ] **Place Order**
  - Click "Place Order" from cart
  - Should create record in FoodTruck.Orders with:
    - userId = customer
    - truckId = truck
    - orderStatus = 'pending'
    - totalPrice = sum of items
  - Should create records in FoodTruck.OrderItems for each item
  - Should clear FoodTruck.Carts for user
  - Should show order confirmation

- [ ] **Truck Owner View Orders**
  - Should see all orders for their truck
  - Should display order number, customer, total, status
  - Should allow updating order status
  - Manual refresh button should update list

### 6. Session Management
- [ ] **Session Expiry**
  - Sessions should expire after 30 minutes
  - Expired sessions should redirect to /login

- [ ] **Logout**
  - Click Logout
  - Should delete session from FoodTruck.Sessions
  - Should remove session_token cookie
  - Should redirect to /login

---

## Database Verification Queries

```sql
-- Check Users table
SELECT * FROM "FoodTruck"."Users";

-- Check Trucks table
SELECT * FROM "FoodTruck"."Trucks";

-- Check MenuItems table
SELECT * FROM "FoodTruck"."MenuItems";

-- Check Orders table
SELECT * FROM "FoodTruck"."Orders";

-- Check OrderItems table
SELECT * FROM "FoodTruck"."OrderItems";

-- Check Carts table
SELECT * FROM "FoodTruck"."Carts";

-- Check Sessions table
SELECT * FROM "FoodTruck"."Sessions";
```

---

## Test Execution Log

### Test Date: December 13, 2025

**Step 1: Register Customer**
- Time: 
- Status: ⏳ Pending
- Notes: 

**Step 2: Register Truck Owner**
- Time: 
- Status: ⏳ Pending
- Notes: 

**Step 3: First-Time Setup & Truck Creation**
- Time: 
- Status: ⏳ Pending
- Notes: 

**Step 4: Menu Item Creation & Management**
- Time: 
- Status: ⏳ Pending
- Notes: 

**Step 5: Customer Browsing & Ordering**
- Time: 
- Status: ⏳ Pending
- Notes: 

**Step 6: Order Management**
- Time: 
- Status: ⏳ Pending
- Notes: 

---

## Summary

| Component | Status | Notes |
|-----------|--------|-------|
| User Registration | ⏳ | To be tested |
| Truck Owner Setup | ⏳ | To be tested |
| Menu Management | ⏳ | To be tested |
| Customer Ordering | ⏳ | To be tested |
| Database Persistence | ⏳ | To be tested |
| Session Management | ⏳ | To be tested |

