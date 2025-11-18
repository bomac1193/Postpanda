const alchemyAiService = require('../services/alchemyAiService');

exports.generateCaptions = async (req, res) => {
  try {
    const { idea, tone = 'neutral' } = req.body || {};

    if (!idea || typeof idea !== 'string') {
      return res.status(400).json({ error: 'idea is required' });
    }

    const captions = await alchemyAiService.generateCaptions(idea.trim(), tone);
    res.json({ captions });
  } catch (error) {
    console.error('Alchemy captions error:', error);
    res.status(500).json({ error: 'Failed to generate captions' });
  }
};

exports.generateIdeas = async (req, res) => {
  try {
    const { niche, examples = [] } = req.body || {};

    if (!niche || typeof niche !== 'string') {
      return res.status(400).json({ error: 'niche is required' });
    }

    if (examples && !Array.isArray(examples)) {
      return res.status(400).json({ error: 'examples must be an array if provided' });
    }

    const ideas = await alchemyAiService.generateIdeas(niche.trim(), examples);
    res.json({ ideas });
  } catch (error) {
    console.error('Alchemy ideas error:', error);
    res.status(500).json({ error: 'Failed to generate ideas' });
  }
};
