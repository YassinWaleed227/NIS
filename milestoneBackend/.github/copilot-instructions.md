# Copilot Instructions - GIU Food Truck Management System

## Project Overview
A Node.js/Express backend for a food truck management platform. Users can be either **customers** or **truck owners**. The system manages user authentication via session tokens, truck operations, and menu items. Frontend uses HJS (Express templating), backend uses Knex.js with PostgreSQL.

## Architecture

### Core Structure
- **`server.js`**: Express app entry point. Routes organized by access level (public/private) and type (API/views)
- **`connectors/db.js`**: Knex.js PostgreSQL connection singleton—use throughout project for all DB queries
- **Database Schema**: All tables prefixed with `"FoodTruck".` schema (e.g., `"FoodTruck.Users"`)
- **Authentication**: Session-based using tokens stored in `FoodTruck.Sessions` table with expiry validation

### Route Architecture
Routes are split into 4 handlers registered sequentially in `server.js`:
1. **Public Views** (`routes/public/view.js`): Login & register pages (no auth required)
2. **Public APIs** (`routes/public/api.js`): User registration & login endpoints
3. **Private Views** (`routes/private/view.js`): Protected frontend routes (auth middleware applied)
4. **Private APIs** (`routes/private/api.js`): Protected backend endpoints (auth middleware applied)

**Critical**: Auth middleware is applied BEFORE private routes in `server.js`, so all private routes require valid session tokens.

### Data Flow: Authentication
1. User POSTs credentials to `/api/v1/user/login` (public API)
2. System generates UUID token, creates session record with 30-min expiry
3. Token sent to client as `session_token` cookie
4. Requests to private routes extract token from cookie, validate against `FoodTruck.Sessions`, verify expiry

### User Roles
- **customer** (default role): Can view menus, place orders
- **truckOwner**: Can add menu items to their truck; associated with one truck via `FoodTruck.Trucks.ownerId`

### Key Patterns

#### Session Retrieval
Use `getUser(req)` from `utils/session.js` for private endpoints—it extracts user AND joins truck data for owners:
```javascript
const user = await getUser(req);
if (user.role !== "truckOwner") return res.status(403).send('...');
```
Returns user object with `truckId`, `truckName`, etc. (if truck owner).

#### Cookie Management
- **Extraction**: `getSessionToken(req)` parses `session_token` from request cookies (see `utils/session.js`)
- **Setting**: In responses, set `session_token` cookie with expiry time (see `/api/v1/user/login`)

#### Database Queries
All queries use Knex.js builder syntax. Common patterns:
```javascript
await db.select('*').from('FoodTruck.Users').where('email', email);
await db('FoodTruck.MenuItems').insert({truckId, name, price});
await db.select('*').from({s: 'FoodTruck.Sessions'})
  .innerJoin('FoodTruck.Users as u', 's.userId', 'u.userId').first();
```

## Development Setup

### Prerequisites
- Node.js, PostgreSQL, VS Code
- Thunder Client extension (for API testing)

### Initial Setup (One-time)
1. Create schema `backendProject` in postgres DB via pgAdmin4
2. Execute all SQL from `connectors/scripts.sql` to create tables
3. Create `.env` file with `PASSWORD=<your_postgres_password>`
4. Run `npm install` (dependencies already in `package.json`)

### Start Server
```bash
npm run server
```
Server runs on port 3001 (configurable via `PORT` env var). Uses `nodemon` for auto-restart on file changes.

## Testing
- Use **Thunder Client** VS Code extension to test APIs
- Public endpoints: `/api/v1/user` (POST register), `/api/v1/user/login` (POST login)
- Private endpoints: Require `session_token` cookie to validate

## Key Files & Responsibilities
- **`middleware/auth.js`**: Session validation; redirects unauthenticated requests to home
- **`utils/session.js`**: Token extraction from cookies, user lookup with truck join
- **`views/*.hjs`**: HJS templates for login, register, homepages; rendered from public/private view routes
- **`public/js/*.js`**: Frontend logic for forms (login.js, register.js) and styling

## Common Development Tasks

### Adding a Private API Endpoint
1. Add route in `routes/private/api.js`
2. Use `getUser(req)` to access authenticated user
3. Check role if needed (e.g., `user.role === "truckOwner"`)
4. Query `"FoodTruck.X"` tables via `db` singleton

### Adding a Protected View
1. Define route in `routes/private/view.js`
2. User automatically authenticated by middleware; extract via `getSessionToken(req)`
3. Render template: `res.render('viewname')`

### Database Changes
- Modify `connectors/scripts.sql` (schema definition)
- Running `npm run server` does NOT auto-migrate; execute SQL manually via pgAdmin4

## Dependencies & Versions
- `express` ^4.21.2: Web framework
- `knex` ^2.5.1: SQL query builder
- `pg` ^8.16.3: PostgreSQL driver
- `hjs` ^0.0.6: Templating engine
- `uuid` ^9.0.1: Session token generation
- `dotenv` ^16.6.1: Environment variables
- `nodemon` ^2.0.22: Dev auto-reload

## Session Expiry
Sessions expire 30 minutes after creation (`18000000` ms in code). Expired sessions trigger redirect to login; invalid tokens also redirect to `/`.
