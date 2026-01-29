# User Authentication Flow

## Overview

The system now supports both new user registration and returning user login with persistent JSON database storage.

## Data Persistence

All user data is stored in `data/database.json` which persists between sessions:
- User accounts and passwords (hashed with bcrypt)
- Profile information
- VPN configuration paths
- Session tokens

## User Flows

### New User Registration

1. **Landing Page** - Shows login form
2. **Click "Create New Account"** - Switches to registration flow
3. **Step 1: Google Sign-In** - Authenticate with @students.wits.ac.za
4. **Step 2: Set Password** - Create account password
5. **Step 3: Profile Setup** - Enter student details
6. **Registration Complete** - VPN download available

### Returning User Login

1. **Landing Page** - Shows login form
2. **Enter Email & Password** - Credentials from registration
3. **Dashboard** - Access profile and download VPN

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login with email/password
  ```json
  {
    "email": "student@students.wits.ac.za",
    "password": "..."
  }
  ```

- `GET /api/auth/me` - Get current user profile (requires session cookie)
  ```json
  {
    "success": true,
    "user": {
      "id": "...",
      "email": "...",
      "name": "...",
      "hasVpnConfig": true,
      ...
    }
  }
  ```

- `POST /api/auth/register` - Register new user (existing)

- `POST /api/auth/profile` - Update user profile (existing)

### VPN

- `GET /api/vpn/profile` - Download VPN config (requires authentication)
  - Returns .ovpn file for authenticated user
  - Auto-provisions from backend if not exists
  - Saves to `data/vpn-profiles/`

## Session Management

Sessions are stored in:
- **Cookie**: `session` (HTTP-only, 7-day expiration)
- **Database**: `data/database.json` → `sessions` array

Session includes:
- User ID
- JWT token
- Expiration timestamp

## Password Security

- Passwords hashed with **bcrypt** (12 rounds)
- Never stored in plain text
- Validated against requirements:
  - Minimum 12 characters
  - Uppercase, lowercase, number, special character

## Components

### New Components

- `components/auth/ebs-login-form.tsx` - Login UI
- `components/auth/ebs-profile-dashboard.tsx` - User dashboard with VPN download
- `components/auth/ebs-vpn-download.tsx` - VPN file download button

### Updated Components

- `components/auth/ebs-register-card.tsx` - Now handles both login and registration
  - Auto-detects existing session on mount
  - Shows login form by default
  - Switches between login/register/dashboard

## User Experience

### First Visit (New User)
```
Landing Page (Login) 
  → "Create New Account"
  → Google Sign-In
  → Set Password
  → Profile Setup
  → Success + VPN Download
```

### Return Visit (Existing User)
```
Landing Page (Login)
  → Enter Email/Password
  → Dashboard
  → Download VPN (already provisioned)
```

### Session Active
```
Landing Page
  → Auto-redirect to Dashboard
  → Access profile and VPN
```

## Data Storage Structure

```json
{
  "users": [
    {
      "id": "uuid",
      "email": "student@students.wits.ac.za",
      "passwordHash": "$2b$12$...",
      "googleId": "...",
      "name": "Student Name",
      "firstName": "Student",
      "lastName": "Name",
      "username": "student_001",
      "studentNumber": "1234567",
      "faculty": "Science",
      "yearOfStudy": "3rd Year",
      "vpnConfigPath": "data/vpn-profiles/student@students.wits.ac.za.ovpn",
      "vpnAssignedIp": "10.60.0.10",
      "createdAt": "2026-01-29T...",
      "updatedAt": "2026-01-29T..."
    }
  ],
  "sessions": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "token": "jwt-token",
      "expiresAt": "2026-02-05T...",
      "createdAt": "2026-01-29T..."
    }
  ]
}
```

## Security Features

- ✅ HTTP-only session cookies
- ✅ Bcrypt password hashing (12 rounds)
- ✅ JWT session tokens with expiration
- ✅ Server-side session validation
- ✅ No passwords in client-side code
- ✅ Automatic session cleanup (expired tokens removed)

## Testing

### Test New Registration
1. Visit http://localhost:3000
2. Click "Create New Account"
3. Complete all steps
4. Verify VPN download works

### Test Login
1. Visit http://localhost:3000 (or refresh)
2. Enter registered email/password
3. Click "Sign In"
4. Verify dashboard loads
5. Verify VPN download still works

### Test Session Persistence
1. Log in successfully
2. Close browser
3. Open http://localhost:3000 again
4. Should auto-redirect to dashboard (session cookie valid for 7 days)

### Test Logout
1. From dashboard, click "Sign Out"
2. Should return to login page
3. Session cookie cleared
4. Must log in again to access dashboard

## Troubleshooting

**"Invalid email or password"**
- Check email ends with @students.wits.ac.za
- Password is case-sensitive
- Verify user completed registration

**"Not authenticated"**
- Session cookie expired (>7 days old)
- Cookies blocked in browser
- Clear cookies and log in again

**"Failed to load profile"**
- User record missing from database
- Check `data/database.json` exists
- Verify file permissions

**VPN download fails**
- Check VPN_BACKEND_URL in .env.local
- Verify backend server is running
- Check backend logs for errors

## Development

### Add New Profile Fields

1. Update `User` interface in `lib/storage/json-db.ts`
2. Update profile form in `components/auth/ebs-profile-setup.tsx`
3. Update dashboard display in `components/auth/ebs-profile-dashboard.tsx`
4. Update `/api/auth/me` response

### Change Session Duration

In `app/api/auth/login/route.ts`:
```typescript
maxAge: 60 * 60 * 24 * 7  // 7 days (in seconds)
```

Change to desired duration.

### Cleanup Expired Sessions

The database file grows over time. Add a cleanup script:

```bash
# scripts/cleanup-sessions.ts
import { cleanupExpired } from '@/lib/storage/json-db'
await cleanupExpired()
```

Run periodically via cron or task scheduler.
