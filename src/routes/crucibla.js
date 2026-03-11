const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

const CRUCIBLA_URL = process.env.CRUCIBLA_URL || 'http://localhost:3000';
const ECOSYSTEM_API_SECRET = process.env.ECOSYSTEM_API_SECRET;

// All routes require authentication
router.use(authenticate);

// GET /api/crucibla/projects — proxy to Crucibla ecosystem API
router.get('/projects', async (req, res) => {
  if (!ECOSYSTEM_API_SECRET) {
    return res.status(503).json({ error: 'Crucibla integration not configured (missing ECOSYSTEM_API_SECRET)' });
  }

  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(400).json({ error: 'User email not available' });
    }

    const response = await fetch(`${CRUCIBLA_URL}/api/ecosystem/projects?email=${encodeURIComponent(userEmail)}`, {
      headers: {
        'X-Ecosystem-Secret': ECOSYSTEM_API_SECRET,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Crucibla API error:', response.status, text);
      return res.status(response.status).json({ error: 'Failed to fetch projects from Crucibla' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Crucibla proxy error:', error.message);
    res.status(502).json({ error: 'Could not reach Crucibla. Is it running?' });
  }
});

module.exports = router;
