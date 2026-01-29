#!/bin/bash
###############################################################################
# generate_client.sh
# Generates a client certificate using Easy-RSA
# NEVER overwrites existing keys
###############################################################################

set -euo pipefail

# Usage
if [ $# -ne 2 ]; then
    echo "Usage: $0 <easyrsa_dir> <cert_name>" >&2
    exit 1
fi

EASYRSA_DIR="$1"
CERT_NAME="$2"

# Validate inputs
if [ ! -d "$EASYRSA_DIR" ]; then
    echo "ERROR: Easy-RSA directory not found: $EASYRSA_DIR" >&2
    exit 1
fi

if [ -z "$CERT_NAME" ]; then
    echo "ERROR: Certificate name cannot be empty" >&2
    exit 1
fi

# Navigate to Easy-RSA directory
cd "$EASYRSA_DIR"

# Check if certificate already exists
if [ -f "pki/issued/${CERT_NAME}.crt" ] && [ -f "pki/private/${CERT_NAME}.key" ]; then
    echo "Certificate already exists for: $CERT_NAME" >&2
    exit 0
fi

# Generate client certificate without password
./easyrsa --batch build-client-full "$CERT_NAME" nopass

if [ $? -eq 0 ]; then
    echo "Successfully generated certificate: $CERT_NAME"
    exit 0
else
    echo "ERROR: Failed to generate certificate for: $CERT_NAME" >&2
    exit 1
fi
