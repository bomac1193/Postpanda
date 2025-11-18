const express = require('express');
const router = express.Router();
const alchemyController = require('../controllers/alchemyController');

router.post('/captions', alchemyController.generateCaptions);
router.post('/ideas', alchemyController.generateIdeas);

module.exports = router;
