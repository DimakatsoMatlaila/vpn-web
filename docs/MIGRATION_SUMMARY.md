# System Migration Summary

## Major Changes

### ✅ Removed Database Dependency
- **Before:** Required PostgreSQL/MySQL database
- **After:** JSON file-based storage in `data/` directory
- **Impact:** No database setup required, easy backup/sync

### ✅ Removed Demo Mode
- **Before:** DEMO_MODE flag with fallback logic
- **After:** Single production mode with JSON storage
- **Impact:** Simplified configuration, no mode switching

### ✅ Added VPN Integration
- **Before:** No VPN provisioning
- **After:** Automatic VPN profile generation after registration
- **Impact:** Users get .ovpn files via backend API

## New Files Created

### Core Storage Layer
- `lib/storage/json-db.ts` - Complete JSON database implementation
  - User CRUD operations
  - OAuth client/token/code management
  - Session management
  - Auto-initialization with OAuth clients

### VPN Integration
- `lib/vpn/backend-api.ts` - VPN backend API client
  - Requests .ovpn profiles from backend
  - Saves files to `data/vpn-profiles/`
  - Updates user records with VPN info

- `app/api/vpn/profile/route.ts` - VPN download endpoint
  - Authenticated endpoint
  - Returns existing or generates new profile
  - Streams .ovpn file to user

- `components/auth/ebs-vpn-download.tsx` - VPN download UI
  - One-click download button
  - Progress/error states
  - Installation instructions

### Configuration
- `.env.production` - Production environment template
- `docs/DEPLOYMENT.md` - Complete deployment guide
- `data/.gitkeep` - Data directory structure documentation
- `README.md` - Updated with JSON storage info

## Modified Files

### Database Layer (All updated to use JSON storage)
- `app/api/auth/register/route.ts`
- `app/api/auth/profile/route.ts`
- `app/api/ctfd/auth/verify/route.ts`
- `app/api/ctfd/users/route.ts`
- `app/api/ad/sync/route.ts`
- `app/api/oauth/userinfo/route.ts`
- `app/api/oauth/authorize/route.ts`
- `app/api/oauth/token/route.ts`

### UI Components
- `components/ebs-navigation.tsx` - Removed demo mode status
- `components/auth/ebs-registration-success.tsx` - Added VPN download section
- `app/page.tsx` - Updated system status display

### Configuration
- `.gitignore` - Added data/ exclusions
- `.env.example` - Updated for production mode
- `.env.local` - Simplified for JSON storage

## Removed Code

### Deleted Concepts
- ❌ All `DEMO_MODE` environment variable checks
- ❌ `NEXT_PUBLIC_DEMO_MODE` client-side flag
- ❌ DATABASE_URL requirement
- ❌ Demo mode fallback logic
- ❌ In-memory demo store (kept file but unused)
- ❌ PostgreSQL/MySQL connection code

### Files to Delete (Optional)
These files are no longer used but kept for reference:
- `lib/db/index.ts` - Old database abstraction
- `lib/demo/store.ts` - Old demo mode store
- `lib/oauth/db.ts` - Old OAuth storage
- `lib/db/schema.ts` - PostgreSQL schema
- `scripts/migrations/` - Database migration scripts
- `docs/DATABASE_SETUP.md` - Database setup guide

## Environment Variables

### Required
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
JWT_SECRET=...
```

### Optional
```env
VPN_BACKEND_URL=http://localhost:3001
MOODLE_CLIENT_SECRET=...
CTFD_CLIENT_SECRET=...
CTFD_API_KEY=...
AD_SYNC_API_KEY=...
```

### Removed
```env
DEMO_MODE               # No longer used
NEXT_PUBLIC_DEMO_MODE   # No longer used
DATABASE_URL            # No longer used
```

## Data Storage

### Structure
```
data/
├── database.json           # Main data file
└── vpn-profiles/
    ├── 2555500@students.wits.ac.za.ovpn
    └── ...
```

### Database Schema (JSON)
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "student@students.wits.ac.za",
      "googleId": "...",
      "name": "...",
      "passwordHash": "...",
      "vpnConfigPath": "data/vpn-profiles/...",
      "vpnAssignedIp": "10.60.0.10",
      "createdAt": "2026-01-29T...",
      "updatedAt": "2026-01-29T..."
    }
  ],
  "oauthClients": [...],
  "oauthAuthorizationCodes": [...],
  "oauthAccessTokens": [...],
  "oauthRefreshTokens": [...],
  "sessions": [...]
}
```

## Registration Flow

### New Flow with VPN
1. **Google Sign-In** → Popup window, OAuth validation
2. **Password Setup** → bcrypt hash (12 rounds)
3. **Profile Setup** → Student details, username
4. **Registration Success** → Account created
5. **VPN Download** → Click button → Backend provisions profile → Download .ovpn

### Backend Communication
```
Frontend                    Backend (VPN Server)
   |                               |
   |--- POST /api/vpn/profile ---->|
   |    (with session cookie)      |
   |                               |
   |<-- Frontend checks auth ------|
   |    User authenticated?        |
   |                               |
   |--- POST to VPN backend ------>|
   |    { email: "..." }           |
   |                               |
   |                        [Generate cert]
   |                        [Assign IP]
   |                        [Build .ovpn]
   |                               |
   |<-- .ovpn file content --------|
   |    (as download)              |
   |                               |
   [Save to data/vpn-profiles/]   |
   [Update user record]           |
   [Stream to user browser]       |
```

## API Endpoints

### New Endpoints
- `GET /api/vpn/profile` - Download VPN configuration

### Existing Endpoints (Updated)
- `POST /api/auth/register` - Uses JSON storage
- `POST /api/auth/profile` - Uses JSON storage
- `POST /api/ctfd/auth/verify` - Uses JSON storage
- All OAuth endpoints - Use JSON storage

## Migration Checklist

### For Development
- [x] Remove DEMO_MODE from .env.local
- [x] Remove DATABASE_URL from .env.local
- [x] Add VPN_BACKEND_URL
- [x] Generate new JWT_SECRET if needed
- [x] Create data/ directory (auto-created on first run)

### For Production
- [ ] Configure Google OAuth credentials
- [ ] Set strong JWT_SECRET (32+ chars)
- [ ] Configure VPN backend server
- [ ] Set OAuth client secrets
- [ ] Set up automated backups
- [ ] Configure file permissions (chmod 700 data/)
- [ ] Set up reverse proxy (nginx/Apache)
- [ ] Enable HTTPS

## Testing Checklist

- [ ] Google sign-in popup works
- [ ] Registration completes successfully
- [ ] User data saved to data/database.json
- [ ] VPN profile downloads after registration
- [ ] VPN file saved to data/vpn-profiles/
- [ ] CTFd OAuth integration works
- [ ] Moodle OAuth integration works
- [ ] Session persistence works across restarts
- [ ] Backup/restore data/ directory works

## Rollback Plan

If issues arise, to rollback:

1. Restore old code from git
2. Set DEMO_MODE=true in .env.local
3. Or set DATABASE_URL to PostgreSQL connection
4. Restart application

Data in `data/database.json` can be exported and imported to PostgreSQL if needed later.

## Performance Notes

### JSON File Storage
- ✅ Fast for < 10,000 users
- ✅ No database maintenance
- ✅ Easy backup (just copy files)
- ⚠️ Single write at a time (file locking)
- ⚠️ Full file read on each query

### Scaling Options
1. **Current (< 1000 users):** Single instance, local files
2. **Medium (1000-10000):** Multiple instances, NFS shared storage
3. **Large (10000+):** Migrate to PostgreSQL using same schema

## Security Improvements

- ✅ No database credentials to manage
- ✅ File-based permissions control
- ✅ Easy to audit (just read JSON file)
- ✅ Simple backup encryption (encrypt data/ directory)
- ✅ No SQL injection possible
- ⚠️ Ensure proper file permissions in production

## Documentation

- ✅ README.md - Quick start guide
- ✅ docs/DEPLOYMENT.md - Production deployment
- ✅ docs/ENV_SETUP.md - Environment variables
- ✅ data/.gitkeep - Data directory info
- ✅ backend/README.md - VPN backend setup

## Next Steps

1. Test the system locally
2. Configure VPN backend server
3. Set up Google OAuth credentials
4. Deploy to production server
5. Set up automated backups
6. Configure monitoring/logging
7. Test full registration flow
8. Integrate with CTFd/Moodle

## Support

For questions or issues with the migration:
1. Check docs/DEPLOYMENT.md
2. Review data/database.json structure
3. Check application logs
4. Verify file permissions
5. Contact WitsCyber support
