const express = require('express');
const router = express.Router();
const linkInBioController = require('../controllers/linkInBioController');
const { authenticate } = require('../middleware/auth');

// Public routes (no auth required)
router.get('/page/:slug', linkInBioController.getPublicPage);
router.post('/page/:slug/view', linkInBioController.trackView);
router.post('/page/:slug/click/:linkId', linkInBioController.trackLinkClick);

// Protected routes (auth required)
router.use(authenticate);

// CRUD operations
router.post('/', linkInBioController.create);
router.get('/', linkInBioController.getAll);
router.get('/:id', linkInBioController.getById);
router.put('/:id', linkInBioController.update);
router.delete('/:id', linkInBioController.delete);

// Link management
router.post('/:id/links', linkInBioController.addLink);
router.put('/:id/links/:linkId', linkInBioController.updateLink);
router.delete('/:id/links/:linkId', linkInBioController.deleteLink);
router.put('/:id/links/reorder', linkInBioController.reorderLinks);

// Theme and settings
router.put('/:id/theme', linkInBioController.updateTheme);
router.put('/:id/publish', linkInBioController.togglePublish);

// Analytics
router.get('/:id/analytics', linkInBioController.getAnalytics);

// Check slug availability
router.get('/check-slug/:slug', linkInBioController.checkSlugAvailability);

module.exports = router;
