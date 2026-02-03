/**
 * Best/Worst Quiz Pool — 18 static questions (6 categories × 3)
 * Each question shows 4 cards spanning different archetype quadrants.
 * User picks Best (+1.0 multiplier) and Worst (−0.5 multiplier).
 *
 * Honing templates target confused archetype pairs for deeper discrimination.
 */

const QUIZ_POOL = [
  // ─── creative-drive (3) ─────────────────────────────────────────
  {
    id: 'bw-01',
    prompt: 'Which creative impulse feels most — and least — like you?',
    category: 'creative-drive',
    cards: [
      { id: 'bw-01-a', label: 'Find it first', description: 'Spot what\'s next before anyone else does', weights: { 'V-2': 0.7, 'S-0': 0.3 } },
      { id: 'bw-01-b', label: 'Build the system', description: 'Reverse-engineer excellence into a repeatable process', weights: { 'T-1': 0.7, 'F-9': 0.3 } },
      { id: 'bw-01-c', label: 'Cut to the bone', description: 'Strip away everything that doesn\'t serve the work', weights: { 'C-4': 0.7, 'R-10': 0.3 } },
      { id: 'bw-01-d', label: 'Let it flow through', description: 'Become a vessel — the work moves through you', weights: { 'D-8': 0.7, 'NULL': 0.3 } },
    ],
  },
  {
    id: 'bw-02',
    prompt: 'What drives you to create?',
    category: 'creative-drive',
    cards: [
      { id: 'bw-02-a', label: 'Set the standard', description: 'Define what others will follow', weights: { 'S-0': 0.7, 'H-6': 0.3 } },
      { id: 'bw-02-b', label: 'Ship the thing', description: 'Turn vision into tangible reality, fast', weights: { 'F-9': 0.7, 'T-1': 0.3 } },
      { id: 'bw-02-c', label: 'Break the assumption', description: 'Fracture what everyone takes for granted', weights: { 'R-10': 0.7, 'C-4': 0.3 } },
      { id: 'bw-02-d', label: 'Connect the dots', description: 'Illuminate borders between disparate worlds', weights: { 'N-5': 0.7, 'D-8': 0.3 } },
    ],
  },
  {
    id: 'bw-03',
    prompt: 'When inspiration strikes, you instinctively...',
    category: 'creative-drive',
    cards: [
      { id: 'bw-03-a', label: 'Archive it', description: 'File it deep — it will matter someday', weights: { 'P-7': 0.7, 'L-3': 0.3 } },
      { id: 'bw-03-b', label: 'Refine it', description: 'Compress it into its purest form', weights: { 'C-4': 0.7, 'T-1': 0.3 } },
      { id: 'bw-03-c', label: 'Broadcast it', description: 'Shout it from the rooftops immediately', weights: { 'H-6': 0.7, 'F-9': 0.3 } },
      { id: 'bw-03-d', label: 'Absorb it', description: 'Let it marinate — no rush to act', weights: { 'NULL': 0.7, 'D-8': 0.3 } },
    ],
  },

  // ─── social-orientation (3) ─────────────────────────────────────
  {
    id: 'bw-04',
    prompt: 'Your relationship to your audience is...',
    category: 'social-orientation',
    cards: [
      { id: 'bw-04-a', label: 'Convert them', description: 'Win people over to what matters', weights: { 'H-6': 0.7, 'F-9': 0.3 } },
      { id: 'bw-04-b', label: 'Observe them', description: 'Watch, absorb, let patterns emerge', weights: { 'NULL': 0.7, 'P-7': 0.3 } },
      { id: 'bw-04-c', label: 'Curate for them', description: 'Surface the deep lineage they\'re missing', weights: { 'P-7': 0.7, 'N-5': 0.3 } },
      { id: 'bw-04-d', label: 'Provoke them', description: 'Challenge their comfort — growth requires friction', weights: { 'R-10': 0.7, 'C-4': 0.3 } },
    ],
  },
  {
    id: 'bw-05',
    prompt: 'When sharing your work, you care most about...',
    category: 'social-orientation',
    cards: [
      { id: 'bw-05-a', label: 'Impact', description: 'Did it change how someone thinks?', weights: { 'H-6': 0.7, 'R-10': 0.3 } },
      { id: 'bw-05-b', label: 'Lineage', description: 'Does it honor what came before?', weights: { 'P-7': 0.7, 'L-3': 0.3 } },
      { id: 'bw-05-c', label: 'Connection', description: 'Did it bridge two worlds?', weights: { 'N-5': 0.7, 'D-8': 0.3 } },
      { id: 'bw-05-d', label: 'Silence', description: 'The best response is reverent quiet', weights: { 'NULL': 0.7, 'C-4': 0.3 } },
    ],
  },
  {
    id: 'bw-06',
    prompt: 'In a creative community, you naturally become the...',
    category: 'social-orientation',
    cards: [
      { id: 'bw-06-a', label: 'Evangelist', description: 'Champion what deserves attention', weights: { 'H-6': 0.7, 'S-0': 0.3 } },
      { id: 'bw-06-b', label: 'Librarian', description: 'Know where everything is and why it matters', weights: { 'P-7': 0.7, 'T-1': 0.3 } },
      { id: 'bw-06-c', label: 'Translator', description: 'Bridge jargon, style, and perspective gaps', weights: { 'N-5': 0.7, 'V-2': 0.3 } },
      { id: 'bw-06-d', label: 'Ghost', description: 'Present but unseen — influence without footprint', weights: { 'NULL': 0.7, 'D-8': 0.3 } },
    ],
  },

  // ─── temporal-stance (3) ────────────────────────────────────────
  {
    id: 'bw-07',
    prompt: 'Your relationship with time and trends...',
    category: 'temporal-stance',
    cards: [
      { id: 'bw-07-a', label: 'Ahead of the wave', description: 'You see what\'s coming before it arrives', weights: { 'V-2': 0.7, 'S-0': 0.3 } },
      { id: 'bw-07-b', label: 'Patient cultivator', description: 'Plant seeds now, harvest in years', weights: { 'L-3': 0.7, 'P-7': 0.3 } },
      { id: 'bw-07-c', label: 'Timeless archivist', description: 'What matters isn\'t new — it\'s deep', weights: { 'P-7': 0.7, 'NULL': 0.3 } },
      { id: 'bw-07-d', label: 'Pattern breaker', description: 'Disrupt the cycle, create a new timeline', weights: { 'R-10': 0.7, 'V-2': 0.3 } },
    ],
  },
  {
    id: 'bw-08',
    prompt: 'When a trend goes viral, your instinct is to...',
    category: 'temporal-stance',
    cards: [
      { id: 'bw-08-a', label: 'Ride it early', description: 'You saw it coming — capitalize now', weights: { 'V-2': 0.7, 'F-9': 0.3 } },
      { id: 'bw-08-b', label: 'Wait and deepen', description: 'Let it settle, then add lasting value', weights: { 'L-3': 0.7, 'T-1': 0.3 } },
      { id: 'bw-08-c', label: 'Subvert it', description: 'Flip it on its head — show what it\'s hiding', weights: { 'R-10': 0.7, 'N-5': 0.3 } },
      { id: 'bw-08-d', label: 'Ignore it', description: 'Trends pass — your work is longer than any cycle', weights: { 'P-7': 0.7, 'C-4': 0.3 } },
    ],
  },
  {
    id: 'bw-09',
    prompt: 'Your ideal creative timeline looks like...',
    category: 'temporal-stance',
    cards: [
      { id: 'bw-09-a', label: 'Rapid prototype', description: 'Ship now, refine later, iterate fast', weights: { 'F-9': 0.7, 'V-2': 0.3 } },
      { id: 'bw-09-b', label: 'Slow burn', description: 'Let the work develop at its own pace', weights: { 'L-3': 0.7, 'D-8': 0.3 } },
      { id: 'bw-09-c', label: 'Seasonal cycles', description: 'Oscillate between intense creation and fallow rest', weights: { 'N-5': 0.7, 'NULL': 0.3 } },
      { id: 'bw-09-d', label: 'No timeline', description: 'External deadlines kill the work — art has its own clock', weights: { 'D-8': 0.7, 'R-10': 0.3 } },
    ],
  },

  // ─── craft-philosophy (3) ──────────────────────────────────────
  {
    id: 'bw-10',
    prompt: 'Your approach to craft is best described as...',
    category: 'craft-philosophy',
    cards: [
      { id: 'bw-10-a', label: 'Architectural', description: 'Design the structure first, fill in later', weights: { 'T-1': 0.7, 'S-0': 0.3 } },
      { id: 'bw-10-b', label: 'Editorial', description: 'The work improves by what you remove', weights: { 'C-4': 0.7, 'R-10': 0.3 } },
      { id: 'bw-10-c', label: 'Manifestation', description: 'Ideas are worthless until shipped', weights: { 'F-9': 0.7, 'H-6': 0.3 } },
      { id: 'bw-10-d', label: 'Channelling', description: 'You don\'t make it — it comes through you', weights: { 'D-8': 0.7, 'NULL': 0.3 } },
    ],
  },
  {
    id: 'bw-11',
    prompt: 'The hardest part of creating is...',
    category: 'craft-philosophy',
    cards: [
      { id: 'bw-11-a', label: 'Starting', description: 'The blank page is the enemy', weights: { 'F-9': 0.7, 'D-8': 0.3 } },
      { id: 'bw-11-b', label: 'Stopping', description: 'Knowing when to put the pen down', weights: { 'C-4': 0.7, 'L-3': 0.3 } },
      { id: 'bw-11-c', label: 'Structuring', description: 'Raw ideas need a skeleton', weights: { 'T-1': 0.7, 'N-5': 0.3 } },
      { id: 'bw-11-d', label: 'Releasing', description: 'Letting the work exist apart from you', weights: { 'D-8': 0.7, 'F-9': 0.3 } },
    ],
  },
  {
    id: 'bw-12',
    prompt: 'A finished piece should feel...',
    category: 'craft-philosophy',
    cards: [
      { id: 'bw-12-a', label: 'Inevitable', description: 'Every element in its only possible place', weights: { 'T-1': 0.7, 'C-4': 0.3 } },
      { id: 'bw-12-b', label: 'Alive', description: 'Buzzing with energy that demands attention', weights: { 'F-9': 0.7, 'H-6': 0.3 } },
      { id: 'bw-12-c', label: 'Unsettling', description: 'It should leave a splinter in the mind', weights: { 'R-10': 0.7, 'V-2': 0.3 } },
      { id: 'bw-12-d', label: 'Open', description: 'Space for the audience to enter and complete it', weights: { 'D-8': 0.7, 'NULL': 0.3 } },
    ],
  },

  // ─── knowledge-mode (3) ────────────────────────────────────────
  {
    id: 'bw-13',
    prompt: 'How you acquire and use knowledge...',
    category: 'knowledge-mode',
    cards: [
      { id: 'bw-13-a', label: 'Deep archive', description: 'Read everything, remember the lineage', weights: { 'P-7': 0.7, 'T-1': 0.3 } },
      { id: 'bw-13-b', label: 'Cross-pollination', description: 'Borrow from unrelated fields and remix', weights: { 'N-5': 0.7, 'V-2': 0.3 } },
      { id: 'bw-13-c', label: 'First principles', description: 'Derive truth from the ground up', weights: { 'S-0': 0.7, 'R-10': 0.3 } },
      { id: 'bw-13-d', label: 'Embodied practice', description: 'Knowledge lives in the doing, not the reading', weights: { 'F-9': 0.7, 'D-8': 0.3 } },
    ],
  },
  {
    id: 'bw-14',
    prompt: 'When you encounter a brilliant idea, you...',
    category: 'knowledge-mode',
    cards: [
      { id: 'bw-14-a', label: 'Catalog it', description: 'File it with precision for future retrieval', weights: { 'P-7': 0.7, 'L-3': 0.3 } },
      { id: 'bw-14-b', label: 'Stress-test it', description: 'Push it until it breaks or proves itself', weights: { 'R-10': 0.7, 'T-1': 0.3 } },
      { id: 'bw-14-c', label: 'Translate it', description: 'Reframe it so different audiences can access it', weights: { 'N-5': 0.7, 'H-6': 0.3 } },
      { id: 'bw-14-d', label: 'Apply it', description: 'Immediately turn it into something concrete', weights: { 'F-9': 0.7, 'S-0': 0.3 } },
    ],
  },
  {
    id: 'bw-15',
    prompt: 'Your knowledge library looks like...',
    category: 'knowledge-mode',
    cards: [
      { id: 'bw-15-a', label: 'A vault', description: 'Deep, organized, canonical — nothing lost', weights: { 'P-7': 0.7, 'T-1': 0.3 } },
      { id: 'bw-15-b', label: 'A web', description: 'Everything connects to everything else', weights: { 'N-5': 0.7, 'D-8': 0.3 } },
      { id: 'bw-15-c', label: 'A workshop', description: 'Tools and materials for the next build', weights: { 'F-9': 0.7, 'C-4': 0.3 } },
      { id: 'bw-15-d', label: 'A frontier', description: 'Maps of unexplored territory and hunches', weights: { 'V-2': 0.7, 'S-0': 0.3 } },
    ],
  },

  // ─── output-identity (3) ───────────────────────────────────────
  {
    id: 'bw-16',
    prompt: 'What you produce is ultimately about...',
    category: 'output-identity',
    cards: [
      { id: 'bw-16-a', label: 'Advocacy', description: 'Giving voice to what deserves attention', weights: { 'H-6': 0.7, 'N-5': 0.3 } },
      { id: 'bw-16-b', label: 'Execution', description: 'Making something real that others only imagine', weights: { 'F-9': 0.7, 'T-1': 0.3 } },
      { id: 'bw-16-c', label: 'Legacy', description: 'Contributing to a lineage that outlasts you', weights: { 'L-3': 0.7, 'P-7': 0.3 } },
      { id: 'bw-16-d', label: 'Reception', description: 'Creating space for others to fill', weights: { 'NULL': 0.7, 'D-8': 0.3 } },
    ],
  },
  {
    id: 'bw-17',
    prompt: 'Your signature strength is...',
    category: 'output-identity',
    cards: [
      { id: 'bw-17-a', label: 'Taste', description: 'You know what\'s good before anyone explains why', weights: { 'V-2': 0.7, 'S-0': 0.3 } },
      { id: 'bw-17-b', label: 'Persistence', description: 'You outlast everyone else in the room', weights: { 'L-3': 0.7, 'F-9': 0.3 } },
      { id: 'bw-17-c', label: 'Conviction', description: 'You stand by your work when others waver', weights: { 'H-6': 0.7, 'R-10': 0.3 } },
      { id: 'bw-17-d', label: 'Receptivity', description: 'You hear what others miss in the silence', weights: { 'NULL': 0.7, 'N-5': 0.3 } },
    ],
  },
  {
    id: 'bw-18',
    prompt: 'When people describe your work, you hope they say...',
    category: 'output-identity',
    cards: [
      { id: 'bw-18-a', label: 'It changed me', description: 'Transformative impact that shifts perspective', weights: { 'H-6': 0.7, 'R-10': 0.3 } },
      { id: 'bw-18-b', label: 'It will last', description: 'Built to endure beyond the moment', weights: { 'L-3': 0.7, 'P-7': 0.3 } },
      { id: 'bw-18-c', label: 'It\'s real', description: 'Tangible, polished, undeniably shipped', weights: { 'F-9': 0.7, 'T-1': 0.3 } },
      { id: 'bw-18-d', label: 'It haunts me', description: 'Stays in the mind long after consumption', weights: { 'D-8': 0.7, 'NULL': 0.3 } },
    ],
  },
];

/**
 * Honing question templates — target confused archetype pairs.
 * Generated when all 18 static questions are exhausted.
 * Each template discriminates between two archetypes that have a small probability gap.
 */
const HONING_TEMPLATES = {
  'V-2_S-0': [
    {
      id: 'hone-v2s0-01',
      prompt: 'Early Witness vs Standard-Bearer — which resonates more?',
      category: 'honing',
      cards: [
        { id: 'hone-v2s0-01-a', label: 'Spot the signal', description: 'You see the wave forming before anyone paddles out', weights: { 'V-2': 0.8 } },
        { id: 'hone-v2s0-01-b', label: 'Define the signal', description: 'You don\'t find trends — you create the standard', weights: { 'S-0': 0.8 } },
        { id: 'hone-v2s0-01-c', label: 'Document the signal', description: 'Record it for posterity — the archive matters', weights: { 'P-7': 0.6 } },
        { id: 'hone-v2s0-01-d', label: 'Amplify the signal', description: 'Make sure the right people hear it', weights: { 'H-6': 0.6 } },
      ],
    },
  ],
  'T-1_C-4': [
    {
      id: 'hone-t1c4-01',
      prompt: 'System-Seer vs Essential Editor — which is your core?',
      category: 'honing',
      cards: [
        { id: 'hone-t1c4-01-a', label: 'Add structure', description: 'The work needs a framework to stand on', weights: { 'T-1': 0.8 } },
        { id: 'hone-t1c4-01-b', label: 'Remove noise', description: 'The work needs less, not more', weights: { 'C-4': 0.8 } },
        { id: 'hone-t1c4-01-c', label: 'Ship it raw', description: 'Done is better than perfect', weights: { 'F-9': 0.6 } },
        { id: 'hone-t1c4-01-d', label: 'Let it breathe', description: 'The work will tell you what it needs', weights: { 'D-8': 0.6 } },
      ],
    },
  ],
  'F-9_T-1': [
    {
      id: 'hone-f9t1-01',
      prompt: 'Manifestor vs System-Seer — build or blueprint?',
      category: 'honing',
      cards: [
        { id: 'hone-f9t1-01-a', label: 'Just build', description: 'Execution reveals the path — plan later', weights: { 'F-9': 0.8 } },
        { id: 'hone-f9t1-01-b', label: 'Blueprint first', description: 'Understand the architecture before touching code', weights: { 'T-1': 0.8 } },
        { id: 'hone-f9t1-01-c', label: 'Cut the scope', description: 'Neither — reduce until the answer is obvious', weights: { 'C-4': 0.6 } },
        { id: 'hone-f9t1-01-d', label: 'Ask the audience', description: 'Let demand tell you what to build', weights: { 'H-6': 0.6 } },
      ],
    },
  ],
  'D-8_NULL': [
    {
      id: 'hone-d8null-01',
      prompt: 'Hollow Channel vs Receptive Presence — what flows?',
      category: 'honing',
      cards: [
        { id: 'hone-d8null-01-a', label: 'Through me', description: 'I\'m a conduit — the work uses me as medium', weights: { 'D-8': 0.8 } },
        { id: 'hone-d8null-01-b', label: 'Into me', description: 'I absorb everything — output is secondary', weights: { 'NULL': 0.8 } },
        { id: 'hone-d8null-01-c', label: 'From me', description: 'I create from accumulated inner reserves', weights: { 'P-7': 0.6 } },
        { id: 'hone-d8null-01-d', label: 'Between us', description: 'Creation happens in the connection', weights: { 'N-5': 0.6 } },
      ],
    },
  ],
  'H-6_R-10': [
    {
      id: 'hone-h6r10-01',
      prompt: 'Relentless Advocate vs Productive Fracture — push or break?',
      category: 'honing',
      cards: [
        { id: 'hone-h6r10-01-a', label: 'Convert skeptics', description: 'Win them over with passion and evidence', weights: { 'H-6': 0.8 } },
        { id: 'hone-h6r10-01-b', label: 'Break assumptions', description: 'Shatter what they take for granted', weights: { 'R-10': 0.8 } },
        { id: 'hone-h6r10-01-c', label: 'Build bridges', description: 'Find common ground between opposing views', weights: { 'N-5': 0.6 } },
        { id: 'hone-h6r10-01-d', label: 'Plant seeds', description: 'Nurture change slowly over time', weights: { 'L-3': 0.6 } },
      ],
    },
  ],
  'P-7_L-3': [
    {
      id: 'hone-p7l3-01',
      prompt: 'Living Archive vs Patient Cultivator — preserve or grow?',
      category: 'honing',
      cards: [
        { id: 'hone-p7l3-01-a', label: 'Preserve the canon', description: 'Guard what\'s proven and share its lineage', weights: { 'P-7': 0.8 } },
        { id: 'hone-p7l3-01-b', label: 'Nurture potential', description: 'Invest in what something could become', weights: { 'L-3': 0.8 } },
        { id: 'hone-p7l3-01-c', label: 'Spot early', description: 'Catch it before anyone else', weights: { 'V-2': 0.6 } },
        { id: 'hone-p7l3-01-d', label: 'Ship it now', description: 'Good enough today beats perfect tomorrow', weights: { 'F-9': 0.6 } },
      ],
    },
  ],
  'N-5_D-8': [
    {
      id: 'hone-n5d8-01',
      prompt: 'Border Illuminator vs Hollow Channel — bridge or flow?',
      category: 'honing',
      cards: [
        { id: 'hone-n5d8-01-a', label: 'Build the bridge', description: 'Connect worlds that don\'t know they\'re adjacent', weights: { 'N-5': 0.8 } },
        { id: 'hone-n5d8-01-b', label: 'Be the river', description: 'Don\'t connect — become the flow itself', weights: { 'D-8': 0.8 } },
        { id: 'hone-n5d8-01-c', label: 'Map the terrain', description: 'Document the landscape between them', weights: { 'P-7': 0.6 } },
        { id: 'hone-n5d8-01-d', label: 'Burn the bridge', description: 'Some gaps should stay unbridged', weights: { 'R-10': 0.6 } },
      ],
    },
  ],
  'S-0_F-9': [
    {
      id: 'hone-s0f9-01',
      prompt: 'Standard-Bearer vs Manifestor — define or deliver?',
      category: 'honing',
      cards: [
        { id: 'hone-s0f9-01-a', label: 'Set the bar', description: 'Your role is to define what excellence looks like', weights: { 'S-0': 0.8 } },
        { id: 'hone-s0f9-01-b', label: 'Clear the bar', description: 'Your role is to actually produce the excellent thing', weights: { 'F-9': 0.8 } },
        { id: 'hone-s0f9-01-c', label: 'Question the bar', description: 'Who decided this was the standard anyway?', weights: { 'R-10': 0.6 } },
        { id: 'hone-s0f9-01-d', label: 'Lower the bar', description: 'Simplicity beats ambition', weights: { 'C-4': 0.6 } },
      ],
    },
  ],
  'V-2_R-10': [
    {
      id: 'hone-v2r10-01',
      prompt: 'Early Witness vs Productive Fracture — foresee or fracture?',
      category: 'honing',
      cards: [
        { id: 'hone-v2r10-01-a', label: 'See it coming', description: 'Your gift is temporal — you know what\'s next', weights: { 'V-2': 0.8 } },
        { id: 'hone-v2r10-01-b', label: 'Break it open', description: 'Your gift is structural — you expose hidden flaws', weights: { 'R-10': 0.8 } },
        { id: 'hone-v2r10-01-c', label: 'Archive it', description: 'Neither — record it for those who come after', weights: { 'P-7': 0.6 } },
        { id: 'hone-v2r10-01-d', label: 'Embody it', description: 'Neither — let it live in your practice', weights: { 'D-8': 0.6 } },
      ],
    },
  ],
  'H-6_F-9': [
    {
      id: 'hone-h6f9-01',
      prompt: 'Relentless Advocate vs Manifestor — persuade or produce?',
      category: 'honing',
      cards: [
        { id: 'hone-h6f9-01-a', label: 'Rally the crowd', description: 'Your power is in converting hearts and minds', weights: { 'H-6': 0.8 } },
        { id: 'hone-h6f9-01-b', label: 'Ship the proof', description: 'Your power is in tangible output — show, don\'t tell', weights: { 'F-9': 0.8 } },
        { id: 'hone-h6f9-01-c', label: 'Refine the message', description: 'Power comes from precision and clarity', weights: { 'C-4': 0.6 } },
        { id: 'hone-h6f9-01-d', label: 'Sense the current', description: 'Power comes from reading the room', weights: { 'V-2': 0.6 } },
      ],
    },
  ],
  'L-3_NULL': [
    {
      id: 'hone-l3null-01',
      prompt: 'Patient Cultivator vs Receptive Presence — grow or absorb?',
      category: 'honing',
      cards: [
        { id: 'hone-l3null-01-a', label: 'Tend the garden', description: 'Active patience — nurture with intention', weights: { 'L-3': 0.8 } },
        { id: 'hone-l3null-01-b', label: 'Be the soil', description: 'Passive reception — let things root in you', weights: { 'NULL': 0.8 } },
        { id: 'hone-l3null-01-c', label: 'Prune the garden', description: 'Remove what isn\'t thriving', weights: { 'C-4': 0.6 } },
        { id: 'hone-l3null-01-d', label: 'Design the garden', description: 'Plan the layout for optimal growth', weights: { 'T-1': 0.6 } },
      ],
    },
  ],
  'T-1_S-0': [
    {
      id: 'hone-t1s0-01',
      prompt: 'System-Seer vs Standard-Bearer — reverse-engineer or originate?',
      category: 'honing',
      cards: [
        { id: 'hone-t1s0-01-a', label: 'Decode the machine', description: 'Understand why the best work works', weights: { 'T-1': 0.8 } },
        { id: 'hone-t1s0-01-b', label: 'Set the standard', description: 'Create the reference point others decode', weights: { 'S-0': 0.8 } },
        { id: 'hone-t1s0-01-c', label: 'Break the machine', description: 'Expose what the system hides', weights: { 'R-10': 0.6 } },
        { id: 'hone-t1s0-01-d', label: 'Channel the machine', description: 'Let the system express itself through you', weights: { 'D-8': 0.6 } },
      ],
    },
  ],
  'C-4_R-10': [
    {
      id: 'hone-c4r10-01',
      prompt: 'Essential Editor vs Productive Fracture — subtract or shatter?',
      category: 'honing',
      cards: [
        { id: 'hone-c4r10-01-a', label: 'Subtract carefully', description: 'Remove until only the essential remains', weights: { 'C-4': 0.8 } },
        { id: 'hone-c4r10-01-b', label: 'Shatter completely', description: 'Destroy the frame to see what survives', weights: { 'R-10': 0.8 } },
        { id: 'hone-c4r10-01-c', label: 'Build anew', description: 'Neither — start from scratch with new materials', weights: { 'F-9': 0.6 } },
        { id: 'hone-c4r10-01-d', label: 'Preserve the core', description: 'Neither — protect what already works', weights: { 'P-7': 0.6 } },
      ],
    },
  ],
  'P-7_N-5': [
    {
      id: 'hone-p7n5-01',
      prompt: 'Living Archive vs Border Illuminator — depth or breadth?',
      category: 'honing',
      cards: [
        { id: 'hone-p7n5-01-a', label: 'Go deeper', description: 'Master one lineage completely before branching', weights: { 'P-7': 0.8 } },
        { id: 'hone-p7n5-01-b', label: 'Go wider', description: 'The magic is in unexpected connections between fields', weights: { 'N-5': 0.8 } },
        { id: 'hone-p7n5-01-c', label: 'Go forward', description: 'Neither — look to what hasn\'t been tried yet', weights: { 'V-2': 0.6 } },
        { id: 'hone-p7n5-01-d', label: 'Go inward', description: 'Neither — the answers are already inside you', weights: { 'NULL': 0.6 } },
      ],
    },
  ],
};

/**
 * Categories with their descriptions — used for entropy-based prioritization.
 */
const CATEGORIES = [
  'creative-drive',
  'social-orientation',
  'temporal-stance',
  'craft-philosophy',
  'knowledge-mode',
  'output-identity',
];

module.exports = { QUIZ_POOL, HONING_TEMPLATES, CATEGORIES };
