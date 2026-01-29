# Easy-RSA Setup Instructions

## Problem
The backend is failing to generate client certificates because Easy-RSA is not properly configured. The error shows:
```
No Easy-RSA 'vars' configuration file exists!
Missing expected directory: private
(perhaps you need to run init-pki?)
```

## Solution

### Option 1: Create vars file (Recommended)

SSH into your VPN server and run:

```bash
# Navigate to Easy-RSA directory
cd /etc/openvpn/easy-rsa

# Create vars file from example
sudo cp vars.example vars

# Edit the vars file (optional - defaults usually work)
sudo nano vars

# Make sure the PKI directory is properly set
# Add this line if not present:
echo 'set_var EASYRSA_PKI "$PWD/pki"' | sudo tee -a vars
```

### Option 2: Initialize PKI (Only if PKI doesn't exist)

⚠️ **WARNING**: Only do this if you don't have existing certificates!

```bash
cd /etc/openvpn/easy-rsa
sudo ./easyrsa init-pki
```

## Verify Setup

After creating the `vars` file, test certificate generation:

```bash
cd /etc/openvpn/easy-rsa
sudo bash /home/ubuntu/vpn-web/backend/scripts/generate_client.sh /etc/openvpn/easy-rsa test@students.wits.ac.za
```

You should see:
```
Successfully generated certificate: test@students.wits.ac.za
```

## Check Permissions

Make sure the backend has permission to execute Easy-RSA:

```bash
# Check Easy-RSA permissions
ls -la /etc/openvpn/easy-rsa/easyrsa

# Make executable if needed
sudo chmod +x /etc/openvpn/easy-rsa/easyrsa

# Check PKI directory permissions
ls -la /etc/openvpn/easy-rsa/pki/

# Backend might need sudo access for Easy-RSA
# Add to sudoers (replace 'ubuntu' with your backend user):
echo 'ubuntu ALL=(ALL) NOPASSWD: /etc/openvpn/easy-rsa/easyrsa' | sudo tee /etc/sudoers.d/easyrsa-backend
sudo chmod 0440 /etc/sudoers.d/easyrsa-backend
```

## Alternative: Use Existing gen-ovpn.sh Script

Your server already has a working `/etc/openvpn/client/gen-ovpn.sh` script. You could modify the backend to:

1. Generate certificate using Easy-RSA (current approach)
2. Generate .ovpn file using existing gen-ovpn.sh script

This keeps the certificate generation and .ovpn creation separate and uses proven scripts.
