const User = require('../models/User');
const Profile = require('../models/Profile');
const tasteGenome = require('./tasteGenome');

/**
 * Build a unified taste context from the stored genome (1193 schema seed).
 * Falls back to safe defaults when a genome is missing.
 */
async function buildTasteContext({ userId, profileId }) {
  let target = null;

  if (profileId) {
    target = await Profile.findOne({ _id: profileId, userId });
  }
  if (!target) {
    target = await User.findById(userId);
  }

  const genome = target?.tasteGenome || tasteGenome.createGenome(userId);
  const primary = genome?.archetype?.primary || null;

  // Lightweight lexicon guardrails derived from archetype glyph and recent signals
  const recentSignals = (genome.signals || []).slice(-25).reverse();
  const recentTopics = recentSignals
    .map(s => s.metadata?.topic || s.metadata?.title || s.value)
    .filter(Boolean)
    .slice(0, 10);

  // Pull learned keywords from genome keyword scores into the lexicon
  const topKeywords = tasteGenome.getTopKeywords(genome, null, 8).map(k => k.keyword);
  const avoidKeywords = tasteGenome.getAvoidKeywords(genome, 6).map(k => k.keyword);

  const lexicon = {
    prefer: [
      primary?.glyph,
      primary?.designation,
      ...(genome.directives?.tone || []),
      ...(genome.directives?.keywords || []),
      ...topKeywords,
    ].filter(Boolean),
    avoid: [
      ...(genome.directives?.avoid || []),
      ...avoidKeywords,
      'generic',
      'placeholder',
      'clickbait'
    ],
  };

  // Deduplicate
  lexicon.prefer = [...new Set(lexicon.prefer)];
  lexicon.avoid = [...new Set(lexicon.avoid)];

  return {
    glyph: primary?.glyph || 'VOID',
    designation: primary?.designation || 'Ø',
    confidence: genome?.confidence || primary?.confidence || 0,
    distribution: genome?.archetype?.distribution || {},
    recentSignals: recentSignals.map(s => ({
      type: s.type,
      timestamp: s.timestamp,
      metadata: s.metadata || {},
    })),
    recentTopics,
    lexicon,
    topKeywords,
    avoidKeywords,
    directives: genome?.directives || {
      tone: ['minimal', 'authoritative'],
      keywords: ['taste', 'resonance'],
      avoid: ['generic', 'templated'],
    },
    performancePatterns: genome?.performancePatterns || {},
    aestheticPatterns: genome?.aestheticPatterns || {},
    voiceSignature: genome?.aestheticPatterns?.voice || 'conversational',
  };
}

/**
 * Materialise a minimal 1193 schema view so clients can consume a single object.
 */
function materialize1193Schema(genome) {
  const primary = genome?.archetype?.primary || null;
  const schema = {
    archetype: {
      primary: primary
        ? {
            glyph: primary.glyph,
            designation: primary.designation,
            confidence: primary.confidence,
          }
        : null,
      distribution: genome?.archetype?.distribution || {},
      classifiedAt: genome?.archetype?.classifiedAt || null,
    },
    signals: {
      total: genome?.signals?.length || 0,
      recent: (genome?.signals || []).slice(-50).map(s => ({
        type: s.type,
        value: s.value,
        weight: s.weight,
        timestamp: s.timestamp,
        metadata: s.metadata || {},
      })),
    },
    directives: genome?.directives || {
      tone: ['minimal', 'authoritative'],
      keywords: ['taste', 'resonance'],
      avoid: ['generic', 'templated'],
    },
    outcomes: genome?.outcomes || [],
    updatedAt: genome?.lastUpdated || genome?.updatedAt || null,
  };

  return schema;
}

module.exports = {
  buildTasteContext,
  materialize1193Schema,
};
