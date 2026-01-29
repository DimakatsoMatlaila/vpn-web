# API Reference

Complete API documentation for the Wits Cyber Authentication System.

## Base URL

```
https://your-wits-cyber-domain.com
```

## Authentication

### Session Cookie

Most user-facing endpoints use session cookies set during login.

### API Keys

Service-to-service communication uses API keys in headers:

```
X-CTFd-API-Key: for CTFd integration
X-Admin-API-Key: for AD sync and admin operations
```

### OAuth Bearer Tokens

OAuth-protected endpoints use Bearer tokens:

```
Authorization: Bearer <access_token>
```

---

## User Registration

### POST /api/auth/register

Create a new user account after Google authentication.

**Request:**
```json
{
  "googleId": "google-sub-id",
  "email": "student@students.wits.ac.za",
  "name": "Student Name",
  "picture": "https://...",
  "password": "SecurePassword123!"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "student@students.wits.ac.za",
    "name": "Student Name"
  }
}
```

**Errors:**
- `400` - Missing required fields or invalid password
- `409` - User already exists

---

## OAuth 2.0 Endpoints

### GET /api/oauth/authorize

OAuth 2.0 authorization endpoint.

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `client_id` | Yes | Registered client ID |
| `redirect_uri` | Yes | Callback URL |
| `response_type` | Yes | Must be `code` |
| `scope` | No | Space-separated scopes |
| `state` | Recommended | CSRF protection |
| `code_challenge` | No | PKCE challenge |
| `code_challenge_method` | No | `plain` or `S256` |

**Response:**
Redirects to `redirect_uri` with:
- `code` - Authorization code
- `state` - If provided

---

### POST /api/oauth/token

Exchange authorization code for tokens.

**Request (form-urlencoded or JSON):**
```
grant_type=authorization_code
code=<authorization_code>
client_id=<client_id>
client_secret=<client_secret>
redirect_uri=<redirect_uri>
code_verifier=<pkce_verifier>  # If PKCE was used
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "dGhp...",
  "scope": "openid profile email"
}
```

---

### GET /api/oauth/userinfo

Get authenticated user's information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "sub": "user-uuid",
  "email": "student@students.wits.ac.za",
  "email_verified": true,
  "name": "Student Name",
  "given_name": "Student",
  "family_name": "Name",
  "picture": "https://..."
}
```

---

### GET /api/oauth/.well-known/openid-configuration

OpenID Connect discovery document.

**Response:**
```json
{
  "issuer": "https://your-domain.com",
  "authorization_endpoint": "https://your-domain.com/api/oauth/authorize",
  "token_endpoint": "https://your-domain.com/api/oauth/token",
  "userinfo_endpoint": "https://your-domain.com/api/oauth/userinfo",
  "jwks_uri": "https://your-domain.com/api/oauth/.well-known/jwks.json",
  "response_types_supported": ["code"],
  "scopes_supported": ["openid", "profile", "email"],
  "claims_supported": ["sub", "email", "email_verified", "name", "given_name", "family_name", "picture"]
}
```

---

## CTFd Integration

### POST /api/ctfd/auth/verify

Verify user credentials for CTFd login.

**Headers:**
```
X-CTFd-API-Key: <api_key>
Content-Type: application/json
```

**Request:**
```json
{
  "username": "student123",
  "password": "userpassword"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "Student Name",
    "email": "student123@students.wits.ac.za",
    "type": "user"
  }
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": "Invalid password"
}
```

---

### GET /api/ctfd/auth/sso

Initiate SSO flow for CTFd.

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `return_url` | No | CTFd URL to redirect to |

**Response:**
Redirects to login if not authenticated, then to CTFd with SSO token.

---

### POST /api/ctfd/auth/sso/validate

Validate SSO token from CTFd callback.

**Headers:**
```
X-CTFd-API-Key: <api_key>
```

**Request:**
```json
{
  "token": "sso-token"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "student@students.wits.ac.za",
    "name": "Student Name",
    "type": "user",
    "verified": true
  }
}
```

---

### GET /api/ctfd/users

Get user details by email or ID.

**Headers:**
```
X-CTFd-API-Key: <api_key>
```

**Query Parameters:**
- `email` - User's email address
- `user_id` - User's UUID

**Response:**
```json
{
  "id": "uuid",
  "email": "student@students.wits.ac.za",
  "name": "Student Name",
  "username": "student",
  "affiliation": "University of the Witwatersrand",
  "verified": true
}
```

---

### POST /api/ctfd/webhook

Receive webhook events from CTFd.

**Headers:**
```
X-CTFd-Signature: <hmac_signature>
Content-Type: application/json
```

**Request:**
```json
{
  "event": "challenge.solve",
  "data": {
    "user_id": "123",
    "challenge_id": "456"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Events:**
- `user.register`
- `user.login`
- `user.update`
- `challenge.solve`

---

## Active Directory Sync

### GET /api/ad/sync

Get user details in AD-compatible format.

**Headers:**
```
X-Admin-API-Key: <api_key>
```

**Query Parameters:**
- `email` - User's email address

**Response:**
```json
{
  "sAMAccountName": "student123",
  "userPrincipalName": "student123@students.wits.ac.za",
  "mail": "student123@students.wits.ac.za",
  "displayName": "Student Name",
  "givenName": "Student",
  "sn": "Name",
  "cn": "Student Name",
  "memberOf": ["CN=WitsCyber-Members,OU=Groups,DC=wits,DC=ac,DC=za"],
  "enabled": true
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "error_code",
  "error_description": "Human readable description"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `invalid_request` | 400 | Missing or invalid parameters |
| `invalid_client` | 401 | Unknown or invalid client |
| `invalid_token` | 401 | Invalid or expired token |
| `invalid_grant` | 400 | Invalid authorization code |
| `unauthorized` | 401 | Missing or invalid API key |
| `not_found` | 404 | Resource not found |
| `server_error` | 500 | Internal server error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/api/auth/*` | 10 req/min |
| `/api/oauth/token` | 20 req/min |
| `/api/ctfd/*` | 100 req/min |
| `/api/ad/*` | 50 req/min |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642089600
