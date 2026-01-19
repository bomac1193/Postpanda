const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const { authenticate } = require('../middleware/auth');
const { requireWorkspaceMember, requirePermission } = require('../middleware/workspaceAuth');

// All routes require authentication
router.use(authenticate);

// Submit content for approval
router.post('/submit', approvalController.submitForApproval);

// Get queue for a workspace
router.get('/workspace/:workspaceId',
  requireWorkspaceMember,
  approvalController.getQueue
);

// Get my submissions for a workspace
router.get('/workspace/:workspaceId/my-submissions',
  requireWorkspaceMember,
  approvalController.getMySubmissions
);

// Get approval statistics for a workspace
router.get('/workspace/:workspaceId/stats',
  requireWorkspaceMember,
  approvalController.getStats
);

// Get a specific queue item
router.get('/:itemId', approvalController.getQueueItem);

// Approve content
router.post('/:itemId/approve', approvalController.approve);

// Reject content
router.post('/:itemId/reject', approvalController.reject);

// Request revision
router.post('/:itemId/revision', approvalController.requestRevision);

// Resubmit after revision
router.post('/:itemId/resubmit', approvalController.resubmit);

// Mark as published
router.post('/:itemId/publish', approvalController.markPublished);

// Delete queue item
router.delete('/:itemId', approvalController.deleteItem);

module.exports = router;
