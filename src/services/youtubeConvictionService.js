/**
 * YouTube Conviction Service
 *
 * Pre-publish conviction scoring for YouTube videos.
 * Scores thumbnail quality, title hook strength, and description completeness.
 *
 * Formula: (thumbnail * 0.45) + (title * 0.35) + (description * 0.20)
 *
 * Uses same tier/gating interface as convictionService for consistency.
 */

const YoutubeVideo = require('../models/YoutubeVideo');

const CONVICTION_THRESHOLDS = {
  EXCEPTIONAL: 85,
  HIGH: 70,
  MEDIUM: 50,
  LOW: 0
};

// ─── THUMBNAIL SCORING ───────────────────────────────────────────────────────

/**
 * Score thumbnail quality (0-100)
 *
 * Signals:
 * - Has custom thumbnail (not auto/missing): +40
 * - Has original high-res URL (Cloudinary): +25
 * - Has explicit custom mode set: +15
 * - Status is 'custom': +20
 * - Missing thumbnail: 10 base
 */
function scoreThumbnail(video) {
  let score = 0;

  if (!video.thumbnail) {
    return 10; // No thumbnail at all
  }

  // Has a thumbnail of some kind
  score += 30;

  // Custom vs auto
  if (video.thumbnailMode === 'custom') {
    score += 15;
  }

  // Thumbnail status signals
  if (video.thumbnailStatus === 'custom') {
    score += 25;
  } else if (video.thumbnailStatus === 'auto') {
    score += 5;
  } else if (video.thumbnailStatus === 'needs_custom') {
    score += 0; // Flagged as needing custom
  }

  // Has high-res original (uploaded to Cloudinary)
  if (video.thumbnailOriginalUrl) {
    score += 20;
  }

  // Has a source filename (intentionally designed)
  if (video.thumbnailSourceFilename) {
    score += 10;
  }

  return Math.min(100, score);
}

// ─── TITLE SCORING ───────────────────────────────────────────────────────────

/**
 * Score title hook strength (0-100)
 *
 * Signals:
 * - Has title at all: +15
 * - Not "Untitled": +10
 * - Length 20-60 chars (optimal for YouTube search): +20
 * - Contains artist name (brand consistency): +10
 * - Contains hook patterns (numbers, questions, power words): +15
 * - Contains featuring artist(s): +10
 * - Title under 100 chars (won't be truncated): +10
 * - Has separators (-, |, :) indicating structure: +10
 */
function scoreTitle(video) {
  const title = video.title || '';
  let score = 0;

  if (!title || title.trim().length === 0) {
    return 0;
  }

  // Has a title
  score += 15;

  // Not generic placeholder
  if (!/^untitled/i.test(title.trim())) {
    score += 10;
  }

  // Optimal length (20-60 chars visible in search, max 100)
  const len = title.length;
  if (len >= 20 && len <= 60) {
    score += 20;
  } else if (len > 60 && len <= 100) {
    score += 12; // Longer but still valid
  } else if (len < 20 && len > 5) {
    score += 8; // Short but present
  }

  // Won't be truncated
  if (len <= 100) {
    score += 10;
  }

  // Contains artist name (brand consistency)
  if (video.artistName && title.toLowerCase().includes(video.artistName.toLowerCase())) {
    score += 10;
  }

  // Has featuring artists mentioned
  if (video.featuringArtists?.length > 0) {
    const hasFeatMention = /\b(feat\.?|ft\.?|featuring|with)\b/i.test(title);
    if (hasFeatMention) {
      score += 10;
    }
  }

  // Hook patterns: numbers, questions, power words
  const hasNumber = /\d/.test(title);
  const hasQuestion = /\?/.test(title);
  const hasPowerWord = /\b(official|premiere|exclusive|live|new|unreleased|remix|visual|lyric)\b/i.test(title);
  const hasStructure = /[-|:]/.test(title);

  if (hasNumber || hasQuestion || hasPowerWord) {
    score += 15;
  }

  if (hasStructure) {
    score += 10;
  }

  return Math.min(100, score);
}

// ─── DESCRIPTION SCORING ─────────────────────────────────────────────────────

/**
 * Score description completeness (0-100)
 *
 * Signals:
 * - Has description: +15
 * - Length > 50 chars (minimal): +10
 * - Length > 200 chars (good): +15
 * - Length > 500 chars (comprehensive): +10
 * - Contains links (http/https): +15
 * - Contains timestamps/chapters (00:00): +15
 * - Has tags: +10
 * - Contains social handles (@): +5
 * - Contains credits/production info: +5
 */
function scoreDescription(video) {
  const desc = video.description || '';
  let score = 0;

  if (!desc || desc.trim().length === 0) {
    // Still give partial credit if tags exist
    if (video.tags?.length > 0) {
      return 15;
    }
    return 0;
  }

  // Has description
  score += 15;

  // Length tiers
  const len = desc.length;
  if (len > 500) {
    score += 35; // All length bonuses
  } else if (len > 200) {
    score += 25;
  } else if (len > 50) {
    score += 10;
  }

  // Contains links
  if (/https?:\/\/\S+/i.test(desc)) {
    score += 15;
  }

  // Contains timestamps/chapters
  if (/\d{1,2}:\d{2}/.test(desc)) {
    score += 15;
  }

  // Has tags
  if (video.tags?.length > 0) {
    score += 10;
  }

  // Social handles
  if (/@\w+/.test(desc)) {
    score += 5;
  }

  // Credits/production mentions
  if (/\b(prod|produced|directed|mixed|mastered|recorded|written|composed|credit|engineer)\b/i.test(desc)) {
    score += 5;
  }

  return Math.min(100, score);
}

// ─── CONVICTION CALCULATION ──────────────────────────────────────────────────

/**
 * Calculate conviction score for a YouTube video
 * @param {Object} video - YoutubeVideo document
 * @returns {Object} Conviction result with scores, tier, gating
 */
function calculateConviction(video) {
  const thumbnailScore = scoreThumbnail(video);
  const titleScore = scoreTitle(video);
  const descriptionScore = scoreDescription(video);

  // Weighted combination: thumbnail is king on YouTube
  const convictionScore = Math.round(
    (thumbnailScore * 0.45) +
    (titleScore * 0.35) +
    (descriptionScore * 0.20)
  );

  const tier = getConvictionTier(convictionScore);

  return {
    conviction: {
      score: convictionScore,
      tier,
      breakdown: {
        thumbnail: thumbnailScore,
        title: titleScore,
        description: descriptionScore
      },
      calculatedAt: new Date()
    },
    aiScores: {
      thumbnailScore,
      titleScore,
      descriptionScore,
      convictionScore
    }
  };
}

/**
 * Get conviction tier from score
 */
function getConvictionTier(score) {
  if (score >= CONVICTION_THRESHOLDS.EXCEPTIONAL) return 'exceptional';
  if (score >= CONVICTION_THRESHOLDS.HIGH) return 'high';
  if (score >= CONVICTION_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}

/**
 * Check conviction gating for a YouTube video
 */
function checkGating(convictionScore, options = {}) {
  const {
    threshold = CONVICTION_THRESHOLDS.HIGH,
    strictMode = false,
    userOverride = false
  } = options;

  if (userOverride) {
    return {
      status: 'override',
      reason: 'User override active',
      score: convictionScore,
      canSchedule: true,
      requiresReview: false,
      suggestions: []
    };
  }

  let status = 'approved';
  let reason = '';
  let suggestions = [];

  if (convictionScore < CONVICTION_THRESHOLDS.MEDIUM) {
    status = strictMode ? 'blocked' : 'warning';
    reason = `Low conviction (${convictionScore}/100). Video needs work before publishing.`;
    suggestions = [
      'Add a custom thumbnail (biggest impact on CTR)',
      'Strengthen your title with a clear hook',
      'Add a description with links and chapters'
    ];
  } else if (convictionScore < threshold) {
    status = 'warning';
    reason = `Below threshold (${convictionScore}/${threshold}). Review before scheduling.`;
    suggestions = [
      'Consider improving thumbnail or title',
      'Add timestamps and links to description'
    ];
  } else if (convictionScore >= CONVICTION_THRESHOLDS.EXCEPTIONAL) {
    status = 'approved';
    reason = `High-conviction video (${convictionScore}/100). Ready for optimal release window.`;
    suggestions = [
      'Schedule during a boost window for maximum impact',
      'Consider premiering for live engagement'
    ];
  } else {
    status = 'approved';
    reason = `Good conviction (${convictionScore}/100)`;
    suggestions = [];
  }

  return {
    status,
    reason,
    score: convictionScore,
    canSchedule: status !== 'blocked',
    requiresReview: status === 'warning',
    suggestions
  };
}

/**
 * Score and save conviction for a YouTube video
 * @param {string} videoId - Video document ID
 * @returns {Object} Updated video with conviction scores
 */
async function scoreAndSave(videoId) {
  const video = await YoutubeVideo.findById(videoId);
  if (!video) throw new Error('Video not found');

  const result = calculateConviction(video);
  const gating = checkGating(result.conviction.score, {
    userOverride: video.conviction?.userOverride
  });

  video.aiScores = result.aiScores;
  video.conviction = {
    ...result.conviction,
    gatingStatus: gating.status,
    gatingReason: gating.reason,
    userOverride: video.conviction?.userOverride || false,
    overrideReason: video.conviction?.overrideReason || undefined
  };

  await video.save();

  return { video, gating };
}

/**
 * Score all videos in a collection
 * @param {string} collectionId
 * @param {string} userId
 * @returns {Object} Summary of scores
 */
async function scoreCollection(collectionId, userId) {
  const videos = await YoutubeVideo.find({ collectionId, userId });

  const results = [];
  for (const video of videos) {
    const result = calculateConviction(video);
    const gating = checkGating(result.conviction.score);

    video.aiScores = result.aiScores;
    video.conviction = {
      ...result.conviction,
      gatingStatus: gating.status,
      gatingReason: gating.reason,
      userOverride: video.conviction?.userOverride || false
    };
    await video.save();

    results.push({
      videoId: video._id,
      title: video.title,
      score: result.conviction.score,
      tier: result.conviction.tier,
      gatingStatus: gating.status
    });
  }

  const scores = results.map(r => r.score);
  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  return {
    collectionId,
    videosScored: results.length,
    avgConviction: Math.round(avg * 10) / 10,
    videos: results
  };
}

module.exports = {
  calculateConviction,
  checkGating,
  scoreAndSave,
  scoreCollection,
  scoreThumbnail,
  scoreTitle,
  scoreDescription,
  CONVICTION_THRESHOLDS
};
