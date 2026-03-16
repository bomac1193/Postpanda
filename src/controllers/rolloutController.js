const Rollout = require('../models/Rollout');
const { validateObjectId } = require('../utils/validators');
const twinOsService = require('../services/twinOsService');
const releaseCoordinator = require('../services/releaseCoordinatorService');

/**
 * Rollout Controllers
 */

// Create a new rollout
exports.createRollout = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Rollout name is required' });
    }

    const rollout = new Rollout({
      userId: req.user._id,
      name: name.trim(),
      description: description || '',
      status: status || 'draft',
      sections: []
    });

    await rollout.save();

    res.status(201).json({
      message: 'Rollout created successfully',
      rollout
    });
  } catch (error) {
    console.error('Create rollout error:', error);
    res.status(500).json({
      error: 'Failed to create rollout',
      details: error.message
    });
  }
};

// Get all rollouts for user
exports.getRollouts = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = { userId: req.user._id };

    if (status) {
      filter.status = status;
    }

    const rollouts = await Rollout.find(filter).sort({ updatedAt: -1 });

    res.json({
      rollouts,
      count: rollouts.length
    });
  } catch (error) {
    console.error('Get rollouts error:', error);
    res.status(500).json({ error: 'Failed to fetch rollouts' });
  }
};

// Get single rollout by ID
exports.getRollout = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid rollout ID' });
    }

    const rollout = await Rollout.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!rollout) {
      return res.status(404).json({ error: 'Rollout not found' });
    }

    res.json({ rollout });
  } catch (error) {
    console.error('Get rollout error:', error);
    res.status(500).json({ error: 'Failed to fetch rollout' });
  }
};

// Update rollout
exports.updateRollout = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid rollout ID' });
    }

    const rollout = await Rollout.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!rollout) {
      return res.status(404).json({ error: 'Rollout not found' });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'description', 'status', 'sections', 'startDate', 'endDate', 'targetPlatforms'];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        rollout[field] = updates[field];
      }
    });

    await rollout.save();

    res.json({
      message: 'Rollout updated successfully',
      rollout
    });
  } catch (error) {
    console.error('Update rollout error:', error);
    res.status(500).json({ error: 'Failed to update rollout' });
  }
};

// Delete rollout
exports.deleteRollout = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid rollout ID' });
    }

    const rollout = await Rollout.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });

    if (!rollout) {
      return res.status(404).json({ error: 'Rollout not found' });
    }

    res.json({ message: 'Rollout deleted successfully' });
  } catch (error) {
    console.error('Delete rollout error:', error);
    res.status(500).json({ error: 'Failed to delete rollout' });
  }
};

/**
 * Section Controllers
 */

// Add section to rollout
exports.addSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid rollout ID' });
    }

    const rollout = await Rollout.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!rollout) {
      return res.status(404).json({ error: 'Rollout not found' });
    }

    await rollout.addSection(name, color);

    res.json({
      message: 'Section added successfully',
      rollout
    });
  } catch (error) {
    console.error('Add section error:', error);
    res.status(500).json({ error: 'Failed to add section' });
  }
};

// Update section in rollout
exports.updateSection = async (req, res) => {
  try {
    const { id, sectionId } = req.params;
    const updates = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid rollout ID' });
    }

    const rollout = await Rollout.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!rollout) {
      return res.status(404).json({ error: 'Rollout not found' });
    }

    const section = rollout.sections.find(s => s.id === sectionId);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    await rollout.updateSection(sectionId, updates);

    res.json({
      message: 'Section updated successfully',
      rollout
    });
  } catch (error) {
    console.error('Update section error:', error);
    res.status(500).json({ error: 'Failed to update section' });
  }
};

// Delete section from rollout
exports.deleteSection = async (req, res) => {
  try {
    const { id, sectionId } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid rollout ID' });
    }

    const rollout = await Rollout.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!rollout) {
      return res.status(404).json({ error: 'Rollout not found' });
    }

    const section = rollout.sections.find(s => s.id === sectionId);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    await rollout.deleteSection(sectionId);

    res.json({
      message: 'Section deleted successfully',
      rollout
    });
  } catch (error) {
    console.error('Delete section error:', error);
    res.status(500).json({ error: 'Failed to delete section' });
  }
};

// Reorder sections in rollout
exports.reorderSections = async (req, res) => {
  try {
    const { id } = req.params;
    const { sectionIds } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid rollout ID' });
    }

    if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
      return res.status(400).json({ error: 'Section IDs array is required' });
    }

    const rollout = await Rollout.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!rollout) {
      return res.status(404).json({ error: 'Rollout not found' });
    }

    await rollout.reorderSections(sectionIds);

    res.json({
      message: 'Sections reordered successfully',
      rollout
    });
  } catch (error) {
    console.error('Reorder sections error:', error);
    res.status(500).json({ error: 'Failed to reorder sections' });
  }
};

// Add collection to section
exports.addCollectionToSection = async (req, res) => {
  try {
    const { id, sectionId } = req.params;
    const { collectionId } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid rollout ID' });
    }

    if (!collectionId) {
      return res.status(400).json({ error: 'Collection ID is required' });
    }

    const rollout = await Rollout.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!rollout) {
      return res.status(404).json({ error: 'Rollout not found' });
    }

    const section = rollout.sections.find(s => s.id === sectionId);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    await rollout.addCollectionToSection(sectionId, collectionId);

    res.json({
      message: 'Collection added to section successfully',
      rollout
    });
  } catch (error) {
    console.error('Add collection to section error:', error);
    res.status(500).json({ error: 'Failed to add collection to section' });
  }
};

// Remove collection from section
exports.removeCollectionFromSection = async (req, res) => {
  try {
    const { id, sectionId, collectionId } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid rollout ID' });
    }

    const rollout = await Rollout.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!rollout) {
      return res.status(404).json({ error: 'Rollout not found' });
    }

    const section = rollout.sections.find(s => s.id === sectionId);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    await rollout.removeCollectionFromSection(sectionId, collectionId);

    res.json({
      message: 'Collection removed from section successfully',
      rollout
    });
  } catch (error) {
    console.error('Remove collection from section error:', error);
    res.status(500).json({ error: 'Failed to remove collection from section' });
  }
};

/**
 * Scheduling Controllers
 */

// Schedule a rollout (set start/end dates and platforms)
exports.scheduleRollout = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, targetPlatforms, activate } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid rollout ID' });
    }

    const rollout = await Rollout.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!rollout) {
      return res.status(404).json({ error: 'Rollout not found' });
    }

    // Update scheduling fields
    if (startDate !== undefined) rollout.startDate = startDate;
    if (endDate !== undefined) rollout.endDate = endDate;
    if (targetPlatforms !== undefined) rollout.targetPlatforms = targetPlatforms;

    // Optionally activate the rollout
    if (activate) {
      rollout.status = 'active';
    }

    await rollout.save();

    res.json({
      message: 'Rollout scheduled successfully',
      rollout
    });
  } catch (error) {
    console.error('Schedule rollout error:', error);
    res.status(500).json({ error: 'Failed to schedule rollout' });
  }
};

// Set section deadline/dates
exports.setSectionDeadline = async (req, res) => {
  try {
    const { id, sectionId } = req.params;
    const { startDate, deadline, status } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid rollout ID' });
    }

    const rollout = await Rollout.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!rollout) {
      return res.status(404).json({ error: 'Rollout not found' });
    }

    const section = rollout.sections.find(s => s.id === sectionId);
    if (!section) {
      return res.status(404).json({ error: 'Section not found' });
    }

    // Update section scheduling
    const updates = {};
    if (startDate !== undefined) updates.startDate = startDate;
    if (deadline !== undefined) updates.deadline = deadline;
    if (status !== undefined) updates.status = status;

    await rollout.updateSection(sectionId, updates);

    res.json({
      message: 'Section deadline set successfully',
      rollout
    });
  } catch (error) {
    console.error('Set section deadline error:', error);
    res.status(500).json({ error: 'Failed to set section deadline' });
  }
};

// Get scheduled rollouts for calendar
exports.getScheduledRollouts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let rollouts;
    if (startDate && endDate) {
      rollouts = await Rollout.findInDateRange(
        req.user._id,
        new Date(startDate),
        new Date(endDate)
      );
    } else {
      rollouts = await Rollout.findScheduled(req.user._id);
    }

    // Transform to calendar events format
    const events = [];

    rollouts.forEach(rollout => {
      // Rollout start date
      if (rollout.startDate) {
        events.push({
          id: `rollout-start-${rollout._id}`,
          type: 'rollout-start',
          date: rollout.startDate,
          rolloutId: rollout._id,
          rolloutName: rollout.name,
          title: `${rollout.name} (Start)`,
          color: rollout.sections[0]?.color || '#8b5cf6'
        });
      }

      // Rollout end date (deadline)
      if (rollout.endDate) {
        events.push({
          id: `rollout-end-${rollout._id}`,
          type: 'rollout-deadline',
          date: rollout.endDate,
          rolloutId: rollout._id,
          rolloutName: rollout.name,
          title: `${rollout.name} (Deadline)`,
          color: rollout.sections[0]?.color || '#8b5cf6'
        });
      }

      // Section dates
      rollout.sections.forEach(section => {
        if (section.startDate) {
          events.push({
            id: `section-start-${section.id}`,
            type: 'section-start',
            date: section.startDate,
            rolloutId: rollout._id,
            sectionId: section.id,
            sectionName: section.name,
            rolloutName: rollout.name,
            title: `${section.name} (Start)`,
            color: section.color || '#6366f1'
          });
        }

        if (section.deadline) {
          events.push({
            id: `section-deadline-${section.id}`,
            type: 'section-deadline',
            date: section.deadline,
            rolloutId: rollout._id,
            sectionId: section.id,
            sectionName: section.name,
            rolloutName: rollout.name,
            title: `${section.name} (Deadline)`,
            color: section.color || '#6366f1'
          });
        }
      });
    });

    res.json({
      events,
      rollouts
    });
  } catch (error) {
    console.error('Get scheduled rollouts error:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled rollouts' });
  }
};

/**
 * Generate a taste-aware rollout playbook (auto, IG/TikTok-first)
 */
exports.generateAutoPlaybook = async (req, res) => {
  try {
    const { campaignName = 'Rollout', targetPlatforms = ['instagram', 'tiktok'] } = req.body || {};

    const recommendedTemplate = 'Core Blueprint: Editorial + Launch';

    const playbook = {
      name: `${campaignName} · ${recommendedTemplate}`,
      template: recommendedTemplate,
      platforms: targetPlatforms,
      steps: [
        { label: 'Define hook and promise', dueInDays: 1, channel: 'ideation' },
        { label: 'Create 3 hooks per platform', dueInDays: 2, channel: 'copy' },
        { label: 'Cut 2x vertical edits', dueInDays: 3, channel: 'video' },
        { label: 'Schedule IG/TikTok staggered', dueInDays: 4, channel: 'publish' },
        { label: 'Measure skip/hold/ROAS', dueInDays: 7, channel: 'analyze' },
      ],
    };

    res.json({ success: true, playbook });
  } catch (error) {
    console.error('Generate auto playbook error:', error);
    res.status(500).json({ error: 'Failed to generate playbook' });
  }
};

/**
 * BLUE OCEAN: Rollout Intelligence Controllers
 */

const rolloutIntelligence = require('../services/rolloutIntelligenceService');

// Get comprehensive rollout intelligence
exports.getRolloutIntelligence = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid rollout ID' });
    }

    const intelligence = await rolloutIntelligence.analyzeRollout(id, req.user._id);

    res.json({
      success: true,
      intelligence
    });
  } catch (error) {
    console.error('Get rollout intelligence error:', error);
    res.status(500).json({ error: 'Failed to analyze rollout intelligence' });
  }
};

// Get section readiness analysis
exports.getSectionReadiness = async (req, res) => {
  try {
    const { id, sectionId } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid rollout ID' });
    }

    const rollout = await Rollout.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!rollout) {
      return res.status(404).json({ error: 'Rollout not found' });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user._id);

    const readiness = await rolloutIntelligence.analyzeSectionReadiness(rollout, sectionId, user);

    res.json({
      success: true,
      readiness
    });
  } catch (error) {
    console.error('Get section readiness error:', error);
    res.status(500).json({ error: 'Failed to analyze section readiness' });
  }
};

// Get pacing recommendations (archetype-aware)
exports.getPacingRecommendations = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ error: 'Invalid rollout ID' });
    }

    const rollout = await Rollout.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!rollout) {
      return res.status(404).json({ error: 'Rollout not found' });
    }

    // Fetch release archetype for personalized pacing
    let archetypeId = null;
    try {
      const userId = req.user._id;
      const [twinContext, velocityData, subtasteGenome] = await Promise.all([
        twinOsService.getTwinContext(userId.toString()).catch(() => twinOsService.getDefaultContext(userId.toString())),
        releaseCoordinator.getContentVelocity(userId).catch(() => ({ postsPerMonth: 0 })),
        releaseCoordinator.fetchSubtasteGenome().catch(() => null),
      ]);
      const classification = releaseCoordinator.classifyReleaseArchetype(
        twinContext,
        subtasteGenome,
        velocityData.postsPerMonth
      );
      archetypeId = classification.archetypeId;
    } catch (err) {
      console.warn('Could not classify archetype for pacing, using default:', err.message);
    }

    const pacing = rolloutIntelligence.getPacingRecommendations(archetypeId, rollout);

    res.json({
      success: true,
      pacing
    });
  } catch (error) {
    console.error('Get pacing recommendations error:', error);
    res.status(500).json({ error: 'Failed to get pacing recommendations' });
  }
};

// Stan velocity prediction — removed (was archetype-dependent)
exports.getStanVelocityPrediction = async (req, res) => {
  res.status(410).json({ error: 'Stan velocity prediction has been removed' });
};

/**
 * Release Coordinator: Get Release Archetype
 * Classifies the user's release archetype from Twin OS + Subtaste + content velocity
 */
exports.getReleaseArchetype = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch Twin OS context, content velocity, and Subtaste genome in parallel
    const [twinContext, velocityData, subtasteGenome] = await Promise.all([
      twinOsService.getTwinContext(userId.toString()).catch(() => twinOsService.getDefaultContext(userId.toString())),
      releaseCoordinator.getContentVelocity(userId).catch(() => ({ postsPerMonth: 0 })),
      releaseCoordinator.fetchSubtasteGenome().catch(() => null),
    ]);

    const classification = releaseCoordinator.classifyReleaseArchetype(
      twinContext,
      subtasteGenome,
      velocityData.postsPerMonth
    );

    res.json({
      success: true,
      ...classification,
      velocity: velocityData,
    });
  } catch (error) {
    console.error('Get release archetype error:', error);
    res.status(500).json({ error: 'Failed to classify release archetype' });
  }
};

/**
 * Release Coordinator: Get Seasonal Windows
 * Returns active/upcoming/avoid seasonal windows + optimal release dates
 */
exports.getSeasonalWindows = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);

    const intelligence = releaseCoordinator.getSeasonalIntelligence(start);
    const windowsInRange = releaseCoordinator.getSeasonalWindowsForRange(start, end);

    // Get user's archetype for optimal release windows
    let optimalWindows = [];
    try {
      const userId = req.user._id;
      const [twinContext, velocityData, subtasteGenome] = await Promise.all([
        twinOsService.getTwinContext(userId.toString()).catch(() => twinOsService.getDefaultContext(userId.toString())),
        releaseCoordinator.getContentVelocity(userId).catch(() => ({ postsPerMonth: 0 })),
        releaseCoordinator.fetchSubtasteGenome().catch(() => null),
      ]);

      const classification = releaseCoordinator.classifyReleaseArchetype(
        twinContext,
        subtasteGenome,
        velocityData.postsPerMonth
      );

      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      optimalWindows = releaseCoordinator.getOptimalReleaseWindows(
        classification.archetypeId,
        start,
        daysDiff
      );
    } catch (err) {
      console.warn('Could not calculate optimal windows:', err.message);
    }

    res.json({
      success: true,
      current: intelligence,
      windowsInRange,
      optimalWindows: optimalWindows.slice(0, 10),
    });
  } catch (error) {
    console.error('Get seasonal windows error:', error);
    res.status(500).json({ error: 'Failed to get seasonal windows' });
  }
};

module.exports = exports;
