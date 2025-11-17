const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Content CRUD
router.post('/', authenticate, upload.single('media'), contentController.createContent);
router.get('/', authenticate, contentController.getAllContent);
router.get('/:id', authenticate, contentController.getContentById);
router.put('/:id', authenticate, contentController.updateContent);
router.delete('/:id', authenticate, contentController.deleteContent);

// Version management
router.post('/:id/versions', authenticate, upload.single('media'), contentController.addVersion);
router.put('/:id/versions/:versionId/select', authenticate, contentController.selectVersion);
router.delete('/:id/versions/:versionId', authenticate, contentController.deleteVersion);

// Scheduling
router.post('/:id/schedule', authenticate, contentController.scheduleContent);
router.post('/:id/publish', authenticate, contentController.publishContent);

module.exports = router;
