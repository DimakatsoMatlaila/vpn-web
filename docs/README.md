# Wits Cyber Authentication System

A centralized authentication system for the Wits Cyber cybersecurity interest group. This system provides:

- **Google Sign-in** for initial registration (restricted to @students.wits.ac.za)
- **Unified Password** for CTFd and Active Directory access
- **OAuth 2.0 Provider** for Moodle 5 integration
- **REST API** for CTFd authentication

## Quick Links

- [Moodle Integration Guide](./MOODLE_INTEGRATION.md)
- [CTFd Integration Guide](./CTFD_INTEGRATION.md)
- [Active Directory Guide](./AD_INTEGRATION.md)
- [API Reference](./API_REFERENCE.md)
- [Environment Variables](./ENV_SETUP.md)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Wits Cyber Auth System                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Google     │    │   Wits Cyber │    │   Database   │      │
│  │   OAuth      │───▶│   Backend    │◀──▶│   (Users)    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Moodle 5   │    │    CTFd      │    │   Active     │      │
│  │   (OAuth)    │    │   (API/SSO)  │    │   Directory  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## User Flow

1. User visits registration page
2. Signs in with Google (@students.wits.ac.za email required)
3. Creates a password (used for CTFd and AD)
4. Account is created in the system
5. User can now:
   - Log into CTFd with username/password
   - Log into Moodle via OAuth SSO
   - Log into AD-connected services

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Cloud Console project (for OAuth)
- Environment variables configured

### Installation

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env.local` file:

```env
# Database
DATABASE_URL=postgresql://...

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Secret (generate a secure random string)
JWT_SECRET=your-jwt-secret-min-32-chars

# CTFd Integration
CTFD_API_KEY=your-ctfd-api-key
CTFD_URL=https://ctf.witscyber.co.za
CTFD_WEBHOOK_SECRET=your-webhook-secret

# AD Integration
AD_SYNC_API_KEY=your-ad-sync-api-key
```

## Security Considerations

- All passwords are hashed using bcrypt with 12 rounds
- OAuth tokens are short-lived with refresh token support
- PKCE is supported for OAuth flows
- API endpoints are protected with API keys
- Session cookies are HTTP-only and secure
