# Backend Certificate Generation Fix

## Problem
Backend was failing to generate VPN certificates with error:
```
No Easy-RSA 'vars' configuration file exists!
Missing expected directory: private
```

## What Was Fixed

### 1. Updated `scripts/generate_client.sh`
- Now sources `vars` file if it exists
- Sets `EASYRSA_PKI` environment variable explicitly
- Better error handling and output capture

### 2. Updated `utils.js`
- Automatically uses `sudo` when not running as root
- Better error logging with full command output
- More detailed error messages

### 3. Created Setup Script
- New `scripts/setup_easyrsa.sh` - one-time server setup
- Creates `vars` file automatically
- Configures sudo permissions for backend user
- Verifies PKI structure

## How to Fix on Server

**Run this ONE TIME on your VPN server:**

```bash
# Upload the new backend code to your server
cd /home/ubuntu/vpn-web/backend

# Make setup script executable
chmod +x scripts/setup_easyrsa.sh

# Run setup as root (replace 'ubuntu' with your backend username if different)
sudo bash scripts/setup_easyrsa.sh ubuntu

# Restart the backend
pm2 restart vpn-backend
# OR
npm run start
```

## What the Setup Script Does

1. **Creates `/etc/openvpn/easy-rsa/vars` file** - Required by Easy-RSA
2. **Sets EASYRSA_PKI variable** - Points to existing PKI directory
3. **Makes easyrsa executable** - Ensures script can run
4. **Verifies PKI structure** - Checks if certificates directory exists
5. **Configures sudo access** - Allows backend to run Easy-RSA commands

## Testing

After setup, test certificate generation:

```bash
# Test from backend directory
cd /home/ubuntu/vpn-web/backend
sudo -u ubuntu bash scripts/generate_client.sh /etc/openvpn/easy-rsa test@students.wits.ac.za

# Should output:
# Successfully generated certificate: test@students.wits.ac.za
```

Then test the full API:

```bash
curl -X POST http://localhost:3001/api/profile \
  -H "Content-Type: application/json" \
  -d '{"email": "2555500@students.wits.ac.za"}'

# Should return a .ovpn file
```

## Files Changed

- ✅ `scripts/generate_client.sh` - Fixed Easy-RSA execution
- ✅ `utils.js` - Added sudo support and better error logging
- ✅ `scripts/setup_easyrsa.sh` - NEW: One-time server setup
- ✅ `docs/EASYRSA_SETUP.md` - NEW: Detailed setup documentation

## No Breaking Changes

- Existing certificates are NOT affected
- Works with your current PKI setup
- Backwards compatible with existing code
