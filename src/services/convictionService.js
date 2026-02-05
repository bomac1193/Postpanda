/**
 * Conviction Service
 * BLUE OCEAN: Calculate conviction scores by combining performance prediction,
 * taste alignment, and brand consistency for intelligent content gating.
 */

const tasteGenome = require('./tasteGenome');
const intelligenceService = require('./intelligenceService');

/**
 * Conviction Score Thresholds
 */
const CONVICTION_THRESHOLDS = {
  EXCEPTIONAL: 85,  // Auto-prioritize, suggest cross-posting
  HIGH: 70,         // Approved for scheduling
  MEDIUM: 50,       // Warning, suggest improvements
  LOW: 0            // Block (strict mode) or warn
};

/**
 * Calculate Conviction Score for Content
 * @param {Object} content - Content document
 * @param {Object} userGenome - User's taste genome
 * @param {Object} options - Calculation options
 * @returns {Object} Conviction scoring result
 */
async function calculateConviction(content, userGenome, options = {}) {
  const {
    strictBrandConsistency = false,
    customWeights = null
  } = options;

  // IMPROVED WEIGHTS (Post Stress-Test): Taste 50%, Performance 30%, Brand 20%
  // Rationale: Taste is the only constant across platforms and time
  // Performance metrics are gameable and platform-dependent
  const weights = customWeights || {
    performance: 0.3,  // Reduced from 0.4
    taste: 0.5,        // Increased from 0.4
    brand: 0.2         // Unchanged
  };

  // 1. Performance Potential Score (existing AI scores)
  const performanceScore = calculatePerformancePotential(content);

  // 2. Taste Alignment Score (alignment with user's genome)
  const tasteScore = calculateTasteAlignment(content, userGenome);

  // 3. Brand Consistency Score (on-brand analysis)
  const brandScore = await calculateBrandConsistency(content, userGenome, strictBrandConsistency);

  // TEMPORAL DECAY: Penalize over-reliance on trends (only affects trend scores >80)
  // IMPROVED: More aggressive penalty for extreme trend-chasing
  const trendScore = content.aiScores?.trendScore || 0;
  let temporalFactor = 1.0;

  if (trendScore > 90) {
    // EXTREME trend dependency (90-100): 15-20% penalty
    temporalFactor = Math.max(0.80, 1.0 - ((trendScore - 90) / 50));
  } else if (trendScore > 80) {
    // High trend dependency (80-90): 5-10% penalty
    temporalFactor = Math.max(0.90, 1.0 - ((trendScore - 80) / 100));
  }

  // Calculate base weighted conviction score
  const baseConvictionScore = (
    (performanceScore * weights.performance) +
    (tasteScore * weights.taste) +
    (brandScore * weights.brand)
  );

  // Apply temporal factor (penalizes trend-chasing)
  const convictionScore = Math.round(baseConvictionScore * temporalFactor);

  // Determine tier and archetype match
  const tier = getConvictionTier(convictionScore);
  const archetypeMatch = extractArchetypeMatch(content, userGenome);

  return {
    conviction: {
      score: convictionScore,
      tier,
      archetypeMatch,
      breakdown: {
        performance: Math.round(performanceScore),
        taste: Math.round(tasteScore),
        brand: Math.round(brandScore)
      },
      weights,
      calculatedAt: new Date()
    },
    // Update aiScores for backward compatibility
    aiScores: {
      convictionScore,
      tasteAlignment: Math.round(tasteScore),
      brandConsistency: Math.round(brandScore)
    }
  };
}

/**
 * Calculate Performance Potential
 * Average of virality, engagement, aesthetic, and trend scores
 */
function calculatePerformancePotential(content) {
  const scores = content.aiScores || {};

  const viralityScore = scores.viralityScore || 0;
  const engagementScore = scores.engagementScore || 0;
  const aestheticScore = scores.aestheticScore || 0;
  const trendScore = scores.trendScore || 0;

  return (viralityScore + engagementScore + aestheticScore + trendScore) / 4;
}

/**
 * Calculate Taste Alignment Score
 * How well content aligns with user's taste genome archetypes
 */
function calculateTasteAlignment(content, userGenome) {
  if (!userGenome || !userGenome.archetype) {
    return 50; // Neutral score if no genome
  }

  // Extract content characteristics
  const contentAnalysis = content.analysis || {};
  const aestheticDNA = contentAnalysis.aestheticDNA || {};
  const performanceDNA = contentAnalysis.performanceDNA || {};

  // Get user's primary and secondary archetypes
  const primaryArchetype = userGenome.archetype.primary;
  const secondaryArchetype = userGenome.archetype.secondary;

  if (!primaryArchetype) {
    return 50;
  }

  let alignmentScore = 50; // Base score

  // Check archetype-specific alignment
  const archetypeDefinition = tasteGenome.ARCHETYPES[primaryArchetype.designation];

  if (archetypeDefinition) {
    // Match content style to archetype creative mode
    const styleMatch = matchStyleToArchetype(aestheticDNA, archetypeDefinition);
    const structureMatch = matchStructureToArchetype(performanceDNA, archetypeDefinition);

    alignmentScore += (styleMatch + structureMatch) / 2;
  }

  // Boost if secondary archetype also aligns
  if (secondaryArchetype && secondaryArchetype.confidence > 0.12) {
    const secondaryDefinition = tasteGenome.ARCHETYPES[secondaryArchetype.designation];
    if (secondaryDefinition) {
      const secondaryMatch = matchStyleToArchetype(aestheticDNA, secondaryDefinition);
      alignmentScore += secondaryMatch * 0.15; // 15% weight for secondary
    }
  }

  // SECURITY FIX: Validate genome confidence (prevent Sybil attack)
  const genomeConfidence = userGenome.confidence || 0;
  const signalCount = userGenome.signals?.length || 0;

  // Only trust high confidence if backed by sufficient signals
  const MIN_SIGNALS_FOR_HIGH_CONFIDENCE = 20;
  const validatedConfidence = signalCount >= MIN_SIGNALS_FOR_HIGH_CONFIDENCE
    ? genomeConfidence
    : Math.min(genomeConfidence, 0.6); // Cap confidence if insufficient signals

  if (validatedConfidence > 0.7 && signalCount >= MIN_SIGNALS_FOR_HIGH_CONFIDENCE) {
    alignmentScore *= 1.05; // 5% boost for validated high-confidence genome
  }

  return Math.min(100, Math.max(0, alignmentScore));
}

/**
 * Match content style to archetype
 * IMPROVED: More generous matching, rewards partial alignment
 */
function matchStyleToArchetype(aestheticDNA, archetype) {
  let matchScore = 0;

  const tone = aestheticDNA.tone || [];
  const style = aestheticDNA.style || [];
  const voice = aestheticDNA.voice || '';

  // Archetype-specific style matching (more generous scoring)
  const creativeMode = archetype.creativeMode?.toLowerCase() || '';

  // Visionary: bold, innovative, forward-thinking
  if (creativeMode === 'visionary') {
    if (tone.includes('bold')) matchScore += 15;
    if (tone.includes('innovative')) matchScore += 15;
    if (style.includes('visionary')) matchScore += 20;
    if (style.includes('forward-thinking')) matchScore += 10;
  }

  // Architectural: structured, systematic
  if (creativeMode === 'architectural') {
    if (style.includes('structured')) matchScore += 15;
    if (style.includes('systematic')) matchScore += 15;
    if (tone.includes('precise')) matchScore += 10;
  }

  // Prophetic: forward-thinking, experimental
  if (creativeMode === 'prophetic') {
    if (tone.includes('forward-thinking')) matchScore += 15;
    if (tone.includes('experimental')) matchScore += 15;
    if (style.includes('prophetic')) matchScore += 20;
  }

  // Editorial: refined, minimal
  if (creativeMode === 'editorial') {
    if (tone.includes('refined')) matchScore += 15;
    if (tone.includes('minimal')) matchScore += 15;
    if (style.includes('curated')) matchScore += 10;
  }

  // Advocacy: passionate, enthusiastic
  if (creativeMode === 'advocacy') {
    if (tone.includes('passionate')) matchScore += 15;
    if (tone.includes('enthusiastic')) matchScore += 15;
  }

  // Voice consistency (stronger weight)
  if (voice && voice.length > 0) {
    matchScore += 15;
  }

  // Style array presence bonus
  if (style.length > 0) {
    matchScore += 10;
  }

  return Math.min(matchScore, 60); // Cap at 60 (out of base 50 + bonuses)
}

/**
 * Match content structure to archetype
 */
function matchStructureToArchetype(performanceDNA, archetype) {
  let matchScore = 0;

  const hooks = performanceDNA.hooks || [];
  const structure = performanceDNA.structure || '';

  const creativeMode = archetype.creativeMode?.toLowerCase() || '';

  // Structure matching based on archetype
  if (creativeMode === 'visionary' && hooks.length > 0) {
    matchScore += 10;
  }

  if (creativeMode === 'architectural' && structure.includes('layered')) {
    matchScore += 10;
  }

  if (creativeMode === 'manifestation' && structure.includes('actionable')) {
    matchScore += 10;
  }

  return matchScore;
}

/**
 * Check if content has any actual data (not empty attack)
 * Returns false only if COMPLETELY empty (no caption, no analysis data, no scores)
 */
function hasAnyData(content) {
  // Has caption with content
  if (content.caption && content.caption.length > 0) return true;

  // Has analysis DNA with actual values (not just empty objects/arrays)
  if (content.analysis?.aestheticDNA?.tone && content.analysis.aestheticDNA.tone.length > 0) return true;
  if (content.analysis?.performanceDNA?.hooks && content.analysis.performanceDNA.hooks.length > 0) return true;
  if (content.analysis?.aestheticDNA?.style && content.analysis.aestheticDNA.style.length > 0) return true;
  if (content.analysis?.aestheticDNA?.voice && content.analysis.aestheticDNA.voice.length > 0) return true;
  if (content.analysis?.performanceDNA?.structure && content.analysis.performanceDNA.structure.length > 0) return true;

  // Has at least SOME AI scores (not all zero)
  const hasScores = content.aiScores && (
    content.aiScores.viralityScore > 0 ||
    content.aiScores.engagementScore > 0 ||
    content.aiScores.aestheticScore > 0 ||
    content.aiScores.trendScore > 0
  );

  if (hasScores) return true;

  // Check if DNA objects have any properties at all (even if empty arrays)
  // This distinguishes {} (completely empty) from {tone: [], voice: ''} (has structure)
  const aestheticDNA = content.analysis?.aestheticDNA;
  const performanceDNA = content.analysis?.performanceDNA;

  const hasAestheticStructure = aestheticDNA && Object.keys(aestheticDNA).length > 0;
  const hasPerformanceStructure = performanceDNA && Object.keys(performanceDNA).length > 0;

  return hasAestheticStructure || hasPerformanceStructure;
}

/**
 * Check if content appears to be from a genuine new creator
 */
function hasGenuineContent(content) {
  const hasCaption = content.caption && content.caption.length > 20;
  const hasAestheticDNA = content.analysis?.aestheticDNA?.tone &&
                          content.analysis.aestheticDNA.tone.length > 0;
  const hasViralityScore = content.aiScores?.viralityScore > 0;
  const hasMediaUrl = content.mediaUrl && content.mediaUrl.length > 0;

  // Genuine content should have at least 2 of these signals:
  // - Caption with substance
  // - Aesthetic DNA analysis
  // - AI virality score
  // - Media URL
  const signalCount = [
    hasCaption,
    hasAestheticDNA,
    hasViralityScore,
    hasMediaUrl
  ].filter(Boolean).length;

  // At least 2 signals = genuine content
  return signalCount >= 2;
}

/**
 * Calculate Brand Consistency Score
 * IMPROVED: Dynamic scoring based on actual genome signals
 * Measures how well content aligns with brand guidelines
 */
async function calculateBrandConsistency(content, userGenome, strictMode = false) {
  // CRITICAL FIX: Lower default brand score to prevent "all zeros" attack
  let brandScore = 50; // Default: neutral (down from 75)

  // SECURITY FIX: Check for empty/incomplete content (all zeros attack)
  if (!hasAnyData(content)) {
    // Incomplete content with no actual data - likely an attack
    brandScore = 20; // Very low score for empty content
  } else {
    // Content has data - now check genome signals
    if (userGenome && userGenome.signals) {
      const signals = userGenome.signals || [];
      const positiveSignals = signals.filter(s => s.type === 'save' || s.type === 'like');
      const totalSignals = signals.length;

      // Brand score increases with signal count (proof of genuine curation)
      if (totalSignals >= 50) {
        brandScore = 85; // Well-established brand
      } else if (totalSignals >= 20) {
        brandScore = 75; // Emerging brand
      } else if (totalSignals >= 10) {
        brandScore = 65; // Early brand
      } else if (totalSignals > 0) {
        brandScore = 55; // Minimal brand data
      } else if (totalSignals === 0 && hasGenuineContent(content)) {
        // NEW CREATOR FIX: No signals yet, but content looks genuine
        // Give benefit of doubt to new creators with real content
        brandScore = 60; // Neutral-positive for genuine new users
      }

      // Strict mode: require high positive signal ratio
      if (strictMode && totalSignals > 0) {
        const positiveRatio = positiveSignals.length / totalSignals;
        if (positiveRatio < 0.5) {
          brandScore *= 0.9; // Penalize low positive ratio
        }
      }
    } else if (hasGenuineContent(content)) {
      // No genome at all, but content looks genuine (completely new artist)
      // Be more generous to encourage first-time creators
      const performanceScore = (
        (content.aiScores?.viralityScore || 0) +
        (content.aiScores?.engagementScore || 0) +
        (content.aiScores?.aestheticScore || 0)
      ) / 3;

      // If their content has decent predicted performance, reward them
      if (performanceScore >= 60) {
        brandScore = 70; // Good first content deserves encouragement
      } else {
        brandScore = 60; // Give benefit of doubt to new creators
      }
    }
  }

  // SECURITY FIX: Penalize override abuse
  if (content.conviction?.userOverride) {
    // Slight penalty for override (user is bypassing system)
    brandScore = Math.max(30, brandScore - 5);
  }

  return Math.round(brandScore);
}

/**
 * Get Conviction Tier from Score
 */
function getConvictionTier(score) {
  if (score >= CONVICTION_THRESHOLDS.EXCEPTIONAL) return 'exceptional';
  if (score >= CONVICTION_THRESHOLDS.HIGH) return 'high';
  if (score >= CONVICTION_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}

/**
 * Extract Archetype Match from Content
 */
function extractArchetypeMatch(content, userGenome) {
  if (!userGenome || !userGenome.archetype || !userGenome.archetype.primary) {
    return null;
  }

  const primary = userGenome.archetype.primary;

  return {
    designation: primary.designation,
    glyph: primary.glyph,
    confidence: primary.confidence || 0
  };
}

/**
 * Check Conviction Gating
 * Determine if content can be scheduled based on conviction score
 */
function checkGating(convictionScore, options = {}) {
  const {
    threshold = CONVICTION_THRESHOLDS.HIGH,
    strictMode = false,
    userOverride = false
  } = options;

  let status = 'approved';
  let reason = '';
  let suggestions = [];

  if (userOverride) {
    return {
      status: 'override',
      reason: 'User override active',
      canSchedule: true,
      requiresReview: false,
      suggestions: []
    };
  }

  if (convictionScore < CONVICTION_THRESHOLDS.MEDIUM) {
    status = strictMode ? 'blocked' : 'warning';
    reason = `Low conviction score (${convictionScore}/100). Content may underperform significantly.`;
    suggestions = [
      'Revise caption to better align with your brand voice',
      'Adjust visual style to match your top-performing content',
      'Consider A/B testing different versions',
      'Review AI suggestions for improvements'
    ];
  } else if (convictionScore < threshold) {
    status = 'warning';
    reason = `Below conviction threshold (${convictionScore}/${threshold}). Review suggested improvements before scheduling.`;
    suggestions = [
      'Minor adjustments could improve predicted performance',
      'Consider testing with a smaller audience first'
    ];
  } else if (convictionScore >= CONVICTION_THRESHOLDS.EXCEPTIONAL) {
    status = 'approved';
    reason = `High-conviction content (${convictionScore}/100). Predicted to perform exceptionally well.`;
    suggestions = [
      'Consider cross-posting to other platforms',
      'Amplify with paid promotion',
      'Save for optimal posting time'
    ];
  } else {
    status = 'approved';
    reason = `Good conviction score (${convictionScore}/100)`;
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
 * Generate Conviction Report for Content
 */
async function generateConvictionReport(content, userGenome) {
  const result = await calculateConviction(content, userGenome);
  const gating = checkGating(result.conviction.score, {
    userOverride: content.conviction?.userOverride
  });

  return {
    ...result,
    gating,
    recommendations: generateRecommendations(result, gating)
  };
}

/**
 * Generate Actionable Recommendations
 */
function generateRecommendations(convictionResult, gatingResult) {
  const recommendations = [];

  const { breakdown } = convictionResult.conviction;

  // Performance recommendations
  if (breakdown.performance < 60) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: 'Low predicted performance',
      actions: [
        'Use AI to analyze top-performing content in your niche',
        'Test different content formats (carousel vs. reel)',
        'Optimize posting time based on audience activity'
      ]
    });
  }

  // Taste alignment recommendations
  if (breakdown.taste < 60) {
    recommendations.push({
      type: 'taste',
      priority: 'high',
      message: 'Content doesn\'t align with your established taste profile',
      actions: [
        'Review your archetype and adjust content to match',
        'Check similar high-performing content for inspiration',
        'Consider if this represents an intentional style shift'
      ]
    });
  }

  // Brand consistency recommendations
  if (breakdown.brand < 70) {
    recommendations.push({
      type: 'brand',
      priority: 'medium',
      message: 'May not match your brand voice',
      actions: [
        'Review brand guidelines and adjust caption',
        'Ensure visual style matches your feed aesthetic',
        'Check if tone aligns with your audience expectations'
      ]
    });
  }

  // Add gating suggestions
  if (gatingResult.suggestions && gatingResult.suggestions.length > 0) {
    recommendations.push({
      type: 'gating',
      priority: gatingResult.status === 'blocked' ? 'critical' : 'medium',
      message: gatingResult.reason,
      actions: gatingResult.suggestions
    });
  }

  return recommendations;
}

module.exports = {
  calculateConviction,
  checkGating,
  generateConvictionReport,
  CONVICTION_THRESHOLDS
};
