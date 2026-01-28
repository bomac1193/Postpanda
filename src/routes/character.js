/**
 * Character API Routes
 * CRUD for AI characters + content generation in character voice
 */

const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Character = require('../models/Character');
const intelligenceService = require('../services/intelligenceService');

/**
 * GET /api/characters
 * List all user's characters
 */
router.get('/', auth, async (req, res) => {
  try {
    const characters = await Character.find({
      userId: req.userId,
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({ success: true, characters });
  } catch (error) {
    console.error('[Characters] List error:', error);
    res.status(500).json({ error: 'Failed to list characters' });
  }
});

/**
 * GET /api/characters/:id
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const character = await Character.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json({ success: true, character });
  } catch (error) {
    console.error('[Characters] Get error:', error);
    res.status(500).json({ error: 'Failed to get character' });
  }
});

/**
 * POST /api/characters
 * Create a new character
 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      name, aliases, avatar, bio, color,
      personaTags, toneAllowed, toneForbidden,
      systemPrompt, voice, captionStyle,
      hookPreferences, platforms
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Character name required' });
    }

    const character = new Character({
      userId: req.userId,
      name,
      aliases: aliases || [],
      avatar,
      bio: bio || '',
      color: color || '#8b5cf6',
      personaTags: personaTags || [],
      toneAllowed: toneAllowed || [],
      toneForbidden: toneForbidden || [],
      systemPrompt: systemPrompt || '',
      voice: voice || 'conversational',
      captionStyle: captionStyle || 'conversational',
      hookPreferences: hookPreferences || [],
      platforms: platforms || ['instagram']
    });

    await character.save();
    res.status(201).json({ success: true, character });
  } catch (error) {
    console.error('[Characters] Create error:', error);
    res.status(500).json({ error: 'Failed to create character' });
  }
});

/**
 * PUT /api/characters/:id
 * Update a character
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const character = await Character.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const allowedFields = [
      'name', 'aliases', 'avatar', 'avatarPosition', 'avatarZoom',
      'bio', 'color', 'personaTags', 'toneAllowed', 'toneForbidden',
      'systemPrompt', 'voice', 'captionStyle', 'hookPreferences',
      'platforms', 'isActive'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        character[field] = req.body[field];
      }
    });

    await character.save();
    res.json({ success: true, character });
  } catch (error) {
    console.error('[Characters] Update error:', error);
    res.status(500).json({ error: 'Failed to update character' });
  }
});

/**
 * DELETE /api/characters/:id
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const character = await Character.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json({ success: true, message: 'Character deleted' });
  } catch (error) {
    console.error('[Characters] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete character' });
  }
});

/**
 * POST /api/characters/:id/generate
 * Generate a caption/post in this character's voice
 */
router.post('/:id/generate', auth, async (req, res) => {
  try {
    const { topic, platform, count } = req.body;
    const character = await Character.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Build character-specific taste profile from their data
    const characterTasteProfile = {
      performancePatterns: {
        hooks: character.hookPreferences || [],
        sentiment: character.toneAllowed || [],
        structure: [],
        keywords: character.performanceData?.topKeywords || []
      },
      aestheticPatterns: {
        dominantTones: character.toneAllowed || [],
        avoidTones: character.toneForbidden || [],
        voice: character.voice || 'conversational',
        complexity: 'moderate'
      },
      voiceSignature: {
        sentencePatterns: [],
        rhetoricalDevices: [],
        vocabularyLevel: 'moderate'
      },
      // Character-specific context
      characterContext: character.buildPromptContext()
    };

    const result = await intelligenceService.generateVariants(
      topic || `content for ${character.name}`,
      characterTasteProfile,
      {
        platform: platform || character.platforms?.[0] || 'instagram',
        count: count || 5
      }
    );

    res.json({
      success: true,
      character: {
        id: character._id,
        name: character.name,
        avatar: character.avatar,
        voice: character.voice
      },
      ...result
    });
  } catch (error) {
    console.error('[Characters] Generate error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

module.exports = router;
