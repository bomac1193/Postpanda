#!/usr/bin/env node
/**
 * Comprehensive Stress Test: YouTube Planner + Scheduler + Rollout
 *
 * Tests:
 * 1. YouTube Collections CRUD
 * 2. YouTube Videos CRUD
 * 3. Rollout CRUD
 * 4. Scheduling Service
 * 5. Integration between systems
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Content = require('../models/Content');
const Collection = require('../models/Collection');
const YoutubeCollection = require('../models/YoutubeCollection');
const YoutubeVideo = require('../models/YoutubeVideo');
const Rollout = require('../models/Rollout');
const schedulingService = require('../services/schedulingService');
require('dotenv').config();

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function section(title) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(70)}${colors.reset}\n`);
}

let testUser;
let testYoutubeCollection;
let testYoutubeVideo;
let testRollout;
let testContent;
let testScheduledCollection;

async function setup() {
  section('🚀 SETUP');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/postpilot');
    log('✅', 'Connected to MongoDB', colors.green);

    // Create test user
    testUser = await User.findOne({ email: 'test@stress.com' });
    if (!testUser) {
      testUser = new User({
        email: 'test@stress.com',
        password: 'test123',
        name: 'Test User',
        tasteGenome: {
          archetype: {
            primary: { designation: 'KETH', confidence: 0.85 },
            secondary: { designation: 'VAULT', confidence: 0.65 }
          }
        },
        socialMedia: {
          instagram: {
            accessToken: 'test_token_instagram',
            refreshToken: 'test_refresh_instagram',
            tokenExpiry: new Date(Date.now() + 3600000),
            userId: 'test_ig_user',
            username: 'test_user_ig'
          },
          tiktok: {
            accessToken: 'test_token_tiktok',
            refreshToken: 'test_refresh_tiktok',
            tokenExpiry: new Date(Date.now() + 3600000),
            userId: 'test_tt_user',
            username: 'test_user_tt'
          }
        }
      });
      await testUser.save();
    }
    log('✅', `Test user ready: ${testUser.email}`, colors.green);

    // Create test content for scheduling
    testContent = new Content({
      userId: testUser._id,
      title: 'Test Scheduled Content',
      caption: 'This is a test scheduled post',
      mediaUrl: 'https://example.com/test-video.mp4',
      mediaType: 'video',
      platform: 'instagram',
      status: 'draft',
      conviction: {
        score: 85,
        tier: 'high',
        gatingStatus: 'approved'
      },
      aiScores: {
        convictionScore: 85,
        tasteAlignment: 90,
        viralityScore: 80
      }
    });
    await testContent.save();
    log('✅', `Test content created: ${testContent.title}`, colors.green);

  } catch (error) {
    log('❌', `Setup failed: ${error.message}`, colors.red);
    throw error;
  }
}

// ============================================================================
// YOUTUBE PLANNER TESTS
// ============================================================================

async function testYoutubeCollections() {
  section('📺 YOUTUBE COLLECTIONS');

  try {
    // Create collection
    testYoutubeCollection = new YoutubeCollection({
      userId: testUser._id,
      name: 'Test Album Rollout',
      color: '#8b5cf6',
      tags: ['music', 'album']
    });
    await testYoutubeCollection.save();
    log('✅', `Created YouTube collection: ${testYoutubeCollection.name}`, colors.green);

    // Read collections
    const collections = await YoutubeCollection.find({ userId: testUser._id });
    log('✅', `Found ${collections.length} collection(s)`, colors.green);

    // Update collection
    testYoutubeCollection.name = 'Updated Album Rollout';
    testYoutubeCollection.tags.push('featured');
    await testYoutubeCollection.save();
    log('✅', `Updated collection name and tags`, colors.green);

    // Create second collection for testing
    const collection2 = new YoutubeCollection({
      userId: testUser._id,
      name: 'Behind the Scenes',
      color: '#3b82f6',
      tags: ['bts', 'vlog']
    });
    await collection2.save();
    log('✅', `Created second collection: ${collection2.name}`, colors.green);

    return true;
  } catch (error) {
    log('❌', `YouTube Collections test failed: ${error.message}`, colors.red);
    return false;
  }
}

async function testYoutubeVideos() {
  section('🎬 YOUTUBE VIDEOS');

  try {
    // Create video
    testYoutubeVideo = new YoutubeVideo({
      userId: testUser._id,
      collectionId: testYoutubeCollection._id,
      title: 'Album Teaser #1',
      description: 'First teaser for upcoming album',
      thumbnail: 'https://i.imgur.com/test.jpg',
      status: 'draft',
      position: 0,
      tags: ['teaser', 'music']
    });
    await testYoutubeVideo.save();
    log('✅', `Created YouTube video: ${testYoutubeVideo.title}`, colors.green);

    // Create multiple videos in collection
    const videos = [];
    for (let i = 2; i <= 5; i++) {
      const video = new YoutubeVideo({
        userId: testUser._id,
        collectionId: testYoutubeCollection._id,
        title: `Album Teaser #${i}`,
        description: `Teaser ${i} for upcoming album`,
        status: 'draft',
        position: i - 1,
        tags: ['teaser']
      });
      await video.save();
      videos.push(video);
    }
    log('✅', `Created ${videos.length} additional videos`, colors.green);

    // Read videos
    const allVideos = await YoutubeVideo.find({
      userId: testUser._id,
      collectionId: testYoutubeCollection._id
    }).sort({ position: 1 });
    log('✅', `Found ${allVideos.length} videos in collection`, colors.green);

    // Update video
    testYoutubeVideo.status = 'scheduled';
    testYoutubeVideo.scheduledDate = new Date(Date.now() + 86400000); // Tomorrow
    await testYoutubeVideo.save();
    log('✅', `Scheduled video for: ${testYoutubeVideo.scheduledDate}`, colors.green);

    // Reorder videos (move video #5 to position 1)
    const lastVideo = videos[videos.length - 1];
    const newOrder = [lastVideo._id, testYoutubeVideo._id, ...videos.slice(0, -1).map(v => v._id)];

    for (let i = 0; i < newOrder.length; i++) {
      await YoutubeVideo.findByIdAndUpdate(newOrder[i], { position: i });
    }
    log('✅', `Reordered videos in collection`, colors.green);

    // Verify reorder
    const reorderedVideos = await YoutubeVideo.find({
      collectionId: testYoutubeCollection._id
    }).sort({ position: 1 });

    if (reorderedVideos[0]._id.toString() === lastVideo._id.toString()) {
      log('✅', `Reorder verified: ${reorderedVideos[0].title} is now first`, colors.green);
    } else {
      log('❌', `Reorder failed: unexpected order`, colors.red);
    }

    return true;
  } catch (error) {
    log('❌', `YouTube Videos test failed: ${error.message}`, colors.red);
    return false;
  }
}

// ============================================================================
// ROLLOUT PLANNER TESTS
// ============================================================================

async function testRollouts() {
  section('📋 ROLLOUT PLANNER');

  try {
    // Create rollout
    testRollout = new Rollout({
      userId: testUser._id,
      name: 'Album Launch Campaign',
      description: 'Five-phase album rollout strategy',
      status: 'draft',
      targetPlatforms: ['youtube', 'instagram', 'tiktok'],
      sections: []
    });
    await testRollout.save();
    log('✅', `Created rollout: ${testRollout.name}`, colors.green);

    // Add sections (phases)
    const phases = [
      { name: 'Tease', color: '#8b5cf6', notes: 'Cryptic hints, mood teasers' },
      { name: 'Announce', color: '#3b82f6', notes: 'Title reveal, pre-save' },
      { name: 'Drip', color: '#10b981', notes: 'Weekly singles' },
      { name: 'Drop', color: '#f97316', notes: 'Album launch day' },
      { name: 'Sustain', color: '#ec4899', notes: 'Remixes, tour promo' }
    ];

    for (const phase of phases) {
      await testRollout.addSection(phase.name, phase.color);
    }
    await testRollout.save();
    log('✅', `Added ${phases.length} phases to rollout`, colors.green);

    // Update section with YouTube collection
    const teaseSection = testRollout.sections[0];
    await testRollout.addCollectionToSection(teaseSection.id, testYoutubeCollection._id.toString());
    log('✅', `Linked YouTube collection to "Tease" phase`, colors.green);

    // Set section deadlines
    const now = new Date();
    await testRollout.updateSection(testRollout.sections[0].id, {
      startDate: new Date(now.getTime() + 86400000), // +1 day
      deadline: new Date(now.getTime() + 86400000 * 7), // +7 days
      status: 'active'
    });
    log('✅', `Set start date and deadline for first phase`, colors.green);

    // Set rollout-level dates
    testRollout.startDate = new Date(now.getTime() + 86400000);
    testRollout.endDate = new Date(now.getTime() + 86400000 * 30); // 30-day campaign
    await testRollout.save();
    log('✅', `Set overall campaign dates (30-day window)`, colors.green);

    // Reorder sections
    const sectionIds = testRollout.sections.map(s => s.id);
    const reordered = [sectionIds[4], ...sectionIds.slice(0, 4)]; // Move "Sustain" to first
    await testRollout.reorderSections(reordered);
    log('✅', `Reordered sections (moved Sustain to first)`, colors.green);

    // Find scheduled rollouts
    const scheduled = await Rollout.findScheduled(testUser._id);
    log('✅', `Found ${scheduled.length} scheduled rollout(s)`, colors.green);

    // Find rollouts in date range
    const inRange = await Rollout.findInDateRange(
      testUser._id,
      new Date(),
      new Date(now.getTime() + 86400000 * 60)
    );
    log('✅', `Found ${inRange.length} rollout(s) in next 60 days`, colors.green);

    return true;
  } catch (error) {
    log('❌', `Rollout Planner test failed: ${error.message}`, colors.red);
    console.error(error);
    return false;
  }
}

// ============================================================================
// SCHEDULING SERVICE TESTS
// ============================================================================

async function testSchedulingService() {
  section('⏰ SCHEDULING SERVICE');

  try {
    // Create a scheduled collection
    testScheduledCollection = new Collection({
      userId: testUser._id,
      name: 'Auto-Post Test Collection',
      platform: 'instagram',
      items: [{
        contentId: testContent._id,
        position: {
          row: 0,
          col: 0
        },
        order: 0,
        posted: false
      }],
      scheduling: {
        enabled: true,
        autoPost: true,
        frequency: 'daily',
        timeOfDay: '10:00'
      },
      settings: {
        isActive: true,
        convictionThreshold: 70
      },
      status: 'scheduled',
      stats: {
        nextPostAt: new Date(Date.now() + 60000) // 1 minute from now
      }
    });
    await testScheduledCollection.save();
    log('✅', `Created scheduled collection: ${testScheduledCollection.name}`, colors.green);

    // Check scheduling service status
    const status = schedulingService.getStatus();
    log('ℹ️', `Scheduling service status:`, colors.blue);
    log('  ', `  Running: ${status.running}`, colors.cyan);
    log('  ', `  Check interval: ${status.checkInterval}`, colors.cyan);

    // Start service if not running
    if (!status.running) {
      schedulingService.start();
      log('✅', `Started scheduling service`, colors.green);
    }

    // Test conviction gating
    const gatingResult = await schedulingService.checkConvictionGating(
      testContent,
      testUser,
      testScheduledCollection
    );
    log('✅', `Conviction gating check:`, colors.green);
    log('  ', `  Can post: ${gatingResult.canPost}`, colors.cyan);
    log('  ', `  Score: ${gatingResult.score}`, colors.cyan);
    log('  ', `  Requires review: ${gatingResult.requiresReview}`, colors.cyan);

    // Test pause/resume
    await schedulingService.pauseCollection(testScheduledCollection._id);
    log('✅', `Paused collection`, colors.green);

    const pausedCollection = await Collection.findById(testScheduledCollection._id);
    if (pausedCollection.status === 'paused') {
      log('✅', `Verified collection status: paused`, colors.green);
    }

    await schedulingService.resumeCollection(testScheduledCollection._id);
    log('✅', `Resumed collection`, colors.green);

    const resumedCollection = await Collection.findById(testScheduledCollection._id);
    if (resumedCollection.status === 'scheduled') {
      log('✅', `Verified collection status: scheduled`, colors.green);
    }

    return true;
  } catch (error) {
    log('❌', `Scheduling Service test failed: ${error.message}`, colors.red);
    console.error(error);
    return false;
  }
}

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

async function testIntegration() {
  section('🔗 INTEGRATION TESTS');

  try {
    // Test: Rollout → YouTube Collection → Videos
    log('ℹ️', 'Testing rollout integration...', colors.blue);

    const rollout = await Rollout.findById(testRollout._id);
    const teasePhase = rollout.sections.find(s => s.name.includes('Tease'));

    if (teasePhase && teasePhase.collectionIds.length > 0) {
      const collectionId = teasePhase.collectionIds[0];
      const collection = await YoutubeCollection.findById(collectionId);

      if (collection) {
        log('✅', `Rollout → YouTube Collection: ${collection.name}`, colors.green);

        const videos = await YoutubeVideo.find({ collectionId: collection._id });
        log('✅', `YouTube Collection → Videos: ${videos.length} video(s)`, colors.green);
      }
    }

    // Test: Scheduled collection → Content → Conviction
    log('ℹ️', 'Testing scheduling integration...', colors.blue);

    const schedCollection = await Collection.findById(testScheduledCollection._id)
      .populate('items.contentId');

    if (schedCollection && schedCollection.items[0]) {
      const content = schedCollection.items[0].contentId;
      log('✅', `Collection → Content: ${content.title}`, colors.green);
      log('✅', `Content → Conviction: ${content.conviction.score}`, colors.green);
      log('✅', `Can schedule: ${content.conviction.canSchedule}`, colors.green);
    }

    return true;
  } catch (error) {
    log('❌', `Integration test failed: ${error.message}`, colors.red);
    console.error(error);
    return false;
  }
}

// ============================================================================
// CLEANUP
// ============================================================================

async function cleanup() {
  section('🧹 CLEANUP');

  try {
    // Delete test data
    await YoutubeVideo.deleteMany({ userId: testUser._id });
    log('✅', 'Deleted test YouTube videos', colors.green);

    await YoutubeCollection.deleteMany({ userId: testUser._id });
    log('✅', 'Deleted test YouTube collections', colors.green);

    await Rollout.deleteMany({ userId: testUser._id });
    log('✅', 'Deleted test rollouts', colors.green);

    await Collection.deleteMany({ userId: testUser._id });
    log('✅', 'Deleted test collections', colors.green);

    await Content.deleteMany({ userId: testUser._id });
    log('✅', 'Deleted test content', colors.green);

    // Optionally delete test user
    // await User.deleteOne({ _id: testUser._id });
    // log('✅', 'Deleted test user', colors.green);

    // Stop scheduling service
    schedulingService.stop();
    log('✅', 'Stopped scheduling service', colors.green);

  } catch (error) {
    log('❌', `Cleanup failed: ${error.message}`, colors.red);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log(`\n${colors.bright}${colors.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                    ║');
  console.log('║          SLAYT - YOUTUBE PLANNER & SCHEDULING STRESS TEST         ║');
  console.log('║                                                                    ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  const results = {
    setup: false,
    youtubeCollections: false,
    youtubeVideos: false,
    rollouts: false,
    scheduling: false,
    integration: false
  };

  try {
    results.setup = await setup();
    results.youtubeCollections = await testYoutubeCollections();
    results.youtubeVideos = await testYoutubeVideos();
    results.rollouts = await testRollouts();
    results.scheduling = await testSchedulingService();
    results.integration = await testIntegration();

  } catch (error) {
    log('❌', `Fatal error: ${error.message}`, colors.red);
    console.error(error);
  } finally {
    await cleanup();
    await mongoose.connection.close();
    log('✅', 'Disconnected from MongoDB', colors.green);
  }

  // Summary
  section('📊 TEST RESULTS');

  const tests = Object.entries(results);
  const passed = tests.filter(([, result]) => result === true).length;
  const total = tests.length;

  tests.forEach(([name, result]) => {
    const emoji = result ? '✅' : '❌';
    const color = result ? colors.green : colors.red;
    log(emoji, `${name.padEnd(25)} ${result ? 'PASS' : 'FAIL'}`, color);
  });

  console.log('\n' + colors.bright);
  const percentage = ((passed / total) * 100).toFixed(1);
  const finalColor = percentage === '100.0' ? colors.green : percentage >= '80.0' ? colors.yellow : colors.red;

  log('📊', `Overall: ${passed}/${total} tests passed (${percentage}%)`, finalColor);
  console.log(colors.reset);

  process.exit(passed === total ? 0 : 1);
}

// Run tests
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main };
