# WitsCyber Registration System

Production-ready student registration system with JSON file-based storage, Google OAuth authentication, and VPN profile provisioning.

## Features

- **Google OAuth Authentication**: Secure sign-in with @students.wits.ac.za accounts
- **JSON File Storage**: All data stored in easily-syncable JSON files
- **VPN Profile Provisioning**: Automatic OpenVPN profile generation after registration
- **OAuth Provider**: Acts as OAuth provider for Moodle and CTFd integration
- **Oracle E-Business Suite UI**: Classic enterprise UI theme

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.production .env.local
```

Edit `.env.local` and configure:

**Required:**
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `JWT_SECRET` - Generate with `openssl rand -base64 32`

**Optional:**
- `VPN_BACKEND_URL` - URL of VPN provisioning server (default: http://localhost:3001)
- `MOODLE_CLIENT_SECRET` - For Moodle OAuth integration
- `CTFD_CLIENT_SECRET` - For CTFd OAuth integration

### 3. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

### 4. Run Production

```bash
npm run build
npm start
```

## Data Storage

All data is stored in JSON files in the `data/` directory:

- `data/database.json` - User accounts, OAuth clients, tokens, sessions
- `data/vpn-profiles/` - User VPN configuration files

**Backup:** Simply copy the `data/` directory to back up all user data.

## VPN Integration

After successful registration, users can download their VPN profile. The system communicates with the VPN backend server to:

1. Generate client certificates
2. Assign static VPN IP addresses
3. Create .ovpn configuration files

Configure the VPN backend URL in `.env.local`:

```env
VPN_BACKEND_URL=http://your-vpn-server:3001
```

See `backend/README.md` for VPN backend setup instructions.

## OAuth Provider

The system acts as an OAuth 2.0 provider for Moodle and CTFd:

### Pre-configured Clients

**Moodle:**
- Client ID: `moodle_client`
- Client Secret: Set in `MOODLE_CLIENT_SECRET`
- Redirect URIs: Configured in `lib/storage/json-db.ts`

**CTFd:**
- Client ID: `ctfd_client`
- Client Secret: Set in `CTFD_CLIENT_SECRET`
- Redirect URIs: Configured in `lib/storage/json-db.ts`

### OAuth Endpoints

- Authorization: `/api/oauth/authorize`
- Token: `/api/oauth/token`
- User Info: `/api/oauth/userinfo`

## Directory Structure

```
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication endpoints
│   │   ├── oauth/         # OAuth provider endpoints
│   │   ├── vpn/           # VPN profile endpoints
│   │   ├── ctfd/          # CTFd integration
│   │   └── ad/            # Active Directory sync
│   └── page.tsx           # Main registration page
├── components/
│   ├── auth/              # Authentication UI components
│   └── ui/                # Reusable UI components
├── lib/
│   ├── storage/           # JSON file storage layer
│   ├── vpn/               # VPN backend integration
│   ├── auth/              # JWT & password utilities
│   └── oauth/             # OAuth utilities
├── data/                  # JSON data files (created at runtime)
└── backend/               # VPN provisioning server
```

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens for session management
- OAuth 2.0 with PKCE support
- Input validation on all endpoints
- Domain restriction (@students.wits.ac.za)

## Production Deployment

### Docker

```bash
docker build -t witscyber-registration .
docker run -p 3000:3000 -v ./data:/app/data witscyber-registration
```

### Manual

```bash
npm run build
NODE_ENV=production npm start
```

Mount the `data/` directory as a volume to persist data across container restarts.

## Troubleshooting

**"Failed to provision VPN profile"**
- Check VPN_BACKEND_URL is accessible
- Verify VPN backend server is running
- Check VPN backend logs

**"Invalid session"**
- JWT_SECRET may have changed
- Session may have expired
- Clear cookies and log in again

**Google OAuth errors**
- Verify Google Cloud Console configuration
- Check redirect URI matches exactly
- Ensure @students.wits.ac.za domain restriction

## License

MIT

## Support

For issues or questions, contact WitsCyber support.
