/**
 * Conviction Loop Service
 * Automatically processes published posts: fetches metrics and calculates
 * Audience Depth Score. Runs every 6 hours.
 *
 * Also processes published YouTube videos: fetches deep analytics
 * and stores in postPublishMetrics.
 *
 * Simplified: removed genome feedback (ADS replaces prediction validation).
 * Window expanded from 7d to 30d to capture content half-life.
 */

const Content = require('../models/Content');
const YoutubeVideo = require('../models/YoutubeVideo');
const User = require('../models/User');
const { fetchPerformanceMetrics } = require('./performanceTrackerService');
const { getVideoAnalyticsDeep } = require('./youtubeApiService');

class ConvictionLoopService {
  constructor() {
    this.isRunning = false;
    this.interval = null;
    this.checkIntervalMs = 6 * 60 * 60 * 1000; // 6 hours
  }

  /**
   * Start the conviction loop service
   */
  start() {
    if (this.isRunning) {
      console.log('[ConvictionLoop] Service already running');
      return;
    }

    console.log('[ConvictionLoop] Service started, interval: 6h');
    this.isRunning = true;

    // Run immediately
    this.runAll().catch(err => {
      console.error('[ConvictionLoop] Initial run failed:', err.message);
    });

    // Then run on interval
    this.interval = setInterval(() => {
      this.runAll().catch(err => {
        console.error('[ConvictionLoop] Interval run failed:', err.message);
      });
    }, this.checkIntervalMs);
  }

  /**
   * Stop the conviction loop service
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('[ConvictionLoop] Service stopped');
  }

  /**
   * Run both content and YouTube processing
   */
  async runAll() {
    await this.processRecentPosts();
    await this.processPublishedYoutubeVideos();
  }

  /**
   * Process recently published posts through the metrics fetch loop.
   * Finds posts published 24h-30d ago that haven't had metrics fetched in 6h+.
   */
  async processRecentPosts() {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixHoursAgo = new Date(now - 6 * 60 * 60 * 1000);

    try {
      const contents = await Content.find({
        status: 'published',
        publishedAt: { $gte: thirtyDaysAgo, $lte: oneDayAgo },
        $or: [
          { lastMetricsFetch: { $exists: false } },
          { lastMetricsFetch: null },
          { lastMetricsFetch: { $lt: sixHoursAgo } }
        ]
      }).limit(30);

      if (contents.length === 0) {
        return;
      }

      console.log(`[ConvictionLoop] Processing ${contents.length} posts`);

      let updated = 0;
      let failed = 0;

      for (const content of contents) {
        try {
          await this.processContent(content);
          updated++;
        } catch (err) {
          failed++;
          console.error(`[ConvictionLoop] Failed for ${content._id}:`, err.message);
        }
      }

      console.log(`[ConvictionLoop] Done: ${updated} updated, ${failed} failed`);
    } catch (error) {
      console.error('[ConvictionLoop] Error querying posts:', error.message);
    }
  }

  /**
   * Process a single content item: fetch metrics → ADS is calculated
   * inside fetchPerformanceMetrics → fetch history stored automatically.
   */
  async processContent(content) {
    const metrics = await fetchPerformanceMetrics(content._id);

    if (metrics.status === 'not_posted') {
      return; // Skip silently
    }

    // ADS + fetch history are stored by fetchPerformanceMetrics.
    // No further processing needed.
  }

  /**
   * Process published YouTube videos: fetch deep analytics from YouTube API
   * and store in postPublishMetrics. Only processes videos with a youtubeVideoId
   * (actually published to YouTube) within the 24h-30d window.
   */
  async processPublishedYoutubeVideos() {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixHoursAgo = new Date(now - 6 * 60 * 60 * 1000);

    try {
      const videos = await YoutubeVideo.find({
        status: 'published',
        youtubeVideoId: { $exists: true, $ne: null },
        publishedAt: { $gte: thirtyDaysAgo, $lte: oneDayAgo },
        $or: [
          { 'postPublishMetrics.lastFetchedAt': { $exists: false } },
          { 'postPublishMetrics.lastFetchedAt': null },
          { 'postPublishMetrics.lastFetchedAt': { $lt: sixHoursAgo } }
        ]
      }).limit(20);

      if (videos.length === 0) {
        return;
      }

      console.log(`[ConvictionLoop] Processing ${videos.length} YouTube videos`);

      // Group by userId to avoid re-fetching user per video
      const userCache = {};
      let updated = 0;
      let failed = 0;

      for (const video of videos) {
        try {
          const userId = video.userId.toString();
          if (!userCache[userId]) {
            userCache[userId] = await User.findById(userId);
          }
          const user = userCache[userId];

          if (!user?.socialMedia?.youtube?.refreshToken) {
            continue; // No YouTube credentials, skip
          }

          await this.processYoutubeVideo(video, user);
          updated++;
        } catch (err) {
          failed++;
          console.error(`[ConvictionLoop] YouTube failed for ${video._id}:`, err.message);
        }
      }

      if (updated > 0 || failed > 0) {
        console.log(`[ConvictionLoop] YouTube: ${updated} updated, ${failed} failed`);
      }
    } catch (error) {
      console.error('[ConvictionLoop] Error querying YouTube videos:', error.message);
    }
  }

  /**
   * Fetch deep analytics for a single YouTube video and store in postPublishMetrics
   */
  async processYoutubeVideo(video, user) {
    const result = await getVideoAnalyticsDeep(user, video.youtubeVideoId);

    if (!result.success) {
      throw new Error(result.error || 'Analytics fetch failed');
    }

    const analytics = result.analytics;
    video.postPublishMetrics = {
      views: analytics.views,
      likes: analytics.likes,
      comments: analytics.comments,
      shares: analytics.shares,
      avgViewDuration: analytics.avgViewDuration,
      avgViewPercentage: analytics.avgViewPercentage,
      subscribersGained: analytics.subscribersGained,
      estimatedMinutesWatched: analytics.estimatedMinutesWatched,
      lastFetchedAt: new Date()
    };

    await video.save();
  }
}

// Create singleton instance
const convictionLoopService = new ConvictionLoopService();

// Graceful shutdown
process.on('SIGTERM', () => {
  convictionLoopService.stop();
});

process.on('SIGINT', () => {
  convictionLoopService.stop();
});

module.exports = convictionLoopService;
