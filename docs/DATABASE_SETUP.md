# Database Setup and Migration Guide

This guide explains how to initialize the database for the Wits Cyber Authentication System.

## Quick Start

### Option 1: Demo Mode (No Database Required)

The easiest way to get started is to run in **demo mode** with in-memory storage:

1. Leave `DATABASE_URL` empty in `.env.local`
2. Start the server: `npm run dev`
3. Visit: http://localhost:3000
4. Use demo credentials: `student@students.wits.ac.za` / `DemoPass123!`

**Demo mode is perfect for:**
- Testing the UI and registration flow
- API development and testing
- Previewing the system without database setup

### Option 2: PostgreSQL Database

#### Step 1: Install PostgreSQL

**Windows:**
```powershell
# Download from: https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE wits_cyber;
CREATE USER wits_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE wits_cyber TO wits_user;
\q
```

#### Step 3: Update .env.local

```env
DATABASE_URL=postgresql://wits_user:your_secure_password@localhost:5432/wits_cyber
```

#### Step 4: Install Database Driver

```bash
npm install pg
```

#### Step 5: Run Migration

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

📊 Database schema initialized:
   - users table
   - user_profiles table
   - oauth_clients table
   - oauth_authorization_codes table
   - oauth_access_tokens table
   - oauth_refresh_tokens table
   - sessions table
   - ctfd_sso_tokens table
   - audit_logs table
   - All indexes and triggers

🎉 All done! Your database is ready to use.
```

### Option 3: MySQL Database

#### Step 1: Install MySQL

**Windows:**
```powershell
# Download from: https://dev.mysql.com/downloads/installer/
# Or use Chocolatey:
choco install mysql
```

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux:**
```bash
sudo apt-get install mysql-server
sudo systemctl start mysql
```

#### Step 2: Create Database

```bash
# Connect to MySQL
mysql -u root -p

# Create database and user
CREATE DATABASE wits_cyber CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wits_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON wits_cyber.* TO 'wits_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Step 3: Update .env.local

```env
DATABASE_URL=mysql://wits_user:your_secure_password@localhost:3306/wits_cyber
```

#### Step 4: Install Database Driver

```bash
npm install mysql2
```

#### Step 5: Run Migration

```bash
npm run db:migrate
```

## Manual Migration (Alternative)

If you prefer to run migrations manually:

### PostgreSQL

```bash
# Run the SQL file directly
psql -U wits_user -d wits_cyber -f scripts/migrations/001_postgresql_schema.sql
```

### MySQL

```bash
# Run the SQL file directly
mysql -u wits_user -p wits_cyber < scripts/migrations/002_mysql_schema.sql
```

## Verifying the Setup

After running migrations, verify the tables were created:

### PostgreSQL

```bash
psql -U wits_user -d wits_cyber

# List all tables
\dt

# Expected output:
#                       List of relations
#  Schema |             Name              | Type  |   Owner
# --------+-------------------------------+-------+-----------
#  public | audit_logs                    | table | wits_user
#  public | ctfd_sso_tokens              | table | wits_user
#  public | oauth_access_tokens          | table | wits_user
#  public | oauth_authorization_codes    | table | wits_user
#  public | oauth_clients                | table | wits_user
#  public | oauth_refresh_tokens         | table | wits_user
#  public | sessions                     | table | wits_user
#  public | user_profiles                | table | wits_user
#  public | users                        | table | wits_user
```

### MySQL

```bash
mysql -u wits_user -p wits_cyber

# Show all tables
SHOW TABLES;

# Expected output:
# +---------------------------+
# | Tables_in_wits_cyber      |
# +---------------------------+
# | audit_logs                |
# | ctfd_sso_tokens          |
# | oauth_access_tokens      |
# | oauth_authorization_codes|
# | oauth_clients            |
# | oauth_refresh_tokens     |
# | sessions                 |
# | user_profiles            |
# | users                    |
# +---------------------------+
```

## Pre-configured OAuth Clients

The MySQL migration automatically creates two OAuth clients:

| Client ID | Name | Purpose |
|-----------|------|---------|
| `moodle_client` | Moodle LMS | Moodle 5 integration |
| `ctfd_client` | CTFd Platform | CTFd integration |

**⚠️ IMPORTANT:** Change the default secrets before production!

Update the secrets in the database:

```sql
-- Update Moodle secret
UPDATE oauth_clients 
SET client_secret = 'your-secure-moodle-secret' 
WHERE client_id = 'moodle_client';

-- Update CTFd secret
UPDATE oauth_clients 
SET client_secret = 'your-secure-ctfd-secret' 
WHERE client_id = 'ctfd_client';
```

## Switching Between Demo and Database Mode

**To enable demo mode:**
1. Remove or comment out `DATABASE_URL` in `.env.local`
2. Restart the dev server

**To use the database:**
1. Set `DATABASE_URL` in `.env.local`
2. Ensure migrations have run
3. Restart the dev server

The app automatically detects the mode based on whether `DATABASE_URL` is set.

## Troubleshooting

### "Cannot find module 'pg'" or "Cannot find module 'mysql2'"

Install the required database driver:
```bash
npm install pg          # For PostgreSQL
npm install mysql2      # For MySQL
```

### "Connection refused" or "Access denied"

- Check that the database server is running
- Verify the username, password, and database name
- Ensure the database user has proper permissions

### "DATABASE_URL is not set"

This means you're running in demo mode. Either:
- Set `DATABASE_URL` in `.env.local` to use a real database
- Continue using demo mode for testing

### Migration fails partway through

The migration script uses `IF NOT EXISTS` clauses, so it's safe to run multiple times. Just run it again:
```bash
npm run db:migrate
```

## Production Deployment

For production on platforms like Vercel, Railway, or Render:

1. **Create a managed database** (recommended):
   - Vercel Postgres
   - Railway PostgreSQL
   - Render PostgreSQL
   - AWS RDS
   - Google Cloud SQL

2. **Add environment variable** to your deployment platform:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/database
   ```

3. **Run migrations** using the platform's console or deploy script:
   ```bash
   npm run db:migrate
   ```

4. **Secure your secrets**:
   - Rotate all default API keys
   - Use strong JWT_SECRET (32+ chars)
   - Update OAuth client secrets

## Database Backup

### PostgreSQL Backup

```bash
# Backup
pg_dump -U wits_user wits_cyber > backup_$(date +%Y%m%d).sql

# Restore
psql -U wits_user wits_cyber < backup_20260110.sql
```

### MySQL Backup

```bash
# Backup
mysqldump -u wits_user -p wits_cyber > backup_$(date +%Y%m%d).sql

# Restore
mysql -u wits_user -p wits_cyber < backup_20260110.sql
```

## Next Steps

After setting up the database:

1. ✅ Start the server: `npm run dev`
2. ✅ Visit: http://localhost:3000
3. ✅ Register your first user
4. ✅ Test the OAuth flow at http://localhost:3000/docs/api
5. ✅ Configure Google OAuth for real authentication
6. ✅ Set up CTFd or Moodle integration

For more information, see:
- [Environment Setup](./ENV_SETUP.md)
- [API Reference](./API_REFERENCE.md)
- [CTFd Integration](./CTFD_INTEGRATION.md)
- [Moodle Integration](./MOODLE_INTEGRATION.md)
