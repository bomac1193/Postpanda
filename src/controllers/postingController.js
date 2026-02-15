const schedulingService = require('../services/schedulingService');
const socialMediaService = require('../services/socialMediaService');
const Collection = require('../models/Collection');
const Content = require('../models/Content');
const User = require('../models/User');
const approvalGateService = require('../services/approvalGateService');

/**
 * Manually post a single content item (legacy endpoint)
 */
exports.postContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { platform, caption } = req.body;

    const content = await Content.findOne({
      _id: contentId,
      userId: req.user._id
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const gate = await approvalGateService.evaluateContentGate({
      content,
      user: req.user,
      action: 'post',
    });
    if (!gate.allowed) {
      return res.status(409).json({
        error: 'Approval gate blocked posting',
        code: gate.code,
        gate,
      });
    }

    const user = await User.findById(req.user._id);

    // Validate credentials
    const validation = await socialMediaService.validateCredentials(user, platform);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error,
        needsRefresh: validation.needsRefresh
      });
    }

    // Post content
    const options = { caption: caption || content.caption };
    let result;

    if (platform === 'instagram') {
      result = await socialMediaService.postToInstagram(user, content, options);
    } else if (platform === 'tiktok') {
      result = await socialMediaService.postToTikTok(user, content, options);
    } else if (platform === 'both') {
      result = await socialMediaService.postToBoth(user, content, options);
    } else {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    // Update content status
    if (result.success) {
      content.status = 'published';
      content.publishedAt = new Date();
      if (result.postUrl) {
        content.platformPostUrl = result.postUrl;
      }
      await content.save();
    }

    res.json({
      message: result.success ? 'Content posted successfully' : 'Posting failed',
      result
    });
  } catch (error) {
    console.error('Post content error:', error);
    res.status(500).json({
      error: 'Failed to post content',
      details: error.message
    });
  }
};

/**
 * Post content immediately to selected platforms (frontend /now endpoint)
 */
exports.postNow = async (req, res) => {
  try {
    const { contentId, platforms, caption, hashtags } = req.body;

    if (!contentId || !platforms) {
      return res.status(400).json({ error: 'Content ID and platforms are required' });
    }

    const content = await Content.findOne({
      _id: contentId,
      userId: req.user._id
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const gate = await approvalGateService.evaluateContentGate({
      content,
      user: req.user,
      action: 'post_now',
    });
    if (!gate.allowed) {
      return res.status(409).json({
        error: 'Approval gate blocked posting',
        code: gate.code,
        gate,
      });
    }

    const user = await User.findById(req.user._id);
    const platformArray = Array.isArray(platforms) ? platforms : [platforms];

    const results = {};
    const errors = [];

    // Build caption with hashtags
    let finalCaption = caption || content.caption || '';
    if (hashtags && hashtags.length > 0) {
      const hashtagStr = hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
      finalCaption = `${finalCaption}\n\n${hashtagStr}`.trim();
    }

    const options = { caption: finalCaption };

    // Post to each platform
    for (const platform of platformArray) {
      try {
        // Validate credentials
        const validation = await socialMediaService.validateCredentials(user, platform);
        if (!validation.valid) {
          errors.push({
            platform,
            error: validation.error,
            needsRefresh: validation.needsRefresh
          });
          continue;
        }

        // Post to platform
        let result;
        if (platform === 'instagram') {
          result = await socialMediaService.postToInstagram(user, content, options);
        } else if (platform === 'tiktok') {
          result = await socialMediaService.postToTikTok(user, content, options);
        } else {
          errors.push({ platform, error: `Unsupported platform: ${platform}` });
          continue;
        }

        results[platform] = result;

        // Update content status if successful
        if (result.success) {
          content.status = 'published';
          content.publishedAt = new Date();
          if (!content.platformPosts) {
            content.platformPosts = {};
          }
          content.platformPosts[platform] = {
            postId: result.postId,
            postUrl: result.postUrl,
            postedAt: result.timestamp
          };
        }
      } catch (error) {
        errors.push({ platform, error: error.message });
      }
    }

    // Save content updates
    if (Object.keys(results).length > 0) {
      await content.save();
    }

    const allSuccessful = errors.length === 0 && Object.keys(results).length === platformArray.length;

    res.json({
      success: allSuccessful,
      message: allSuccessful ? 'Posted successfully to all platforms' : 'Some posts failed',
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Post now error:', error);
    res.status(500).json({
      error: 'Failed to post content',
      details: error.message
    });
  }
};

/**
 * Manually trigger posting for a collection
 */
exports.postCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const result = await schedulingService.triggerCollectionPost(id);

    res.json(result);
  } catch (error) {
    console.error('Post collection error:', error);
    res.status(500).json({
      error: 'Failed to post collection',
      details: error.message
    });
  }
};

/**
 * Post a specific item from a collection
 */
exports.postCollectionItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;

    const collection = await Collection.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const result = await schedulingService.postCollectionItem(id, itemId);

    res.json({
      message: result.success ? 'Item posted successfully' : 'Posting failed',
      result
    });
  } catch (error) {
    console.error('Post collection item error:', error);
    res.status(500).json({
      error: 'Failed to post item',
      details: error.message
    });
  }
};

/**
 * Pause a scheduled collection
 */
exports.pauseCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const result = await schedulingService.pauseCollection(id);

    res.json(result);
  } catch (error) {
    console.error('Pause collection error:', error);
    res.status(500).json({
      error: 'Failed to pause collection',
      details: error.message
    });
  }
};

/**
 * Resume a paused collection
 */
exports.resumeCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const result = await schedulingService.resumeCollection(id);

    res.json(result);
  } catch (error) {
    console.error('Resume collection error:', error);
    res.status(500).json({
      error: 'Failed to resume collection',
      details: error.message
    });
  }
};

/**
 * Get scheduling service status
 */
exports.getSchedulingStatus = async (req, res) => {
  try {
    const status = schedulingService.getStatus();

    // Get counts
    const scheduledCount = await Collection.countDocuments({
      userId: req.user._id,
      status: 'scheduled',
      'scheduling.enabled': true
    });

    const activeCount = await Collection.countDocuments({
      userId: req.user._id,
      status: { $in: ['scheduled', 'posting'] },
      'settings.isActive': true
    });

    res.json({
      service: status,
      userCollections: {
        scheduled: scheduledCount,
        active: activeCount
      }
    });
  } catch (error) {
    console.error('Get scheduling status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
};

/**
 * Refresh Instagram access token
 */
exports.refreshInstagramToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.socialAccounts.instagram.connected) {
      return res.status(400).json({ error: 'Instagram not connected' });
    }

    await socialMediaService.refreshInstagramToken(user);

    res.json({ message: 'Instagram token refreshed successfully' });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      error: 'Failed to refresh token',
      details: error.message
    });
  }
};

/**
 * Schedule content for future posting
 */
exports.schedulePost = async (req, res) => {
  try {
    // Support both frontend naming (platforms, scheduledAt) and original naming (platform, scheduledTime)
    const { contentId, scheduledTime, scheduledAt, platform, platforms, autoPost } = req.body;
    const resolvedScheduledTime = scheduledTime || scheduledAt;
    const resolvedPlatform = platform || (Array.isArray(platforms) ? platforms[0] : platforms) || 'instagram';

    if (!contentId || !resolvedScheduledTime) {
      return res.status(400).json({ error: 'Content ID and scheduled time are required' });
    }

    const content = await Content.findOne({
      _id: contentId,
      userId: req.user._id
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const gate = await approvalGateService.evaluateContentGate({
      content,
      user: req.user,
      action: 'schedule',
    });
    if (!gate.allowed) {
      return res.status(409).json({
        error: 'Approval gate blocked scheduling',
        code: gate.code,
        gate,
      });
    }

    // Update content with scheduling info
    content.scheduledTime = new Date(resolvedScheduledTime);
    content.scheduledPlatform = resolvedPlatform;
    content.autoPost = autoPost || false;
    content.status = 'scheduled';

    await content.save();

    res.json({
      message: 'Content scheduled successfully',
      scheduledPost: {
        id: content._id,
        scheduledTime: content.scheduledTime,
        platform: content.scheduledPlatform,
        autoPost: content.autoPost,
        status: content.status
      }
    });
  } catch (error) {
    console.error('Schedule post error:', error);
    res.status(500).json({
      error: 'Failed to schedule post',
      details: error.message
    });
  }
};

/**
 * Get all scheduled posts for user
 */
exports.getScheduledPosts = async (req, res) => {
  try {
    const scheduledPosts = await Content.find({
      userId: req.user._id,
      status: 'scheduled',
      scheduledTime: { $exists: true }
    }).sort({ scheduledTime: 1 });

    const mappedPosts = scheduledPosts.map(post => ({
      id: post._id,
      caption: post.caption,
      mediaUrl: post.mediaUrl,
      image: post.mediaUrl,
      scheduledTime: post.scheduledTime,
      scheduledAt: post.scheduledTime, // Alias for frontend compatibility
      platform: post.scheduledPlatform,
      autoPost: post.autoPost,
      status: post.status
    }));

    res.json({
      scheduledPosts: mappedPosts,
      posts: mappedPosts, // Alias for frontend compatibility
      scheduled: mappedPosts // Another alias for frontend compatibility
    });
  } catch (error) {
    console.error('Get scheduled posts error:', error);
    res.status(500).json({ error: 'Failed to get scheduled posts' });
  }
};

/**
 * Update a scheduled post
 */
exports.updateScheduledPost = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { scheduledTime, platform, autoPost } = req.body;

    const content = await Content.findOne({
      _id: scheduleId,
      userId: req.user._id,
      status: 'scheduled'
    });

    if (!content) {
      return res.status(404).json({ error: 'Scheduled post not found' });
    }

    if (scheduledTime) {
      content.scheduledTime = new Date(scheduledTime);
    }
    if (platform) {
      content.scheduledPlatform = platform;
    }
    if (typeof autoPost === 'boolean') {
      content.autoPost = autoPost;
    }

    await content.save();

    res.json({
      message: 'Scheduled post updated successfully',
      scheduledPost: {
        id: content._id,
        scheduledTime: content.scheduledTime,
        platform: content.scheduledPlatform,
        autoPost: content.autoPost
      }
    });
  } catch (error) {
    console.error('Update scheduled post error:', error);
    res.status(500).json({
      error: 'Failed to update scheduled post',
      details: error.message
    });
  }
};

/**
 * Cancel a scheduled post
 */
exports.cancelScheduledPost = async (req, res) => {
  try {
    const { scheduleId, postId } = req.params;
    const contentId = scheduleId || postId;

    const content = await Content.findOne({
      _id: contentId,
      userId: req.user._id,
      status: 'scheduled'
    });

    if (!content) {
      return res.status(404).json({ error: 'Scheduled post not found' });
    }

    content.status = 'draft';
    content.scheduledTime = undefined;
    content.scheduledPlatform = undefined;
    content.autoPost = false;

    await content.save();

    res.json({
      message: 'Scheduled post cancelled successfully',
      contentId: content._id
    });
  } catch (error) {
    console.error('Cancel scheduled post error:', error);
    res.status(500).json({
      error: 'Failed to cancel scheduled post',
      details: error.message
    });
  }
};

/**
 * Get posting history for user
 */
exports.getPostingHistory = async (req, res) => {
  try {
    const { platform, startDate, endDate, limit = 50 } = req.query;

    const query = {
      userId: req.user._id,
      status: 'published',
      publishedAt: { $exists: true }
    };

    if (platform && platform !== 'all') {
      query[`platformPosts.${platform}`] = { $exists: true };
    }

    if (startDate || endDate) {
      query.publishedAt = {};
      if (startDate) query.publishedAt.$gte = new Date(startDate);
      if (endDate) query.publishedAt.$lte = new Date(endDate);
    }

    const posts = await Content.find(query)
      .sort({ publishedAt: -1 })
      .limit(parseInt(limit));

    const history = posts.map(post => ({
      id: post._id,
      caption: post.caption,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      publishedAt: post.publishedAt,
      platforms: Object.keys(post.platformPosts || {}),
      platformPosts: post.platformPosts,
      status: post.status
    }));

    res.json({
      success: true,
      posts: history,
      count: history.length
    });
  } catch (error) {
    console.error('Get posting history error:', error);
    res.status(500).json({
      error: 'Failed to get posting history',
      details: error.message
    });
  }
};

module.exports = exports;
