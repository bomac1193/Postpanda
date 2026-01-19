const ApprovalQueue = require('../models/ApprovalQueue');
const Workspace = require('../models/Workspace');
const Content = require('../models/Content');

const approvalController = {
  /**
   * Get all items in approval queue for a workspace
   */
  async getQueue(req, res) {
    try {
      const { workspaceId } = req.params;
      const { status, submittedBy, page = 1, limit = 20 } = req.query;

      const query = { workspaceId };
      if (status) query.status = status;
      if (submittedBy) query.submittedBy = submittedBy;

      const items = await ApprovalQueue.find(query)
        .sort({ priority: -1, submittedAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('contentId')
        .populate('submittedBy', 'name email avatar');

      const total = await ApprovalQueue.countDocuments(query);

      res.json({
        items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching approval queue:', error);
      res.status(500).json({ error: 'Failed to fetch approval queue' });
    }
  },

  /**
   * Get a specific queue item
   */
  async getQueueItem(req, res) {
    try {
      const item = await ApprovalQueue.findById(req.params.itemId)
        .populate('contentId')
        .populate('submittedBy', 'name email avatar')
        .populate('reviews.reviewerId', 'name email avatar');

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      res.json(item);
    } catch (error) {
      console.error('Error fetching queue item:', error);
      res.status(500).json({ error: 'Failed to fetch queue item' });
    }
  },

  /**
   * Submit content for approval
   */
  async submitForApproval(req, res) {
    try {
      const { workspaceId, contentId, caption, hashtags, scheduledFor, platforms, priority, notes } = req.body;

      // Get workspace settings
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
      }

      // Check if content exists
      const content = await Content.findById(contentId);
      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }

      // Check if already in queue
      const existing = await ApprovalQueue.findOne({
        workspaceId,
        contentId,
        status: { $in: ['pending', 'in_review'] }
      });

      if (existing) {
        return res.status(400).json({ error: 'Content is already in approval queue' });
      }

      const queueItem = new ApprovalQueue({
        workspaceId,
        contentId,
        contentType: content.type || 'post',
        submittedBy: req.user._id,
        submitterName: req.user.name,
        caption,
        hashtags,
        scheduledFor,
        platforms,
        priority: priority || 'normal',
        notes,
        requiredApprovalLevels: workspace.settings.approvalLevels || 1,
        metadata: {
          thumbnailUrl: content.thumbnailUrl,
          mediaType: content.type
        }
      });

      await queueItem.save();

      // Update workspace analytics
      workspace.analytics.pendingApproval = await ApprovalQueue.getPendingCount(workspaceId);
      await workspace.save();

      res.status(201).json(queueItem);
    } catch (error) {
      console.error('Error submitting for approval:', error);
      res.status(500).json({ error: 'Failed to submit for approval' });
    }
  },

  /**
   * Approve content
   */
  async approve(req, res) {
    try {
      const { feedback } = req.body;
      const item = await ApprovalQueue.findById(req.params.itemId);

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Check permission
      const workspace = await Workspace.findById(item.workspaceId);
      if (!workspace.hasPermission(req.user._id, 'canApprove')) {
        return res.status(403).json({ error: 'You do not have permission to approve content' });
      }

      item.addReview(req.user._id, req.user.name, 'approved', feedback);
      await item.save();

      // Update workspace analytics
      workspace.analytics.pendingApproval = await ApprovalQueue.getPendingCount(item.workspaceId);
      await workspace.save();

      res.json(item);
    } catch (error) {
      console.error('Error approving content:', error);
      res.status(500).json({ error: 'Failed to approve content' });
    }
  },

  /**
   * Reject content
   */
  async reject(req, res) {
    try {
      const { feedback } = req.body;
      const item = await ApprovalQueue.findById(req.params.itemId);

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      if (!feedback) {
        return res.status(400).json({ error: 'Feedback is required when rejecting' });
      }

      // Check permission
      const workspace = await Workspace.findById(item.workspaceId);
      if (!workspace.hasPermission(req.user._id, 'canApprove')) {
        return res.status(403).json({ error: 'You do not have permission to reject content' });
      }

      item.addReview(req.user._id, req.user.name, 'rejected', feedback);
      await item.save();

      // Update workspace analytics
      workspace.analytics.pendingApproval = await ApprovalQueue.getPendingCount(item.workspaceId);
      await workspace.save();

      res.json(item);
    } catch (error) {
      console.error('Error rejecting content:', error);
      res.status(500).json({ error: 'Failed to reject content' });
    }
  },

  /**
   * Request revision
   */
  async requestRevision(req, res) {
    try {
      const { feedback } = req.body;
      const item = await ApprovalQueue.findById(req.params.itemId);

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      if (!feedback) {
        return res.status(400).json({ error: 'Feedback is required when requesting revision' });
      }

      // Check permission
      const workspace = await Workspace.findById(item.workspaceId);
      if (!workspace.hasPermission(req.user._id, 'canApprove')) {
        return res.status(403).json({ error: 'You do not have permission to request revisions' });
      }

      item.addReview(req.user._id, req.user.name, 'revision_requested', feedback);
      await item.save();

      res.json(item);
    } catch (error) {
      console.error('Error requesting revision:', error);
      res.status(500).json({ error: 'Failed to request revision' });
    }
  },

  /**
   * Resubmit content after revision
   */
  async resubmit(req, res) {
    try {
      const { caption, notes } = req.body;
      const item = await ApprovalQueue.findById(req.params.itemId);

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Only submitter can resubmit
      if (item.submittedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Only the original submitter can resubmit' });
      }

      if (item.status !== 'revision_requested' && item.status !== 'rejected') {
        return res.status(400).json({ error: 'Content is not in a state that can be resubmitted' });
      }

      item.resubmit(caption, notes);
      await item.save();

      // Update workspace analytics
      const workspace = await Workspace.findById(item.workspaceId);
      workspace.analytics.pendingApproval = await ApprovalQueue.getPendingCount(item.workspaceId);
      await workspace.save();

      res.json(item);
    } catch (error) {
      console.error('Error resubmitting content:', error);
      res.status(500).json({ error: 'Failed to resubmit content' });
    }
  },

  /**
   * Mark as published
   */
  async markPublished(req, res) {
    try {
      const item = await ApprovalQueue.findById(req.params.itemId);

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      if (item.status !== 'approved') {
        return res.status(400).json({ error: 'Content must be approved before publishing' });
      }

      item.status = 'published';
      item.publishedAt = new Date();
      await item.save();

      // Update workspace analytics
      const workspace = await Workspace.findById(item.workspaceId);
      workspace.analytics.publishedThisMonth = (workspace.analytics.publishedThisMonth || 0) + 1;
      await workspace.save();

      res.json(item);
    } catch (error) {
      console.error('Error marking as published:', error);
      res.status(500).json({ error: 'Failed to mark as published' });
    }
  },

  /**
   * Delete queue item
   */
  async deleteItem(req, res) {
    try {
      const item = await ApprovalQueue.findById(req.params.itemId);

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Check permission - must be submitter or have delete permission
      const workspace = await Workspace.findById(item.workspaceId);
      const isSubmitter = item.submittedBy.toString() === req.user._id.toString();
      const canDelete = workspace.hasPermission(req.user._id, 'canDeleteContent');

      if (!isSubmitter && !canDelete) {
        return res.status(403).json({ error: 'You do not have permission to delete this item' });
      }

      await ApprovalQueue.findByIdAndDelete(req.params.itemId);

      // Update workspace analytics
      workspace.analytics.pendingApproval = await ApprovalQueue.getPendingCount(item.workspaceId);
      await workspace.save();

      res.json({ message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Error deleting queue item:', error);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  },

  /**
   * Get my submissions
   */
  async getMySubmissions(req, res) {
    try {
      const { workspaceId } = req.params;
      const { status } = req.query;

      const query = {
        workspaceId,
        submittedBy: req.user._id
      };
      if (status) query.status = status;

      const items = await ApprovalQueue.find(query)
        .sort({ submittedAt: -1 })
        .populate('contentId');

      res.json(items);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  },

  /**
   * Get approval statistics
   */
  async getStats(req, res) {
    try {
      const { workspaceId } = req.params;

      const stats = await ApprovalQueue.aggregate([
        { $match: { workspaceId: require('mongoose').Types.ObjectId(workspaceId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        pending: 0,
        in_review: 0,
        approved: 0,
        rejected: 0,
        revision_requested: 0,
        published: 0
      };

      stats.forEach(s => {
        result[s._id] = s.count;
      });

      res.json(result);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
};

module.exports = approvalController;
