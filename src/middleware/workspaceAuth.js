const Workspace = require('../models/Workspace');

/**
 * Middleware to check if user is a member of the workspace
 */
const requireWorkspaceMember = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.body.workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (!workspace.isMember(req.user._id)) {
      return res.status(403).json({ error: 'You are not a member of this workspace' });
    }

    req.workspace = workspace;
    req.workspaceMember = workspace.getMember(req.user._id);
    next();
  } catch (error) {
    console.error('Workspace auth error:', error);
    res.status(500).json({ error: 'Authorization failed' });
  }
};

/**
 * Middleware to check if user has a specific permission
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const workspaceId = req.params.workspaceId || req.body.workspaceId;

      if (!workspaceId) {
        return res.status(400).json({ error: 'Workspace ID is required' });
      }

      const workspace = req.workspace || await Workspace.findById(workspaceId);

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      if (!workspace.hasPermission(req.user._id, permission)) {
        return res.status(403).json({
          error: 'Permission denied',
          required: permission
        });
      }

      if (!req.workspace) {
        req.workspace = workspace;
        req.workspaceMember = workspace.getMember(req.user._id);
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Authorization failed' });
    }
  };
};

/**
 * Middleware to check if user is workspace owner
 */
const requireWorkspaceOwner = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.body.workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (workspace.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the workspace owner can perform this action' });
    }

    req.workspace = workspace;
    next();
  } catch (error) {
    console.error('Owner check error:', error);
    res.status(500).json({ error: 'Authorization failed' });
  }
};

/**
 * Middleware to check if user is admin or owner
 */
const requireWorkspaceAdmin = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.body.workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    const member = workspace.getMember(req.user._id);

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.workspace = workspace;
    req.workspaceMember = member;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Authorization failed' });
  }
};

module.exports = {
  requireWorkspaceMember,
  requirePermission,
  requireWorkspaceOwner,
  requireWorkspaceAdmin
};
