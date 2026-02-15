/**
 * Twin OS API Routes
 * Cross-modal identity context from Starforge ecosystem
 * Combines Visual DNA (Clarosa) + Audio DNA for content creation
 */

const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const twinOsService = require('../services/twinOsService');

/**
 * GET /api/twin-os/context
 * Get full Twin OS context for the current user
 */
router.get('/context', auth, async (req, res) => {
  try {
    const userId = req.query.userId || req.userId || 'default';
    const context = await twinOsService.getTwinContext(userId);

    res.json(context);
  } catch (error) {
    console.error('[TwinOS] Context error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Twin OS context'
    });
  }
});

/**
 * GET /api/twin-os/ai-context
 * Get AI-ready context for content generation
 */
router.get('/ai-context', auth, async (req, res) => {
  try {
    const userId = req.query.userId || req.userId || 'default';
    const context = await twinOsService.getTwinContext(userId);
    const aiContext = twinOsService.buildAiContext(context);

    res.json({
      success: true,
      source: context.source,
      aiContext
    });
  } catch (error) {
    console.error('[TwinOS] AI context error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to build AI context'
    });
  }
});

/**
 * GET /api/twin-os/coherence
 * Check cross-modal coherence status
 */
router.get('/coherence', auth, async (req, res) => {
  try {
    const userId = req.query.userId || req.userId || 'default';
    const context = await twinOsService.getTwinContext(userId);
    const coherence = twinOsService.checkCoherence(context);

    res.json({
      success: true,
      ...coherence,
      archetype: context.twin_os?.archetype
    });
  } catch (error) {
    console.error('[TwinOS] Coherence error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check coherence'
    });
  }
});

/**
 * POST /api/twin-os/sync-visual
 * Trigger a fresh Visual DNA sync from Clarosa
 */
router.post('/sync-visual', auth, async (req, res) => {
  try {
    const userId = req.body.userId || req.userId || 'default';
    const result = await twinOsService.syncVisualDna(userId);

    res.json(result);
  } catch (error) {
    console.error('[TwinOS] Sync visual error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync Visual DNA'
    });
  }
});

/**
 * GET /api/twin-os/brand-guidance
 * Get content creation guidance based on Twin OS
 */
router.get('/brand-guidance', auth, async (req, res) => {
  try {
    const userId = req.query.userId || req.userId || 'default';
    const context = await twinOsService.getTwinContext(userId);

    const guidance = {
      success: true,
      source: context.source,
      archetype: context.twin_os?.archetype,
      brandKeywords: context.twin_os?.brand_keywords || [],
      contentGuidance: context.content_guidance,
      visualDna: context.twin_os?.visual_dna ? {
        themes: context.twin_os.visual_dna.themes,
        warmth: context.twin_os.visual_dna.warmth,
        energy: context.twin_os.visual_dna.energy,
        confidence: context.twin_os.visual_dna.confidence
      } : null,
      audioDna: context.twin_os?.audio_dna ? {
        genre: context.twin_os.audio_dna.primary_genre,
        tasteCoherence: context.twin_os.audio_dna.taste_coherence
      } : null
    };

    res.json(guidance);
  } catch (error) {
    console.error('[TwinOS] Brand guidance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get brand guidance'
    });
  }
});

/**
 * GET /api/twin-os/caption-prompt
 * Get AI system prompt for caption generation
 */
router.get('/caption-prompt', auth, async (req, res) => {
  try {
    const userId = req.query.userId || req.userId || 'default';
    const context = await twinOsService.getTwinContext(userId);
    const aiContext = twinOsService.buildAiContext(context);

    res.json({
      success: true,
      systemPrompt: aiContext.systemPrompt,
      avoid: aiContext.brand.avoid,
      captionVoice: aiContext.brand.captionVoice,
      archetype: aiContext.brand.archetype
    });
  } catch (error) {
    console.error('[TwinOS] Caption prompt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to build caption prompt'
    });
  }
});

/**
 * GET /api/twin-os/health
 * Health check for Twin OS integration
 */
router.get('/health', async (req, res) => {
  try {
    // Quick check if Starforge is reachable
    const context = await twinOsService.getTwinContext('health-check');

    res.json({
      success: true,
      status: 'healthy',
      starforgeConnected: context.source === 'starforge',
      source: context.source
    });
  } catch (error) {
    res.json({
      success: true,
      status: 'degraded',
      starforgeConnected: false,
      error: error.message
    });
  }
});

/**
 * GET /api/twin-os/ecosystem/context/:userId
 * Ecosystem-level endpoint for internal app communication
 * Uses X-Ecosystem-Secret instead of user auth
 */
const ECOSYSTEM_API_SECRET = process.env.ECOSYSTEM_API_SECRET || 'dev-secret-change-in-production';

router.get('/ecosystem/context/:userId', async (req, res) => {
  try {
    const secret = req.headers['x-ecosystem-secret'];
    const isDev = process.env.NODE_ENV !== 'production';

    if (secret !== ECOSYSTEM_API_SECRET && !isDev) {
      return res.status(401).json({
        success: false,
        error: 'Invalid ecosystem secret'
      });
    }

    const { userId } = req.params;
    const context = await twinOsService.getTwinContext(userId);
    const aiContext = twinOsService.buildAiContext(context);

    res.json({
      success: true,
      source: context.source,
      twin_os: context.twin_os,
      content_guidance: context.content_guidance,
      ai_context: {
        systemPrompt: aiContext.systemPrompt,
        brand: aiContext.brand,
        coherence: aiContext.coherence
      }
    });
  } catch (error) {
    console.error('[TwinOS] Ecosystem context error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Twin OS context'
    });
  }
});

module.exports = router;
