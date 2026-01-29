# WitsCyber VPN Backend

OpenVPN client profile provisioning API for WitsCyber students.

## Overview

This backend application provisions OpenVPN client profiles by:
- Generating client certificates using Easy-RSA
- Assigning static VPN IPs from a configured pool
- Creating client configuration directory (CCD) files
- Building complete .ovpn profiles with embedded certificates
- Storing metadata in JSON (no database required)

## Features

- **Automated provisioning**: One-click VPN profile generation
- **Easy-RSA integration**: Secure certificate generation
- **Static IP assignment**: Sequential IP allocation with duplicate prevention
- **Role-based access**: Student and admin roles
- **RESTful API**: Simple HTTP endpoints
- **Swagger documentation**: Interactive API docs at `/api-docs`
- **Security hardened**: Input validation, sanitization, no eval/exec
- **Comprehensive logging**: Winston-based logging system

## Requirements

- Node.js >= 18.0.0
- OpenVPN server with Easy-RSA configured
- Bash shell (for scripts)
- Root or appropriate permissions for OpenVPN operations

## Installation

1. **Clone/copy the backend folder**

2. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - OpenVPN paths (EASYRSA_DIR, CCD_DIR, etc.)
   - VPN network settings
   - Admin emails
   - Server settings

4. **Ensure directories exist and have correct permissions**
   ```bash
   sudo mkdir -p /etc/openvpn/ccd
   sudo mkdir -p /etc/openvpn/client/generated
   sudo chmod 755 /etc/openvpn/ccd
   sudo chmod 755 /etc/openvpn/client/generated
   ```

5. **Make scripts executable**
   ```bash
   chmod +x scripts/*.sh
   ```

## Configuration

### Environment Variables

See `.env.example` for all configuration options.

Key variables:
- `OPENVPN_BASE`: Base OpenVPN directory
- `EASYRSA_DIR`: Easy-RSA installation directory
- `CCD_DIR`: Client configuration directory
- `OVPN_OUTPUT_DIR`: Where .ovpn files are saved
- `ADMIN_EMAILS`: Comma-separated list of admin emails
- `VPN_NETWORK`, `VPN_NETMASK`: VPN network configuration
- `VPN_START_IP`, `VPN_END_IP`: IP allocation range

### Admin Users

Admins are configured via the `ADMIN_EMAILS` environment variable:
```
ADMIN_EMAILS=admin@wits.ac.za,supervisor@wits.ac.za
```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` by default.

## API Endpoints

### POST /api/profile
Request or retrieve a VPN profile.

**Request:**
```json
{
  "email": "student001@wits.ac.za"
}
```

**Response:** Downloads `.ovpn` file

### GET /api/admin/users?email=admin@wits.ac.za
Get all VPN users (admin only).

**Response:**
```json
{
  "users": [...],
  "total": 42
}
```

### GET /api/admin/stats?email=admin@wits.ac.za
Get VPN statistics (admin only).

**Response:**
```json
{
  "total_users": 42,
  "admins": 2,
  "students": 40,
  "ip_pool_used": 42,
  "ip_pool_total": 1022
}
```

## API Documentation

Interactive Swagger documentation available at:
```
http://localhost:3000/api-docs
```

## Scripts

### generate_client.sh
Generates client certificate using Easy-RSA.
- Never overwrites existing certificates
- Uses nopass (no password)
- Validates all inputs

### assign_ip.sh
Assigns static VPN IP and creates CCD file.
- Prevents duplicate IPs
- Validates IP format
- Creates CCD file with ifconfig-push directive

### build_ovpn.sh
Builds complete .ovpn profile.
- Embeds CA certificate
- Embeds client certificate
- Embeds client key
- Configures server connection details

## Security

- **Input validation**: All inputs validated with express-validator
- **Email sanitization**: Prevents path traversal and injection
- **No eval/exec**: Uses execFile for script execution
- **Helmet.js**: Security headers
- **CORS**: Configurable origins
- **Logging**: All operations logged
- **File permissions**: Generated files have restricted permissions (600)

## File Structure

```
backend/
├── server.js              # Main application entry point
├── config.js              # Configuration management
├── logger.js              # Winston logger setup
├── utils.js               # Helper functions
├── package.json           # Dependencies
├── .env.example           # Example environment file
├── vpn-users.json         # User metadata storage
├── routes/
│   ├── profile.js         # Profile endpoint
│   └── admin.js           # Admin endpoints
├── scripts/
│   ├── generate_client.sh # Certificate generation
│   ├── assign_ip.sh       # IP assignment
│   └── build_ovpn.sh      # OVPN file builder
├── templates/
│   └── client.ovpn.tpl    # OVPN template (reference)
└── logs/
    ├── combined.log       # All logs
    └── error.log          # Error logs
```

## Data Storage

User metadata is stored in `vpn-users.json`:

```json
[
  {
    "email": "student001@wits.ac.za",
    "role": "student",
    "cert_name": "student001@wits.ac.za",
    "vpn_ip": "10.60.0.10",
    "ccd_file": "/etc/openvpn/ccd/student001@wits.ac.za",
    "ovpn_file": "/etc/openvpn/client/generated/student001@wits.ac.za.ovpn",
    "created_at": "2026-01-22T14:00:00Z"
  }
]
```

## Logging

Logs are written to:
- `logs/combined.log`: All logs
- `logs/error.log`: Error logs only
- Console: Development mode only

## Troubleshooting

### Certificate generation fails
- Verify Easy-RSA is properly initialized
- Check `EASYRSA_DIR` path
- Ensure PKI directory exists
- Check permissions

### IP assignment fails
- Verify `CCD_DIR` exists and is writable
- Check for IP pool exhaustion
- Review `vpn-users.json` for conflicts

### OVPN file generation fails
- Verify certificates were generated
- Check `OVPN_OUTPUT_DIR` permissions
- Ensure CA certificate exists

### Permission denied errors
Run backend as user with appropriate permissions:
```bash
sudo node server.js
```

Or configure sudoers for specific scripts.

## Production Deployment

See `systemd/vpn-backend.service` for systemd service configuration.

## License

MIT
