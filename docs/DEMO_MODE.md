# Demo Mode Control Guide

## Quick Reference

### ✅ ENABLE Demo Mode (In-Memory Storage)

**Edit `.env.local`:**
```env
DEMO_MODE=true
DATABASE_URL=
```

**Then restart:**
```bash
npm run dev
```

**Result:** App uses in-memory storage, no database required.

---

### ❌ DISABLE Demo Mode (Use Real Database)

**Edit `.env.local`:**
```env
DEMO_MODE=false
DATABASE_URL=postgresql://user:password@localhost:5432/wits_cyber
```

**Then run:**
```bash
# Install database driver (if not already installed)
npm install pg

# Run migrations
npm run db:migrate

# Start server
npm run dev
```

**Result:** App connects to real database.

---

## How It Works

The `DEMO_MODE` environment variable explicitly controls whether the app uses demo mode:

| DEMO_MODE | DATABASE_URL | Behavior |
|-----------|--------------|----------|
| `true` | Any value | ✅ **Demo Mode** - Uses in-memory storage |
| `false` | Set | ✅ **Database Mode** - Uses real database |
| `false` | Empty | ❌ **Error** - Database required but not configured |
| Not set | Set | ✅ **Database Mode** - Uses database (legacy behavior) |
| Not set | Empty | ✅ **Demo Mode** - Uses in-memory storage (legacy behavior) |

### Priority

1. **`DEMO_MODE` flag** (if set) takes precedence
2. **`DATABASE_URL` presence** (fallback for legacy configs)

---

## Step-by-Step: Switch from Demo to Database

### 1. Set Up Database

**PostgreSQL:**
```powershell
# Create database
psql -U postgres
CREATE DATABASE wits_cyber;
CREATE USER wits_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE wits_cyber TO wits_user;
\q

# Install driver
npm install pg
```

**MySQL:**
```powershell
# Create database
mysql -u root -p
CREATE DATABASE wits_cyber;
CREATE USER 'wits_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON wits_cyber.* TO 'wits_user'@'localhost';
EXIT;

# Install driver
npm install mysql2
```

### 2. Update `.env.local`

```env
# Turn OFF demo mode
DEMO_MODE=false

# Set your database connection
DATABASE_URL=postgresql://wits_user:your_password@localhost:5432/wits_cyber
# OR for MySQL:
# DATABASE_URL=mysql://wits_user:your_password@localhost:3306/wits_cyber
```

### 3. Run Migrations

```bash
npm run db:migrate
```

**Expected output:**
```
🔧 Wits Cyber Database Migration Tool

Database Type: PostgreSQL
Connection: postgresql://wits_user:****@localhost:5432/wits_cyber

📡 Connecting to PostgreSQL...
✅ Connected successfully

📄 Reading migration: 001_postgresql_schema.sql
⚙️  Executing migration...
✅ Migration completed successfully!
```

### 4. Restart Server

```bash
npm run dev
```

### 5. Verify

- Navigate to http://localhost:3000
- Check the top toolbar - it should say **"Connected: Database"** instead of "Connected: Demo Mode"
- Register a new user - data will be saved to the database
- Stop and restart the server - user data persists (not in demo mode anymore!)

---

## Checking Current Mode

### In the UI

Look at the **top toolbar** in the app:
- 🟢 **"Connected: Demo Mode"** = Demo mode is active
- 🔵 **"Connected: Database"** = Database mode is active

### In the Code

All database functions check the mode automatically:

```typescript
// lib/db/index.ts
const isDemoMode = () => {
  // Explicit DEMO_MODE flag takes precedence
  if (process.env.DEMO_MODE !== undefined) {
    return process.env.DEMO_MODE === 'true'
  }
  // Fallback: no database URL means demo mode
  return !process.env.DATABASE_URL
}
```

### In Server Logs

When you start the server, look for log messages:

**Demo Mode:**
```
[DEMO MODE] Skipping database query: SELECT * FROM users WHERE email = $1
```

**Database Mode:**
```
[DATABASE] Executing query: SELECT * FROM users WHERE email = $1
```

---

## Common Scenarios

### Scenario 1: Development with Demo Data

```env
DEMO_MODE=true
DATABASE_URL=
```

- Quick testing without database setup
- Pre-seeded demo user
- No persistence between restarts
- Perfect for UI development

---

### Scenario 2: Development with Real Database

```env
DEMO_MODE=false
DATABASE_URL=postgresql://localhost:5432/wits_cyber_dev
```

- Full database functionality
- Data persists between restarts
- Test migrations and database features
- Close to production environment

---

### Scenario 3: Production

```env
DEMO_MODE=false
DATABASE_URL=postgresql://user:pass@db.example.com:5432/wits_cyber
JWT_SECRET=very-secure-secret-min-32-chars
CTFD_API_KEY=secure-ctfd-api-key
```

- Always use real database in production
- Never use demo mode in production
- Secure all API keys and secrets

---

## Troubleshooting

### Error: "Database not configured"

**Problem:** `DEMO_MODE=false` but `DATABASE_URL` is empty.

**Solution:** Either set `DATABASE_URL` or change `DEMO_MODE=true`

```env
# Option 1: Use demo mode
DEMO_MODE=true

# Option 2: Set database URL
DEMO_MODE=false
DATABASE_URL=postgresql://user:password@localhost:5432/wits_cyber
```

---

### Error: "Cannot find module 'pg'"

**Problem:** Database driver not installed.

**Solution:**
```bash
npm install pg        # For PostgreSQL
npm install mysql2    # For MySQL
```

---

### Data Not Persisting

**Problem:** Still in demo mode but thought it was disabled.

**Check:**
1. Verify `.env.local` has `DEMO_MODE=false`
2. Restart the dev server (old env vars are cached)
3. Check the UI toolbar shows "Connected: Database"

**Solution:**
```bash
# Stop server (Ctrl+C)
# Verify .env.local
cat .env.local | grep DEMO_MODE

# Should show: DEMO_MODE=false

# Restart
npm run dev
```

---

### Demo User Still Appearing

**Problem:** Demo user exists even in database mode.

**This is normal!** The demo user is pre-seeded in the in-memory store, but won't appear in database mode. If you're seeing the demo user in database mode, you likely registered them while in demo mode, then switched to database mode. They only exist in memory.

**Solution:** In database mode, register a new user with a different email.

---

## Best Practices

### ✅ Do

- Use `DEMO_MODE=true` for quick UI testing
- Use `DEMO_MODE=false` for integration testing
- Always set `DEMO_MODE=false` in production
- Document which mode you're using in comments

### ❌ Don't

- Don't use demo mode in production
- Don't rely on demo data for important tests
- Don't forget to run migrations when switching to database mode
- Don't commit `.env.local` to version control

---

## Environment File Example

### Development (Demo)

```env
# .env.local
DEMO_MODE=true
DATABASE_URL=
JWT_SECRET=dev-jwt-secret-change-for-production
CTFD_API_KEY=demo-api-key
```

### Development (Database)

```env
# .env.local
DEMO_MODE=false
DATABASE_URL=postgresql://wits_user:devpass@localhost:5432/wits_cyber_dev
JWT_SECRET=dev-jwt-secret-change-for-production
CTFD_API_KEY=dev-ctfd-api-key
```

### Production

```env
# Set in deployment platform (Vercel, Railway, etc.)
DEMO_MODE=false
DATABASE_URL=postgresql://prod_user:secure_pass@db.example.com:5432/wits_cyber_prod
JWT_SECRET=vXJk8Hp9QmNwL3RzY2xpZW50X3NlY3JldA==
CTFD_API_KEY=prod-secure-ctfd-key-32-chars
NEXT_PUBLIC_GOOGLE_CLIENT_ID=actual-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=actual-google-client-secret
```

---

## Quick Commands Reference

```bash
# Check current mode
cat .env.local | grep DEMO_MODE

# Enable demo mode
echo "DEMO_MODE=true" >> .env.local

# Disable demo mode
echo "DEMO_MODE=false" >> .env.local

# Run migrations (required when DEMO_MODE=false)
npm run db:migrate

# Restart server
npm run dev
```

---

For more information:
- [Database Setup Guide](./DATABASE_SETUP.md)
- [Environment Variables](./ENV_SETUP.md)
- [API Reference](./API_REFERENCE.md)
