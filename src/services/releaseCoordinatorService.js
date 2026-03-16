/**
 * Release Coordinator Service
 *
 * Maps Twin OS identity + Subtaste genome + content velocity into personalized
 * Release Archetypes that drive pacing, timing, and strategy recommendations.
 *
 * Three responsibilities:
 * 1. Release Archetype Classification (Twin OS + Subtaste + velocity → archetype)
 * 2. Content Velocity Calculator (posts/month from Content model)
 * 3. Seasonal Intelligence (industry timing windows + optimal release dates)
 */

const Content = require('../models/Content');

const SUBTASTE_API_URL = process.env.SUBTASTE_API_URL || 'http://localhost:3000';
const SUBTASTE_API_KEY = process.env.SUBTASTE_API_KEY || '';

// ─── RELEASE ARCHETYPES ──────────────────────────────────────────────────────

const RELEASE_ARCHETYPES = {
  velocity_dropper: {
    id: 'velocity_dropper',
    label: 'Velocity Dropper',
    description: 'Fast, high-energy drops with short hype cycles. Momentum over buildup.',
    examples: ['Charli XCX', 'Playboi Carti', 'Ken Carson'],
    pacing: { minCadenceDays: 2, optimalCadenceDays: 4, maxCadenceDays: 6 },
    phases: { min: 3, optimal: 4, max: 5 },
    convictionThreshold: 65,
    phaseNames: ['Tease', 'Drop', 'Push', 'Sustain'],
    strengths: ['Capitalizes on momentum', 'Keeps audience engaged', 'Rewards fast followers'],
    risks: ['Burnout from constant output', 'Low conviction content slipping through', 'Audience fatigue'],
  },
  deep_campaigner: {
    id: 'deep_campaigner',
    label: 'Deep Campaigner',
    description: 'Meticulous, world-building rollouts with deep narrative arcs and high emotional investment.',
    examples: ['Tyler the Creator', 'Beyonce', 'Kendrick Lamar'],
    pacing: { minCadenceDays: 7, optimalCadenceDays: 10, maxCadenceDays: 14 },
    phases: { min: 5, optimal: 6, max: 7 },
    convictionThreshold: 75,
    phaseNames: ['Seed', 'Lore', 'Tease', 'Reveal', 'Drop', 'Deepen'],
    strengths: ['Deep emotional connection', 'High stan conversion', 'Cultural moment creation'],
    risks: ['Losing momentum mid-campaign', 'Over-investing in underperforming content', 'Perfectionism paralysis'],
  },
  precision_striker: {
    id: 'precision_striker',
    label: 'Precision Striker',
    description: 'Calculated, high-impact releases with minimal noise. Every piece earns its spot.',
    examples: ['Frank Ocean', 'Kendrick', 'SZA'],
    pacing: { minCadenceDays: 10, optimalCadenceDays: 14, maxCadenceDays: 21 },
    phases: { min: 3, optimal: 4, max: 5 },
    convictionThreshold: 80,
    phaseNames: ['Signal', 'Build', 'Strike', 'Echo'],
    strengths: ['Maximum impact per piece', 'High brand equity', 'Cultural scarcity value'],
    risks: ['Long gaps lose casual fans', 'Pressure on every piece to perform', 'Slow recovery from misses'],
  },
  steady_builder: {
    id: 'steady_builder',
    label: 'Steady Builder',
    description: 'Consistent, reliable cadence that builds audience trust over time. The workhorse.',
    examples: ['Drake', 'Bad Bunny', 'Central Cee'],
    pacing: { minCadenceDays: 4, optimalCadenceDays: 6, maxCadenceDays: 8 },
    phases: { min: 4, optimal: 5, max: 6 },
    convictionThreshold: 70,
    phaseNames: ['Warm', 'Build', 'Peak', 'Sustain', 'Bridge'],
    strengths: ['Predictable growth', 'Audience trust', 'Forgiving of individual misses'],
    risks: ['Can feel generic', 'Algorithm dependency', 'Lacks cultural moment potential'],
  },
  event_architect: {
    id: 'event_architect',
    label: 'Event Architect',
    description: 'Rare, high-ceremony releases that become cultural events. Absence creates anticipation.',
    examples: ['Rihanna', 'Adele', 'Frank Ocean'],
    pacing: { minCadenceDays: 14, optimalCadenceDays: 21, maxCadenceDays: 30 },
    phases: { min: 6, optimal: 7, max: 8 },
    convictionThreshold: 85,
    phaseNames: ['Silence', 'Whisper', 'Signal', 'Confirm', 'Build', 'Event', 'Aftermath'],
    strengths: ['Maximum cultural impact', 'Highest stan loyalty', 'Premium brand positioning'],
    risks: ['Audience forgets between releases', 'Enormous pressure on execution', 'Long ROI timeline'],
  },
  adaptive_surfer: {
    id: 'adaptive_surfer',
    label: 'Adaptive Surfer',
    description: 'Flexible, trend-responsive releases that ride cultural waves. Improvisation over planning.',
    examples: ['Doja Cat', 'Lil Nas X', 'Ice Spice'],
    pacing: { minCadenceDays: 2, optimalCadenceDays: 5, maxCadenceDays: 10 },
    phases: { min: 3, optimal: 4, max: 5 },
    convictionThreshold: 70,
    phaseNames: ['Read', 'Ride', 'Push', 'Pivot'],
    strengths: ['Captures trending moments', 'High virality potential', 'Audience surprise factor'],
    risks: ['Inconsistent brand identity', 'Hard to build deep fans', 'Reactive rather than proactive'],
  },
};

// ─── SUBTASTE → RELEASE ARCHETYPE MAPPINGS ───────────────────────────────────

// Maps Subtaste designations + axes to release archetype affinities
const SUBTASTE_ARCHETYPE_AFFINITIES = {
  // Designation → archetype weight boosts (adds to classification score)
  'S-0':   { deep_campaigner: 0.3, precision_striker: 0.2 },      // KETH - Visionary
  'T-1':   { deep_campaigner: 0.3, event_architect: 0.2 },        // STRATA - Architectural
  'V-2':   { precision_striker: 0.3, event_architect: 0.2 },       // OMEN - Prophetic
  'L-3':   { steady_builder: 0.3, deep_campaigner: 0.2 },         // SILT - Developmental
  'C-4':   { precision_striker: 0.3, steady_builder: 0.2 },        // CULL - Editorial
  'N-5':   { adaptive_surfer: 0.2, steady_builder: 0.2 },          // LIMN - Integrative
  'H-6':   { velocity_dropper: 0.2, steady_builder: 0.2 },         // TOLL - Advocacy
  'P-7':   { deep_campaigner: 0.2, event_architect: 0.3 },         // VAULT - Archival
  'D-8':   { adaptive_surfer: 0.3, velocity_dropper: 0.2 },        // WICK - Channelling
  'F-9':   { velocity_dropper: 0.3, precision_striker: 0.2 },      // ANVIL - Manifestation
  'R-10':  { adaptive_surfer: 0.3, velocity_dropper: 0.2 },        // SCHISM - Contrarian
  'Null':  { steady_builder: 0.2, adaptive_surfer: 0.2 },          // VOID - Receptive
};

// ─── SEASONAL WINDOWS ────────────────────────────────────────────────────────

const SEASONAL_WINDOWS = [
  // Weekly recurring
  {
    id: 'new_music_friday',
    label: 'New Music Friday',
    type: 'weekly',
    dayOfWeek: 5, // Friday
    boost: 1.3,
    category: 'music',
    description: 'Peak discovery day for music releases across all platforms',
  },

  // Annual windows
  {
    id: 'q1_fresh_start',
    label: 'New Year Fresh Start',
    type: 'annual',
    startMonth: 0, startDay: 6,
    endMonth: 1, endDay: 14,
    boost: 1.2,
    category: 'all',
    description: 'High engagement period as audiences seek new content',
  },
  {
    id: 'spring_refresh',
    label: 'Spring Refresh',
    type: 'annual',
    startMonth: 2, startDay: 15,
    endMonth: 3, endDay: 15,
    boost: 1.15,
    category: 'content',
    description: 'Audience appetite for new aesthetics and fresh starts',
  },
  {
    id: 'summer_anthem',
    label: 'Summer Anthem Window',
    type: 'annual',
    startMonth: 4, startDay: 1,
    endMonth: 5, endDay: 15,
    boost: 1.35,
    category: 'music',
    description: 'Peak window for singles targeting summer playlists and festivals',
  },
  {
    id: 'festival_season',
    label: 'Festival Season',
    type: 'annual',
    startMonth: 5, startDay: 1,
    endMonth: 8, endDay: 15,
    boost: 1.2,
    category: 'music',
    description: 'Live performance content and festival tie-in releases',
  },
  {
    id: 'back_to_school',
    label: 'Back to School',
    type: 'annual',
    startMonth: 7, startDay: 15,
    endMonth: 8, endDay: 30,
    boost: 1.15,
    category: 'content',
    description: 'High content consumption as routines reset',
  },
  {
    id: 'q4_award_push',
    label: 'Q4 Award Push',
    type: 'annual',
    startMonth: 8, startDay: 15,
    endMonth: 10, endDay: 15,
    boost: 1.25,
    category: 'music',
    description: 'Albums and projects positioned for year-end lists and awards',
  },
  {
    id: 'eoy_list_deadline',
    label: 'End-of-Year List Deadline',
    type: 'annual',
    startMonth: 10, startDay: 1,
    endMonth: 10, endDay: 30,
    boost: 1.2,
    category: 'music',
    description: 'Last window to land on year-end best-of lists',
  },
  {
    id: 'holiday_dead_zone',
    label: 'Holiday Dead Zone',
    type: 'annual',
    startMonth: 11, startDay: 20,
    endMonth: 0, endDay: 5,
    boost: 0.6,
    category: 'all',
    description: 'Low engagement — audience attention on holidays, not discovery',
  },
  {
    id: 'dump_month_jan',
    label: 'January Dump Window',
    type: 'annual',
    startMonth: 0, startDay: 1,
    endMonth: 0, endDay: 5,
    boost: 0.7,
    category: 'music',
    description: 'Major labels avoid this window — opportunity for indie releases',
  },
];

// ─── CLASSIFICATION ──────────────────────────────────────────────────────────

/**
 * Classify release archetype from Twin OS signals + Subtaste genome + content velocity
 *
 * @param {Object} twinContext - Twin OS context from Starforge (or fallback)
 * @param {Object|null} subtasteGenome - Subtaste genome (optional enrichment)
 * @param {number} contentVelocity - Posts per month average
 * @returns {Object} Classification result with archetype, runner-up, confidence, signals
 */
function classifyReleaseArchetype(twinContext, subtasteGenome, contentVelocity) {
  const twinOs = twinContext?.twin_os || {};
  const isFallback = twinContext?.source === 'fallback';

  // Extract signals from Twin OS
  const energy = twinOs.visual_dna?.energy ?? 0.5;
  const warmth = twinOs.visual_dna?.warmth ?? 0.5;
  const coherence = twinOs.cross_modal_coherence ?? null;
  const velocity = contentVelocity || 0;

  // Normalize velocity to 0-1 (0 posts = 0, 20+ posts/month = 1)
  const normalizedVelocity = Math.min(1, velocity / 20);

  const signals = {
    energy,
    warmth,
    coherence: coherence ?? 0.5,
    velocity: normalizedVelocity,
    postsPerMonth: velocity,
    twinOsConnected: !isFallback,
    subtasteConnected: !!subtasteGenome,
  };

  // Score each archetype
  const scores = {};

  // Velocity Dropper: high energy + high velocity
  scores.velocity_dropper =
    (energy * 0.35) +
    (normalizedVelocity * 0.35) +
    ((1 - warmth) * 0.15) +
    ((1 - (coherence ?? 0.5)) * 0.15);

  // Deep Campaigner: low energy + high warmth + high coherence
  scores.deep_campaigner =
    ((1 - energy) * 0.25) +
    (warmth * 0.30) +
    ((coherence ?? 0.5) * 0.30) +
    ((1 - normalizedVelocity) * 0.15);

  // Precision Striker: high energy + low warmth + high coherence
  scores.precision_striker =
    (energy * 0.25) +
    ((1 - warmth) * 0.25) +
    ((coherence ?? 0.5) * 0.30) +
    ((1 - normalizedVelocity) * 0.20);

  // Steady Builder: medium everything
  const medianPenalty = (v) => 1 - Math.abs(v - 0.5) * 2; // peaks at 0.5
  scores.steady_builder =
    (medianPenalty(energy) * 0.30) +
    (medianPenalty(normalizedVelocity) * 0.30) +
    (medianPenalty(warmth) * 0.20) +
    ((coherence ?? 0.5) * 0.20);

  // Event Architect: low energy + low warmth + high coherence
  scores.event_architect =
    ((1 - energy) * 0.25) +
    ((1 - warmth) * 0.20) +
    ((coherence ?? 0.5) * 0.30) +
    ((1 - normalizedVelocity) * 0.25);

  // Adaptive Surfer: mixed signals + low coherence
  scores.adaptive_surfer =
    (Math.abs(energy - 0.5) * 0.20) +
    (normalizedVelocity * 0.25) +
    ((1 - (coherence ?? 0.5)) * 0.35) +
    (Math.abs(warmth - 0.5) * 0.20);

  // Apply Subtaste enrichment if available
  if (subtasteGenome) {
    const designation = subtasteGenome.primary?.designation;
    const affinities = SUBTASTE_ARCHETYPE_AFFINITIES[designation];
    if (affinities) {
      for (const [archetypeId, boost] of Object.entries(affinities)) {
        if (scores[archetypeId] !== undefined) {
          scores[archetypeId] += boost * (subtasteGenome.primary?.confidence || 0.5);
        }
      }
    }

    // Use orderChaos axis: high order → campaigner/event, high chaos → velocity/adaptive
    const orderChaos = subtasteGenome.axes?.orderChaos;
    if (orderChaos !== undefined) {
      if (orderChaos > 0.6) {
        scores.deep_campaigner += 0.1;
        scores.event_architect += 0.1;
      } else if (orderChaos < 0.4) {
        scores.velocity_dropper += 0.1;
        scores.adaptive_surfer += 0.1;
      }
    }

    signals.subtasteDesignation = designation;
    signals.subtasteGlyph = subtasteGenome.primary?.name;
    signals.subtasteOrderChaos = orderChaos;
  }

  // Sort by score
  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);

  const [primaryId, primaryScore] = sorted[0];
  const [runnerUpId, runnerUpScore] = sorted[1];

  // Confidence: how much the primary stands out from the runner-up
  const totalScore = sorted.reduce((sum, [, s]) => sum + s, 0);
  const spread = primaryScore - runnerUpScore;
  let confidence = Math.min(1, spread / (totalScore / sorted.length) * 0.8);

  // Reduce confidence when Twin OS is fallback
  if (isFallback) {
    confidence *= 0.4;
  }

  // Reduce confidence when no Subtaste
  if (!subtasteGenome) {
    confidence *= 0.8;
  }

  const primary = RELEASE_ARCHETYPES[primaryId];
  const runnerUp = RELEASE_ARCHETYPES[runnerUpId];

  return {
    archetype: primary,
    archetypeId: primaryId,
    confidence: Math.round(confidence * 100) / 100,
    runnerUp: {
      archetype: runnerUp,
      archetypeId: runnerUpId,
      score: Math.round(runnerUpScore * 100) / 100,
    },
    signals,
    scores: Object.fromEntries(sorted.map(([id, s]) => [id, Math.round(s * 100) / 100])),
    recommendation: primary.description,
  };
}

// ─── CONTENT VELOCITY ────────────────────────────────────────────────────────

/**
 * Calculate content velocity (posts per month) for a user
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Object} Velocity metrics
 */
async function getContentVelocity(userId) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);

  const [count30, count60, count90] = await Promise.all([
    Content.countDocuments({ userId, createdAt: { $gte: thirtyDaysAgo } }),
    Content.countDocuments({ userId, createdAt: { $gte: sixtyDaysAgo } }),
    Content.countDocuments({ userId, createdAt: { $gte: ninetyDaysAgo } }),
  ]);

  // Weighted average favoring recent activity
  const postsPerMonth = count90 > 0
    ? (count30 * 0.5 + (count60 / 2) * 0.3 + (count90 / 3) * 0.2)
    : 0;

  return {
    postsPerMonth: Math.round(postsPerMonth * 10) / 10,
    last30Days: count30,
    last60Days: count60,
    last90Days: count90,
  };
}

// ─── SUBTASTE API ────────────────────────────────────────────────────────────

/**
 * Fetch Subtaste genome for the current user
 * @returns {Object|null} Subtaste genome or null if unavailable
 */
async function fetchSubtasteGenome() {
  if (!SUBTASTE_API_KEY) {
    return null;
  }

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${SUBTASTE_API_URL}/api/external/genome`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUBTASTE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn('[ReleaseCoordinator] Subtaste API returned', response.status);
      return null;
    }

    const data = await response.json();
    if (!data.success || !data.genome) {
      return null;
    }

    return data.genome;
  } catch (error) {
    console.warn('[ReleaseCoordinator] Subtaste unavailable:', error.message);
    return null;
  }
}

// ─── SEASONAL INTELLIGENCE ───────────────────────────────────────────────────

/**
 * Get seasonal intelligence for a given date
 * @param {Date} date - The date to analyze
 * @returns {Object} Active, upcoming, and avoid windows
 */
function getSeasonalIntelligence(date = new Date()) {
  const d = new Date(date);
  const month = d.getMonth();
  const day = d.getDate();
  const dayOfWeek = d.getDay();

  const active = [];
  const upcoming = [];
  const avoid = [];

  for (const window of SEASONAL_WINDOWS) {
    if (window.type === 'weekly') {
      if (dayOfWeek === window.dayOfWeek) {
        active.push({ ...window, status: 'active' });
      } else {
        // Calculate days until next occurrence
        const daysUntil = ((window.dayOfWeek - dayOfWeek + 7) % 7) || 7;
        if (daysUntil <= 3) {
          const nextDate = new Date(d);
          nextDate.setDate(d.getDate() + daysUntil);
          upcoming.push({ ...window, status: 'upcoming', daysUntil, nextDate: nextDate.toISOString() });
        }
      }
      continue;
    }

    // Annual windows
    if (window.type === 'annual') {
      const isActive = isDateInWindow(month, day, window);
      if (isActive) {
        if (window.boost < 1) {
          avoid.push({ ...window, status: 'avoid' });
        } else {
          active.push({ ...window, status: 'active' });
        }
      } else {
        // Check if upcoming (within 30 days)
        const daysUntilStart = daysUntilWindowStart(d, window);
        if (daysUntilStart > 0 && daysUntilStart <= 30) {
          if (window.boost < 1) {
            avoid.push({ ...window, status: 'upcoming_avoid', daysUntil: daysUntilStart });
          } else {
            upcoming.push({ ...window, status: 'upcoming', daysUntil: daysUntilStart });
          }
        }
      }
    }
  }

  return { active, upcoming, avoid, date: d.toISOString() };
}

/**
 * Check if a month/day falls within a seasonal window (handles year-wrapping)
 */
function isDateInWindow(month, day, window) {
  const { startMonth, startDay, endMonth, endDay } = window;
  const dateVal = month * 100 + day;
  const startVal = startMonth * 100 + startDay;
  const endVal = endMonth * 100 + endDay;

  if (startVal <= endVal) {
    return dateVal >= startVal && dateVal <= endVal;
  }
  // Wraps around year end (e.g., Dec 20 → Jan 5)
  return dateVal >= startVal || dateVal <= endVal;
}

/**
 * Calculate days until a seasonal window starts
 */
function daysUntilWindowStart(date, window) {
  const year = date.getFullYear();
  let startDate = new Date(year, window.startMonth, window.startDay);

  // If start date is in the past, try next year
  if (startDate < date) {
    startDate = new Date(year + 1, window.startMonth, window.startDay);
  }

  return Math.ceil((startDate - date) / (1000 * 60 * 60 * 24));
}

/**
 * Get optimal release windows for an archetype within a date range
 * @param {string} archetypeId - Release archetype ID
 * @param {Date} startDate - Start of window
 * @param {number} windowDays - How many days to look ahead (default 90)
 * @returns {Array} Recommended release dates with scores
 */
function getOptimalReleaseWindows(archetypeId, startDate = new Date(), windowDays = 90) {
  const archetype = RELEASE_ARCHETYPES[archetypeId] || RELEASE_ARCHETYPES.steady_builder;
  const cadence = archetype.pacing.optimalCadenceDays;
  const recommendations = [];
  const start = new Date(startDate);

  for (let dayOffset = 0; dayOffset < windowDays; dayOffset += cadence) {
    const date = new Date(start);
    date.setDate(start.getDate() + dayOffset);

    const intelligence = getSeasonalIntelligence(date);
    let score = 1.0;
    const activeWindows = [];

    // Apply boost from active windows
    for (const w of intelligence.active) {
      score *= w.boost;
      activeWindows.push(w.label);
    }

    // Penalize avoid windows
    for (const w of intelligence.avoid) {
      score *= w.boost;
      activeWindows.push(`${w.label} (avoid)`);
    }

    // Slight boost for Fridays (New Music Friday)
    if (date.getDay() === 5) {
      score *= 1.05;
    }

    recommendations.push({
      date: date.toISOString().split('T')[0],
      dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
      score: Math.round(score * 100) / 100,
      activeWindows,
      recommended: score >= 1.0,
    });
  }

  return recommendations.sort((a, b) => b.score - a.score);
}

/**
 * Get all seasonal windows active within a date range (for calendar overlay)
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 * @returns {Array} Windows with their date ranges
 */
function getSeasonalWindowsForRange(rangeStart, rangeEnd) {
  const start = new Date(rangeStart);
  const end = new Date(rangeEnd);
  const results = [];

  for (const window of SEASONAL_WINDOWS) {
    if (window.type === 'weekly') {
      // Generate all occurrences of this weekly event in the range
      const current = new Date(start);
      while (current <= end) {
        if (current.getDay() === window.dayOfWeek) {
          results.push({
            ...window,
            date: current.toISOString().split('T')[0],
            isAvoid: window.boost < 1,
          });
        }
        current.setDate(current.getDate() + 1);
      }
    } else if (window.type === 'annual') {
      // Check if this annual window overlaps with the range
      const year = start.getFullYear();
      for (let y = year; y <= end.getFullYear(); y++) {
        const wStart = new Date(y, window.startMonth, window.startDay);
        let wEnd = new Date(y, window.endMonth, window.endDay);

        // Handle year-wrapping
        if (window.endMonth < window.startMonth) {
          wEnd = new Date(y + 1, window.endMonth, window.endDay);
        }

        if (wStart <= end && wEnd >= start) {
          results.push({
            ...window,
            rangeStart: (wStart < start ? start : wStart).toISOString().split('T')[0],
            rangeEnd: (wEnd > end ? end : wEnd).toISOString().split('T')[0],
            isAvoid: window.boost < 1,
          });
        }
      }
    }
  }

  return results;
}

module.exports = {
  RELEASE_ARCHETYPES,
  SEASONAL_WINDOWS,
  classifyReleaseArchetype,
  getContentVelocity,
  getSeasonalIntelligence,
  getOptimalReleaseWindows,
  getSeasonalWindowsForRange,
  fetchSubtasteGenome,
};
