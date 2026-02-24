/**
 * Conviction Loop Service
 * Automatically processes published posts: fetches metrics and calculates
 * Audience Depth Score. Runs every 6 hours.
 *
 * Simplified: removed genome feedback (ADS replaces prediction validation).
 * Window expanded from 7d to 30d to capture content half-life.
 */

const Content = require('../models/Content');
const { fetchPerformanceMetrics } = require('./performanceTrackerService');

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
    this.processRecentPosts().catch(err => {
      console.error('[ConvictionLoop] Initial run failed:', err.message);
    });

    // Then run on interval
    this.interval = setInterval(() => {
      this.processRecentPosts().catch(err => {
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
