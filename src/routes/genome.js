/**
 * Genome API Routes
 * Taste genome management, archetype quiz, and gamification
 */

const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const User = require('../models/User');
const Profile = require('../models/Profile');
const tasteGenome = require('../services/tasteGenome');
const { buildTasteContext, materialize1193Schema } = require('../services/tasteContextService');
const { QUIZ_POOL, HONING_TEMPLATES, CATEGORIES } = require('../data/quizPool');

async function getTarget(profileId, userId) {
  if (profileId) {
    const profile = await Profile.findOne({ _id: profileId, userId });
    if (profile) return profile;
  }
  return await User.findById(userId);
}

/**
 * GET /api/genome
 * Get user's taste genome
 */
router.get('/', auth, async (req, res) => {
  try {
    const { profileId } = req.query;
    let genome = null;

    const target = await getTarget(profileId, req.userId);
    genome = target?.tasteGenome;

    if (!genome) {
      return res.json({
        success: true,
        hasGenome: false,
        message: 'No taste genome yet. Take the quiz or start creating content.'
      });
    }

    res.json({
      success: true,
      hasGenome: true,
      summary: tasteGenome.getGenomeSummary(genome),
      genome
    });
  } catch (error) {
    console.error('[Genome] Get error:', error);
    res.status(500).json({ error: 'Failed to get genome' });
  }
});

/**
 * POST /api/genome/signal
 * Record a behavioral signal to evolve the genome
 */
router.post('/signal', auth, async (req, res) => {
  try {
    const { type, value, metadata, profileId } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Signal type required' });
    }

    let target = await getTarget(profileId, req.userId);
    if (!target) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    let genome = target.tasteGenome || tasteGenome.createGenome(req.userId);

    // Record signal and evolve genome
    const evolvedGenome = tasteGenome.recordSignal(genome, {
      type,
      value,
      metadata: metadata || {},
      timestamp: new Date()
    });

    // Save evolved genome
    target.tasteGenome = evolvedGenome;
    if (typeof target.markModified === 'function') {
      target.markModified('tasteGenome');
    }
    await target.save();

    res.json({
      success: true,
      xpGained: tasteGenome.XP_REWARDS[type] || 5,
      tier: tasteGenome.getCurrentTier(evolvedGenome),
      archetype: evolvedGenome.archetype.primary ? {
        glyph: evolvedGenome.archetype.primary.glyph,
        confidence: evolvedGenome.archetype.confidence
      } : null,
      confidence: evolvedGenome.confidence
    });
  } catch (error) {
    console.error('[Genome] Signal error:', error);
    res.status(500).json({ error: 'Failed to record signal' });
  }
});

/**
 * POST /api/genome/folio-signal
 * Convenience endpoint to ingest Folio signals (save/like/skip)
 */
router.post('/folio-signal', auth, async (req, res) => {
  try {
    const { action, metadata = {}, profileId } = req.body;
    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const type = action === 'skip' ? 'skip' : (action === 'like' || action === 'save' ? 'save' : 'implicit');
    const signalMeta = { ...metadata, source: 'folio' };

    let target = await getTarget(profileId, req.userId);
    if (!target) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    let genome = target.tasteGenome || tasteGenome.createGenome(req.userId);
    genome = tasteGenome.recordSignal(genome, {
      type,
      value: metadata?.contentId || action,
      metadata: signalMeta,
      timestamp: new Date()
    });

    target.tasteGenome = genome;
    if (typeof target.markModified === 'function') {
      target.markModified('tasteGenome');
    }
    await target.save();

    res.json({ success: true, archetype: genome.archetype?.primary || null });
  } catch (error) {
    console.error('[Genome] Folio signal error:', error);
    res.status(500).json({ error: 'Failed to record folio signal' });
  }
});

/**
 * POST /api/genome/quiz
 * Process archetype quiz responses (best/worst card format + backward compat)
 */
router.post('/quiz', auth, async (req, res) => {
  try {
    const { responses, profileId } = req.body;

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: 'Quiz responses required' });
    }

    let target = await getTarget(profileId, req.userId);
    if (!target) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    let genome = target.tasteGenome || tasteGenome.createGenome(req.userId);

    // Process each quiz response
    responses.forEach(response => {
      // Backward compat: old binary format has response.answer
      if (response.answer !== undefined) {
        const archetypeWeights = response.weights || {};
        genome = tasteGenome.recordSignal(genome, {
          type: 'choice',
          value: response.questionId,
          metadata: {
            questionId: response.questionId,
            answer: response.answer,
            archetypeWeights
          }
        });
        Object.entries(archetypeWeights).forEach(([designation, weight]) => {
          genome.signals.push({
            type: 'choice',
            value: response.answer,
            weight: 1.0,
            archetypeWeights: { [designation]: weight },
            timestamp: new Date()
          });
        });
        return;
      }

      // New best/worst card format: { questionId, best, worst }
      const question = [...QUIZ_POOL, ...Object.values(HONING_TEMPLATES).flat()]
        .find(q => q.id === response.questionId);
      if (!question) return;

      const bestCard = question.cards.find(c => c.id === response.best);
      const worstCard = question.cards.find(c => c.id === response.worst);

      // Best card: +1.0 multiplier
      if (bestCard) {
        genome.signals.push({
          type: 'choice',
          value: bestCard.id,
          weight: 1.0,
          archetypeWeights: { ...bestCard.weights },
          metadata: { questionId: response.questionId, selection: 'best' },
          timestamp: new Date()
        });
      }

      // Worst card: −0.5 multiplier
      if (worstCard) {
        const negWeights = {};
        Object.entries(worstCard.weights).forEach(([d, w]) => {
          negWeights[d] = w * -0.5;
        });
        genome.signals.push({
          type: 'choice',
          value: worstCard.id,
          weight: 1.0,
          archetypeWeights: negWeights,
          metadata: { questionId: response.questionId, selection: 'worst' },
          timestamp: new Date()
        });
      }
    });

    // Re-classify after quiz
    const distribution = {};
    Object.keys(tasteGenome.ARCHETYPES).forEach(d => { distribution[d] = 0; });

    genome.signals.forEach(signal => {
      Object.entries(signal.archetypeWeights || {}).forEach(([d, w]) => {
        if (distribution[d] !== undefined) {
          distribution[d] += w * Math.abs(signal.weight || 1);
        }
      });
    });

    // Softmax normalization
    const temperature = 5;
    const designations = Object.keys(tasteGenome.ARCHETYPES);
    let sumExp = 0;
    const expValues = {};

    designations.forEach(d => {
      expValues[d] = Math.exp((distribution[d] || 0) / temperature);
      sumExp += expValues[d];
    });

    designations.forEach(d => {
      distribution[d] = sumExp > 0 ? expValues[d] / sumExp : 1 / designations.length;
    });

    const sorted = Object.entries(distribution).sort((a, b) => b[1] - a[1]);

    genome.archetype.distribution = distribution;
    genome.archetype.primary = {
      designation: sorted[0][0],
      confidence: sorted[0][1],
      ...tasteGenome.ARCHETYPES[sorted[0][0]]
    };

    if (sorted[1][1] > 0.12) {
      genome.archetype.secondary = {
        designation: sorted[1][0],
        confidence: sorted[1][1],
        ...tasteGenome.ARCHETYPES[sorted[1][0]]
      };
    }

    genome.archetype.classifiedAt = new Date();

    // Award quiz achievement
    tasteGenome.updateGamification(genome, 'score_content');

    // Save
    target.tasteGenome = genome;
    if (typeof target.markModified === 'function') {
      target.markModified('tasteGenome');
    }
    await target.save();

    res.json({
      success: true,
      archetype: {
        primary: genome.archetype.primary,
        secondary: genome.archetype.secondary,
        confidence: genome.archetype.confidence,
        distribution
      },
      tier: tasteGenome.getCurrentTier(genome),
      summary: tasteGenome.getGenomeSummary(genome)
    });
  } catch (error) {
    console.error('[Genome] Quiz error:', error);
    res.status(500).json({ error: 'Failed to process quiz' });
  }
});

/**
 * GET /api/genome/quiz/questions
 * Serve best/worst card questions — filters answered, supports honing mode
 */
router.get('/quiz/questions', auth, async (req, res) => {
  try {
    const { profileId } = req.query;
    const target = await getTarget(profileId, req.userId);
    const genome = target?.tasteGenome;

    // Extract answered question IDs from signals
    const answeredIds = new Set();
    if (genome && genome.signals) {
      genome.signals.forEach(s => {
        const qid = s.metadata?.questionId;
        if (qid && (qid.startsWith('bw-') || qid.startsWith('hone-'))) {
          answeredIds.add(qid);
        }
      });
    }

    const answeredCount = answeredIds.size;
    const totalPool = QUIZ_POOL.length;

    // Filter to unanswered static questions
    const unanswered = QUIZ_POOL.filter(q => !answeredIds.has(q.id));

    if (unanswered.length > 0) {
      // Determine how many to serve
      let selected;

      if (answeredCount === 0) {
        // First quiz: one per category (up to 5), randomly chosen
        const byCategory = {};
        unanswered.forEach(q => {
          if (!byCategory[q.category]) byCategory[q.category] = [];
          byCategory[q.category].push(q);
        });
        selected = [];
        const cats = Object.keys(byCategory);
        // Shuffle categories
        for (let i = cats.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cats[i], cats[j]] = [cats[j], cats[i]];
        }
        for (const cat of cats.slice(0, 5)) {
          const pool = byCategory[cat];
          selected.push(pool[Math.floor(Math.random() * pool.length)]);
        }
      } else {
        // Retake: prioritize categories with highest entropy in distribution
        if (genome?.archetype?.distribution) {
          const dist = genome.archetype.distribution;
          // Compute per-category entropy (archetypes touched by each category)
          const catEntropy = {};
          for (const cat of CATEGORIES) {
            const catQuestions = QUIZ_POOL.filter(q => q.category === cat);
            const touched = new Set();
            catQuestions.forEach(q => q.cards.forEach(c => {
              Object.keys(c.weights).forEach(d => touched.add(d));
            }));
            let entropy = 0;
            for (const d of touched) {
              const p = dist[d] || 0;
              if (p > 0) entropy -= p * Math.log(p);
            }
            catEntropy[cat] = entropy;
          }
          // Sort unanswered by category entropy (highest first)
          unanswered.sort((a, b) => (catEntropy[b.category] || 0) - (catEntropy[a.category] || 0));
        }
        selected = unanswered.slice(0, 5);
      }

      return res.json({
        success: true,
        questions: selected,
        mode: 'standard',
        answeredCount,
        totalPool,
      });
    }

    // Pool exhausted — honing mode
    const distribution = genome?.archetype?.distribution || {};
    const designations = Object.keys(distribution);

    // Find confused pairs (smallest probability gap)
    const pairs = [];
    for (let i = 0; i < designations.length; i++) {
      for (let j = i + 1; j < designations.length; j++) {
        const gap = Math.abs((distribution[designations[i]] || 0) - (distribution[designations[j]] || 0));
        pairs.push({ a: designations[i], b: designations[j], gap });
      }
    }
    pairs.sort((a, b) => a.gap - b.gap);

    // Find honing questions for top confused pairs
    const honingQuestions = [];
    for (const pair of pairs) {
      if (honingQuestions.length >= 3) break;
      const key1 = `${pair.a}_${pair.b}`;
      const key2 = `${pair.b}_${pair.a}`;
      const templates = HONING_TEMPLATES[key1] || HONING_TEMPLATES[key2] || [];
      for (const tmpl of templates) {
        if (!answeredIds.has(tmpl.id) && honingQuestions.length < 3) {
          honingQuestions.push(tmpl);
        }
      }
    }

    if (honingQuestions.length > 0) {
      return res.json({
        success: true,
        questions: honingQuestions,
        mode: 'honing',
        answeredCount,
        totalPool,
      });
    }

    // All honing exhausted
    return res.json({
      success: true,
      questions: [],
      mode: 'complete',
      answeredCount,
      totalPool,
    });
  } catch (error) {
    console.error('[Genome] Quiz questions error:', error);
    res.status(500).json({ error: 'Failed to load quiz questions' });
  }
});

/**
 * GET /api/genome/gamification
 * Get gamification state
 */
router.get('/gamification', auth, async (req, res) => {
  try {
    const { profileId } = req.query;
    let genome = null;

    if (profileId) {
      const profile = await Profile.findOne({ _id: profileId, userId: req.userId });
      genome = profile?.tasteGenome;
    }

    if (!genome) {
      const user = await User.findById(req.userId);
      genome = user?.tasteGenome;
    }

    if (!genome) {
      return res.json({
        success: true,
        tier: tasteGenome.TASTE_TIERS[0],
        xp: 0,
        streak: 0,
        achievements: [],
        allAchievements: tasteGenome.ACHIEVEMENTS
      });
    }

    res.json({
      success: true,
      tier: tasteGenome.getCurrentTier(genome),
      xp: genome.gamification.xp,
      streak: genome.gamification.streak,
      longestStreak: genome.gamification.longestStreak,
      achievements: genome.gamification.achievements,
      allAchievements: tasteGenome.ACHIEVEMENTS,
      stats: {
        totalScores: genome.gamification.totalScores,
        totalPublished: genome.gamification.totalPublished,
        totalHooksGenerated: genome.gamification.totalHooksGenerated,
        uniqueStyles: genome.gamification.uniqueStyles.length,
        uniqueHooks: genome.gamification.uniqueHooks.length
      }
    });
  } catch (error) {
    console.error('[Genome] Gamification error:', error);
    res.status(500).json({ error: 'Failed to get gamification data' });
  }
});

/**
 * GET /api/genome/archetypes
 * Get all archetype definitions
 */
router.get('/archetypes', (req, res) => {
  res.json({
    success: true,
    archetypes: tasteGenome.ARCHETYPES
  });
});

/**
 * GET /api/genome/raw
 * Full genome object for diagnostics/admin
 */
router.get('/raw', auth, async (req, res) => {
  try {
    const { profileId } = req.query;
    const target = await getTarget(profileId, req.userId);
    if (!target || !target.tasteGenome) {
      return res.status(404).json({ error: 'Genome not found' });
    }
    res.json({
      success: true,
      genome: target.tasteGenome,
      distribution: target.tasteGenome.archetype?.distribution || {},
      signals: target.tasteGenome.signals?.length || 0
    });
  } catch (error) {
    console.error('[Genome] Raw error:', error);
    res.status(500).json({ error: 'Failed to load genome' });
  }
});

/**
 * GET /api/genome/signals
 * Recent signals for diagnostics/admin
 */
router.get('/signals', auth, async (req, res) => {
  try {
    const { profileId, limit = 20 } = req.query;
    const target = await getTarget(profileId, req.userId);
    if (!target || !target.tasteGenome) {
      return res.status(404).json({ error: 'Genome not found' });
    }
    const signals = target.tasteGenome.signals || [];
    const slice = signals.slice(-Number(limit)).reverse();
    res.json({ success: true, signals: slice });
  } catch (error) {
    console.error('[Genome] Signals error:', error);
    res.status(500).json({ error: 'Failed to load signals' });
  }
});

/**
 * GET /api/genome/schema
 * Return a materialised 1193 schema view for clients
 */
router.get('/schema', auth, async (req, res) => {
  try {
    const { profileId } = req.query;
    const target = await getTarget(profileId, req.userId);
    if (!target || !target.tasteGenome) {
      return res.status(404).json({ error: 'Genome not found' });
    }
    const schema = materialize1193Schema(target.tasteGenome);
    res.json({ success: true, schema });
  } catch (error) {
    console.error('[Genome] Schema error:', error);
    res.status(500).json({ error: 'Failed to load schema' });
  }
});

/**
 * GET /api/genome/context
 * Build shared taste context (for generation guardrails)
 */
router.get('/context', auth, async (req, res) => {
  try {
    const { profileId } = req.query;
    const context = await buildTasteContext({ userId: req.userId, profileId });
    res.json({ success: true, context });
  } catch (error) {
    console.error('[Genome] Context error:', error);
    res.status(500).json({ error: 'Failed to build context' });
  }
});

/**
 * GET /api/genome/dashboard
 * Minimal 3-signal dashboard: taste confidence, skip rate, ROAS (placeholder)
 */
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { profileId } = req.query;
    const target = await getTarget(profileId, req.userId);
    if (!target || !target.tasteGenome) {
      return res.status(404).json({ error: 'Genome not found' });
    }
    const genome = target.tasteGenome;
    const signals = genome.signals || [];

    const tasteConfidence = genome?.archetype?.primary?.confidence || genome.confidence || 0;
    const skipSignals = signals.filter(s => s.type === 'skip');
    const likeSignals = signals.filter(s => s.type === 'save' || s.type === 'like');
    const skipRate = (skipSignals.length + likeSignals.length) > 0
      ? skipSignals.length / (skipSignals.length + likeSignals.length)
      : 0;

    // Placeholder ROAS; future: pull from performance metrics
    const roas = genome?.outcomes?.slice(-1)[0]?.roas || 0;

    res.json({
      success: true,
      metrics: {
        tasteConfidence,
        skipRate,
        roas,
      },
      counts: {
        totalSignals: signals.length,
        skipSignals: skipSignals.length,
        likeSignals: likeSignals.length,
      },
      lastUpdated: genome.lastUpdated || genome.updatedAt || null,
    });
  } catch (error) {
    console.error('[Genome] Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard metrics' });
  }
});

/**
 * POST /api/genome/recompute
 * Recompute archetype distribution from stored signals
 */
router.post('/recompute', auth, async (req, res) => {
  try {
    const { profileId } = req.body;
    const target = await getTarget(profileId, req.userId);
    if (!target) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    let genome = target.tasteGenome || tasteGenome.createGenome(req.userId);
    tasteGenome.updateArchetypeFromSignals(genome);
    genome.confidence = tasteGenome.calculateConfidence(genome);
    genome.lastUpdated = new Date();
    target.tasteGenome = genome;
    if (typeof target.markModified === 'function') {
      target.markModified('tasteGenome');
    }
    await target.save();
    res.json({
      success: true,
      archetype: genome.archetype,
      distribution: genome.archetype.distribution,
      confidence: genome.confidence
    });
  } catch (error) {
    console.error('[Genome] Recompute error:', error);
    res.status(500).json({ error: 'Failed to recompute genome' });
  }
});

module.exports = router;
