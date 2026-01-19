const express = require('express');
const router = express.Router();
const mediaKitController = require('../controllers/mediaKitController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/public/:slug', mediaKitController.getPublicMediaKit);

// Protected routes
router.use(authenticate);

// Get available templates
router.get('/templates', mediaKitController.getTemplates);

// Fetch platform stats
router.get('/stats', mediaKitController.fetchStats);

// CRUD operations
router.get('/', mediaKitController.getMediaKits);
router.post('/', mediaKitController.createMediaKit);
router.get('/:id', mediaKitController.getMediaKit);
router.put('/:id', mediaKitController.updateMediaKit);
router.delete('/:id', mediaKitController.deleteMediaKit);

// Stats update
router.put('/:id/stats', mediaKitController.updateStats);

// Export
router.get('/:id/export/html', mediaKitController.exportHTML);
router.get('/:id/preview', mediaKitController.getPreview);

// Portfolio items
router.post('/:id/portfolio', mediaKitController.addPortfolioItem);
router.delete('/:id/portfolio/:itemId', mediaKitController.removePortfolioItem);

// Service items
router.post('/:id/services', mediaKitController.addServiceItem);
router.delete('/:id/services/:itemId', mediaKitController.removeServiceItem);

module.exports = router;
