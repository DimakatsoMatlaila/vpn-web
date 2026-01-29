const path = require('path');
require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Admin Configuration
  admins: (process.env.ADMIN_EMAILS || 'admin@wits.ac.za').split(',').map(e => e.trim()),

  // OpenVPN Paths
  openvpn: {
    base: process.env.OPENVPN_BASE || '/etc/openvpn',
    easyrsa: process.env.EASYRSA_DIR || '/etc/openvpn/easy-rsa',
    ccd: process.env.CCD_DIR || '/etc/openvpn/ccd',
    outputDir: process.env.OVPN_OUTPUT_DIR || '/etc/openvpn/client/generated',
    caCert: process.env.CA_CERT || '/etc/openvpn/easy-rsa/pki/ca.crt',
  },

  // VPN Network Configuration
  vpn: {
    network: process.env.VPN_NETWORK || '10.60.0.0',
    netmask: process.env.VPN_NETMASK || '255.255.252.0',
    startIp: process.env.VPN_START_IP || '10.60.0.10',
    endIp: process.env.VPN_END_IP || '10.60.3.254',
    serverHost: process.env.VPN_SERVER_HOST || 'connect.vpn.witscyber.co.za',
    serverPort: process.env.VPN_SERVER_PORT || '1194',
    protocol: process.env.VPN_PROTOCOL || 'udp',
  },

  // Security
  security: {
    allowedEmailDomains: (process.env.ALLOWED_EMAIL_DOMAINS || 'students.wits.ac.za,wits.ac.za').split(',').map(d => d.trim()),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || path.join(__dirname, 'logs'),
  },

  // Data Storage
  storage: {
    usersFile: path.join(__dirname, 'vpn-users.json'),
  },

  // Scripts (relative to backend root)
  scripts: {
    generateClient: path.join(__dirname, 'scripts', 'generate_client.sh'),
    assignIp: path.join(__dirname, 'scripts', 'assign_ip.sh'),
    buildOvpn: path.join(__dirname, 'scripts', 'build_ovpn.sh'),
  },

  // Templates
  templates: {
    clientOvpn: path.join(__dirname, 'templates', 'client.ovpn.tpl'),
  },
};

module.exports = config;
