const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const postingController = require('../controllers/postingController');

// All routes require authentication
router.use(authenticate);

/**
 * Content posting
 */

// Post single content item
router.post('/content/:contentId', postingController.postContent);

/**
 * Collection posting
 */

// Manually trigger collection posting
router.post('/collection/:id', postingController.postCollection);

// Post specific item from collection
router.post('/collection/:id/item/:itemId', postingController.postCollectionItem);

// Pause scheduled collection
router.post('/collection/:id/pause', postingController.pauseCollection);

// Resume paused collection
router.post('/collection/:id/resume', postingController.resumeCollection);

/**
 * Service status and utilities
 */

// Get scheduling service status
router.get('/status', postingController.getSchedulingStatus);

// Refresh Instagram access token
router.post('/instagram/refresh-token', postingController.refreshInstagramToken);

module.exports = router;
