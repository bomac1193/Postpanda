const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const postingController = require('../controllers/postingController');

// All routes require authentication
router.use(authenticate);

/**
 * Content posting
 */

// Post content immediately (frontend endpoint)
router.post('/now', postingController.postNow);

// Post single content item (legacy endpoint)
router.post('/content/:contentId', postingController.postContent);

// Schedule content for future posting
router.post('/schedule', postingController.schedulePost);

// Get all scheduled posts
router.get('/scheduled', postingController.getScheduledPosts);

// Get posting history
router.get('/history', postingController.getPostingHistory);

// Update scheduled post
router.put('/schedule/:scheduleId', postingController.updateScheduledPost);

// Cancel scheduled post (DELETE method)
router.delete('/schedule/:scheduleId', postingController.cancelScheduledPost);

// Cancel scheduled post (POST method - frontend alias)
router.post('/:postId/cancel', postingController.cancelScheduledPost);

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
