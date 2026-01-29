#!/bin/bash
###############################################################################
# assign_ip.sh
# Assigns a static VPN IP to a client and creates CCD file
# Prevents duplicate IP assignments
###############################################################################

set -euo pipefail

# Usage
if [ $# -ne 4 ]; then
    echo "Usage: $0 <ccd_dir> <cert_name> <vpn_ip> <vpn_netmask>" >&2
    exit 1
fi

CCD_DIR="$1"
CERT_NAME="$2"
VPN_IP="$3"
VPN_NETMASK="$4"

# Validate inputs
if [ ! -d "$CCD_DIR" ]; then
    echo "ERROR: CCD directory not found: $CCD_DIR" >&2
    exit 1
fi

if [ -z "$CERT_NAME" ] || [ -z "$VPN_IP" ]; then
    echo "ERROR: Certificate name and IP are required" >&2
    exit 1
fi

# Validate IP format (basic check)
if ! echo "$VPN_IP" | grep -qE '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$'; then
    echo "ERROR: Invalid IP format: $VPN_IP" >&2
    exit 1
fi

CCD_FILE="${CCD_DIR}/${CERT_NAME}"

# Check if CCD file already exists
if [ -f "$CCD_FILE" ]; then
    echo "CCD file already exists for: $CERT_NAME"
    exit 0
fi

# Check for duplicate IP in existing CCD files
if grep -r "ifconfig-push $VPN_IP " "$CCD_DIR" 2>/dev/null | grep -v "$CCD_FILE"; then
    echo "ERROR: IP $VPN_IP is already assigned to another client" >&2
    exit 1
fi

# Create CCD file with static IP assignment
cat > "$CCD_FILE" << EOF
# Client configuration for $CERT_NAME
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
ifconfig-push $VPN_IP $VPN_NETMASK
EOF

if [ $? -eq 0 ]; then
    echo "Successfully created CCD file: $CCD_FILE"
    exit 0
else
    echo "ERROR: Failed to create CCD file for: $CERT_NAME" >&2
    exit 1
fi
