const Workspace = require('../models/Workspace');
const ApprovalQueue = require('../models/ApprovalQueue');
const crypto = require('crypto');

const workspaceController = {
  /**
   * Get all workspaces for the current user
   */
  async getWorkspaces(req, res) {
    try {
      // Find workspaces where user is owner or member
      const workspaces = await Workspace.find({
        $or: [
          { ownerId: req.user._id },
          { 'members.userId': req.user._id }
        ],
        isActive: true
      }).sort({ updatedAt: -1 });

      // Add role info to each workspace
      const workspacesWithRole = workspaces.map(ws => {
        const isOwner = ws.ownerId.toString() === req.user._id.toString();
        const member = ws.members.find(m => m.userId.toString() === req.user._id.toString());
        return {
          ...ws.toObject(),
          userRole: isOwner ? 'owner' : member?.role || 'viewer'
        };
      });

      res.json(workspacesWithRole);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
  },

  /**
   * Get a specific workspace
   */
  async getWorkspace(req, res) {
    try {
      const workspace = await Workspace.findById(req.params.workspaceId)
        .populate('ownerId', 'name email avatar')
        .populate('members.userId', 'name email avatar');

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      // Check membership
      if (!workspace.isMember(req.user._id)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get pending approval count
      const pendingCount = await ApprovalQueue.getPendingCount(workspace._id);
      workspace.analytics.pendingApproval = pendingCount;

      res.json(workspace);
    } catch (error) {
      console.error('Error fetching workspace:', error);
      res.status(500).json({ error: 'Failed to fetch workspace' });
    }
  },

  /**
   * Create a new workspace
   */
  async createWorkspace(req, res) {
    try {
      const { name, description } = req.body;

      const workspace = new Workspace({
        name,
        description,
        ownerId: req.user._id,
        members: [{
          userId: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: 'owner',
          permissions: Workspace.getDefaultPermissions('owner')
        }]
      });

      await workspace.save();
      res.status(201).json(workspace);
    } catch (error) {
      console.error('Error creating workspace:', error);
      res.status(500).json({ error: 'Failed to create workspace' });
    }
  },

  /**
   * Update workspace settings
   */
  async updateWorkspace(req, res) {
    try {
      const { name, description, settings, branding } = req.body;
      const workspace = req.workspace;

      if (name) workspace.name = name;
      if (description !== undefined) workspace.description = description;
      if (settings) workspace.settings = { ...workspace.settings, ...settings };
      if (branding) workspace.branding = { ...workspace.branding, ...branding };

      await workspace.save();
      res.json(workspace);
    } catch (error) {
      console.error('Error updating workspace:', error);
      res.status(500).json({ error: 'Failed to update workspace' });
    }
  },

  /**
   * Delete a workspace
   */
  async deleteWorkspace(req, res) {
    try {
      const workspace = req.workspace;
      workspace.isActive = false;
      await workspace.save();
      res.json({ message: 'Workspace deleted successfully' });
    } catch (error) {
      console.error('Error deleting workspace:', error);
      res.status(500).json({ error: 'Failed to delete workspace' });
    }
  },

  /**
   * Invite a member to the workspace
   */
  async inviteMember(req, res) {
    try {
      const { email, role } = req.body;
      const workspace = req.workspace;

      // Check if already a member
      const existingMember = workspace.members.find(m => m.email === email);
      if (existingMember) {
        return res.status(400).json({ error: 'User is already a member' });
      }

      // Check for existing invite
      const existingInvite = workspace.pendingInvites.find(i => i.email === email);
      if (existingInvite) {
        return res.status(400).json({ error: 'Invite already sent to this email' });
      }

      // Generate invite token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      workspace.pendingInvites.push({
        email,
        role: role || 'viewer',
        token,
        expiresAt,
        invitedBy: req.user._id
      });

      await workspace.save();

      // In production, send email with invite link
      // For now, return the token
      res.json({
        message: 'Invite sent successfully',
        inviteToken: token,
        expiresAt
      });
    } catch (error) {
      console.error('Error inviting member:', error);
      res.status(500).json({ error: 'Failed to send invite' });
    }
  },

  /**
   * Accept an invite
   */
  async acceptInvite(req, res) {
    try {
      const { token } = req.body;

      const workspace = await Workspace.findOne({
        'pendingInvites.token': token,
        'pendingInvites.expiresAt': { $gt: new Date() }
      });

      if (!workspace) {
        return res.status(404).json({ error: 'Invalid or expired invite' });
      }

      const invite = workspace.pendingInvites.find(i => i.token === token);

      // Check if user email matches invite
      if (invite.email !== req.user.email) {
        return res.status(403).json({ error: 'This invite is for a different email address' });
      }

      // Add member
      workspace.members.push({
        userId: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: invite.role,
        permissions: Workspace.getDefaultPermissions(invite.role),
        invitedBy: invite.invitedBy
      });

      // Remove invite
      workspace.pendingInvites = workspace.pendingInvites.filter(i => i.token !== token);

      await workspace.save();
      res.json({ message: 'Successfully joined workspace', workspace });
    } catch (error) {
      console.error('Error accepting invite:', error);
      res.status(500).json({ error: 'Failed to accept invite' });
    }
  },

  /**
   * Remove a member from the workspace
   */
  async removeMember(req, res) {
    try {
      const { memberId } = req.params;
      const workspace = req.workspace;

      // Can't remove owner
      if (workspace.ownerId.toString() === memberId) {
        return res.status(400).json({ error: 'Cannot remove workspace owner' });
      }

      workspace.members = workspace.members.filter(
        m => m.userId.toString() !== memberId
      );

      await workspace.save();
      res.json({ message: 'Member removed successfully' });
    } catch (error) {
      console.error('Error removing member:', error);
      res.status(500).json({ error: 'Failed to remove member' });
    }
  },

  /**
   * Update member role and permissions
   */
  async updateMember(req, res) {
    try {
      const { memberId } = req.params;
      const { role, permissions } = req.body;
      const workspace = req.workspace;

      // Can't update owner
      if (workspace.ownerId.toString() === memberId) {
        return res.status(400).json({ error: 'Cannot modify workspace owner' });
      }

      const memberIndex = workspace.members.findIndex(
        m => m.userId.toString() === memberId
      );

      if (memberIndex === -1) {
        return res.status(404).json({ error: 'Member not found' });
      }

      if (role) {
        workspace.members[memberIndex].role = role;
        workspace.members[memberIndex].permissions = Workspace.getDefaultPermissions(role);
      }

      if (permissions) {
        workspace.members[memberIndex].permissions = {
          ...workspace.members[memberIndex].permissions,
          ...permissions
        };
      }

      await workspace.save();
      res.json({ message: 'Member updated successfully', member: workspace.members[memberIndex] });
    } catch (error) {
      console.error('Error updating member:', error);
      res.status(500).json({ error: 'Failed to update member' });
    }
  },

  /**
   * Leave a workspace
   */
  async leaveWorkspace(req, res) {
    try {
      const workspace = await Workspace.findById(req.params.workspaceId);

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      // Owner can't leave
      if (workspace.ownerId.toString() === req.user._id.toString()) {
        return res.status(400).json({ error: 'Owner cannot leave workspace. Transfer ownership first.' });
      }

      workspace.members = workspace.members.filter(
        m => m.userId.toString() !== req.user._id.toString()
      );

      await workspace.save();
      res.json({ message: 'Successfully left workspace' });
    } catch (error) {
      console.error('Error leaving workspace:', error);
      res.status(500).json({ error: 'Failed to leave workspace' });
    }
  },

  /**
   * Transfer ownership
   */
  async transferOwnership(req, res) {
    try {
      const { newOwnerId } = req.body;
      const workspace = req.workspace;

      // Find new owner in members
      const newOwnerMember = workspace.members.find(
        m => m.userId.toString() === newOwnerId
      );

      if (!newOwnerMember) {
        return res.status(404).json({ error: 'New owner must be an existing member' });
      }

      // Update current owner to admin
      const currentOwnerIndex = workspace.members.findIndex(
        m => m.userId.toString() === workspace.ownerId.toString()
      );
      if (currentOwnerIndex !== -1) {
        workspace.members[currentOwnerIndex].role = 'admin';
        workspace.members[currentOwnerIndex].permissions = Workspace.getDefaultPermissions('admin');
      }

      // Update new owner
      newOwnerMember.role = 'owner';
      newOwnerMember.permissions = Workspace.getDefaultPermissions('owner');
      workspace.ownerId = newOwnerId;

      await workspace.save();
      res.json({ message: 'Ownership transferred successfully' });
    } catch (error) {
      console.error('Error transferring ownership:', error);
      res.status(500).json({ error: 'Failed to transfer ownership' });
    }
  },

  /**
   * Get workspace members
   */
  async getMembers(req, res) {
    try {
      const workspace = await Workspace.findById(req.params.workspaceId)
        .populate('members.userId', 'name email avatar')
        .populate('ownerId', 'name email avatar');

      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      if (!workspace.isMember(req.user._id)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json({
        owner: workspace.ownerId,
        members: workspace.members,
        pendingInvites: workspace.pendingInvites.map(i => ({
          email: i.email,
          role: i.role,
          expiresAt: i.expiresAt
        }))
      });
    } catch (error) {
      console.error('Error fetching members:', error);
      res.status(500).json({ error: 'Failed to fetch members' });
    }
  },

  /**
   * Cancel pending invite
   */
  async cancelInvite(req, res) {
    try {
      const { email } = req.params;
      const workspace = req.workspace;

      workspace.pendingInvites = workspace.pendingInvites.filter(
        i => i.email !== email
      );

      await workspace.save();
      res.json({ message: 'Invite cancelled' });
    } catch (error) {
      console.error('Error cancelling invite:', error);
      res.status(500).json({ error: 'Failed to cancel invite' });
    }
  }
};

module.exports = workspaceController;
