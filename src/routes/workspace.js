const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');
const { authenticate } = require('../middleware/auth');
const {
  requireWorkspaceMember,
  requireWorkspaceOwner,
  requireWorkspaceAdmin,
  requirePermission
} = require('../middleware/workspaceAuth');

// All routes require authentication
router.use(authenticate);

// Get all workspaces for current user
router.get('/', workspaceController.getWorkspaces);

// Create a new workspace
router.post('/', workspaceController.createWorkspace);

// Accept an invite (needs to be before :workspaceId routes)
router.post('/accept-invite', workspaceController.acceptInvite);

// Get a specific workspace
router.get('/:workspaceId', workspaceController.getWorkspace);

// Update workspace (owner/admin only)
router.put('/:workspaceId', requireWorkspaceAdmin, workspaceController.updateWorkspace);

// Delete workspace (owner only)
router.delete('/:workspaceId', requireWorkspaceOwner, workspaceController.deleteWorkspace);

// Leave workspace
router.post('/:workspaceId/leave', workspaceController.leaveWorkspace);

// Member management
router.get('/:workspaceId/members', requireWorkspaceMember, workspaceController.getMembers);

// Invite member (requires permission)
router.post('/:workspaceId/invite',
  requirePermission('canInviteMembers'),
  workspaceController.inviteMember
);

// Cancel invite (admin only)
router.delete('/:workspaceId/invite/:email',
  requireWorkspaceAdmin,
  workspaceController.cancelInvite
);

// Remove member (admin only)
router.delete('/:workspaceId/members/:memberId',
  requireWorkspaceAdmin,
  workspaceController.removeMember
);

// Update member role/permissions (admin only)
router.put('/:workspaceId/members/:memberId',
  requireWorkspaceAdmin,
  workspaceController.updateMember
);

// Transfer ownership (owner only)
router.post('/:workspaceId/transfer-ownership',
  requireWorkspaceOwner,
  workspaceController.transferOwnership
);

module.exports = router;
