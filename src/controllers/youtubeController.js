const YoutubeCollection = require('../models/YoutubeCollection');
const YoutubeVideo = require('../models/YoutubeVideo');
const { validateObjectId } = require('../utils/validators');

/**
 * YouTube Collection Controllers
 */

// Create a new collection
exports.createCollection = async (req, res) => {
  try {
    const { name, color, tags } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Collection name is required' });
    }

    const collection = new YoutubeCollection({
      userId: req.user._id,
      name: name.trim(),
      color: color || '#6366f1',
      tags: tags || []
    });

    await collection.save();

    res.status(201).json({
      message: 'YouTube collection created successfully',
      collection
    });
  } catch (error) {
    console.error('Create YouTube collection error:', error);
    res.status(500).json({
      error: 'Failed to create collection',
      details: error.message
    });
  }
};

// Get all collections for user
exports.getCollections = async (req, res) => {
  try {
    const collections = await YoutubeCollection.find({ userId: req.user._id })
      .sort({ updatedAt: -1 });

    // Get video counts for each collection
    const collectionsWithCounts = await Promise.all(
      collections.map(async (collection) => {
        const videoCount = await YoutubeVideo.countDocuments({
          collectionId: collection._id,
          userId: req.user._id
        });
        return {
          ...collection.toObject(),
          videoCount
        };
      })
    );

    res.json({
      collections: collectionsWithCounts,
      count: collectionsWithCounts.length
    });
  } catch (error) {
    console.error('Get YouTube collections error:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
};

// Get single collection by ID
exports.getCollection = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid collection ID' });
    }

    const collection = await YoutubeCollection.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Get videos in this collection
    const videos = await YoutubeVideo.find({
      collectionId: id,
      userId: req.user._id
    }).sort({ position: 1 });

    res.json({
      collection: {
        ...collection.toObject(),
        videos
      }
    });
  } catch (error) {
    console.error('Get YouTube collection error:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
};

// Update collection
exports.updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid collection ID' });
    }

    const collection = await YoutubeCollection.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'color', 'tags', 'rolloutId', 'sectionId'];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        collection[field] = updates[field];
      }
    });

    await collection.save();

    res.json({
      message: 'Collection updated successfully',
      collection
    });
  } catch (error) {
    console.error('Update YouTube collection error:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
};

// Delete collection
exports.deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid collection ID' });
    }

    const collection = await YoutubeCollection.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Also delete all videos in this collection
    await YoutubeVideo.deleteMany({
      collectionId: id,
      userId: req.user._id
    });

    res.json({ message: 'Collection and its videos deleted successfully' });
  } catch (error) {
    console.error('Delete YouTube collection error:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
};

/**
 * YouTube Video Controllers
 */

// Create a new video
exports.createVideo = async (req, res) => {
  try {
    const { title, description, thumbnail, collectionId, status, scheduledDate, position, tags } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Video title is required' });
    }

    // Validate collectionId if provided
    if (collectionId && !validateObjectId(collectionId)) {
      return res.status(400).json({ error: 'Invalid collection ID' });
    }

    // Verify collection belongs to user if provided
    if (collectionId) {
      const collection = await YoutubeCollection.findOne({
        _id: collectionId,
        userId: req.user._id
      });

      if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
      }
    }

    // Get the next position if in a collection
    let videoPosition = position;
    if (collectionId && videoPosition === undefined) {
      const lastVideo = await YoutubeVideo.findOne({
        collectionId,
        userId: req.user._id
      }).sort({ position: -1 });
      videoPosition = lastVideo ? lastVideo.position + 1 : 0;
    }

    const video = new YoutubeVideo({
      userId: req.user._id,
      title: title.trim(),
      description: description || '',
      thumbnail: thumbnail || '',
      collectionId: collectionId || null,
      status: status || 'draft',
      scheduledDate: scheduledDate || null,
      position: videoPosition || 0,
      tags: tags || []
    });

    await video.save();

    res.status(201).json({
      message: 'Video created successfully',
      video
    });
  } catch (error) {
    console.error('Create YouTube video error:', error);
    res.status(500).json({
      error: 'Failed to create video',
      details: error.message
    });
  }
};

// Get videos (with optional collection filter)
exports.getVideos = async (req, res) => {
  try {
    const { collectionId, status } = req.query;

    const filter = { userId: req.user._id };

    if (collectionId) {
      if (!validateObjectId(collectionId)) {
        return res.status(400).json({ error: 'Invalid collection ID' });
      }
      filter.collectionId = collectionId;
    }

    if (status) {
      filter.status = status;
    }

    const videos = await YoutubeVideo.find(filter)
      .sort({ position: 1, createdAt: -1 });

    res.json({
      videos,
      count: videos.length
    });
  } catch (error) {
    console.error('Get YouTube videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
};

// Get single video by ID
exports.getVideo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    const video = await YoutubeVideo.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ video });
  } catch (error) {
    console.error('Get YouTube video error:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
};

// Update video
exports.updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    const video = await YoutubeVideo.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Validate new collectionId if provided
    if (updates.collectionId && updates.collectionId !== video.collectionId?.toString()) {
      if (!validateObjectId(updates.collectionId)) {
        return res.status(400).json({ error: 'Invalid collection ID' });
      }

      const collection = await YoutubeCollection.findOne({
        _id: updates.collectionId,
        userId: req.user._id
      });

      if (!collection) {
        return res.status(404).json({ error: 'Collection not found' });
      }
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'thumbnail', 'collectionId', 'status', 'scheduledDate', 'position', 'tags'];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        video[field] = updates[field];
      }
    });

    await video.save();

    res.json({
      message: 'Video updated successfully',
      video
    });
  } catch (error) {
    console.error('Update YouTube video error:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
};

// Delete video
exports.deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    const video = await YoutubeVideo.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete YouTube video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
};

// Reorder videos in a collection
exports.reorderVideos = async (req, res) => {
  try {
    const { collectionId, videoIds } = req.body;

    if (!collectionId || !validateObjectId(collectionId)) {
      return res.status(400).json({ error: 'Invalid collection ID' });
    }

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({ error: 'Video IDs array is required' });
    }

    // Verify collection belongs to user
    const collection = await YoutubeCollection.findOne({
      _id: collectionId,
      userId: req.user._id
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Update positions for all videos
    const updatePromises = videoIds.map((videoId, index) => {
      if (!validateObjectId(videoId)) {
        throw new Error(`Invalid video ID: ${videoId}`);
      }
      return YoutubeVideo.findOneAndUpdate(
        { _id: videoId, userId: req.user._id, collectionId },
        { position: index },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    // Fetch updated videos
    const videos = await YoutubeVideo.find({
      collectionId,
      userId: req.user._id
    }).sort({ position: 1 });

    res.json({
      message: 'Videos reordered successfully',
      videos
    });
  } catch (error) {
    console.error('Reorder YouTube videos error:', error);
    res.status(500).json({ error: 'Failed to reorder videos' });
  }
};

module.exports = exports;
