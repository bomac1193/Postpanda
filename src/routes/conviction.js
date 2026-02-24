/**
 * Conviction API Routes
 * BLUE OCEAN: Conviction-gated scheduling and content intelligence
 */

const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Content = require('../models/Content');
const convictionService = require('../services/convictionService');
const { fetchPerformanceMetrics } = require('../services/performanceTrackerService');

/**
 * POST /api/conviction/calculate
 * Calculate conviction score for content
 */
router.post('/calculate', auth, async (req, res) => {
  try {
    const { contentId, profileId } = req.body;

    if (!contentId) {
      return res.status(400).json({ error: 'Content ID required' });
    }

    // Get content
    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Calculate conviction
    const result = await convictionService.calculateConviction(content, null);

    // Update content with conviction scores
    Object.assign(content.aiScores, result.aiScores);
    content.conviction = result.conviction;
    await content.save();

    res.json({
      success: true,
      contentId: content._id,
      ...result
    });
  } catch (error) {
    console.error('[Conviction] Calculate error:', error);
    res.status(500).json({ error: 'Failed to calculate conviction' });
  }
});

/**
 * POST /api/conviction/check-gating
 * Check if content passes conviction gating
 */
router.post('/check-gating', auth, async (req, res) => {
  try {
    const { contentId, threshold, strictMode } = req.body;

    if (!contentId) {
      return res.status(400).json({ error: 'Content ID required' });
    }

    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Use content's method to check gating
    const gatingResult = content.checkConvictionGating(threshold, strictMode);

    res.json({
      success: true,
      contentId: content._id,
      ...gatingResult
    });
  } catch (error) {
    console.error('[Conviction] Check gating error:', error);
    res.status(500).json({ error: 'Failed to check gating' });
  }
});

/**
 * POST /api/conviction/override
 * Override conviction gating for a piece of content
 */
router.post('/override', auth, async (req, res) => {
  try {
    const { contentId, reason } = req.body;

    if (!contentId) {
      return res.status(400).json({ error: 'Content ID required' });
    }

    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Override gating
    const overrideResult = content.overrideConvictionGating(reason);
    await content.save();

    res.json({
      success: true,
      message: 'Conviction gating overridden',
      contentId: content._id,
      conviction: overrideResult
    });
  } catch (error) {
    console.error('[Conviction] Override error:', error);
    res.status(500).json({ error: 'Failed to override gating' });
  }
});

/**
 * GET /api/conviction/report/:contentId
 * Get full conviction report for content
 */
router.get('/report/:contentId', auth, async (req, res) => {
  try {
    const { contentId } = req.params;
    const { profileId } = req.query;

    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Generate full report
    const report = await convictionService.generateConvictionReport(content, null);

    res.json({
      success: true,
      contentId: content._id,
      report,
      validationResult: content.convictionValidation || null,
      contentStatus: content.status,
      wasUserOverride: content.conviction?.userOverride || false
    });
  } catch (error) {
    console.error('[Conviction] Report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * POST /api/conviction/batch-calculate
 * Calculate conviction for multiple content items
 */
router.post('/batch-calculate', auth, async (req, res) => {
  try {
    const { contentIds, profileId } = req.body;

    if (!contentIds || !Array.isArray(contentIds)) {
      return res.status(400).json({ error: 'Content IDs array required' });
    }

    // Get all content
    const contents = await Content.find({
      _id: { $in: contentIds },
      userId: req.userId
    });

    // Calculate conviction for each
    const results = await Promise.all(
      contents.map(async (content) => {
        const result = await convictionService.calculateConviction(content, null);

        // Update content
        Object.assign(content.aiScores, result.aiScores);
        content.conviction = result.conviction;
        await content.save();

        return {
          contentId: content._id,
          conviction: result.conviction,
          gating: convictionService.checkGating(result.conviction.score)
        };
      })
    );

    res.json({
      success: true,
      calculated: results.length,
      results
    });
  } catch (error) {
    console.error('[Conviction] Batch calculate error:', error);
    res.status(500).json({ error: 'Failed to batch calculate conviction' });
  }
});

/**
 * GET /api/conviction/stats
 * Get conviction statistics for user's content
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const { profileId } = req.query;

    const query = { userId: req.userId };
    if (profileId) {
      query.profileId = profileId;
    }

    // Get all content with conviction scores
    const contents = await Content.find(query).select('conviction aiScores status');

    // Calculate stats
    const stats = {
      total: contents.length,
      byTier: {
        exceptional: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      byStatus: {
        approved: 0,
        warning: 0,
        blocked: 0,
        override: 0
      },
      averageScore: 0,
      highestScore: 0,
      lowestScore: 100
    };

    let totalScore = 0;

    contents.forEach(content => {
      const score = content.conviction?.score || content.aiScores?.convictionScore || 0;
      const tier = content.conviction?.tier || 'medium';
      const status = content.conviction?.gatingStatus || 'approved';

      stats.byTier[tier]++;
      stats.byStatus[status]++;

      totalScore += score;

      if (score > stats.highestScore) stats.highestScore = score;
      if (score < stats.lowestScore) stats.lowestScore = score;
    });

    stats.averageScore = contents.length > 0 ? Math.round(totalScore / contents.length) : 0;

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('[Conviction] Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

/**
 * GET /api/conviction/thresholds
 * Get conviction thresholds configuration
 */
router.get('/thresholds', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      thresholds: convictionService.CONVICTION_THRESHOLDS,
      description: {
        exceptional: 'Auto-prioritize, suggest cross-posting',
        high: 'Approved for scheduling',
        medium: 'Warning, suggest improvements',
        low: 'Block (strict mode) or warn'
      }
    });
  } catch (error) {
    console.error('[Conviction] Thresholds error:', error);
    res.status(500).json({ error: 'Failed to get thresholds' });
  }
});

// --- Audience Depth Score endpoints ---

/**
 * GET /api/conviction/audience-depth/:contentId
 * Get ADS + breakdown for a published post
 */
router.get('/audience-depth/:contentId', auth, async (req, res) => {
  try {
    const { contentId } = req.params;

    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (content.status !== 'published') {
      return res.json({
        success: true,
        status: 'not_published',
        message: 'ADS is only available for published content'
      });
    }

    const pm = content.performanceMetrics;

    res.json({
      success: true,
      contentId: content._id,
      audienceDepthScore: pm?.audienceDepthScore ?? null,
      audienceDepthBreakdown: pm?.audienceDepthBreakdown ?? null,
      engagementScore: pm?.engagementScore ?? null,
      metrics: pm?.metrics ?? null,
      fetchedAt: pm?.fetchedAt ?? null,
      fetchHistory: pm?.fetchHistory ?? [],
      publishedAt: content.publishedAt
    });
  } catch (error) {
    console.error('[Conviction] Audience depth error:', error);
    res.status(500).json({ error: 'Failed to get audience depth score' });
  }
});

/**
 * POST /api/conviction/audience-depth/:contentId/refresh
 * Force-refresh metrics + recalculate ADS
 */
router.post('/audience-depth/:contentId/refresh', auth, async (req, res) => {
  try {
    const { contentId } = req.params;

    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (content.status !== 'published') {
      return res.status(400).json({ error: 'Content is not published' });
    }

    const metrics = await fetchPerformanceMetrics(contentId);

    if (metrics.status === 'not_posted') {
      return res.json({ success: false, message: 'No platform post IDs found' });
    }

    res.json({
      success: true,
      contentId,
      audienceDepthScore: metrics.audienceDepthScore,
      audienceDepthBreakdown: metrics.audienceDepthBreakdown,
      engagementScore: metrics.engagementScore,
      metrics: metrics.metrics,
      fetchedAt: metrics.fetchedAt
    });
  } catch (error) {
    console.error('[Conviction] ADS refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh audience depth score' });
  }
});

/**
 * GET /api/conviction/audience-depth-stats
 * Aggregate ADS stats across published posts (avg, best, worst, by-platform, trend)
 */
router.get('/audience-depth-stats', auth, async (req, res) => {
  try {
    const contents = await Content.find({
      userId: req.userId,
      status: 'published',
      'performanceMetrics.audienceDepthScore': { $exists: true, $ne: null }
    }).select('performanceMetrics.audienceDepthScore performanceMetrics.audienceDepthBreakdown performanceMetrics.fetchedAt publishedAt platform');

    if (contents.length === 0) {
      return res.json({
        success: true,
        stats: {
          total: 0,
          avg: 0,
          best: null,
          worst: null,
          byPlatform: {},
          trend: []
        }
      });
    }

    const scores = contents.map(c => ({
      id: c._id,
      score: c.performanceMetrics.audienceDepthScore,
      platform: c.platform,
      fetchedAt: c.performanceMetrics.fetchedAt,
      publishedAt: c.publishedAt
    }));

    const avg = Math.round(scores.reduce((s, c) => s + c.score, 0) / scores.length);
    const sorted = [...scores].sort((a, b) => b.score - a.score);

    // By platform
    const byPlatform = {};
    for (const s of scores) {
      if (!byPlatform[s.platform]) {
        byPlatform[s.platform] = { total: 0, sum: 0 };
      }
      byPlatform[s.platform].total++;
      byPlatform[s.platform].sum += s.score;
    }
    for (const [p, data] of Object.entries(byPlatform)) {
      byPlatform[p] = {
        count: data.total,
        avg: Math.round(data.sum / data.total)
      };
    }

    // Trend (last 10 by publish date)
    const trend = [...scores]
      .sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt))
      .slice(-10)
      .map(s => ({ score: s.score, publishedAt: s.publishedAt }));

    res.json({
      success: true,
      stats: {
        total: scores.length,
        avg,
        best: { id: sorted[0].id, score: sorted[0].score },
        worst: { id: sorted[sorted.length - 1].id, score: sorted[sorted.length - 1].score },
        byPlatform,
        trend
      }
    });
  } catch (error) {
    console.error('[Conviction] ADS stats error:', error);
    res.status(500).json({ error: 'Failed to get audience depth stats' });
  }
});

module.exports = router;
