# ⚠️ Setup & Troubleshooting Guide 

## The Problem

 ran `npm run server` on laptop and the server **CRASHES**. Here's why and how to fix it.
---

## ❌ What's Missing (Why It Fails)

Your project has **3 critical dependencies** that won't work without setup:

### 1. ❌ **PostgreSQL Database NOT Running**
- **Error Message:** 
  ```
  Error: connect ECONNREFUSED 127.0.0.1:5432
  ```
- **Why:** The app tries to connect to PostgreSQL on `localhost:5432` but database server isn't running
- **Fix:** They need to start PostgreSQL service

### 2. ❌ **Database Schema Not Created**
- **Error Message:**
  ```
  error: schema "FoodTruck" does not exist
  ```
- **Why:** You never created the "FoodTruck" schema on their computer
- **Fix:** Run `scripts.sql` in pgAdmin to create tables

### 3. ❌ **`.env` File Missing or Wrong Password**
- **Error Message:**
  ```
  error: password authentication failed for user "postgres"
  ```
- **Why:** `.env` file has YOUR PostgreSQL password, not theirs
- **Fix:** They need to update `.env` with their own PostgreSQL password

### 4. ❌ **Dependencies Not Installed**
- **Error Message:**
  ```
  Cannot find module 'express'
  ```
- **Why:** `npm_modules` folder is too large to share (1000+ files)
- **Fix:** They need to run `npm install` to download packages

---

## ✅ Complete Setup Instructions for Team

### **STEP 1: System Requirements**
```
✓ Node.js (v14+)
✓ PostgreSQL (v12+)
✓ Visual Studio Code
✓ Git (to clone project)
```

### **STEP 2: Clone/Copy Project**
```bash
# Copy all project files to their computer
# OR clone from Git
git clone <your-repo-url>
cd milestoneBackend
```

### **STEP 3: Install Dependencies** ⭐ CRITICAL
```bash
npm install
```
**What it does:** Downloads 1000+ files from npm registry
**Time:** 1-2 minutes
**Result:** Creates `node_modules` folder (300MB)

### **STEP 4: Start PostgreSQL Service** ⭐ CRITICAL

**On Windows:**
```
1. Open Services (services.msc)
2. Find "PostgreSQL" service
3. Right-click → Start
4. Status should show "Running"
```

**On Mac:**
```bash
brew services start postgresql
```

**On Linux:**
```bash
sudo systemctl start postgresql
```

**Verify it's running:**
```bash
# Open pgAdmin and login
# If you can see databases → PostgreSQL is running
```

### **STEP 5: Create Database Schema** ⭐ CRITICAL

**In pgAdmin:**
```
1. Open pgAdmin (http://localhost:5050)
2. Login with your credentials
3. Right-click on "postgres" database
4. Select "Query Tool"
5. Copy ALL content from: connectors/scripts.sql
6. Paste into Query Tool
7. Click Execute (F5)
```

**Expected result:** 7 tables created in FoodTruck schema

### **STEP 6: Update .env File** ⭐ CRITICAL

**Current .env (YOUR password):**
```
PORT=3000
PASSWORD=adham
```

**They need to change to:**
```
PORT=3000
PASSWORD=<their-postgres-password>
```

**How to find their PostgreSQL password:**
- It's the password they set during PostgreSQL installation
- Or: Reset in pgAdmin → Right-click server → Properties → Password tab

### **STEP 7: Run Server**
```bash
npm run server
```

**Success message:**
```
Server is now listening at port 3000 on http://localhost:3000/
```

**If it fails → See Troubleshooting section below**

---

## 🐛 Troubleshooting (What Can Go Wrong)

### Error 1: "ECONNREFUSED 127.0.0.1:5432"
```
Problem: PostgreSQL not running
Solution:
1. Start PostgreSQL service
2. Wait 5 seconds
3. Try again: npm run server
```

### Error 2: "schema 'FoodTruck' does not exist"
```
Problem: Database tables not created
Solution:
1. Open pgAdmin
2. Run scripts.sql (all 111 lines)
3. Check: postgres → Schemas → FoodTruck
4. Should see 7 tables
5. Try again: npm run server
```

### Error 3: "password authentication failed"
```
Problem: Wrong password in .env
Solution:
1. Check .env file
2. Update PASSWORD= value
3. Save file
4. Stop server (Ctrl+C)
5. Restart: npm run server
```

### Error 4: "Cannot find module 'express'"
```
Problem: node_modules not installed
Solution:
1. Run: npm install
2. Wait for completion
3. Try again: npm run server
```

### Error 5: "port 3000 already in use"
```
Problem: Another app using port 3000
Solution:
Option A: Change port in .env
  PORT=3001
  
Option B: Kill process using port
  On Windows:
    netstat -ano | findstr :3000
    taskkill /PID <PID> /F
    
  On Mac/Linux:
    lsof -i :3000
    kill -9 <PID>
```

### Error 6: "Cannot find 'node_modules'"
```
Problem: Installation incomplete
Solution:
1. Delete package-lock.json (if stuck)
2. Delete node_modules folder
3. Run: npm install (fresh install)
4. Try again: npm run server
```

---

## 📋 Checklist Before Running Server

```
BEFORE npm run server:

1. [ ] PostgreSQL service is RUNNING
   → Open pgAdmin → Can you login?
   
2. [ ] FoodTruck schema EXISTS
   → Open pgAdmin → Schemas → See FoodTruck?
   
3. [ ] 7 tables CREATED
   → Open pgAdmin → FoodTruck → Tables
   → See: Users, Trucks, MenuItems, Orders, OrderItems, Carts, Sessions?
   
4. [ ] .env has CORRECT PASSWORD
   → Open .env
   → PASSWORD= <matches their postgres password>?
   
5. [ ] node_modules INSTALLED
   → Check: does node_modules folder exist?
   → If not: run npm install
   
6. [ ] PORT 3000 is FREE
   → Try: npm run server
   → See "listening at port 3000"?
```

---

## 🚀 Quick Start Script (For Impatient People)

**On Windows (save as `setup.bat`):**
```batch
@echo off
echo Installing dependencies...
npm install

echo.
echo Setup complete! Now you need to:
echo 1. Start PostgreSQL service
echo 2. Create FoodTruck schema in pgAdmin (run scripts.sql)
echo 3. Update .env with your PostgreSQL password
echo 4. Run: npm run server
```

**On Mac/Linux (save as `setup.sh`):**
```bash
#!/bin/bash
echo "Installing dependencies..."
npm install

echo ""
echo "Setup complete! Now you need to:"
echo "1. Start PostgreSQL (brew services start postgresql)"
echo "2. Create FoodTruck schema in pgAdmin (run scripts.sql)"
echo "3. Update .env with your PostgreSQL password"
echo "4. Run: npm run server"
```

---

## 📦 What Should Be Shared

**✅ These files SHOULD be shared:**
```
✓ All .js files (routes, middleware, utils, server.js)
✓ All .hjs files (views)
✓ .env file (but password needs update)
✓ package.json (dependencies list)
✓ package-lock.json (exact versions)
✓ scripts.sql (database schema)
✓ public/ folder (CSS, images, JavaScript)
✓ This README
```

**❌ These files SHOULD NOT be shared:**
```
✗ node_modules/ (too large, regenerated by npm install)
✗ .git/ (version control, regenerate with git clone)
✗ .env with your actual PostgreSQL password
```

---

## 🔄 Common Team Setup Workflow

**Person A (You):**
1. Create GitHub repo
2. Push all code (except node_modules & .env password)
3. Write setup instructions

**Person B (Team Member):**
1. Clone repo: `git clone <url>`
2. Run: `npm install`
3. Start PostgreSQL
4. Run `scripts.sql` in pgAdmin
5. Update `.env` with their password
6. Run: `npm run server`

**Person C (Team Member):**
1. Same steps as Person B

---

## 📞 Team Coordination Tips

### If Someone's Server Keeps Crashing:
**Ask them these questions:**

1. "Is PostgreSQL running?"
   - On Windows: Check Services → PostgreSQL status
   - On Mac: Run `brew services list`

2. "Did you run `npm install`?"
   - Check: Does `node_modules` folder exist?

3. "Did you create the FoodTruck schema?"
   - Check: Open pgAdmin → Schemas → FoodTruck exists?

4. "What's your PostgreSQL password?"
   - Have them update `.env` file

5. "What error message do you see?"
   - Copy/paste error and match to Troubleshooting section

---

## 🎯 Why This Happens

| Issue | Why | How to Prevent |
|-------|-----|-----------------|
| **No PostgreSQL** | Database server not running | Start PostgreSQL service before npm run server |
| **No Schema** | Tables never created | Run scripts.sql once per computer |
| **Wrong Password** | .env hardcoded with YOUR password | Each person updates .env with their own |
| **No Dependencies** | npm_modules not shared (too large) | Run npm install on each computer |
| **Port Conflict** | Another app using 3000 | Change PORT in .env |

---

## ✅ Success Indicators

**If setup is CORRECT, you should see:**

```
Server is now listening at port 3000 on http://localhost:3000/
```

Then open browser: http://localhost:3000
- Should see Login page
- No red errors in console

---

## 🆘 If Still Doesn't Work

**Step-by-step debug:**

1. **Check PostgreSQL:**
   ```bash
   # Try to connect
   psql -U postgres -h localhost
   # If this fails → PostgreSQL not running
   ```

2. **Check Database:**
   ```bash
   # In psql
   \l
   # Should see "postgres" database
   \c postgres
   \dn
   # Should see "FoodTruck" schema
   ```

3. **Check Node:**
   ```bash
   npm -v  # Should be v6+
   node -v # Should be v14+
   ```

4. **Check Dependencies:**
   ```bash
   npm list express  # Should show version
   npm list knex     # Should show version
   npm list pg       # Should show version
   ```

5. **Check .env:**
   ```bash
   cat .env
   # Should show: PORT=3000
   #            PASSWORD=<their-postgres-password>
   ```

---

## 🎓 Learning Point for Evaluation

**You can explain this in your presentation:**

*"Our application requires three external systems to be configured before it can run:*
- *A PostgreSQL database server*
- *Database schema creation*
- *Environment variables for configuration*

*This is a real-world scenario where applications have dependencies that must be set up correctly, or the application will crash with connection errors."*

This shows you understand **DevOps/deployment concepts**.

