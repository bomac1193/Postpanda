/**
 * Performance Tracker Service
 * Fetches actual performance metrics from social platforms and calculates
 * the Audience Depth Score (ADS) — a post-vanity metric derived from
 * real post-publish data.
 *
 * North star signals: save rate, share rate, follower conversion, watch depth
 * NOT likes/views.
 */

const Content = require('../models/Content');
const User = require('../models/User');
const axios = require('axios');
const { getVideoAnalyticsDeep } = require('./youtubeApiService');

// --- ADS Benchmarks & Weights ---

const ADS_WEIGHTS = {
  instagram_reel: {
    saveRate:      { weight: 0.30, benchmark: 0.05 },   // 5% saves/reach
    shareRate:     { weight: 0.25, benchmark: 0.03 },   // 3% shares/reach
    conversion:    { weight: 0.15, benchmark: 0.005 },   // 0.5% follows/reach
    watchDepth:    { weight: 0.20, benchmark: 10 },      // 10s avg watch time
    commentDepth:  { weight: 0.10, benchmark: 0.03 },   // 3% comments/reach
  },
  instagram_static: {
    saveRate:      { weight: 0.40, benchmark: 0.05 },
    shareRate:     { weight: 0.30, benchmark: 0.03 },
    conversion:    { weight: 0.15, benchmark: 0.005 },
    commentDepth:  { weight: 0.15, benchmark: 0.03 },
  },
  tiktok: {
    shareRate:     { weight: 0.65, benchmark: 0.02 },   // 2% shares/views
    commentDepth:  { weight: 0.35, benchmark: 0.02 },   // 2% comments/views
  },
  youtube: {
    watchDepth:    { weight: 0.35, benchmark: 60 },      // 60% avg view percentage
    shareRate:     { weight: 0.20, benchmark: 0.005 },   // 0.5% shares/views
    conversion:    { weight: 0.20, benchmark: 0.002 },   // 0.2% subs gained/views
    cardCTR:       { weight: 0.15, benchmark: 0.05 },    // 5% card click rate
    commentDepth:  { weight: 0.10, benchmark: 0.02 },   // 2% comments/views
  }
};

// Platform API completeness weights for composite ADS
const PLATFORM_COMPLETENESS = {
  instagram: 1.0,
  youtube: 1.0,
  tiktok: 0.7
};

/**
 * Resolve platformPostIds with fallback to platformPosts for backward compat
 */
function resolvePostIds(content) {
  const postIds = { ...(content.platformPostIds || {}) };

  // Fallback: check platformPosts for any IDs not in platformPostIds
  if (!postIds.instagram && content.platformPosts?.instagram?.postId) {
    postIds.instagram = content.platformPosts.instagram.postId;
  }
  if (!postIds.tiktok && content.platformPosts?.tiktok?.postId) {
    postIds.tiktok = content.platformPosts.tiktok.postId;
  }
  if (!postIds.youtube && content.platformPosts?.youtube?.postId) {
    postIds.youtube = content.platformPosts.youtube.postId;
  }

  return postIds;
}

/**
 * Fetch performance metrics for a posted content item
 * @param {String} contentId - Content ID
 * @returns {Object} Performance metrics with ADS
 */
async function fetchPerformanceMetrics(contentId) {
  try {
    const content = await Content.findById(contentId).populate('userId');

    if (!content) {
      throw new Error('Content not found');
    }

    const user = content.userId; // populated user doc

    // Check if content has been posted
    if (!content.publishedAt) {
      return {
        status: 'not_posted',
        message: 'Content has not been posted yet'
      };
    }

    const postIds = resolvePostIds(content);

    if (!postIds.instagram && !postIds.tiktok && !postIds.youtube) {
      return {
        status: 'not_posted',
        message: 'No platform post IDs found'
      };
    }

    const metrics = {
      contentId: content._id,
      platform: content.platform,
      postedAt: content.publishedAt,
      metrics: {},
      fetchedAt: new Date()
    };

    // Fetch from ALL platforms that have post IDs (not just primary platform)
    if (postIds.instagram) {
      metrics.metrics.instagram = await fetchInstagramMetrics(
        postIds.instagram,
        user
      );
    }

    if (postIds.tiktok) {
      metrics.metrics.tiktok = await fetchTikTokMetrics(
        postIds.tiktok,
        user
      );
    }

    if (postIds.youtube) {
      metrics.metrics.youtube = await fetchYouTubeMetrics(
        postIds.youtube,
        user
      );
    }

    // Calculate legacy engagement score (backward compat)
    metrics.engagementScore = calculateLegacyEngagementScore(metrics.metrics);

    // Calculate Audience Depth Score
    const adsResult = calculateAudienceDepthScore(metrics.metrics);
    metrics.audienceDepthScore = adsResult.score;
    metrics.audienceDepthBreakdown = adsResult.breakdown;

    // Append to fetch history (capped at 10)
    const fetchHistoryEntry = {
      fetchedAt: new Date(),
      audienceDepthScore: adsResult.score,
      rawMetrics: metrics.metrics
    };

    if (!content.performanceMetrics) {
      content.performanceMetrics = {};
    }
    if (!Array.isArray(content.performanceMetrics.fetchHistory)) {
      content.performanceMetrics.fetchHistory = [];
    }
    content.performanceMetrics.fetchHistory.push(fetchHistoryEntry);
    if (content.performanceMetrics.fetchHistory.length > 10) {
      content.performanceMetrics.fetchHistory =
        content.performanceMetrics.fetchHistory.slice(-10);
    }

    // Store metrics in content document
    content.performanceMetrics.contentId = metrics.contentId;
    content.performanceMetrics.platform = metrics.platform;
    content.performanceMetrics.postedAt = metrics.postedAt;
    content.performanceMetrics.metrics = metrics.metrics;
    content.performanceMetrics.engagementScore = metrics.engagementScore;
    content.performanceMetrics.audienceDepthScore = metrics.audienceDepthScore;
    content.performanceMetrics.audienceDepthBreakdown = metrics.audienceDepthBreakdown;
    content.performanceMetrics.fetchedAt = metrics.fetchedAt;
    content.lastMetricsFetch = new Date();
    await content.save();

    return metrics;
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    throw error;
  }
}

/**
 * Fetch Instagram metrics using Instagram Graph API v21+
 */
async function fetchInstagramMetrics(postId, user) {
  try {
    const instagramAuth = user.socialAccounts?.instagram;

    if (!instagramAuth || !instagramAuth.accessToken) {
      throw new Error('Instagram not connected');
    }

    const accessToken = instagramAuth.accessToken;

    // Basic media fields (v21+)
    const url = `https://graph.instagram.com/v21.0/${postId}`;
    const params = {
      fields: 'like_count,comments_count,timestamp,media_type,media_product_type,permalink',
      access_token: accessToken
    };

    const response = await axios.get(url, { params });
    const data = response.data;

    const isReel = data.media_product_type === 'REELS';

    // Fetch insights (requires Business/Creator account)
    let insights = null;
    try {
      const insightsUrl = `https://graph.instagram.com/v21.0/${postId}/insights`;

      // Build metric list based on media type
      let metricList = 'reach,saved,shares,follows,profile_visits,views';
      if (isReel) {
        metricList += ',ig_reels_avg_watch_time';
      }

      const insightsParams = {
        metric: metricList,
        access_token: accessToken
      };
      const insightsResponse = await axios.get(insightsUrl, { params: insightsParams });
      insights = insightsResponse.data.data;
    } catch (err) {
      console.log('[IG Insights] Could not fetch insights (may not be business account):', err.message);
    }

    const getInsight = (name) => {
      if (!insights) return null;
      const metric = insights.find(i => i.name === name);
      return metric?.values?.[0]?.value ?? null;
    };

    return {
      likes: data.like_count || 0,
      comments: data.comments_count || 0,
      views: getInsight('views'),
      reach: getInsight('reach'),
      saved: getInsight('saved'),
      shares: getInsight('shares'),
      follows: getInsight('follows'),
      profileVisits: getInsight('profile_visits'),
      reelAvgWatchTime: isReel ? getInsight('ig_reels_avg_watch_time') : null,
      isReel,
      timestamp: data.timestamp,
      url: data.permalink
    };
  } catch (error) {
    console.error('Error fetching Instagram metrics:', error.message);
    return {
      error: error.message,
      likes: 0,
      comments: 0
    };
  }
}

/**
 * Fetch TikTok metrics using TikTok API v2
 */
async function fetchTikTokMetrics(videoId, user) {
  try {
    const tiktokAuth = user.socialAccounts?.tiktok;

    if (!tiktokAuth || !tiktokAuth.accessToken) {
      throw new Error('TikTok not connected');
    }

    const url = 'https://open.tiktokapis.com/v2/video/query/';
    const params = {
      fields: 'id,create_time,cover_image_url,share_url,video_description,duration,height,width,title,like_count,comment_count,share_count,view_count'
    };

    const response = await axios.post(url, {
      filters: {
        video_ids: [videoId]
      }
    }, {
      headers: {
        'Authorization': `Bearer ${tiktokAuth.accessToken}`,
        'Content-Type': 'application/json'
      },
      params
    });

    const video = response.data.data?.videos?.[0];

    if (!video) {
      throw new Error('Video not found');
    }

    return {
      likes: video.like_count || 0,
      comments: video.comment_count || 0,
      shares: video.share_count || 0,
      views: video.view_count || 0,
      timestamp: video.create_time,
      url: video.share_url
    };
  } catch (error) {
    console.error('Error fetching TikTok metrics:', error.message);
    return {
      error: error.message,
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0
    };
  }
}

/**
 * Fetch YouTube metrics using Data API v3 + Analytics API v2
 */
async function fetchYouTubeMetrics(videoId, user) {
  try {
    const result = await getVideoAnalyticsDeep(user, videoId);

    if (!result.success) {
      throw new Error(result.error || 'YouTube analytics fetch failed');
    }

    const a = result.analytics;
    return {
      views: a.views || 0,
      likes: a.likes || 0,
      comments: a.comments || 0,
      shares: a.shares,
      avgViewDuration: a.avgViewDuration,
      avgViewPercentage: a.avgViewPercentage,
      subscribersGained: a.subscribersGained,
      subscribersLost: a.subscribersLost,
      estimatedMinutesWatched: a.estimatedMinutesWatched,
      cardClickRate: a.cardClickRate,
      timestamp: a.publishedAt,
      url: `https://www.youtube.com/watch?v=${videoId}`
    };
  } catch (error) {
    console.error('Error fetching YouTube metrics:', error.message);
    return {
      error: error.message,
      views: 0,
      likes: 0,
      comments: 0
    };
  }
}

// --- Audience Depth Score ---

/**
 * Normalize a signal value against its benchmark to a 0-100 scale
 * At benchmark = 100. Linear below, soft-cap above.
 */
function normalizeSignal(value, benchmark) {
  if (!benchmark || benchmark === 0) return 0;
  const ratio = value / benchmark;
  // Linear up to 100, then diminishing returns above
  if (ratio <= 1) return Math.round(ratio * 100);
  return Math.round(100 + (Math.log(ratio) / Math.log(2)) * 15); // soft cap
}

/**
 * Calculate Audience Depth Score for a single platform
 * Returns { score, signals } where signals is per-signal breakdown
 */
function calculatePlatformADS(platformKey, metrics) {
  const weights = ADS_WEIGHTS[platformKey];
  if (!weights) return null;

  let totalScore = 0;
  const signals = {};

  for (const [signalName, config] of Object.entries(weights)) {
    let rawValue = 0;

    if (platformKey.startsWith('instagram')) {
      const reach = metrics.reach || metrics.views || 0;
      if (reach === 0) {
        signals[signalName] = { raw: 0, normalized: 0, weight: config.weight, humanLabel: getSignalLabel(signalName) };
        continue;
      }
      switch (signalName) {
        case 'saveRate':     rawValue = (metrics.saved || 0) / reach; break;
        case 'shareRate':    rawValue = (metrics.shares || 0) / reach; break;
        case 'conversion':   rawValue = (metrics.follows || 0) / reach; break;
        case 'watchDepth':   rawValue = metrics.reelAvgWatchTime || 0; break;
        case 'commentDepth': rawValue = (metrics.comments || 0) / reach; break;
      }
    } else if (platformKey === 'tiktok') {
      const views = metrics.views || 0;
      if (views === 0) {
        signals[signalName] = { raw: 0, normalized: 0, weight: config.weight, humanLabel: getSignalLabel(signalName) };
        continue;
      }
      switch (signalName) {
        case 'shareRate':    rawValue = (metrics.shares || 0) / views; break;
        case 'commentDepth': rawValue = (metrics.comments || 0) / views; break;
      }
    } else if (platformKey === 'youtube') {
      const views = metrics.views || 0;
      if (views === 0 && signalName !== 'watchDepth') {
        signals[signalName] = { raw: 0, normalized: 0, weight: config.weight, humanLabel: getSignalLabel(signalName) };
        continue;
      }
      switch (signalName) {
        case 'watchDepth':   rawValue = metrics.avgViewPercentage || 0; break;
        case 'shareRate':    rawValue = views > 0 ? (metrics.shares || 0) / views : 0; break;
        case 'conversion':   rawValue = views > 0 ? (metrics.subscribersGained || 0) / views : 0; break;
        case 'cardCTR':      rawValue = metrics.cardClickRate || 0; break;
        case 'commentDepth': rawValue = views > 0 ? (metrics.comments || 0) / views : 0; break;
      }
    }

    const normalized = normalizeSignal(rawValue, config.benchmark);
    const capped = Math.min(130, normalized); // hard cap at 130

    signals[signalName] = {
      raw: rawValue,
      normalized: capped,
      weight: config.weight,
      humanLabel: getSignalLabel(signalName)
    };

    totalScore += capped * config.weight;
  }

  return {
    score: Math.round(Math.min(100, totalScore)),
    signals
  };
}

/**
 * Human-readable labels for ADS signals
 */
function getSignalLabel(signalName) {
  const labels = {
    saveRate: 'Save Rate',
    shareRate: 'Share Rate',
    conversion: 'Follower Conversion',
    watchDepth: 'Watch Depth',
    commentDepth: 'Comment Depth',
    cardCTR: 'Card Click Rate'
  };
  return labels[signalName] || signalName;
}

/**
 * Calculate composite Audience Depth Score across all platforms
 * Replaces calculateEngagementScore as the primary post-publish metric
 */
function calculateAudienceDepthScore(allMetrics) {
  const breakdown = { platforms: {} };
  let weightedSum = 0;
  let totalWeight = 0;

  // Instagram
  if (allMetrics.instagram && !allMetrics.instagram.error) {
    const ig = allMetrics.instagram;
    const platformKey = ig.isReel ? 'instagram_reel' : 'instagram_static';
    const result = calculatePlatformADS(platformKey, ig);
    if (result) {
      breakdown.platforms.instagram = {
        type: ig.isReel ? 'reel' : 'static',
        score: result.score,
        signals: result.signals
      };
      const w = PLATFORM_COMPLETENESS.instagram;
      weightedSum += result.score * w;
      totalWeight += w;
    }
  }

  // TikTok
  if (allMetrics.tiktok && !allMetrics.tiktok.error) {
    const result = calculatePlatformADS('tiktok', allMetrics.tiktok);
    if (result) {
      breakdown.platforms.tiktok = {
        score: result.score,
        signals: result.signals
      };
      const w = PLATFORM_COMPLETENESS.tiktok;
      weightedSum += result.score * w;
      totalWeight += w;
    }
  }

  // YouTube
  if (allMetrics.youtube && !allMetrics.youtube.error) {
    const result = calculatePlatformADS('youtube', allMetrics.youtube);
    if (result) {
      breakdown.platforms.youtube = {
        score: result.score,
        signals: result.signals
      };
      const w = PLATFORM_COMPLETENESS.youtube;
      weightedSum += result.score * w;
      totalWeight += w;
    }
  }

  const compositeScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  return {
    score: compositeScore,
    breakdown
  };
}

/**
 * Legacy engagement score (backward compat)
 * Kept as calculateLegacyEngagementScore so old code referencing engagementScore still works
 */
function calculateLegacyEngagementScore(metrics) {
  let score = 0;
  let count = 0;

  if (metrics.instagram && !metrics.instagram.error) {
    const ig = metrics.instagram;
    let igScore = 0;
    if (ig.reach) {
      const engagementRate = ((ig.likes + ig.comments * 3 + (ig.saved || 0) * 5) / ig.reach) * 100;
      igScore = Math.min(100, engagementRate * 10);
    } else {
      igScore = Math.min(100, (ig.likes * 0.5 + ig.comments * 2) / 10);
    }
    score += igScore;
    count++;
  }

  if (metrics.tiktok && !metrics.tiktok.error) {
    const tt = metrics.tiktok;
    let ttScore = 0;
    if (tt.views > 0) {
      const engagementRate = ((tt.likes + tt.comments * 3 + tt.shares * 5) / tt.views) * 100;
      ttScore = Math.min(100, engagementRate * 10);
    } else {
      ttScore = Math.min(100, (tt.likes * 0.5 + tt.comments * 2 + tt.shares * 3) / 20);
    }
    score += ttScore;
    count++;
  }

  if (metrics.youtube && !metrics.youtube.error) {
    const yt = metrics.youtube;
    let ytScore = 0;
    if (yt.views > 0) {
      const engagementRate = ((yt.likes + yt.comments * 3 + (yt.shares || 0) * 5) / yt.views) * 100;
      ytScore = Math.min(100, engagementRate * 10);
    }
    score += ytScore;
    count++;
  }

  return count > 0 ? Math.round(score / count) : 0;
}

/**
 * Batch fetch performance metrics for multiple posts
 */
async function batchFetchPerformance(contentIds) {
  const results = [];

  for (const contentId of contentIds) {
    try {
      const metrics = await fetchPerformanceMetrics(contentId);
      results.push(metrics);
    } catch (error) {
      results.push({
        contentId,
        status: 'error',
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Auto-fetch performance for recent posts (cron job)
 * Fetches metrics for posts 24h-30d old
 */
async function autoFetchRecentPerformance() {
  const now = new Date();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  try {
    const content = await Content.find({
      status: 'published',
      publishedAt: { $gte: thirtyDaysAgo, $lte: oneDayAgo },
      $or: [
        { lastMetricsFetch: { $exists: false } },
        { lastMetricsFetch: { $lt: new Date(now - 12 * 60 * 60 * 1000) } }
      ]
    }).limit(50);

    console.log(`[Performance Tracker] Auto-fetching metrics for ${content.length} posts`);

    const results = await batchFetchPerformance(content.map(c => c._id));

    return {
      processed: content.length,
      successful: results.filter(r => r.status !== 'error').length,
      failed: results.filter(r => r.status === 'error').length
    };
  } catch (error) {
    console.error('[Performance Tracker] Auto-fetch failed:', error);
    throw error;
  }
}

module.exports = {
  fetchPerformanceMetrics,
  batchFetchPerformance,
  autoFetchRecentPerformance,
  calculateAudienceDepthScore,
  calculateEngagementScore: calculateLegacyEngagementScore
};
