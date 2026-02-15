/**
 * Twin OS Service
 * Fetches cross-modal identity context from Starforge
 * Combines Visual DNA (from Clarosa) + Audio DNA for content creation guidance
 */

const STARFORGE_API_URL = process.env.STARFORGE_API_URL || 'http://localhost:5000';
const ECOSYSTEM_API_SECRET = process.env.ECOSYSTEM_API_SECRET || 'dev-secret-change-in-production';

/**
 * Fetch Twin OS context from Starforge
 * @param {string} userId - User identifier
 * @returns {Object} Twin OS context with audio/visual DNA and cross-modal coherence
 */
async function getTwinContext(userId = 'default') {
  try {
    const fetch = (await import('node-fetch')).default;

    const response = await fetch(`${STARFORGE_API_URL}/api/twin/visual-dna/context/${userId}`, {
      method: 'GET',
      headers: {
        'X-Ecosystem-Secret': ECOSYSTEM_API_SECRET,
        'X-Source-App': 'slayt',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[TwinOS] Starforge API error:', error);
      return getDefaultContext(userId);
    }

    const data = await response.json();

    if (!data.success) {
      console.warn('[TwinOS] Starforge returned unsuccessful response');
      return getDefaultContext(userId);
    }

    return {
      success: true,
      source: 'starforge',
      ...data
    };
  } catch (error) {
    console.error('[TwinOS] Failed to fetch from Starforge:', error.message);
    return getDefaultContext(userId);
  }
}

/**
 * Get default context when Starforge is unavailable
 */
function getDefaultContext(userId) {
  return {
    success: true,
    source: 'fallback',
    user_id: userId,
    twin_os: {
      audio_dna: {
        message: 'Connect to Starforge for audio analysis'
      },
      visual_dna: {
        message: 'Connect to Clarosa for visual taste training'
      },
      cross_modal_coherence: null,
      archetype: 'Unknown',
      brand_keywords: ['creative', 'authentic']
    },
    content_guidance: {
      visual_direction: 'Develop your visual identity through consistent content',
      caption_voice: 'Authentic and personal',
      avoid: []
    }
  };
}

/**
 * Transform Twin OS context into AI generation prompts
 * @param {Object} context - Twin OS context from Starforge
 * @returns {Object} AI-ready context for caption/content generation
 */
function buildAiContext(context) {
  const twinOs = context.twin_os || {};
  const guidance = context.content_guidance || {};

  return {
    // Visual context for image selection/generation
    visual: {
      palette: twinOs.visual_dna?.dominant_colors || [],
      warmth: twinOs.visual_dna?.warmth,
      energy: twinOs.visual_dna?.energy,
      themes: twinOs.visual_dna?.themes || [],
      direction: guidance.visual_direction
    },

    // Audio context for music/audio content
    audio: {
      sonicPalette: twinOs.audio_dna?.sonic_palette,
      genre: twinOs.audio_dna?.primary_genre,
      tasteCoherence: twinOs.audio_dna?.taste_coherence
    },

    // Brand identity for captions and messaging
    brand: {
      archetype: twinOs.archetype,
      keywords: twinOs.brand_keywords || [],
      captionVoice: guidance.caption_voice,
      avoid: guidance.avoid || []
    },

    // Cross-modal coherence for consistency checks
    coherence: twinOs.cross_modal_coherence,

    // Build system prompt for AI generation
    systemPrompt: buildSystemPrompt(twinOs, guidance)
  };
}

/**
 * Build AI system prompt from Twin OS context
 */
function buildSystemPrompt(twinOs, guidance) {
  const parts = [];

  parts.push('You are a content creation assistant aligned with this creator\'s identity:');

  if (twinOs.archetype && twinOs.archetype !== 'Unknown') {
    parts.push(`\nArchetype: ${twinOs.archetype}`);
  }

  if (twinOs.brand_keywords?.length > 0) {
    parts.push(`Brand keywords: ${twinOs.brand_keywords.join(', ')}`);
  }

  if (guidance.caption_voice) {
    parts.push(`Voice style: ${guidance.caption_voice}`);
  }

  if (twinOs.visual_dna?.themes?.length > 0) {
    parts.push(`Visual themes: ${twinOs.visual_dna.themes.join(', ')}`);
  }

  if (twinOs.audio_dna?.primary_genre) {
    parts.push(`Music genre: ${twinOs.audio_dna.primary_genre}`);
  }

  if (guidance.avoid?.length > 0) {
    parts.push(`\nAvoid: ${guidance.avoid.join(', ')}`);
  }

  if (twinOs.cross_modal_coherence !== null && twinOs.cross_modal_coherence !== undefined) {
    const coherenceDesc = twinOs.cross_modal_coherence >= 0.7
      ? 'High visual-audio coherence - maintain consistency'
      : 'Developing coherence - help strengthen brand identity';
    parts.push(`\n${coherenceDesc}`);
  }

  return parts.join('\n');
}

/**
 * Check if user's visual and audio identities are coherent
 * @param {Object} context - Twin OS context
 * @returns {Object} Coherence status and recommendations
 */
function checkCoherence(context) {
  const coherence = context.twin_os?.cross_modal_coherence;

  if (coherence === null || coherence === undefined) {
    return {
      status: 'incomplete',
      score: null,
      message: 'Complete your visual and audio profiles to enable coherence analysis',
      hasVisualDna: !!context.twin_os?.visual_dna?.dominant_colors,
      hasAudioDna: !!context.twin_os?.audio_dna?.sonic_palette
    };
  }

  if (coherence >= 0.8) {
    return {
      status: 'excellent',
      score: coherence,
      message: 'Your visual and audio identities are strongly aligned'
    };
  } else if (coherence >= 0.6) {
    return {
      status: 'good',
      score: coherence,
      message: 'Good coherence - minor adjustments could strengthen your brand'
    };
  } else {
    return {
      status: 'developing',
      score: coherence,
      message: 'Consider aligning your visual and audio aesthetics for stronger brand identity'
    };
  }
}

/**
 * Sync Visual DNA from Clarosa through Starforge
 * Triggers a fresh pull from Clarosa to update the Twin OS context
 */
async function syncVisualDna(userId = 'default') {
  try {
    const fetch = (await import('node-fetch')).default;

    const response = await fetch(`${STARFORGE_API_URL}/api/twin/visual-dna/sync`, {
      method: 'POST',
      headers: {
        'X-Ecosystem-Secret': ECOSYSTEM_API_SECRET,
        'X-Source-App': 'slayt',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sync failed: ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[TwinOS] Sync Visual DNA error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  getTwinContext,
  buildAiContext,
  checkCoherence,
  syncVisualDna,
  getDefaultContext
};
