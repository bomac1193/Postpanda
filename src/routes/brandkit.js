const express = require('express');
const router = express.Router();
const brandKitController = require('../controllers/brandKitController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(authenticate);

// Get brand kit
router.get('/', brandKitController.getBrandKit);

// Update brand kit
router.put('/', brandKitController.updateBrandKit);

// Colors
router.put('/colors', brandKitController.updateColors);
router.post('/colors/custom', brandKitController.addCustomColor);
router.delete('/colors/custom/:colorId', brandKitController.removeCustomColor);

// Fonts
router.put('/fonts', brandKitController.updateFonts);
router.post('/fonts/custom', brandKitController.addCustomFont);
router.delete('/fonts/custom/:fontId', brandKitController.removeCustomFont);

// Logos
router.post('/logos', upload.single('logo'), brandKitController.uploadLogo);
router.put('/logos/:logoId', brandKitController.updateLogo);
router.delete('/logos/:logoId', brandKitController.deleteLogo);

// Templates
router.post('/templates', brandKitController.saveTemplate);
router.put('/templates/:templateId', brandKitController.updateTemplate);
router.delete('/templates/:templateId', brandKitController.deleteTemplate);

module.exports = router;
