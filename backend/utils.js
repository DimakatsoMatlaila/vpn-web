const fs = require('fs').promises;
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const config = require('./config');
const logger = require('./logger');

const execFileAsync = promisify(execFile);

/**
 * Sanitize email to create a safe certificate name
 */
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email');
  }

  // Convert to lowercase and replace @ with a safe separator
  const sanitized = email
    .toLowerCase()
    .trim()
    .replace(/@/g, '@')
    .replace(/[^a-z0-9@._-]/g, '');

  if (sanitized.length === 0) {
    throw new Error('Email sanitization resulted in empty string');
  }

  return sanitized;
}

/**
 * Validate email domain
 */
function isValidEmailDomain(email) {
  const domain = email.split('@')[1];
  return config.security.allowedEmailDomains.includes(domain);
}

/**
 * Determine user role
 */
function getUserRole(email) {
  return config.admins.includes(email) ? 'admin' : 'student';
}

/**
 * Load VPN users from JSON
 */
async function loadUsers() {
  try {
    const data = await fs.readFile(config.storage.usersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty array
      return [];
    }
    throw error;
  }
}

/**
 * Save VPN users to JSON
 */
async function saveUsers(users) {
  await fs.writeFile(
    config.storage.usersFile,
    JSON.stringify(users, null, 2),
    'utf8'
  );
}

/**
 * Find user by email
 */
async function findUserByEmail(email) {
  const users = await loadUsers();
  return users.find(u => u.email === email);
}

/**
 * Get next available VPN IP
 */
async function getNextAvailableIp() {
  const users = await loadUsers();
  const usedIps = new Set(users.map(u => u.vpn_ip));

  // Parse start IP
  const [a, b, c, d] = config.vpn.startIp.split('.').map(Number);
  const [ea, eb, ec, ed] = config.vpn.endIp.split('.').map(Number);

  const startNum = (a << 24) | (b << 16) | (c << 8) | d;
  const endNum = (ea << 24) | (eb << 16) | (ec << 8) | ed;

  // Find first available IP
  for (let num = startNum; num <= endNum; num++) {
    const ip = [
      (num >>> 24) & 0xFF,
      (num >>> 16) & 0xFF,
      (num >>> 8) & 0xFF,
      num & 0xFF
    ].join('.');

    if (!usedIps.has(ip)) {
      return ip;
    }
  }

  throw new Error('No available IP addresses in the pool');
}

/**
 * Generate client certificate using Easy-RSA
 */
async function generateClientCert(certName) {
  logger.info(`Generating client certificate: ${certName}`);

  try {
    const { stdout, stderr } = await execFileAsync(
      'bash',
      [config.scripts.generateClient, config.openvpn.easyrsa, certName],
      { timeout: 30000 }
    );

    logger.info(`Certificate generation output: ${stdout}`);
    if (stderr) logger.warn(`Certificate generation stderr: ${stderr}`);

    return true;
  } catch (error) {
    logger.error(`Failed to generate certificate for ${certName}:`, error);
    throw new Error(`Certificate generation failed: ${error.message}`);
  }
}

/**
 * Assign static IP to client
 */
async function assignStaticIp(certName, vpnIp) {
  logger.info(`Assigning IP ${vpnIp} to ${certName}`);

  try {
    const { stdout, stderr } = await execFileAsync(
      'bash',
      [
        config.scripts.assignIp,
        config.openvpn.ccd,
        certName,
        vpnIp,
        config.vpn.netmask
      ],
      { timeout: 10000 }
    );

    logger.info(`IP assignment output: ${stdout}`);
    if (stderr) logger.warn(`IP assignment stderr: ${stderr}`);

    return path.join(config.openvpn.ccd, certName);
  } catch (error) {
    logger.error(`Failed to assign IP for ${certName}:`, error);
    throw new Error(`IP assignment failed: ${error.message}`);
  }
}

/**
 * Build .ovpn file
 */
async function buildOvpnFile(certName) {
  const outputFile = path.join(config.openvpn.outputDir, `${certName}.ovpn`);
  
  logger.info(`Building .ovpn file for ${certName}`);

  try {
    const { stdout, stderr } = await execFileAsync(
      'bash',
      [
        config.scripts.buildOvpn,
        config.openvpn.easyrsa,
        certName,
        outputFile,
        config.vpn.serverHost,
        config.vpn.serverPort,
        config.vpn.protocol
      ],
      { timeout: 10000 }
    );

    logger.info(`OVPN build output: ${stdout}`);
    if (stderr) logger.warn(`OVPN build stderr: ${stderr}`);

    return outputFile;
  } catch (error) {
    logger.error(`Failed to build .ovpn file for ${certName}:`, error);
    throw new Error(`.ovpn file generation failed: ${error.message}`);
  }
}

/**
 * Provision a new VPN client
 */
async function provisionClient(email) {
  // Validate email domain
  if (!isValidEmailDomain(email)) {
    throw new Error(`Email domain not allowed: ${email}`);
  }

  // Check if user already exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    logger.info(`User already exists: ${email}`);
    return existingUser;
  }

  // Create new user
  const certName = sanitizeEmail(email);
  const role = getUserRole(email);
  const vpnIp = await getNextAvailableIp();

  logger.info(`Provisioning new client: ${email} (${certName}) with IP ${vpnIp}`);

  try {
    // Step 1: Generate certificate
    await generateClientCert(certName);

    // Step 2: Assign static IP
    const ccdFile = await assignStaticIp(certName, vpnIp);

    // Step 3: Build .ovpn file
    const ovpnFile = await buildOvpnFile(certName);

    // Step 4: Save metadata
    const newUser = {
      email,
      role,
      cert_name: certName,
      vpn_ip: vpnIp,
      ccd_file: ccdFile,
      ovpn_file: ovpnFile,
      created_at: new Date().toISOString()
    };

    const users = await loadUsers();
    users.push(newUser);
    await saveUsers(users);

    logger.info(`Successfully provisioned client: ${email}`);
    return newUser;

  } catch (error) {
    logger.error(`Provisioning failed for ${email}:`, error);
    throw error;
  }
}

module.exports = {
  sanitizeEmail,
  isValidEmailDomain,
  getUserRole,
  loadUsers,
  saveUsers,
  findUserByEmail,
  getNextAvailableIp,
  provisionClient,
};
