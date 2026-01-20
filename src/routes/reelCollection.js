const express = require('express');
const router = express.Router();
const reelCollectionController = require('../controllers/reelCollectionController');
const { authenticate } = require('../middleware/auth');

// Collection CRUD
router.post('/', authenticate, reelCollectionController.createCollection);
router.get('/', authenticate, reelCollectionController.getAllCollections);
router.get('/:id', authenticate, reelCollectionController.getCollection);
router.put('/:id', authenticate, reelCollectionController.updateCollection);
router.delete('/:id', authenticate, reelCollectionController.deleteCollection);

// Reel management within collection
router.post('/:id/reel', authenticate, reelCollectionController.addReel);
router.delete('/:id/reel', authenticate, reelCollectionController.removeReel);
router.post('/:id/reorder', authenticate, reelCollectionController.reorderReels);
router.post('/:id/bulk-add', authenticate, reelCollectionController.bulkAddReels);

module.exports = router;
