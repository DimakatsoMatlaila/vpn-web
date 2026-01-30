const express = require('express');
const { query, validationResult } = require('express-validator');
const logger = require('../logger');
const { loadUsers, getUserRole } = require('../utils');
const config = require('../config');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

/**
 * Middleware to check if user is admin
 */
function requireAdmin(req, res, next) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email parameter required' });
  }

  const role = getUserRole(email);
  
  if (role !== 'admin') {
    logger.warn(`Unauthorized admin access attempt by: ${email}`);
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  next();
}

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all VPN users (Admin only)
 *     description: Returns a list of all provisioned VPN users. Requires admin email in query parameter.
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Admin email address
 *         example: admin@wits.ac.za
 *     responses:
 *       200:
 *         description: List of all VPN users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       cert_name:
 *                         type: string
 *                       vpn_ip:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.get(
  '/users',
  [
    query('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
  ],
  requireAdmin,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email } = req.query;

    try {
      logger.info(`Admin user list requested by: ${email}`);

      const users = await loadUsers();

      // Remove sensitive file paths for security
      const sanitizedUsers = users.map(user => ({
        email: user.email,
        role: user.role,
        cert_name: user.cert_name,
        vpn_ip: user.vpn_ip,
        created_at: user.created_at,
      }));

      res.json({
        users: sanitizedUsers,
        total: sanitizedUsers.length,
      });

    } catch (error) {
      logger.error(`Failed to retrieve users for admin ${email}:`, error);
      res.status(500).json({ 
        error: 'Failed to retrieve users',
        message: error.message 
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get VPN statistics (Admin only)
 *     description: Returns statistics about VPN usage. Requires admin email in query parameter.
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Admin email address
 *     responses:
 *       200:
 *         description: VPN statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_users:
 *                   type: integer
 *                 admins:
 *                   type: integer
 *                 students:
 *                   type: integer
 *                 ip_pool_used:
 *                   type: integer
 *                 ip_pool_total:
 *                   type: integer
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get(
  '/stats',
  [
    query('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
  ],
  requireAdmin,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email } = req.query;

    try {
      logger.info(`Admin stats requested by: ${email}`);

      const users = await loadUsers();

      const stats = {
        total_users: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        students: users.filter(u => u.role === 'student').length,
        ip_pool_used: users.length,
        // Calculate total IPs in pool
        ip_pool_total: (() => {
          const [a, b, c, d] = config.vpn.startIp.split('.').map(Number);
          const [ea, eb, ec, ed] = config.vpn.endIp.split('.').map(Number);
          const start = (a << 24) | (b << 16) | (c << 8) | d;
          const end = (ea << 24) | (eb << 16) | (ec << 8) | ed;
          return end - start + 1;
        })(),
      };

      res.json(stats);

    } catch (error) {
      logger.error(`Failed to retrieve stats for admin ${email}:`, error);
      res.status(500).json({ 
        error: 'Failed to retrieve statistics',
        message: error.message 
      });
    }
  }
);

/**
 * @swagger
 * /api/admin/vpn-users:
 *   get:
 *     summary: Get all VPN users with their assigned IPs
 *     description: Returns the vpn-users.json data for admin sync purposes (no auth required for internal use)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of VPN users with IPs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   vpn_ip:
 *                     type: string
 *                   cert_name:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/vpn-users', async (req, res) => {
  try {
    const vpnUsersPath = path.join(__dirname, '../vpn-users.json');
    const data = await fs.readFile(vpnUsersPath, 'utf-8');
    const vpnUsers = JSON.parse(data);
    
    logger.info(`Admin: Retrieved ${vpnUsers.length} VPN users for sync`);
    
    res.json(vpnUsers);
  } catch (error) {
    logger.error('Failed to read vpn-users.json:', error);
    res.status(500).json({ error: 'Failed to retrieve VPN users' });
  }
});

module.exports = router;
