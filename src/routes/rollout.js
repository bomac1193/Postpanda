const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const rolloutController = require('../controllers/rolloutController');

// All routes require authentication
router.use(authenticate);

/**
 * Rollout CRUD Routes
 */

// Create new rollout
router.post('/', rolloutController.createRollout);

// Get all rollouts for user
router.get('/', rolloutController.getRollouts);

// Get single rollout
router.get('/:id', rolloutController.getRollout);

// Update rollout
router.put('/:id', rolloutController.updateRollout);

// Delete rollout
router.delete('/:id', rolloutController.deleteRollout);

/**
 * Section Routes
 */

// Add section to rollout
router.post('/:id/sections', rolloutController.addSection);

// Update section
router.put('/:id/sections/:sectionId', rolloutController.updateSection);

// Delete section
router.delete('/:id/sections/:sectionId', rolloutController.deleteSection);

// Reorder sections
router.post('/:id/sections/reorder', rolloutController.reorderSections);

/**
 * Collection in Section Routes
 */

// Add collection to section
router.post('/:id/sections/:sectionId/collections', rolloutController.addCollectionToSection);

// Remove collection from section
router.delete('/:id/sections/:sectionId/collections/:collectionId', rolloutController.removeCollectionFromSection);

module.exports = router;
