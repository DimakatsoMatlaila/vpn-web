#!/bin/bash
###############################################################################
# build_ovpn.sh
# Generates a complete .ovpn profile with embedded certificates
###############################################################################

set -euo pipefail

# Usage
if [ $# -ne 6 ]; then
    echo "Usage: $0 <easyrsa_dir> <cert_name> <output_file> <server_host> <server_port> <protocol>" >&2
    exit 1
fi

EASYRSA_DIR="$1"
CERT_NAME="$2"
OUTPUT_FILE="$3"
SERVER_HOST="$4"
SERVER_PORT="$5"
PROTOCOL="$6"

# Validate inputs
if [ ! -d "$EASYRSA_DIR" ]; then
    echo "ERROR: Easy-RSA directory not found: $EASYRSA_DIR" >&2
    exit 1
fi

CA_CERT="${EASYRSA_DIR}/pki/ca.crt"
CLIENT_CERT="${EASYRSA_DIR}/pki/issued/${CERT_NAME}.crt"
CLIENT_KEY="${EASYRSA_DIR}/pki/private/${CERT_NAME}.key"

# Verify all required files exist
if [ ! -f "$CA_CERT" ]; then
    echo "ERROR: CA certificate not found: $CA_CERT" >&2
    exit 1
fi

if [ ! -f "$CLIENT_CERT" ]; then
    echo "ERROR: Client certificate not found: $CLIENT_CERT" >&2
    exit 1
fi

if [ ! -f "$CLIENT_KEY" ]; then
    echo "ERROR: Client key not found: $CLIENT_KEY" >&2
    exit 1
fi

# Create output directory if it doesn't exist
OUTPUT_DIR=$(dirname "$OUTPUT_FILE")
mkdir -p "$OUTPUT_DIR"

# Generate .ovpn file
cat > "$OUTPUT_FILE" << EOF
##############################################
# WitsCyber VPN Client Configuration
# User: $CERT_NAME
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
##############################################

client
dev tun
proto $PROTOCOL
remote $SERVER_HOST $SERVER_PORT
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-GCM
auth SHA256
verb 3
key-direction 1

# Embedded Certificates
<ca>
$(cat "$CA_CERT")
</ca>

<cert>
$(cat "$CLIENT_CERT")
</cert>

<key>
$(cat "$CLIENT_KEY")
</key>
EOF

if [ $? -eq 0 ]; then
    echo "Successfully created .ovpn file: $OUTPUT_FILE"
    chmod 600 "$OUTPUT_FILE"
    exit 0
else
    echo "ERROR: Failed to create .ovpn file for: $CERT_NAME" >&2
    exit 1
fi
