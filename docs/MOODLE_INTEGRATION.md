# Moodle 5 OAuth Integration Guide

This guide explains how to configure Moodle 5 to use Wits Cyber as an OAuth 2.0 identity provider.

## Overview

Moodle 5 supports OAuth 2.0 authentication, allowing users to log in with their Wits Cyber credentials. This integration uses the OpenID Connect protocol.

## Prerequisites

- Moodle 5.x installed and running
- Administrator access to Moodle
- Wits Cyber Auth system deployed and accessible

## Step 1: Register OAuth Client

First, you need to register Moodle as an OAuth client in the Wits Cyber system.

### Option A: Using the Admin API

```bash
curl -X POST https://your-wits-cyber-domain.com/api/admin/oauth/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Moodle LMS",
    "redirect_uris": [
      "https://your-moodle-domain.com/admin/oauth2callback.php"
    ],
    "allowed_scopes": ["openid", "profile", "email"]
  }'
```

Response:
```json
{
  "client_id": "generated-client-id",
  "client_secret": "generated-client-secret",
  "name": "Moodle LMS",
  "redirect_uris": ["https://your-moodle-domain.com/admin/oauth2callback.php"]
}
```

**Save the `client_id` and `client_secret` - you'll need them for Moodle configuration.**

### Option B: Direct Database Insert

```sql
INSERT INTO oauth_clients (client_id, client_secret, name, redirect_uris, allowed_scopes)
VALUES (
  'moodle-client-id',
  'your-secure-client-secret',
  'Moodle LMS',
  ARRAY['https://your-moodle-domain.com/admin/oauth2callback.php'],
  ARRAY['openid', 'profile', 'email']
);
```

## Step 2: Configure Moodle

### 2.1 Navigate to OAuth 2 Services

1. Log in to Moodle as an administrator
2. Go to **Site administration** → **Server** → **OAuth 2 services**
3. Click **Create new custom service**

### 2.2 Service Configuration

Fill in the following details:

| Field | Value |
|-------|-------|
| **Name** | Wits Cyber |
| **Client ID** | `your-client-id` (from Step 1) |
| **Client secret** | `your-client-secret` (from Step 1) |
| **Service base URL** | `https://your-wits-cyber-domain.com` |
| **Logo URL** | `https://your-wits-cyber-domain.com/logo.png` (optional) |
| **This service will be used** | Login page and internal services |
| **Name displayed on login page** | Sign in with Wits Cyber |
| **Require email verification** | No (already verified via Google) |

### 2.3 Configure Endpoints

Click **Configure endpoints** and set:

| Endpoint | URL |
|----------|-----|
| **authorization_endpoint** | `https://your-wits-cyber-domain.com/api/oauth/authorize` |
| **token_endpoint** | `https://your-wits-cyber-domain.com/api/oauth/token` |
| **userinfo_endpoint** | `https://your-wits-cyber-domain.com/api/oauth/userinfo` |
| **discovery_endpoint** | `https://your-wits-cyber-domain.com/api/oauth/.well-known/openid-configuration` |

### 2.4 Configure User Field Mappings

Click **Configure user field mappings** and set:

| External field | Internal field |
|----------------|----------------|
| `sub` | `idnumber` |
| `email` | `email` |
| `name` | `firstname lastname` |
| `given_name` | `firstname` |
| `family_name` | `lastname` |
| `picture` | `picture` |

### 2.5 Save and Enable

1. Click **Save changes**
2. Ensure the service is enabled

## Step 3: Configure Authentication

1. Go to **Site administration** → **Plugins** → **Authentication** → **Manage authentication**
2. Enable **OAuth 2** authentication
3. Move it to the desired position in the authentication order

### OAuth 2 Settings

| Setting | Value |
|---------|-------|
| **OAuth 2 service** | Wits Cyber |
| **Prevent account creation** | No (to auto-create accounts) |
| **Account creation domain** | `students.wits.ac.za` |

## Step 4: Test the Integration

1. Log out of Moodle
2. On the login page, click **Sign in with Wits Cyber**
3. You should be redirected to the Wits Cyber auth page
4. After authentication, you'll be redirected back to Moodle

## Troubleshooting

### Error: "Invalid redirect_uri"

Ensure the redirect URI in Moodle matches exactly what's registered in the OAuth client:
- Check for trailing slashes
- Ensure HTTPS is used
- Verify the path is correct (`/admin/oauth2callback.php`)

### Error: "Invalid scope"

Ensure the OAuth client has the required scopes: `openid`, `profile`, `email`

### Error: "User not found after authentication"

Check the user field mappings in Moodle. The `email` field must be mapped correctly.

### Users can't log in

1. Check that the OAuth 2 authentication plugin is enabled
2. Verify the service is configured correctly
3. Check Moodle logs at **Site administration** → **Reports** → **Logs**

## Advanced Configuration

### Custom Claims

To add custom claims to the userinfo response, modify the `/api/oauth/userinfo/route.ts` file:

```typescript
// Add custom claim
response.affiliation = "University of the Witwatersrand"
response.groups = ["wits-cyber-members"]
```

### Restricting Access

To restrict Moodle access to specific users, add authorization logic:

```typescript
// In /api/oauth/authorize/route.ts
const allowedGroups = ["moodle-access"]
if (!userHasGroup(payload.sub, allowedGroups)) {
  return NextResponse.redirect(new URL('/?error=access_denied', request.url))
}
```

## Security Notes

- Always use HTTPS in production
- Rotate client secrets periodically
- Monitor OAuth logs for suspicious activity
- Consider implementing rate limiting on the token endpoint
