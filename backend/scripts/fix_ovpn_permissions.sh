#!/bin/bash
###############################################################################
# fix_ovpn_permissions.sh
# Fix permissions on existing .ovpn files so backend can read them
# Run this once on the server to fix existing files
###############################################################################

set -e

OVPN_DIR="/etc/openvpn/client/generated"

echo "Fixing permissions for .ovpn files in: $OVPN_DIR"

if [ ! -d "$OVPN_DIR" ]; then
    echo "ERROR: Directory not found: $OVPN_DIR"
    exit 1
fi

# Make all .ovpn files readable by backend
find "$OVPN_DIR" -name "*.ovpn" -type f -exec chmod 644 {} \;

echo "✓ Fixed permissions for all .ovpn files"
echo ""
echo "Files in $OVPN_DIR:"
ls -lh "$OVPN_DIR"
