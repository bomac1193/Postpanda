const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const haloController = require('../controllers/haloController');

router.use(authenticate);

router.get('/', haloController.listHalos);
router.get('/:id', haloController.getHalo);
router.post(
  '/',
  upload.fields([
    { name: 'referenceImages', maxCount: 6 },
    { name: 'lutFiles', maxCount: 6 },
    { name: 'scheduleFiles', maxCount: 3 }
  ]),
  haloController.createHalo
);
router.post('/:id/purchase', haloController.purchaseHalo);

module.exports = router;
