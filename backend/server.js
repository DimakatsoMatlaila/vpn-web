const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');
const logger = require('./logger');

// Import routes
const profileRoute = require('./routes/profile');
const adminRoute = require('./routes/admin');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*', // Configure this in production
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logger
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WitsCyber VPN Provisioning API',
      version: '1.0.0',
      description: 'API for provisioning OpenVPN client profiles for WitsCyber students',
      contact: {
        name: 'WitsCyber Support',
        email: 'support@witscyber.co.za',
      },
    },
    servers: [
      {
        url: `http://${config.server.host}:${config.server.port}`,
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Profile',
        description: 'VPN profile management endpoints',
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints (admin only)',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'vpn-backend',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/profile', profileRoute);
app.use('/api/admin', adminRoute);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'WitsCyber VPN Provisioning API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health',
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: config.server.nodeEnv === 'production' ? 'An error occurred' : err.message,
  });
});

// Start server
const server = app.listen(config.server.port, config.server.host, () => {
  logger.info(`===========================================`);
  logger.info(`WitsCyber VPN Backend Server`);
  logger.info(`===========================================`);
  logger.info(`Environment: ${config.server.nodeEnv}`);
  logger.info(`Server: http://${config.server.host}:${config.server.port}`);
  logger.info(`API Documentation: http://${config.server.host}:${config.server.port}/api-docs`);
  logger.info(`Health Check: http://${config.server.host}:${config.server.port}/health`);
  logger.info(`===========================================`);
  logger.info(`OpenVPN Base: ${config.openvpn.base}`);
  logger.info(`Easy-RSA Dir: ${config.openvpn.easyrsa}`);
  logger.info(`CCD Dir: ${config.openvpn.ccd}`);
  logger.info(`Output Dir: ${config.openvpn.outputDir}`);
  logger.info(`===========================================`);
  logger.info(`VPN Network: ${config.vpn.network}/${config.vpn.netmask}`);
  logger.info(`IP Range: ${config.vpn.startIp} - ${config.vpn.endIp}`);
  logger.info(`VPN Server: ${config.vpn.serverHost}:${config.vpn.serverPort}`);
  logger.info(`===========================================`);
  logger.info(`Admins: ${config.admins.join(', ')}`);
  logger.info(`===========================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
