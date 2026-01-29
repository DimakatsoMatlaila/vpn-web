# Environment Variables Setup

Complete guide for configuring environment variables.

## Required Variables

### Database

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

### Google OAuth

```env
# Google Cloud Console > APIs & Services > Credentials
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Development redirect URL (set in Supabase/Vercel dashboard)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
```

### JWT Secret

```env
# Generate with: openssl rand -base64 32
JWT_SECRET=your-very-secure-jwt-secret-at-least-32-characters
```

## Integration Variables

### CTFd

```env
# API key for CTFd to authenticate with Wits Cyber
# Generate with: openssl rand -base64 32
CTFD_API_KEY=your-ctfd-api-key

# Your CTFd instance URL
CTFD_URL=https://ctf.witscyber.co.za

# Webhook secret for CTFd events
# Generate with: openssl rand -base64 32
CTFD_WEBHOOK_SECRET=your-webhook-secret
```

### Active Directory

```env
# API key for AD sync operations
# Generate with: openssl rand -base64 32
AD_SYNC_API_KEY=your-ad-sync-api-key
```

## Optional Variables

### Application

```env
# Application URL (auto-detected in most cases)
NEXT_PUBLIC_APP_URL=https://auth.witscyber.co.za

# Environment
NODE_ENV=production
```

### Security

```env
# Rate limiting (requests per minute)
RATE_LIMIT_AUTH=10
RATE_LIMIT_API=100

# Session duration (seconds)
SESSION_DURATION=604800  # 7 days

# Access token duration (seconds)
ACCESS_TOKEN_DURATION=3600  # 1 hour

# Refresh token duration (seconds)
REFRESH_TOKEN_DURATION=2592000  # 30 days
```

## Setup by Environment

### Local Development

Create `.env.local`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wits_cyber
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-dev-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-dev-client-secret
JWT_SECRET=development-jwt-secret-not-for-production
CTFD_API_KEY=dev-ctfd-api-key
CTFD_URL=http://localhost:8000
AD_SYNC_API_KEY=dev-ad-sync-key
```

### Production (Vercel)

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add each variable with **Production** environment selected
4. Redeploy for changes to take effect

### Docker

Create `.env.production`:

```env
DATABASE_URL=postgresql://user:pass@db:5432/wits_cyber
# ... other variables
```

Use in docker-compose:

```yaml
services:
  app:
    env_file:
      - .env.production
```

## Google OAuth Setup

### 1. Create Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the **Google+ API** and **People API**

### 2. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in:
   - App name: `Wits Cyber`
   - User support email: your email
   - Authorized domains: `witscyber.co.za`
   - Developer contact: your email

### 3. Create Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - `https://auth.witscyber.co.za/api/auth/google/callback` (production)

### 4. Restrict to Wits Domain

In the OAuth consent screen, under **Domain verification**:
- Verify ownership of `students.wits.ac.za` if possible
- Or use the `hd` parameter to restrict to Wits domain (implemented in code)

## Security Best Practices

1. **Never commit secrets** - Use `.env.local` (gitignored) or environment variables in deployment platform

2. **Rotate secrets regularly**:
   - JWT_SECRET: Every 6 months
   - API keys: Every 3 months
   - Client secrets: Annually

3. **Use strong secrets**:
   ```bash
   # Generate secure random string
   openssl rand -base64 32
   ```

4. **Separate environments** - Use different credentials for development, staging, and production

5. **Monitor for leaks** - Use tools like GitGuardian or GitHub's secret scanning
