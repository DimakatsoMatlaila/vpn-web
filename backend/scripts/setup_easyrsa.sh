#!/bin/bash
###############################################################################
# setup_easyrsa.sh
# One-time setup for Easy-RSA to work with the VPN backend
# Run this on your VPN server as root or with sudo
###############################################################################

set -e

EASYRSA_DIR="/etc/openvpn/easy-rsa"
BACKEND_USER="${1:-ubuntu}"  # Default to 'ubuntu', or pass as first argument

echo "====================================================================="
echo "Setting up Easy-RSA for VPN Backend"
echo "====================================================================="

# Check if Easy-RSA directory exists
if [ ! -d "$EASYRSA_DIR" ]; then
    echo "ERROR: Easy-RSA directory not found: $EASYRSA_DIR"
    exit 1
fi

cd "$EASYRSA_DIR"

# Step 1: Create vars file if it doesn't exist
if [ ! -f "vars" ]; then
    echo "[1/5] Creating vars file..."
    if [ -f "vars.example" ]; then
        cp vars.example vars
        echo "✓ Created vars from vars.example"
    else
        # Create minimal vars file
        cat > vars << 'EOF'
# Easy-RSA configuration
set_var EASYRSA_PKI "$PWD/pki"

# Reduce output verbosity
set_var EASYRSA_BATCH "yes"
EOF
        echo "✓ Created minimal vars file"
    fi
else
    echo "[1/5] vars file already exists ✓"
fi

# Step 2: Ensure PKI directory variable is set
if ! grep -q "EASYRSA_PKI" vars; then
    echo "[2/5] Adding EASYRSA_PKI to vars..."
    echo 'set_var EASYRSA_PKI "$PWD/pki"' >> vars
    echo "✓ Added EASYRSA_PKI variable"
else
    echo "[2/5] EASYRSA_PKI already configured ✓"
fi

# Step 3: Make easyrsa executable
echo "[3/5] Setting permissions..."
chmod +x easyrsa
echo "✓ Made easyrsa executable"

# Step 4: Verify PKI structure
echo "[4/5] Verifying PKI structure..."
if [ ! -d "pki/private" ]; then
    echo "WARNING: PKI not initialized. Run: ./easyrsa init-pki"
    echo "NOTE: This will DELETE existing certificates!"
else
    echo "✓ PKI structure exists"
fi

# Step 5: Configure sudo access for backend user
echo "[5/5] Configuring sudo access for backend..."
SUDOERS_FILE="/etc/sudoers.d/vpn-backend-easyrsa"

if [ ! -f "$SUDOERS_FILE" ]; then
    cat > "$SUDOERS_FILE" << EOF
# Allow VPN backend to run Easy-RSA commands
$BACKEND_USER ALL=(ALL) NOPASSWD: $EASYRSA_DIR/easyrsa
$BACKEND_USER ALL=(ALL) NOPASSWD: /bin/bash $EASYRSA_DIR/easyrsa
EOF
    chmod 0440 "$SUDOERS_FILE"
    echo "✓ Created sudoers file for backend user: $BACKEND_USER"
else
    echo "✓ Sudoers file already exists"
fi

echo ""
echo "====================================================================="
echo "Setup Complete!"
echo "====================================================================="
echo ""
echo "Test certificate generation with:"
echo "  sudo -u $BACKEND_USER bash /path/to/backend/scripts/generate_client.sh \\"
echo "    $EASYRSA_DIR test@students.wits.ac.za"
echo ""
echo "If you need to initialize PKI (DELETES existing certs!):"
echo "  cd $EASYRSA_DIR && ./easyrsa init-pki"
echo ""
