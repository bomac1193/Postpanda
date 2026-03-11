const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const youtubeController = require('../controllers/youtubeController');

// All routes require authentication
router.use(authenticate);

/**
 * YouTube Collection Routes
 */

// Create new collection
router.post('/collections', youtubeController.createCollection);

// Get all collections for user
router.get('/collections', youtubeController.getCollections);

// Get single collection
router.get('/collections/:id', youtubeController.getCollection);

// Update collection
router.put('/collections/:id', youtubeController.updateCollection);

// Delete collection
router.delete('/collections/:id', youtubeController.deleteCollection);

/**
 * Collection Version Routes
 */

// Save a version (snapshot)
router.post('/collections/:id/versions', youtubeController.saveVersion);

// Get all versions for a collection
router.get('/collections/:id/versions', youtubeController.getVersions);

// Restore a version by index
router.post('/collections/:id/versions/:index/restore', youtubeController.restoreVersion);

// Delete a version by index
router.delete('/collections/:id/versions/:index', youtubeController.deleteVersion);

/**
 * YouTube Video Routes
 */

// Create new video
router.post('/videos', youtubeController.createVideo);

// Get videos (filter by collectionId via query param)
router.get('/videos', youtubeController.getVideos);

// Get single video
router.get('/videos/:id', youtubeController.getVideo);

// Update video
router.put('/videos/:id', youtubeController.updateVideo);

// Delete video
router.delete('/videos/:id', youtubeController.deleteVideo);

// Reorder videos in collection
router.post('/videos/reorder', youtubeController.reorderVideos);

module.exports = router;
