const express = require('express');
const router = express.Router();
const gridController = require('../controllers/gridController');
const { authenticate } = require('../middleware/auth');

// Grid CRUD
router.post('/', authenticate, gridController.createGrid);
router.get('/', authenticate, gridController.getAllGrids);
router.get('/:id', authenticate, gridController.getGridById);
router.put('/:id', authenticate, gridController.updateGrid);
router.delete('/:id', authenticate, gridController.deleteGrid);

// Grid operations
router.post('/:id/add-row', authenticate, gridController.addRow);
router.post('/:id/remove-row', authenticate, gridController.removeRow);
router.post('/:id/add-content', authenticate, gridController.addContentToGrid);
router.post('/:id/remove-content', authenticate, gridController.removeContentFromGrid);
router.post('/:id/crop', authenticate, gridController.updateCellCrop);
router.post('/:id/reorder', authenticate, gridController.reorderContent);

// Character assignment
router.post('/:id/assign-character', authenticate, gridController.assignCharacterToCell);

// Grid preview
router.get('/:id/preview', authenticate, gridController.getGridPreview);

module.exports = router;
