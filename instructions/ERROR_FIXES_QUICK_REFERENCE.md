# 🔴 Server Crash Errors & Exact Fixes

## Why Your Team's Server Crashes

When they run `npm run server` and it crashes, here are the **EXACT error messages and solutions**.

---

## Error #1: "ECONNREFUSED 127.0.0.1:5432"

### Full Error Message:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
    at TCPConnectWrap.afterConnect [as oncomplete]
```

### What It Means:
**PostgreSQL server is NOT running** - The app can't connect to the database.

### Why It Happens:
They ran `npm run server` but forgot to start PostgreSQL service.

### ✅ FIX:

**Windows:**
```
1. Press: Windows Key
2. Type: services.msc
3. Find: PostgreSQL (v12 Server) or similar
4. Status should show: Running
5. If not running → Right-click → Start
6. Try: npm run server
```

**Mac:**
```bash
brew services start postgresql
# or
brew services restart postgresql
```

**Linux:**
```bash
sudo systemctl start postgresql
# or
sudo service postgresql start
```

### How to Verify It's Running:
```bash
# Test connection
psql -U postgres -h localhost

# If you see psql prompt (postgres=#) → PostgreSQL is running
```

---

## Error #2: "schema 'FoodTruck' does not exist"

### Full Error Message:
```
error: schema "FoodTruck" does not exist
    at Protocol._enqueue (/node_modules/pg/lib/protocol.js:...)
```

### What It Means:
**Database tables were never created** - PostgreSQL is running but no tables exist.

### Why It Happens:
They installed everything but never ran `scripts.sql` to create tables.

### ✅ FIX:

**Step-by-step:**

1. Open pgAdmin (http://localhost:5050)
2. Login with your credentials
3. Expand: postgres → Databases → postgres → Schemas
4. Right-click on Schemas → Query Tool
5. Copy the file: `connectors/scripts.sql`
6. Paste ALL content into Query Tool
7. Click: Execute (F5 key)
8. Wait for success message
9. Check: Refresh → postgres → Schemas → FoodTruck should appear
10. Verify: Inside FoodTruck → Tables → Should see 7 tables

### Verify Tables Were Created:
```bash
# In pgAdmin, run:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'FoodTruck';

# Should show:
# Sessions
# Carts
# OrderItems
# Orders
# MenuItems
# Trucks
# Users
```

If empty → scripts.sql didn't run correctly, try again.

---

## Error #3: "password authentication failed for user 'postgres'"

### Full Error Message:
```
error: password authentication failed for user "postgres"
    at Authentication.parseError (/node_modules/pg/lib/...)
```

### What It Means:
**Wrong PostgreSQL password in `.env` file** - Can't authenticate to database.

### Why It Happens:
- `.env` file has YOUR password (e.g., "adham")
- They have a DIFFERENT password
- App tries YOUR password → fails

### ✅ FIX:

**Step 1: Find their PostgreSQL password**
- It's the password they set when installing PostgreSQL
- If they forgot it, they can reset it in pgAdmin

**Step 2: Update .env file**

Open: `.env`

Change from:
```
PORT=3000
PASSWORD=adham
```

To:
```
PORT=3000
PASSWORD=<their-actual-password>
```

**Step 3: Restart server**
```bash
# Stop: Ctrl+C
# Start: npm run server
```

### How to Reset PostgreSQL Password (if forgotten):

**Windows - Reset in pgAdmin:**
```
1. pgAdmin → postgres (in tree)
2. Right-click → Properties
3. Definition tab
4. Password field
5. Enter new password
6. Save
7. Update .env with new password
```

**Linux/Mac:**
```bash
sudo -u postgres psql
postgres=# ALTER USER postgres PASSWORD 'newpassword';
postgres=# \q
# Update .env with newpassword
```

---

## Error #4: "Cannot find module 'express'"

### Full Error Message:
```
Error: Cannot find module 'express'
Require stack:
- C:\...\milestoneBackend\server.js
```

### What It Means:
**Dependencies not installed** - Missing npm packages.

### Why It Happens:
They copied project files but forgot to run `npm install`.

### ✅ FIX:

```bash
# Run this command:
npm install

# This downloads ALL packages:
# - express
# - knex
# - pg
# - hjs
# - uuid
# - bcrypt
# - dotenv
# - axios
# - and more...

# Wait for completion (takes 1-2 minutes)
# Then: npm run server
```

### Verify Installation:
```bash
# Check if node_modules folder exists
ls node_modules

# Check if express is installed
npm list express
# Should show: express@4.21.2
```

---

## Error #5: "listen EADDRINUSE :::3000"

### Full Error Message:
```
Error: listen EADDRINUSE :::3000
    at Server.setupListeners (net.js:...)
```

### What It Means:
**Port 3000 is already in use** - Another app is using port 3000.

### Why It Happens:
- Server is already running in another terminal
- Another app using port 3000
- Previous server process didn't shut down

### ✅ FIX:

**Option 1: Use different port**

Edit `.env`:
```
PORT=3001
```

Restart:
```bash
npm run server
# Now runs on http://localhost:3001
```

**Option 2: Kill process using port**

**Windows:**
```bash
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with number from above)
taskkill /PID 12345 /F

# Restart
npm run server
```

**Mac/Linux:**
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process (replace PID with number from above)
kill -9 12345

# Restart
npm run server
```

**Option 3: Stop running server**
```bash
# If server is already running:
# Press: Ctrl+C (in the terminal where npm run server is running)

# Then start fresh:
npm run server
```

---

## Error #6: "Module not found: knex"

### Full Error Message:
```
Error: Cannot find module 'knex'
```

### ✅ FIX:
Same as Error #4 - Run `npm install`

---

## Error #7: "Cannot find template 'login'"

### Full Error Message:
```
Error: ENOENT: no such file or directory, open 'C:\...\views\login.hjs'
```

### What It Means:
**Views folder is missing or in wrong location**

### ✅ FIX:
Check folder structure:
```
milestoneBackend/
└── views/
    ├── login.hjs
    ├── register.hjs
    ├── customerHomepage.hjs
    └── ... (other .hjs files)
```

If views folder missing → Restore from backup or re-download.

---

## Error #8: "Connection timeout"

### Full Error Message:
```
Error: connect ETIMEDOUT
    at TCPConnectWrap.afterConnect [as oncomplete]
```

### What It Means:
**Can't reach PostgreSQL** - Either:
- PostgreSQL crashed
- Firewall blocking connection
- Wrong host/port

### ✅ FIX:

1. **Check PostgreSQL running:**
   ```bash
   psql -U postgres -h localhost
   ```
   If fails → Start PostgreSQL

2. **Check .env has correct host:**
   ```
   # Should have:
   host: localhost
   port: 5432
   ```

3. **Restart PostgreSQL:**
   ```bash
   # Windows: Services → PostgreSQL → Restart
   # Mac: brew services restart postgresql
   # Linux: sudo systemctl restart postgresql
   ```

---

## Error #9: "Error: ENOENT: no such file or directory, open '.env'"

### Full Error Message:
```
Error: ENOENT: no such file or directory, open '.env'
```

### What It Means:
**`.env` file is missing**

### ✅ FIX:

Create `.env` file in project root with:
```
PORT=3000
PASSWORD=postgres
```

Then update PASSWORD with actual postgres password.

---

## Error #10: "Error: Invalid connection string"

### Full Error Message:
```
Error: Invalid connection string 'postgres://...'
```

### What It Means:
**Database configuration in `db.js` is wrong**

### ✅ FIX:

Check `connectors/db.js`:
```javascript
const config = {
  client: 'pg',
  connection: {
    host: 'localhost',    // ← Should be localhost
    port: 5432,           // ← Should be 5432
    user: 'postgres',     // ← Should be postgres
    password: process.env.PASSWORD,  // ← Should read from .env
    database: 'postgres'  // ← Should be postgres
  }
};
```

Verify:
- host = `localhost` (not IP address)
- port = `5432` (default postgres port)
- user = `postgres`
- database = `postgres`

---

## 🆘 Step-by-Step Debug Process

If error not in list above, try this:

### Step 1: Check Environment
```bash
node -v      # Should be v14+
npm -v       # Should be v6+
psql -V      # Should be v12+
```

### Step 2: Check PostgreSQL
```bash
psql -U postgres -h localhost
# If fails → PostgreSQL not running
# If succeeds → PostgreSQL OK
```

### Step 3: Check Database
```bash
# In psql:
\l          # List databases
\c postgres # Connect to postgres
\dn         # List schemas
# Should see: FoodTruck schema
```

### Step 4: Check Node Modules
```bash
npm list express
npm list knex
npm list pg
# All should show versions
```

### Step 5: Check .env
```bash
cat .env
# Should show:
# PORT=3000
# PASSWORD=<correct-password>
```

### Step 6: Check Server Config
```bash
cat connectors/db.js
# Verify host, port, user, database values
```

### Step 7: Restart Everything
```bash
# 1. Stop server (Ctrl+C)
# 2. Restart PostgreSQL
# 3. Delete node_modules (optional)
# 4. npm install
# 5. npm run server
```

---

## 📋 Quick Checklist

Before reporting error, verify:

```
[ ] PostgreSQL service is RUNNING
[ ] FoodTruck schema EXISTS in pgAdmin
[ ] 7 tables created (check in pgAdmin)
[ ] .env file exists with correct PASSWORD
[ ] node_modules folder exists (1000+ files)
[ ] Port 3000 is available (or changed in .env)
[ ] Ran: npm install (not just npm)
```

If all checked → Should work!

---

## 🎯 Most Common Culprits (80% of crashes)

1. **PostgreSQL not running** → Start it
2. **Schema not created** → Run scripts.sql
3. **Wrong password in .env** → Update with correct password
4. **Dependencies not installed** → Run npm install
5. **Port already in use** → Change PORT in .env

---

## ✅ Success Indicators

When setup is CORRECT, you should see:

```
[nodemon] starting `node server.js`
Server is now listening at port 3000 on http://localhost:3000/
```

Then:
1. Open browser: http://localhost:3000
2. Should see: Login page
3. Should be able to: Click Register, fill form, see pages
4. No red errors in terminal

---

## 💡 Pro Tips

**Tip 1: Use .gitignore**
```
Don't commit:
- node_modules/ (too large)
- .env (passwords!)
- .git/
```

**Tip 2: Share Setup Instructions**
Make sure team reads: SETUP_TROUBLESHOOTING_GUIDE.md

**Tip 3: Automate Setup**
Create setup.sh or setup.bat to run npm install + other steps

**Tip 4: Document Passwords**
Privately tell each team member their PostgreSQL password (don't hardcode)

