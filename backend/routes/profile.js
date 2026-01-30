const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { body, validationResult } = require('express-validator');
const logger = require('../logger');
const { provisionClient, findUserByEmail } = require('../utils');

const router = express.Router();

/**
 * @swagger
 * /api/profile:
 *   post:
 *     summary: Request or retrieve VPN client profile
 *     description: Generates a new VPN profile for the user or returns existing one. The .ovpn file is returned as a download.
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student001@wits.ac.za
 *     responses:
 *       200:
 *         description: VPN profile file (.ovpn)
 *         content:
 *           application/x-openvpn-profile:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
  ],
  async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`Validation failed for profile request: ${JSON.stringify(errors.array())}`);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email } = req.body;

    try {
      logger.info(`Profile request received for: ${email}`);

      // Provision or retrieve user
      const user = await provisionClient(email);

      // Check if .ovpn file exists
      try {
        await fs.access(user.ovpn_file);
      } catch (error) {
        logger.error(`OVPN file not found: ${user.ovpn_file}`);
        return res.status(500).json({ 
          error: 'Profile file not found. Please contact administrator.' 
        });
      }

      // Stream the .ovpn file
      const fileName = `${user.cert_name}.ovpn`;
      
      res.setHeader('Content-Type', 'application/x-openvpn-profile');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('X-VPN-IP', user.vpn_ip); // Add VPN IP to response header
      
      logger.info(`Sending .ovpn file to ${email}: ${user.ovpn_file} (IP: ${user.vpn_ip})`);
      
      const fileStream = require('fs').createReadStream(user.ovpn_file);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        logger.error(`Error streaming file for ${email}:`, error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to send profile file' });
        }
      });

    } catch (error) {
      logger.error(`Profile request failed for ${email}:`, error);
      res.status(500).json({ 
        error: 'Failed to provision VPN profile',
        message: error.message 
      });
    }
  }
);

module.exports = router;
