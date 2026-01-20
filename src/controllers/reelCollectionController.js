const ReelCollection = require('../models/ReelCollection');
const Content = require('../models/Content');

// Create new reel collection
exports.createCollection = async (req, res) => {
  try {
    const { name, platform, description, color } = req.body;

    const collection = new ReelCollection({
      userId: req.userId,
      name: name || 'Untitled Collection',
      platform: platform || 'instagram',
      description,
      color
    });

    await collection.save();

    res.status(201).json({
      message: 'Collection created successfully',
      collection
    });
  } catch (error) {
    console.error('Create reel collection error:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
};

// Get all reel collections for user
exports.getAllCollections = async (req, res) => {
  try {
    const { platform } = req.query;

    const filter = { userId: req.userId };
    if (platform) filter.platform = platform;

    const collections = await ReelCollection.find(filter)
      .populate('reels.contentId')
      .sort({ updatedAt: -1 });

    // Clean up orphaned references (where content was deleted)
    for (const collection of collections) {
      const originalLength = collection.reels?.length || 0;
      const validReels = collection.reels?.filter(r => r.contentId && r.contentId.mediaUrl) || [];

      if (validReels.length !== originalLength) {
        console.log(`[ReelCollection] Cleaning up ${originalLength - validReels.length} orphaned reels from collection ${collection._id}`);
        collection.reels = validReels;
        // Re-order after cleanup
        collection.reels.forEach((r, i) => { r.order = i; });
        await collection.save();
      }
    }

    res.json({ collections });
  } catch (error) {
    console.error('Get reel collections error:', error);
    res.status(500).json({ error: 'Failed to get collections' });
  }
};

// Get single reel collection
exports.getCollection = async (req, res) => {
  try {
    const collection = await ReelCollection.findOne({
      _id: req.params.id,
      userId: req.userId
    }).populate('reels.contentId');

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json({ collection });
  } catch (error) {
    console.error('Get reel collection error:', error);
    res.status(500).json({ error: 'Failed to get collection' });
  }
};

// Update reel collection
exports.updateCollection = async (req, res) => {
  try {
    const { name, platform, description, color, isActive } = req.body;

    const collection = await ReelCollection.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (name !== undefined) collection.name = name;
    if (platform !== undefined) collection.platform = platform;
    if (description !== undefined) collection.description = description;
    if (color !== undefined) collection.color = color;
    if (isActive !== undefined) collection.isActive = isActive;

    await collection.save();

    res.json({
      message: 'Collection updated successfully',
      collection
    });
  } catch (error) {
    console.error('Update reel collection error:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
};

// Delete reel collection
exports.deleteCollection = async (req, res) => {
  try {
    const collection = await ReelCollection.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Delete reel collection error:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
};

// Add reel to collection
exports.addReel = async (req, res) => {
  try {
    const { contentId } = req.body;

    const collection = await ReelCollection.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Verify content exists and belongs to user
    const content = await Content.findOne({
      _id: contentId,
      userId: req.userId
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    collection.addReel(contentId);
    await collection.save();

    // Return populated collection
    const populated = await ReelCollection.findById(collection._id)
      .populate('reels.contentId');

    res.json({
      message: 'Reel added successfully',
      collection: populated
    });
  } catch (error) {
    console.error('Add reel to collection error:', error);
    res.status(500).json({ error: 'Failed to add reel' });
  }
};

// Remove reel from collection
exports.removeReel = async (req, res) => {
  try {
    const { contentId } = req.body;

    const collection = await ReelCollection.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    collection.removeReel(contentId);
    await collection.save();

    // Return populated collection
    const populated = await ReelCollection.findById(collection._id)
      .populate('reels.contentId');

    res.json({
      message: 'Reel removed successfully',
      collection: populated
    });
  } catch (error) {
    console.error('Remove reel from collection error:', error);
    res.status(500).json({ error: 'Failed to remove reel' });
  }
};

// Reorder reels in collection
exports.reorderReels = async (req, res) => {
  try {
    const { reelIds } = req.body;

    if (!reelIds || !Array.isArray(reelIds)) {
      return res.status(400).json({ error: 'reelIds array required' });
    }

    const collection = await ReelCollection.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    collection.reorderReels(reelIds);
    collection.markModified('reels');
    await collection.save();

    // Return populated collection
    const populated = await ReelCollection.findById(collection._id)
      .populate('reels.contentId');

    res.json({
      message: 'Reels reordered successfully',
      collection: populated
    });
  } catch (error) {
    console.error('Reorder reels error:', error);
    res.status(500).json({ error: 'Failed to reorder reels' });
  }
};

// Bulk add reels to collection (for initial setup or import)
exports.bulkAddReels = async (req, res) => {
  try {
    const { contentIds } = req.body;

    if (!contentIds || !Array.isArray(contentIds)) {
      return res.status(400).json({ error: 'contentIds array required' });
    }

    const collection = await ReelCollection.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Add each reel
    for (const contentId of contentIds) {
      collection.addReel(contentId);
    }

    await collection.save();

    // Return populated collection
    const populated = await ReelCollection.findById(collection._id)
      .populate('reels.contentId');

    res.json({
      message: 'Reels added successfully',
      collection: populated
    });
  } catch (error) {
    console.error('Bulk add reels error:', error);
    res.status(500).json({ error: 'Failed to add reels' });
  }
};
