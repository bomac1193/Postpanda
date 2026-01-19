const LinkInBio = require('../models/LinkInBio');

// Create a new Link in Bio page
exports.create = async (req, res) => {
  try {
    const { slug, title, bio } = req.body;

    // Generate unique slug if not provided
    const uniqueSlug = slug
      ? await LinkInBio.generateUniqueSlug(slug)
      : await LinkInBio.generateUniqueSlug(req.user.name || 'mylinks');

    const linkInBio = new LinkInBio({
      userId: req.userId,
      slug: uniqueSlug,
      title: title || 'My Links',
      bio: bio || ''
    });

    await linkInBio.save();

    res.status(201).json({
      message: 'Link in Bio page created successfully',
      linkInBio
    });
  } catch (error) {
    console.error('Create Link in Bio error:', error);
    res.status(500).json({ error: 'Failed to create Link in Bio page' });
  }
};

// Get all Link in Bio pages for user
exports.getAll = async (req, res) => {
  try {
    const pages = await LinkInBio.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ pages });
  } catch (error) {
    console.error('Get all Link in Bio error:', error);
    res.status(500).json({ error: 'Failed to get Link in Bio pages' });
  }
};

// Get single Link in Bio page by ID
exports.getById = async (req, res) => {
  try {
    const page = await LinkInBio.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!page) {
      return res.status(404).json({ error: 'Link in Bio page not found' });
    }

    res.json({ page });
  } catch (error) {
    console.error('Get Link in Bio error:', error);
    res.status(500).json({ error: 'Failed to get Link in Bio page' });
  }
};

// Get public page by slug (no auth)
exports.getPublicPage = async (req, res) => {
  try {
    const page = await LinkInBio.findOne({
      slug: req.params.slug,
      isPublished: true
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Return only public data
    res.json({
      title: page.title,
      bio: page.bio,
      avatar: page.avatar,
      theme: page.theme,
      links: page.getActiveLinks(),
      socialLinks: page.socialLinks
    });
  } catch (error) {
    console.error('Get public page error:', error);
    res.status(500).json({ error: 'Failed to get page' });
  }
};

// Update Link in Bio page
exports.update = async (req, res) => {
  try {
    const { title, bio, avatar, socialLinks, seoTitle, seoDescription } = req.body;

    const page = await LinkInBio.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        $set: {
          title,
          bio,
          avatar,
          socialLinks,
          seoTitle,
          seoDescription
        }
      },
      { new: true }
    );

    if (!page) {
      return res.status(404).json({ error: 'Link in Bio page not found' });
    }

    res.json({ message: 'Page updated successfully', page });
  } catch (error) {
    console.error('Update Link in Bio error:', error);
    res.status(500).json({ error: 'Failed to update page' });
  }
};

// Delete Link in Bio page
exports.delete = async (req, res) => {
  try {
    const page = await LinkInBio.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!page) {
      return res.status(404).json({ error: 'Link in Bio page not found' });
    }

    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Delete Link in Bio error:', error);
    res.status(500).json({ error: 'Failed to delete page' });
  }
};

// Add a link
exports.addLink = async (req, res) => {
  try {
    const { title, url, icon } = req.body;

    if (!title || !url) {
      return res.status(400).json({ error: 'Title and URL are required' });
    }

    const page = await LinkInBio.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const order = page.links.length;
    page.links.push({ title, url, icon: icon || 'link', order });
    await page.save();

    res.json({
      message: 'Link added successfully',
      link: page.links[page.links.length - 1]
    });
  } catch (error) {
    console.error('Add link error:', error);
    res.status(500).json({ error: 'Failed to add link' });
  }
};

// Update a link
exports.updateLink = async (req, res) => {
  try {
    const { title, url, icon, isActive } = req.body;

    const page = await LinkInBio.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const link = page.links.id(req.params.linkId);
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    if (title !== undefined) link.title = title;
    if (url !== undefined) link.url = url;
    if (icon !== undefined) link.icon = icon;
    if (isActive !== undefined) link.isActive = isActive;

    await page.save();

    res.json({ message: 'Link updated successfully', link });
  } catch (error) {
    console.error('Update link error:', error);
    res.status(500).json({ error: 'Failed to update link' });
  }
};

// Delete a link
exports.deleteLink = async (req, res) => {
  try {
    const page = await LinkInBio.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    page.links.pull(req.params.linkId);
    await page.save();

    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Delete link error:', error);
    res.status(500).json({ error: 'Failed to delete link' });
  }
};

// Reorder links
exports.reorderLinks = async (req, res) => {
  try {
    const { linkOrder } = req.body; // Array of link IDs in new order

    const page = await LinkInBio.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    linkOrder.forEach((linkId, index) => {
      const link = page.links.id(linkId);
      if (link) {
        link.order = index;
      }
    });

    await page.save();

    res.json({ message: 'Links reordered successfully' });
  } catch (error) {
    console.error('Reorder links error:', error);
    res.status(500).json({ error: 'Failed to reorder links' });
  }
};

// Update theme
exports.updateTheme = async (req, res) => {
  try {
    const { theme } = req.body;

    const page = await LinkInBio.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { theme } },
      { new: true }
    );

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json({ message: 'Theme updated successfully', theme: page.theme });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
};

// Toggle publish status
exports.togglePublish = async (req, res) => {
  try {
    const page = await LinkInBio.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    page.isPublished = !page.isPublished;
    await page.save();

    res.json({
      message: page.isPublished ? 'Page published' : 'Page unpublished',
      isPublished: page.isPublished
    });
  } catch (error) {
    console.error('Toggle publish error:', error);
    res.status(500).json({ error: 'Failed to toggle publish status' });
  }
};

// Track page view
exports.trackView = async (req, res) => {
  try {
    const page = await LinkInBio.findOne({
      slug: req.params.slug,
      isPublished: true
    });

    if (page) {
      await page.trackView(req.body.visitorId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ error: 'Failed to track view' });
  }
};

// Track link click
exports.trackLinkClick = async (req, res) => {
  try {
    const page = await LinkInBio.findOne({
      slug: req.params.slug,
      isPublished: true
    });

    if (page) {
      await page.trackLinkClick(req.params.linkId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
};

// Get analytics
exports.getAnalytics = async (req, res) => {
  try {
    const page = await LinkInBio.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    const linkStats = page.links.map(link => ({
      id: link._id,
      title: link.title,
      clicks: link.clicks
    }));

    res.json({
      totalViews: page.analytics.totalViews,
      uniqueVisitors: page.analytics.uniqueVisitors,
      lastViewedAt: page.analytics.lastViewedAt,
      linkStats
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
};

// Check slug availability
exports.checkSlugAvailability = async (req, res) => {
  try {
    const existing = await LinkInBio.findOne({ slug: req.params.slug });
    res.json({ available: !existing });
  } catch (error) {
    console.error('Check slug error:', error);
    res.status(500).json({ error: 'Failed to check slug' });
  }
};
