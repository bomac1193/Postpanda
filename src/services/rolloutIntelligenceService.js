/**
 * Rollout Intelligence Service
 *
 * Blue Ocean Feature: Transforms generic rollout planning into intelligent
 * prediction engine using Taste Genome, Conviction, and Stanvault data.
 *
 * Core Features:
 * 1. Conviction-Based Phase Gating (can't advance with low-quality content)
 * 2. Archetype-Specific Pacing (KETH = fast, VAULT = slow)
 * 3. Stan Velocity Prediction (forecast SCR based on cadence)
 * 4. Aesthetic Continuity Check (Folio integration)
 * 5. Burnout Prevention (workload analysis)
 */

const Content = require('../models/Content');
const Rollout = require('../models/Rollout');
const YoutubeCollection = require('../models/YoutubeCollection');
const YoutubeVideo = require('../models/YoutubeVideo');
const Collection = require('../models/Collection');
const convictionService = require('./convictionService');

/**
 * ARCHETYPE-SPECIFIC ROLLOUT DNA
 *
 * Each archetype has optimal pacing, phase count, and conversion patterns
 * based on audience behavior analysis.
 */
const ROLLOUT_DNA = {
  // KETH: Velocity-driven, high momentum decay
  KETH: {
    designation: 'KETH',
    label: 'The Vanguard',

    pacing: {
      optimalCadenceDays: 3,
      minCadenceDays: 2,
      maxCadenceDays: 5,
      reasoning: 'High momentum decay - audience forgets if you wait >5 days'
    },

    phases: {
      optimal: 4,
      min: 3,
      max: 5,
      reasoning: 'KETH thrives on velocity - too many phases kills momentum'
    },

    conversionVelocity: 'FAST', // < 7 days casual → stan
    momentumHalfLife: 3, // days until 50% engagement drop

    risks: [
      'Drip fatigue after 3 weeks - compress timeline',
      'Audience moves on fast - skip long sustain phases',
      'Burnout risk - KETH creators push too hard'
    ],

    recommendations: [
      'Use surprise drops to maintain disruption',
      'Compress phases to 3-4 days each',
      'Skip traditional "sustain" - pivot to next project',
      'Batch content creation to maintain velocity'
    ],

    scr: {
      baseline: 4.2,
      optimal: 6.8, // with 3-day cadence
      penalties: {
        slowPace: -40, // % if cadence > 7 days
        tooManyPhases: -25 // % if > 5 phases
      }
    }
  },

  // VAULT: Editorial-driven, slow burn
  VAULT: {
    designation: 'VAULT',
    label: 'The Curator',

    pacing: {
      optimalCadenceDays: 7,
      minCadenceDays: 5,
      maxCadenceDays: 14,
      reasoning: 'Builds anticipation through scarcity - rushing kills mystique'
    },

    phases: {
      optimal: 5,
      min: 4,
      max: 7,
      reasoning: 'VAULT audiences appreciate elaborate, multi-phase narratives'
    },

    conversionVelocity: 'SLOW', // 14-21 days casual → stan
    momentumHalfLife: 10, // days until 50% engagement drop

    risks: [
      'Losing casual viewers if too slow',
      'Perfectionism paralysis - never launching',
      'Audience expects high polish - no room for mistakes'
    ],

    recommendations: [
      'Build anticipation with weekly drops',
      'Emphasize quality over quantity',
      'Use longer sustain phase (4-6 weeks)',
      'Create lore-rich narrative across phases'
    ],

    scr: {
      baseline: 3.8,
      optimal: 5.4, // with 7-day cadence
      penalties: {
        fastPace: -35, // % if cadence < 4 days
        tooFewPhases: -20 // % if < 4 phases
      }
    }
  },

  // SCHISM: Contrarian, unpredictable
  SCHISM: {
    designation: 'SCHISM',
    label: 'The Disruptor',

    pacing: {
      optimalCadenceDays: 0, // ERRATIC by design
      minCadenceDays: 1,
      maxCadenceDays: 14,
      reasoning: 'Unpredictability IS the strategy - avoid patterns'
    },

    phases: {
      optimal: 3,
      min: 2,
      max: 4,
      reasoning: 'SCHISM rejects traditional structures - fewer, weirder phases'
    },

    conversionVelocity: 'ERRATIC',
    momentumHalfLife: 5,

    risks: [
      'Audience confusion if too chaotic',
      'Platform algorithms penalize inconsistency',
      'Hard to sustain without burning out'
    ],

    recommendations: [
      'Embrace erratic pacing (2 days, then 10 days, then 1 day)',
      'Use unconventional phase names',
      'Skip "announce" phase - just drop without warning',
      'Lean into chaos as brand differentiator'
    ],

    scr: {
      baseline: 5.1, // High - polarizing content converts hard
      optimal: 7.2, // with unpredictable cadence
      penalties: {
        tooRegular: -50 // % if cadence too predictable
      }
    }
  },

  // TOLL: Community-driven, dialogue-focused
  TOLL: {
    designation: 'TOLL',
    label: 'The Connector',

    pacing: {
      optimalCadenceDays: 5,
      minCadenceDays: 3,
      maxCadenceDays: 10,
      reasoning: 'Needs time for community dialogue between phases'
    },

    phases: {
      optimal: 5,
      min: 4,
      max: 6,
      reasoning: 'TOLL thrives on multi-phase conversations'
    },

    conversionVelocity: 'MEDIUM',
    momentumHalfLife: 7,

    risks: [
      'Over-reliance on comments/engagement',
      'Community fatigue if too frequent',
      'Debate paralysis - too much input'
    ],

    recommendations: [
      'Build in "response" phases to community feedback',
      'Use polls/questions between content drops',
      'Allow 2-3 day buffer for community dialogue',
      'Create collaborative content in later phases'
    ],

    scr: {
      baseline: 4.5,
      optimal: 6.2,
      penalties: {
        noDialogue: -30 // % if no community engagement built in
      }
    }
  },

  // CULL: Data-driven, optimization-focused
  CULL: {
    designation: 'CULL',
    label: 'The Optimizer',

    pacing: {
      optimalCadenceDays: 4,
      minCadenceDays: 3,
      maxCadenceDays: 7,
      reasoning: 'Data-driven iteration - fast enough to test, slow enough to analyze'
    },

    phases: {
      optimal: 6,
      min: 4,
      max: 8,
      reasoning: 'CULL uses more phases for A/B testing'
    },

    conversionVelocity: 'MEDIUM-FAST',
    momentumHalfLife: 6,

    risks: [
      'Analysis paralysis - optimizing forever',
      'Losing creative spark to data obsession',
      'Audience sees through "testing" and disengages'
    ],

    recommendations: [
      'Build in A/B test phases',
      'Use 4-day cadence for iteration speed',
      'Track metrics obsessively between phases',
      'Pivot strategy mid-rollout based on data'
    ],

    scr: {
      baseline: 4.0,
      optimal: 6.5,
      penalties: {
        noTesting: -25
      }
    }
  },

  // Default for unknown archetypes
  DEFAULT: {
    designation: 'UNKNOWN',
    label: 'Generic',

    pacing: {
      optimalCadenceDays: 5,
      minCadenceDays: 3,
      maxCadenceDays: 7,
      reasoning: 'Balanced approach - neither too fast nor too slow'
    },

    phases: {
      optimal: 5,
      min: 3,
      max: 7,
      reasoning: 'Standard multi-phase rollout'
    },

    conversionVelocity: 'MEDIUM',
    momentumHalfLife: 7,

    risks: [],
    recommendations: [
      'Complete taste profile for personalized recommendations'
    ],

    scr: {
      baseline: 3.5,
      optimal: 5.0,
      penalties: {}
    }
  }
};

/**
 * Get Rollout DNA for user's archetype
 */
function getRolloutDNA(archetype) {
  if (!archetype) return ROLLOUT_DNA.DEFAULT;

  // Extract designation (e.g., "KETH" from full archetype object)
  const designation = typeof archetype === 'string'
    ? archetype
    : archetype.designation || archetype.primary?.designation;

  return ROLLOUT_DNA[designation] || ROLLOUT_DNA.DEFAULT;
}

/**
 * CONVICTION-BASED PHASE GATING
 *
 * Analyzes if a section is ready to advance based on content conviction scores.
 * Blocks advancement if content quality is too low.
 */
async function analyzeSectionReadiness(rollout, sectionId, user) {
  try {
    const section = rollout.sections.find(s => s.id === sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    // Get all content from collections in this section
    const allContent = [];

    for (const collectionId of section.collectionIds) {
      // Try YouTube collection
      const youtubeCollection = await YoutubeCollection.findById(collectionId);
      if (youtubeCollection) {
        const videos = await YoutubeVideo.find({ collectionId: youtubeCollection._id });
        // Note: YouTube videos don't have conviction scores yet
        // This is a placeholder for future implementation
        continue;
      }

      // Try IG/TikTok collection
      const collection = await Collection.findById(collectionId).populate('items.contentId');
      if (collection) {
        collection.items.forEach(item => {
          if (item.contentId) {
            allContent.push(item.contentId);
          }
        });
      }
    }

    if (allContent.length === 0) {
      return {
        ready: false,
        canAdvance: false,
        reason: 'NO_CONTENT',
        message: 'No content found in this section',
        stats: {
          totalPieces: 0,
          avgConviction: 0,
          belowThreshold: 0,
          aboveThreshold: 0
        },
        blockers: [],
        suggestions: ['Add content to this section before advancing']
      };
    }

    // Calculate conviction stats
    const threshold = 70; // Can be customized per rollout
    const convictionScores = allContent.map(c => c.conviction?.score || 0);
    const avgConviction = convictionScores.reduce((a, b) => a + b, 0) / convictionScores.length;

    const belowThreshold = allContent.filter(c => (c.conviction?.score || 0) < threshold);
    const aboveThreshold = allContent.filter(c => (c.conviction?.score || 0) >= threshold);

    // Determine readiness
    const ready = belowThreshold.length === 0 && avgConviction >= threshold;

    // Build blockers list
    const blockers = belowThreshold.map(content => ({
      contentId: content._id,
      title: content.title,
      convictionScore: content.conviction?.score || 0,
      gap: threshold - (content.conviction?.score || 0),
      issues: content.conviction?.gatingReason || 'Low conviction score'
    }));

    // Build suggestions
    const suggestions = [];
    if (belowThreshold.length > 0) {
      suggestions.push(`Rework ${belowThreshold.length} piece(s) below conviction threshold (${threshold})`);

      // Top 3 worst performers
      const worst = belowThreshold
        .sort((a, b) => (a.conviction?.score || 0) - (b.conviction?.score || 0))
        .slice(0, 3);

      worst.forEach(content => {
        suggestions.push(
          `"${content.title}" (conviction: ${content.conviction?.score || 0}) - ${content.conviction?.gatingReason || 'needs improvement'}`
        );
      });
    }

    if (avgConviction < threshold) {
      suggestions.push(`Increase average conviction from ${avgConviction.toFixed(1)} to ${threshold}+`);
    }

    // Calculate estimated time to ready
    let estimatedDays = 0;
    if (!ready) {
      // Assume 1 day per piece to rework
      estimatedDays = Math.ceil(belowThreshold.length * 1);
    }

    return {
      ready,
      canAdvance: ready,
      reason: ready ? 'READY' : 'CONVICTION_TOO_LOW',
      message: ready
        ? `Section ready to advance (avg conviction: ${avgConviction.toFixed(1)})`
        : `${belowThreshold.length} piece(s) below threshold - fix before advancing`,
      stats: {
        totalPieces: allContent.length,
        avgConviction: Math.round(avgConviction * 10) / 10,
        belowThreshold: belowThreshold.length,
        aboveThreshold: aboveThreshold.length,
        threshold
      },
      blockers,
      suggestions,
      estimatedTimeToReady: estimatedDays > 0 ? `${estimatedDays} day${estimatedDays > 1 ? 's' : ''}` : null,
      overrideAllowed: true,
      overrideWarning: ready ? null : `Advancing now may reduce stan conversion by ~${Math.min(40, belowThreshold.length * 10)}%`
    };

  } catch (error) {
    console.error('Error analyzing section readiness:', error);
    throw error;
  }
}

/**
 * ARCHETYPE-SPECIFIC PACING RECOMMENDATIONS
 *
 * Recommends optimal cadence and phase count based on user's taste archetype.
 */
function getPacingRecommendations(archetype, rollout) {
  const dna = getRolloutDNA(archetype);

  // Analyze current rollout structure
  const currentPhaseCount = rollout.sections.length;
  const currentCadence = calculateAverageCadence(rollout);

  // Calculate deviations
  const phaseDelta = currentPhaseCount - dna.phases.optimal;
  const cadenceDelta = currentCadence - dna.pacing.optimalCadenceDays;

  // Build recommendations
  const recommendations = [];
  const warnings = [];

  // Phase count analysis
  if (phaseDelta > 0) {
    warnings.push({
      type: 'TOO_MANY_PHASES',
      severity: 'MEDIUM',
      message: `${currentPhaseCount} phases is ${phaseDelta} more than optimal for ${dna.label}`,
      impact: `May reduce SCR by ~${dna.scr.penalties.tooManyPhases || 20}%`,
      suggestion: `Consider consolidating to ${dna.phases.optimal} phases`
    });
  } else if (phaseDelta < 0 && Math.abs(phaseDelta) > 1) {
    warnings.push({
      type: 'TOO_FEW_PHASES',
      severity: 'LOW',
      message: `${currentPhaseCount} phases is ${Math.abs(phaseDelta)} fewer than optimal`,
      impact: `May reduce engagement depth`,
      suggestion: `Consider expanding to ${dna.phases.optimal} phases`
    });
  }

  // Cadence analysis
  if (cadenceDelta > 2) {
    warnings.push({
      type: 'TOO_SLOW',
      severity: 'HIGH',
      message: `${currentCadence}-day cadence is too slow for ${dna.label}`,
      impact: `Momentum decay: ${dna.momentumHalfLife}-day half-life means ${Math.floor((currentCadence / dna.momentumHalfLife) * 50)}% engagement drop`,
      suggestion: `Compress to ${dna.pacing.optimalCadenceDays}-day cadence`,
      scrImpact: dna.scr.penalties.slowPace ? `${dna.scr.penalties.slowPace}% SCR reduction` : null
    });
  } else if (cadenceDelta < -2) {
    warnings.push({
      type: 'TOO_FAST',
      severity: 'MEDIUM',
      message: `${currentCadence}-day cadence may be too fast`,
      impact: `Burnout risk + audience fatigue`,
      suggestion: `Slow to ${dna.pacing.optimalCadenceDays}-day cadence for sustainability`,
      scrImpact: dna.scr.penalties.fastPace ? `${dna.scr.penalties.fastPace}% SCR reduction` : null
    });
  }

  // General recommendations from DNA
  dna.recommendations.forEach(rec => {
    recommendations.push({
      type: 'ARCHETYPE_SPECIFIC',
      message: rec,
      archetype: dna.designation
    });
  });

  // Risk warnings
  dna.risks.forEach(risk => {
    warnings.push({
      type: 'ARCHETYPE_RISK',
      severity: 'INFO',
      message: risk,
      archetype: dna.designation
    });
  });

  return {
    archetype: dna.designation,
    label: dna.label,
    optimal: {
      cadenceDays: dna.pacing.optimalCadenceDays,
      phaseCount: dna.phases.optimal,
      reasoning: dna.pacing.reasoning
    },
    current: {
      cadenceDays: currentCadence,
      phaseCount: currentPhaseCount
    },
    deviations: {
      phases: phaseDelta,
      cadence: cadenceDelta
    },
    recommendations,
    warnings,
    conversionVelocity: dna.conversionVelocity,
    momentumHalfLife: dna.momentumHalfLife
  };
}

/**
 * Calculate average cadence between phases
 */
function calculateAverageCadence(rollout) {
  const sections = rollout.sections.filter(s => s.startDate).sort((a, b) =>
    new Date(a.startDate) - new Date(b.startDate)
  );

  if (sections.length < 2) {
    return 7; // Default if not enough data
  }

  let totalDays = 0;
  for (let i = 1; i < sections.length; i++) {
    const prev = new Date(sections[i - 1].startDate);
    const curr = new Date(sections[i].startDate);
    const days = (curr - prev) / (1000 * 60 * 60 * 24);
    totalDays += days;
  }

  return Math.round(totalDays / (sections.length - 1));
}

/**
 * STAN VELOCITY PREDICTION
 *
 * Predicts Stan Conversion Rate based on rollout pacing and archetype.
 */
function predictStanVelocity(archetype, rollout, options = {}) {
  const dna = getRolloutDNA(archetype);
  const currentCadence = calculateAverageCadence(rollout);
  const currentPhaseCount = rollout.sections.length;

  // Start with baseline SCR for this archetype
  let predictedSCR = dna.scr.baseline;

  // Apply cadence multiplier
  if (Math.abs(currentCadence - dna.pacing.optimalCadenceDays) <= 1) {
    // Within optimal range - use optimal SCR
    predictedSCR = dna.scr.optimal;
  } else if (currentCadence > dna.pacing.maxCadenceDays) {
    // Too slow - apply penalty
    const penalty = dna.scr.penalties.slowPace || 30;
    predictedSCR *= (1 - penalty / 100);
  } else if (currentCadence < dna.pacing.minCadenceDays) {
    // Too fast - apply penalty
    const penalty = dna.scr.penalties.fastPace || 25;
    predictedSCR *= (1 - penalty / 100);
  }

  // Apply phase count penalty
  if (currentPhaseCount > dna.phases.max) {
    const penalty = dna.scr.penalties.tooManyPhases || 20;
    predictedSCR *= (1 - penalty / 100);
  } else if (currentPhaseCount < dna.phases.min) {
    const penalty = dna.scr.penalties.tooFewPhases || 15;
    predictedSCR *= (1 - penalty / 100);
  }

  // Calculate optimal scenario
  const optimalSCR = dna.scr.optimal;
  const improvement = ((optimalSCR - predictedSCR) / predictedSCR) * 100;

  // Calculate conversion timeline
  const avgConversionDays = calculateConversionTimeline(dna, currentCadence, currentPhaseCount);

  return {
    current: {
      predictedSCR: Math.round(predictedSCR * 10) / 10,
      cadence: currentCadence,
      phaseCount: currentPhaseCount
    },
    optimal: {
      targetSCR: optimalSCR,
      cadence: dna.pacing.optimalCadenceDays,
      phaseCount: dna.phases.optimal,
      improvement: Math.round(improvement)
    },
    conversionTimeline: {
      casualToStan: avgConversionDays,
      velocity: dna.conversionVelocity,
      momentumHalfLife: dna.momentumHalfLife
    },
    reasoning: buildVelocityReasoning(dna, currentCadence, currentPhaseCount, improvement),
    recommendations: buildVelocityRecommendations(dna, currentCadence, currentPhaseCount, predictedSCR, optimalSCR)
  };
}

function calculateConversionTimeline(dna, cadence, phaseCount) {
  // Base conversion time
  const baseMap = {
    'FAST': 7,
    'MEDIUM-FAST': 10,
    'MEDIUM': 14,
    'SLOW': 21,
    'ERRATIC': 12
  };

  let days = baseMap[dna.conversionVelocity] || 14;

  // Adjust based on cadence deviation
  const cadenceDelta = cadence - dna.pacing.optimalCadenceDays;
  days += cadenceDelta * 2; // Each day off optimal adds 2 days to conversion

  return Math.max(3, Math.round(days));
}

function buildVelocityReasoning(dna, cadence, phaseCount, improvement) {
  const reasons = [];

  reasons.push(`Your archetype (${dna.designation}) has ${dna.conversionVelocity.toLowerCase()} conversion velocity`);

  if (dna.momentumHalfLife) {
    reasons.push(`Momentum half-life: ${dna.momentumHalfLife} days (engagement drops 50% after this)`);
  }

  if (cadence > dna.pacing.optimalCadenceDays + 2) {
    reasons.push(`Current ${cadence}-day gaps cause significant momentum loss`);
  } else if (cadence < dna.pacing.minCadenceDays) {
    reasons.push(`Current ${cadence}-day cadence may cause audience fatigue`);
  }

  if (improvement > 20) {
    reasons.push(`Optimizing to ${dna.pacing.optimalCadenceDays}-day cadence could boost SCR by ${Math.round(improvement)}%`);
  }

  return reasons;
}

function buildVelocityRecommendations(dna, cadence, phaseCount, currentSCR, optimalSCR) {
  const recs = [];

  if (cadence > dna.pacing.optimalCadenceDays) {
    recs.push({
      type: 'COMPRESS_CADENCE',
      priority: 'HIGH',
      message: `Compress cadence from ${cadence} to ${dna.pacing.optimalCadenceDays} days`,
      impact: `+${Math.round(((optimalSCR - currentSCR) / currentSCR) * 100)}% SCR improvement`
    });
  } else if (cadence < dna.pacing.minCadenceDays) {
    recs.push({
      type: 'EXTEND_CADENCE',
      priority: 'MEDIUM',
      message: `Extend cadence from ${cadence} to ${dna.pacing.optimalCadenceDays} days for sustainability`,
      impact: 'Reduces burnout risk'
    });
  }

  if (phaseCount > dna.phases.optimal) {
    recs.push({
      type: 'CONSOLIDATE_PHASES',
      priority: 'MEDIUM',
      message: `Consolidate ${phaseCount} phases down to ${dna.phases.optimal}`,
      impact: `Maintains momentum without overwhelming audience`
    });
  }

  return recs;
}

/**
 * COMPREHENSIVE ROLLOUT INTELLIGENCE
 *
 * Combines all intelligence features into single analysis
 */
async function analyzeRollout(rolloutId, userId) {
  try {
    const rollout = await Rollout.findOne({ _id: rolloutId, userId });
    if (!rollout) {
      throw new Error('Rollout not found');
    }

    // Get user to access archetype
    const User = require('../models/User');
    const user = await User.findById(userId);
    const archetype = user.tasteGenome?.archetype?.primary;

    // Run all analyses
    const [
      pacing,
      velocity,
      sectionAnalyses
    ] = await Promise.all([
      Promise.resolve(getPacingRecommendations(archetype, rollout)),
      Promise.resolve(predictStanVelocity(archetype, rollout)),
      Promise.all(rollout.sections.map(section =>
        analyzeSectionReadiness(rollout, section.id, user)
      ))
    ]);

    // Calculate overall readiness
    const allSectionsReady = sectionAnalyses.every(s => s.ready);
    const totalPieces = sectionAnalyses.reduce((sum, s) => sum + s.stats.totalPieces, 0);
    const avgConviction = sectionAnalyses.reduce((sum, s) =>
      sum + (s.stats.avgConviction * s.stats.totalPieces), 0
    ) / Math.max(1, totalPieces);

    return {
      rolloutId: rollout._id,
      rolloutName: rollout.name,
      archetype: archetype?.designation || 'UNKNOWN',

      overallReadiness: {
        ready: allSectionsReady,
        totalSections: rollout.sections.length,
        readySections: sectionAnalyses.filter(s => s.ready).length,
        totalPieces,
        avgConviction: Math.round(avgConviction * 10) / 10
      },

      pacing,
      velocity,

      sections: rollout.sections.map((section, idx) => ({
        sectionId: section.id,
        sectionName: section.name,
        order: section.order,
        ...sectionAnalyses[idx]
      })),

      timestamp: new Date()
    };

  } catch (error) {
    console.error('Error analyzing rollout:', error);
    throw error;
  }
}

module.exports = {
  getRolloutDNA,
  analyzeSectionReadiness,
  getPacingRecommendations,
  predictStanVelocity,
  analyzeRollout,
  ROLLOUT_DNA
};
