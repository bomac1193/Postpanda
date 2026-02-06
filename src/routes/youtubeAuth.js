const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const youtubeAuthController = require('../controllers/youtubeAuthController');

/**
 * YouTube OAuth Routes
 */

// Initiate YouTube OAuth (requires authentication)
router.get('/connect', authenticate, youtubeAuthController.initiateAuth);

// YouTube OAuth callback (no auth required - handles its own state)
router.get('/callback', youtubeAuthController.handleCallback);

// Disconnect YouTube (requires authentication)
router.post('/disconnect', authenticate, youtubeAuthController.disconnect);

// Get YouTube connection status (requires authentication)
router.get('/status', authenticate, youtubeAuthController.getStatus);

// Refresh YouTube token (requires authentication)
router.post('/refresh', authenticate, youtubeAuthController.refreshToken);

module.exports = router;
