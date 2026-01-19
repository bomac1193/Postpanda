const MediaKit = require('../models/MediaKit');
const mediaKitService = require('../services/mediaKitService');

const mediaKitController = {
  /**
   * Get user's media kits
   */
  async getMediaKits(req, res) {
    try {
      const mediaKits = await MediaKit.find({ userId: req.user._id })
        .sort({ updatedAt: -1 });
      res.json(mediaKits);
    } catch (error) {
      console.error('Error fetching media kits:', error);
      res.status(500).json({ error: 'Failed to fetch media kits' });
    }
  },

  /**
   * Get a specific media kit
   */
  async getMediaKit(req, res) {
    try {
      const mediaKit = await MediaKit.findOne({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!mediaKit) {
        return res.status(404).json({ error: 'Media kit not found' });
      }

      res.json(mediaKit);
    } catch (error) {
      console.error('Error fetching media kit:', error);
      res.status(500).json({ error: 'Failed to fetch media kit' });
    }
  },

  /**
   * Create a new media kit
   */
  async createMediaKit(req, res) {
    try {
      const { name, template } = req.body;

      const mediaKit = new MediaKit({
        userId: req.user._id,
        name: name || 'My Media Kit',
        template: template || 'professional'
      });

      await mediaKit.save();
      res.status(201).json(mediaKit);
    } catch (error) {
      console.error('Error creating media kit:', error);
      res.status(500).json({ error: 'Failed to create media kit' });
    }
  },

  /**
   * Update a media kit
   */
  async updateMediaKit(req, res) {
    try {
      const { name, template, sections, customization, isPublished } = req.body;

      const mediaKit = await MediaKit.findOne({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!mediaKit) {
        return res.status(404).json({ error: 'Media kit not found' });
      }

      if (name !== undefined) mediaKit.name = name;
      if (template !== undefined) mediaKit.template = template;
      if (sections !== undefined) mediaKit.sections = { ...mediaKit.sections, ...sections };
      if (customization !== undefined) mediaKit.customization = { ...mediaKit.customization, ...customization };
      if (isPublished !== undefined) mediaKit.isPublished = isPublished;

      await mediaKit.save();
      res.json(mediaKit);
    } catch (error) {
      console.error('Error updating media kit:', error);
      res.status(500).json({ error: 'Failed to update media kit' });
    }
  },

  /**
   * Delete a media kit
   */
  async deleteMediaKit(req, res) {
    try {
      const result = await MediaKit.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!result) {
        return res.status(404).json({ error: 'Media kit not found' });
      }

      res.json({ message: 'Media kit deleted successfully' });
    } catch (error) {
      console.error('Error deleting media kit:', error);
      res.status(500).json({ error: 'Failed to delete media kit' });
    }
  },

  /**
   * Fetch platform stats for media kit
   */
  async fetchStats(req, res) {
    try {
      const stats = await mediaKitService.fetchAllStats(req.user._id);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  },

  /**
   * Update stats in media kit
   */
  async updateStats(req, res) {
    try {
      const { platforms } = req.body;

      const mediaKit = await MediaKit.findOne({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!mediaKit) {
        return res.status(404).json({ error: 'Media kit not found' });
      }

      // Update stats section
      mediaKit.sections.stats.platforms = platforms.map(p => ({
        name: p.name,
        followers: p.followers,
        engagementRate: p.engagementRate,
        avgLikes: p.avgLikes,
        avgComments: p.avgComments,
        avgViews: p.avgViews,
        username: p.username
      }));

      // Calculate totals
      mediaKit.sections.stats.totalReach = platforms.reduce((sum, p) => sum + (p.followers || 0), 0);
      mediaKit.sections.stats.avgEngagement = (
        platforms.reduce((sum, p) => sum + parseFloat(p.engagementRate || 0), 0) / platforms.length
      ).toFixed(2);

      await mediaKit.save();
      res.json(mediaKit);
    } catch (error) {
      console.error('Error updating stats:', error);
      res.status(500).json({ error: 'Failed to update stats' });
    }
  },

  /**
   * Export media kit as HTML
   */
  async exportHTML(req, res) {
    try {
      const mediaKit = await MediaKit.findOne({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!mediaKit) {
        return res.status(404).json({ error: 'Media kit not found' });
      }

      const html = mediaKitService.generateHTML(mediaKit);

      // Track download
      mediaKit.analytics.downloads = (mediaKit.analytics.downloads || 0) + 1;
      await mediaKit.save();

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${mediaKit.slug}.html"`);
      res.send(html);
    } catch (error) {
      console.error('Error exporting media kit:', error);
      res.status(500).json({ error: 'Failed to export media kit' });
    }
  },

  /**
   * Get preview HTML (for iframe display)
   */
  async getPreview(req, res) {
    try {
      const mediaKit = await MediaKit.findOne({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!mediaKit) {
        return res.status(404).json({ error: 'Media kit not found' });
      }

      const html = mediaKitService.generateHTML(mediaKit);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Error generating preview:', error);
      res.status(500).json({ error: 'Failed to generate preview' });
    }
  },

  /**
   * Get public media kit page
   */
  async getPublicMediaKit(req, res) {
    try {
      const mediaKit = await MediaKit.findOne({
        slug: req.params.slug,
        isPublished: true
      });

      if (!mediaKit) {
        return res.status(404).json({ error: 'Media kit not found' });
      }

      // Track view
      mediaKit.analytics.totalViews = (mediaKit.analytics.totalViews || 0) + 1;
      mediaKit.analytics.lastViewed = new Date();
      await mediaKit.save();

      const html = mediaKitService.generateHTML(mediaKit);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Error fetching public media kit:', error);
      res.status(500).json({ error: 'Failed to fetch media kit' });
    }
  },

  /**
   * Get available templates
   */
  async getTemplates(req, res) {
    try {
      const templates = mediaKitService.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  },

  /**
   * Add portfolio item
   */
  async addPortfolioItem(req, res) {
    try {
      const { title, imageUrl, brandName, description, metrics } = req.body;

      const mediaKit = await MediaKit.findOne({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!mediaKit) {
        return res.status(404).json({ error: 'Media kit not found' });
      }

      const newItem = {
        id: `portfolio-${Date.now()}`,
        title,
        imageUrl,
        brandName,
        description,
        metrics
      };

      if (!mediaKit.sections.portfolio.items) {
        mediaKit.sections.portfolio.items = [];
      }
      mediaKit.sections.portfolio.items.push(newItem);

      await mediaKit.save();
      res.json(mediaKit);
    } catch (error) {
      console.error('Error adding portfolio item:', error);
      res.status(500).json({ error: 'Failed to add portfolio item' });
    }
  },

  /**
   * Remove portfolio item
   */
  async removePortfolioItem(req, res) {
    try {
      const mediaKit = await MediaKit.findOne({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!mediaKit) {
        return res.status(404).json({ error: 'Media kit not found' });
      }

      mediaKit.sections.portfolio.items = mediaKit.sections.portfolio.items.filter(
        item => item.id !== req.params.itemId
      );

      await mediaKit.save();
      res.json(mediaKit);
    } catch (error) {
      console.error('Error removing portfolio item:', error);
      res.status(500).json({ error: 'Failed to remove portfolio item' });
    }
  },

  /**
   * Add service item
   */
  async addServiceItem(req, res) {
    try {
      const { name, description, price, deliverables } = req.body;

      const mediaKit = await MediaKit.findOne({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!mediaKit) {
        return res.status(404).json({ error: 'Media kit not found' });
      }

      const newItem = {
        id: `service-${Date.now()}`,
        name,
        description,
        price,
        deliverables
      };

      if (!mediaKit.sections.services.items) {
        mediaKit.sections.services.items = [];
      }
      mediaKit.sections.services.items.push(newItem);

      await mediaKit.save();
      res.json(mediaKit);
    } catch (error) {
      console.error('Error adding service item:', error);
      res.status(500).json({ error: 'Failed to add service item' });
    }
  },

  /**
   * Remove service item
   */
  async removeServiceItem(req, res) {
    try {
      const mediaKit = await MediaKit.findOne({
        _id: req.params.id,
        userId: req.user._id
      });

      if (!mediaKit) {
        return res.status(404).json({ error: 'Media kit not found' });
      }

      mediaKit.sections.services.items = mediaKit.sections.services.items.filter(
        item => item.id !== req.params.itemId
      );

      await mediaKit.save();
      res.json(mediaKit);
    } catch (error) {
      console.error('Error removing service item:', error);
      res.status(500).json({ error: 'Failed to remove service item' });
    }
  }
};

module.exports = mediaKitController;
