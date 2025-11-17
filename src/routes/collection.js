const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const collectionController = require('../controllers/collectionController');

// All routes require authentication
router.use(authenticate);

/**
 * Collection CRUD operations
 */

// Create new collection
router.post('/', collectionController.createCollection);

// Get all collections for user
router.get('/', collectionController.getCollections);

// Get collection statistics
router.get('/stats', collectionController.getCollectionStats);

// Get single collection
router.get('/:id', collectionController.getCollection);

// Update collection
router.put('/:id', collectionController.updateCollection);

// Delete collection
router.delete('/:id', collectionController.deleteCollection);

/**
 * Collection content management
 */

// Add content to collection
router.post('/:id/content', collectionController.addContent);

// Remove content from collection
router.delete('/:id/content/:contentId', collectionController.removeContent);

// Reorder content in collection (for drag & drop)
router.put('/:id/reorder', collectionController.reorderContent);

/**
 * Collection utilities
 */

// Duplicate collection
router.post('/:id/duplicate', collectionController.duplicateCollection);

// Preview collection grid
router.get('/:id/preview', collectionController.previewCollection);

module.exports = router;
