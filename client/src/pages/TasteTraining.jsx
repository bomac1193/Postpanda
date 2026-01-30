import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { genomeApi } from '../lib/api';
import { Dna, Target, Activity, ListChecks } from 'lucide-react';

const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const BEST_WORST_POOL = [
  { id: 'bw-opening-thesis', topic: 'opening', prompt: 'Open with a hard thesis. No preamble.', archetypeHint: 'R-10' },
  { id: 'bw-opening-scene', topic: 'opening', prompt: 'Open with a scene and let the idea surface.', archetypeHint: 'D-8' },
  { id: 'bw-payoff-fast', topic: 'payoff', prompt: 'Immediate payoff. Zero suspense.', archetypeHint: 'F-9' },
  { id: 'bw-payoff-slow', topic: 'payoff', prompt: 'Slow burn with a decisive reveal.', archetypeHint: 'D-8' },
  { id: 'bw-hook-contrarian', topic: 'hook', prompt: 'Contrarian hook that polarizes.', archetypeHint: 'R-10' },
  { id: 'bw-hook-curiosity', topic: 'hook', prompt: 'Curiosity hook that pulls me forward.', archetypeHint: 'N-5' },
  { id: 'bw-evidence', topic: 'evidence', prompt: 'Receipts, data, and sources make it land.', archetypeHint: 'T-1' },
  { id: 'bw-constraints', topic: 'constraints', prompt: 'I want to see the constraints or rules behind it.', archetypeHint: 'T-1' },
  { id: 'bw-framework', topic: 'framework', prompt: 'Give me a clear model or system.', archetypeHint: 'T-1' },
  { id: 'bw-narrative', topic: 'narrative', prompt: 'Mythic storytelling and mood over analysis.', archetypeHint: 'D-8' },
  { id: 'bw-structure', topic: 'structure', prompt: 'Frameworks over story arcs.', archetypeHint: 'T-1' },
  { id: 'bw-voice-lived', topic: 'authority', prompt: 'Speak from lived experience.', archetypeHint: 'L-3' },
  { id: 'bw-voice-research', topic: 'authority', prompt: 'Speak from research and synthesis.', archetypeHint: 'T-1' },
  { id: 'bw-audience-insider', topic: 'audience', prompt: 'Talk to insiders with shared context.', archetypeHint: 'P-7' },
  { id: 'bw-audience-bridge', topic: 'audience', prompt: 'Translate for first-timers and outsiders.', archetypeHint: 'L-3' },
  { id: 'bw-risk', topic: 'risk', prompt: 'Make a sharp bet and commit.', archetypeHint: 'R-10' },
  { id: 'bw-nuance', topic: 'nuance', prompt: 'Hold nuance and bridge perspectives.', archetypeHint: 'L-3' },
  { id: 'bw-energy', topic: 'energy', prompt: 'High-voltage, kinetic delivery.', archetypeHint: 'F-9' },
  { id: 'bw-calm', topic: 'energy', prompt: 'Composed, low-velocity delivery.', archetypeHint: 'L-3' },
  { id: 'bw-visual-polish', topic: 'visual', prompt: 'Cinematic, high-design polish.', archetypeHint: 'S-0' },
  { id: 'bw-visual-utility', topic: 'visual', prompt: 'Plain, utilitarian clarity.', archetypeHint: 'T-1' },
  { id: 'bw-format-short', topic: 'format', prompt: 'Shorts, carousels, tight modules.', archetypeHint: 'F-9' },
  { id: 'bw-format-long', topic: 'format', prompt: 'Longform essays and deep dives.', archetypeHint: 'T-1' },
  { id: 'bw-novel-framing', topic: 'novelty', prompt: 'New framing on known ideas.', archetypeHint: 'N-5' },
  { id: 'bw-new-facts', topic: 'novelty', prompt: 'New facts even if framing is familiar.', archetypeHint: 'T-1' },
  { id: 'bw-texture-analog', topic: 'texture', prompt: 'Analog grit and tactile texture.', archetypeHint: 'P-7' },
  { id: 'bw-texture-digital', topic: 'texture', prompt: 'Clean, precise, digital surfaces.', archetypeHint: 'S-0' },
  { id: 'bw-cadence-serial', topic: 'cadence', prompt: 'Serialized drops and ongoing threads.', archetypeHint: 'H-6' },
  { id: 'bw-cadence-single', topic: 'cadence', prompt: 'Standalone, self-contained posts.', archetypeHint: 'S-0' },
  { id: 'bw-signal-subtle', topic: 'signal', prompt: 'Subtle, coded, insider signals.', archetypeHint: 'P-7' },
  { id: 'bw-signal-explicit', topic: 'signal', prompt: 'Direct, explicit, broad reach.', archetypeHint: 'H-6' },
  { id: 'bw-purpose-utility', topic: 'purpose', prompt: 'Change behavior with practical utility.', archetypeHint: 'F-9' },
  { id: 'bw-purpose-shift', topic: 'purpose', prompt: 'Change perception with worldview shifts.', archetypeHint: 'N-5' },
  { id: 'bw-ambiguity', topic: 'ambiguity', prompt: 'A bit of ambiguity keeps me engaged longer.', archetypeHint: 'D-8' },
  { id: 'bw-precision', topic: 'precision', prompt: 'Precision and naming are half the signal.', archetypeHint: 'S-0' },
  { id: 'bw-lineage', topic: 'lineage', prompt: 'Lineage and provenance deepen my trust.', archetypeHint: 'P-7' },
  { id: 'bw-futurism', topic: 'futurism', prompt: 'Future-facing, speculative ideas.', archetypeHint: 'V-2' },
  { id: 'bw-community', topic: 'community', prompt: 'Community reaction is part of the work.', archetypeHint: 'H-6' },
  { id: 'bw-humor', topic: 'humor', prompt: 'Humor is a strong delivery mechanism.', archetypeHint: 'N-5' },
  { id: 'bw-vulnerability', topic: 'vulnerability', prompt: 'Vulnerability connects more than authority.', archetypeHint: 'L-3' },
];

const slugify = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const buildDynamicOptions = (g) => {
  if (!g?.keywords) return [];
  const options = [];
  const tones = Object.entries(g.keywords?.content?.tone || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tone]) => tone);
  tones.forEach((tone) => {
    const slug = slugify(tone);
    options.push({
      id: `bw-tone-${slug}`,
      topic: `tone-${slug}`,
      prompt: `Lean into ${tone} tone.`,
      archetypeHint: null,
    });
  });
  const hooks = Object.entries(g.keywords?.content?.hooks || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hook]) => hook);
  hooks.forEach((hook) => {
    const slug = slugify(hook);
    options.push({
      id: `bw-hook-${slug}`,
      topic: `hook-${slug}`,
      prompt: `Open with a ${hook} hook.`,
      archetypeHint: null,
    });
  });
  return options;
};

const getItemTopic = (item) => item?.topic || item?.id || 'misc';

const buildBestWorstPool = (g) => {
  const dynamic = buildDynamicOptions(g);
  const combined = [...dynamic, ...BEST_WORST_POOL];
  const seenIds = new Set();
  return shuffleArray(combined.filter((item) => {
    if (seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    return true;
  }));
};

const pickUniqueByTopic = (items, count, usedTopics) => {
  const picks = [];
  for (const item of items) {
    const topic = item.topic;
    if (usedTopics.has(topic)) continue;
    usedTopics.add(topic);
    picks.push(item);
    if (picks.length >= count) break;
  }
  return picks;
};

const OPTIONS_PER_CARD = 4;
const QUEUE_SIZE = 1;
const BEST_WORST_WEIGHT = 1.6;

function TasteTraining() {
  const currentProfileId = useAppStore((state) => state.currentProfileId);
  const activeFolioId = useAppStore((state) => state.activeFolioId);
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  const ADMIN_MODE = import.meta.env.VITE_ADMIN_MODE === 'true';

  const [genome, setGenome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trainMessage, setTrainMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [queue, setQueue] = useState([]);
  const [rawGenome, setRawGenome] = useState(null);
  const [recentSignals, setRecentSignals] = useState([]);
  const [adminBusy, setAdminBusy] = useState(false);
  const [askedIds, setAskedIds] = useState(new Set());
  const [askedTopics, setAskedTopics] = useState(new Set());
  const [selections, setSelections] = useState({});

  useEffect(() => {
    loadGenome({ resetAsked: true });
  }, [currentProfileId]);

  const loadGenome = async ({ resetAsked = false, skipQueue = false } = {}) => {
    setLoading(true);
    try {
      const result = await genomeApi.get(currentProfileId || null);
      if (result.hasGenome) {
        setGenome(result.genome);
        const nextAskedIds = resetAsked ? new Set() : askedIds;
        const nextAskedTopics = resetAsked ? new Set() : askedTopics;
        if (resetAsked) {
          setAskedIds(nextAskedIds);
          setAskedTopics(nextAskedTopics);
        }
        if (!skipQueue) {
          setQueue(buildNextQueue(result.genome, nextAskedIds, nextAskedTopics));
        }
        if (ADMIN_MODE) {
          fetchRaw();
        }
        return result.genome;
      }
    } catch (error) {
      console.error('Failed to load genome:', error);
      return null;
    } finally {
      setLoading(false);
    }
    return null;
  };

  const buildNextQueue = (g, askedIdSet = askedIds, askedTopicSet = askedTopics) => {
    const pool = buildBestWorstPool(g).map((option) => ({
      ...option,
      topic: getItemTopic(option),
    }));

    let available = pool.filter((option) => !askedIdSet.has(option.id));
    if (available.length < OPTIONS_PER_CARD) {
      available = pool;
    }

    const queueItems = [];
    const usedTopics = new Set([...askedTopicSet]);
    let remaining = [...available];

    for (let i = 0; i < QUEUE_SIZE && remaining.length >= OPTIONS_PER_CARD; i += 1) {
      const shuffled = shuffleArray(remaining);
      const picks = pickUniqueByTopic(shuffled, OPTIONS_PER_CARD, usedTopics);

      if (picks.length < OPTIONS_PER_CARD) {
        for (const item of shuffled) {
          if (picks.includes(item)) continue;
          picks.push(item);
          if (picks.length >= OPTIONS_PER_CARD) break;
        }
      }

      if (picks.length < OPTIONS_PER_CARD) break;

      const pickIds = new Set(picks.map((item) => item.id));
      remaining = remaining.filter((item) => !pickIds.has(item.id));
      queueItems.push({
        id: `bw-${picks.map((item) => item.id).join('-')}`,
        options: picks,
      });
    }

    return queueItems;
  };

  const handleSelectOption = (cardId, optionId, kind) => {
    if (busy) return;
    setSelections((prev) => {
      const current = prev[cardId] || { best: null, worst: null };
      const next = { ...current };
      if (kind === 'best') {
        next.best = current.best === optionId ? null : optionId;
        if (next.best === next.worst) next.worst = null;
      } else {
        next.worst = current.worst === optionId ? null : optionId;
        if (next.worst === next.best) next.best = null;
      }
      return { ...prev, [cardId]: next };
    });
  };

  const handleSubmitBestWorst = async (card) => {
    const selection = selections[card.id];
    if (!selection?.best || !selection?.worst) return;

    const bestOption = card.options.find((opt) => opt.id === selection.best);
    const worstOption = card.options.find((opt) => opt.id === selection.worst);
    if (!bestOption || !worstOption) return;

    setBusy(true);
    setTrainMessage('Locking in your signal…');
    try {
      await genomeApi.signal(
        'likert',
        null,
        {
          score: 5,
          prompt: bestOption.prompt,
          archetypeHint: bestOption.archetypeHint,
          topic: bestOption.topic,
          optionId: bestOption.id,
          setId: card.id,
          polarity: 'best',
          weightOverride: BEST_WORST_WEIGHT,
          folioId: activeFolioId || undefined,
          projectId: activeProjectId || undefined,
        },
        currentProfileId || null
      );
      await genomeApi.signal(
        'likert',
        null,
        {
          score: 1,
          prompt: worstOption.prompt,
          archetypeHint: worstOption.archetypeHint,
          topic: worstOption.topic,
          optionId: worstOption.id,
          setId: card.id,
          polarity: 'worst',
          weightOverride: BEST_WORST_WEIGHT,
          folioId: activeFolioId || undefined,
          projectId: activeProjectId || undefined,
        },
        currentProfileId || null
      );
      setTrainMessage(`Logged: best "${bestOption.prompt}" / worst "${worstOption.prompt}".`);
      const nextGenome = await loadGenome({ skipQueue: true });
      const nextAskedIds = new Set(askedIds);
      const nextAskedTopics = new Set(askedTopics);
      card.options.forEach((opt) => {
        nextAskedIds.add(opt.id);
        nextAskedTopics.add(opt.topic);
      });
      setAskedIds(nextAskedIds);
      setAskedTopics(nextAskedTopics);
      setSelections((prev) => {
        const next = { ...prev };
        delete next[card.id];
        return next;
      });
      setQueue(buildNextQueue(nextGenome || genome, nextAskedIds, nextAskedTopics));
    } catch (error) {
      console.error('Failed to log best/worst signal:', error);
      setTrainMessage('Could not record this signal. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleSkipCard = async (card) => {
    if (busy) return;
    setBusy(true);
    setTrainMessage('Skipping this card…');
    try {
      await genomeApi.signal(
        'pass',
        card.id,
        {
          neutral: true,
          setId: card.id,
          optionIds: card.options.map((opt) => opt.id),
          topics: card.options.map((opt) => opt.topic),
          folioId: activeFolioId || undefined,
          projectId: activeProjectId || undefined,
        },
        currentProfileId || null
      );
      const nextGenome = await loadGenome({ skipQueue: true });
      const nextAskedIds = new Set(askedIds);
      const nextAskedTopics = new Set(askedTopics);
      card.options.forEach((opt) => {
        nextAskedIds.add(opt.id);
        nextAskedTopics.add(opt.topic);
      });
      setAskedIds(nextAskedIds);
      setAskedTopics(nextAskedTopics);
      setSelections((prev) => {
        const next = { ...prev };
        delete next[card.id];
        return next;
      });
      setQueue(buildNextQueue(nextGenome || genome, nextAskedIds, nextAskedTopics));
      setTrainMessage('Skipped. New card loaded.');
    } catch (error) {
      console.error('Failed to skip card:', error);
      setTrainMessage('Could not skip this card. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const fetchRaw = async () => {
    if (!ADMIN_MODE) return;
    try {
      const raw = await genomeApi.getRaw(currentProfileId || null);
      setRawGenome(raw);
    } catch (error) {
      console.error('Failed to load raw genome:', error);
    }
    try {
      const signals = await genomeApi.getSignals(currentProfileId || null, 20);
      setRecentSignals(signals.signals || []);
    } catch (error) {
      console.error('Failed to load signals:', error);
    }
  };

  const handleRecompute = async () => {
    if (!ADMIN_MODE) return;
    setAdminBusy(true);
    try {
      await genomeApi.recompute(currentProfileId || null);
      await loadGenome();
      await fetchRaw();
    } catch (error) {
      console.error('Failed to recompute genome:', error);
    } finally {
      setAdminBusy(false);
    }
  };

  const handleSeed = async () => {
    if (!ADMIN_MODE) return;
    setAdminBusy(true);
    const seeds = [
      { type: 'choice', id: 'seed-contrarian', metadata: { choice: 'a', selected: 'Contrarian', rejected: 'Consensus' } },
      { type: 'choice', id: 'seed-polish', metadata: { choice: 'b', selected: 'Ship fast', rejected: 'Polish' } },
      { type: 'likert', id: 'seed-likert-intensity', metadata: { score: 4, prompt: 'I prefer intense delivery', archetypeHint: 'R-10' } },
    ];
    try {
      for (const seed of seeds) {
        await genomeApi.signal(seed.type, seed.id, { ...seed.metadata, folioId: activeFolioId || undefined, projectId: activeProjectId || undefined }, currentProfileId || null);
      }
      await loadGenome();
      await fetchRaw();
    } catch (error) {
      console.error('Failed to seed signals:', error);
    } finally {
      setAdminBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-white flex items-center gap-3 tracking-[0.08em]">
              <Dna className="w-6 h-6 text-accent-purple" />
              Subtaste · Training
            </h1>
            <p className="text-sm text-dark-400 mt-2 max-w-xl">
              High-signal inputs to sharpen your profile. Short, focused, and reaction-forward.
            </p>
            {genome?.archetype?.primary && (
              <div className="mt-3 flex items-center gap-3">
                <span className="px-3 py-1 bg-dark-950/60 border border-dark-800 rounded-sm text-[11px] text-dark-100 font-mono tracking-[0.28em] uppercase">
                  {genome.archetype.primary.designation}
                </span>
                <span className="text-lg text-white font-black uppercase tracking-[0.12em]">
                  {genome.archetype.primary.glyph}
                </span>
                {genome.archetype.primary.sigil && (
                  <span className="text-[11px] text-dark-400 font-mono uppercase tracking-[0.14em]">
                    {genome.archetype.primary.sigil}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Unified Training Stack */}
        <div className="relative overflow-hidden rounded-2xl border border-dark-800 bg-dark-950/70 p-5 mb-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-purple/40 to-transparent" />
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-[0.18em] flex items-center gap-2">
              <Target className="w-4 h-4 text-accent-purple" />
              Training Stack
            </h3>
            <span className="text-[10px] text-dark-500 font-mono uppercase tracking-[0.18em]">Best / Worst</span>
          </div>
          <p className="text-sm text-dark-300 mb-4">
            One card at a time. Pick one best and one worst, then lock to continue.
          </p>
          <div className="grid gap-3">
            {queue.map((card, idx) => {
              const selection = selections[card.id] || { best: null, worst: null };
              const isReady = selection.best && selection.worst;
              return (
                <div key={`${card.id}-${idx}`} className="rounded-xl border border-dark-800 bg-dark-950/80 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-dark-500 uppercase tracking-[0.18em]">Best / Worst</p>
                    <p className="text-[10px] text-dark-500 uppercase tracking-[0.18em]">4 Options</p>
                  </div>
                  <div className="space-y-2">
                    {card.options.map((opt) => {
                      const isBest = selection.best === opt.id;
                      const isWorst = selection.worst === opt.id;
                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors ${
                            isBest
                              ? 'border-accent-purple/70 bg-accent-purple/10'
                              : isWorst
                                ? 'border-red-500/60 bg-red-500/10'
                                : 'border-dark-800 bg-dark-950/60'
                          }`}
                        >
                          <span className="text-sm text-dark-100">{opt.prompt}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSelectOption(card.id, opt.id, 'best')}
                              disabled={busy}
                              className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-[0.12em] border transition-colors ${
                                isBest
                                  ? 'border-accent-purple text-white bg-accent-purple/20'
                                  : 'border-dark-800 text-dark-400 hover:text-white hover:border-accent-purple/70'
                              }`}
                            >
                              Best
                            </button>
                            <button
                              onClick={() => handleSelectOption(card.id, opt.id, 'worst')}
                              disabled={busy}
                              className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-[0.12em] border transition-colors ${
                                isWorst
                                  ? 'border-red-500 text-white bg-red-500/20'
                                  : 'border-dark-800 text-dark-400 hover:text-white hover:border-red-500/70'
                              }`}
                            >
                              Worst
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-dark-500 uppercase tracking-[0.14em]">
                      {isReady ? 'Ready to lock' : 'Select best and worst'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSkipCard(card)}
                        disabled={busy}
                        className="px-3 py-1.5 rounded-md border border-dark-800 text-[10px] uppercase tracking-[0.12em] text-dark-400 hover:text-white hover:border-dark-600 hover:bg-dark-900/40 disabled:opacity-40"
                      >
                        Skip
                      </button>
                      <button
                        onClick={() => handleSubmitBestWorst(card)}
                        disabled={!isReady || busy}
                        className="px-3 py-1.5 rounded-md border border-dark-800 text-[10px] uppercase tracking-[0.12em] text-dark-200 hover:text-white hover:border-accent-purple/70 hover:bg-dark-900/60 disabled:opacity-40"
                      >
                        Lock
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {trainMessage && <p className="text-xs text-dark-300 mt-3">{trainMessage}</p>}
        </div>

        {ADMIN_MODE && (
          <div className="bg-dark-950/70 rounded-2xl border border-dark-800 p-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-white uppercase tracking-[0.18em] flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent-purple" />
                Admin Diagnostics
              </h3>
              {adminBusy && <span className="text-xs text-accent-purple">Working…</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSeed}
                disabled={adminBusy}
                className="px-3 py-2 rounded-lg border border-dark-700 text-sm text-white hover:border-accent-purple/70 hover:bg-dark-900/50"
              >
                Seed signals
              </button>
              <button
                onClick={handleRecompute}
                disabled={adminBusy}
                className="px-3 py-2 rounded-lg border border-dark-700 text-sm text-white hover:border-accent-purple/70 hover:bg-dark-900/50"
              >
                Recompute genome
              </button>
              <button
                onClick={fetchRaw}
                disabled={adminBusy}
                className="px-3 py-2 rounded-lg border border-dark-700 text-sm text-white hover:border-accent-purple/70 hover:bg-dark-900/50"
              >
                Refresh raw view
              </button>
            </div>

            {rawGenome?.distribution && (
              <div>
                <h4 className="text-[11px] text-dark-400 uppercase tracking-[0.18em] mb-2 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-accent-purple" />
                  Archetype Distribution
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(rawGenome.distribution).map(([designation, prob]) => (
                    <div key={designation} className="rounded-lg border border-dark-800 p-2 bg-dark-950/80 text-sm text-dark-200 flex items-center justify-between">
                      <span className="font-mono tracking-[0.12em]">{designation}</span>
                      <span className="text-white font-semibold">{Math.round(prob * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentSignals?.length > 0 && (
              <div>
                <h4 className="text-[11px] text-dark-400 uppercase tracking-[0.18em] mb-2 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-accent-purple" />
                  Recent Signals
                </h4>
                <div className="space-y-1 text-sm text-dark-200">
                  {recentSignals.map((sig) => (
                    <div key={sig.id || sig._id || sig.timestamp} className="rounded-lg border border-dark-800 bg-dark-950/80 p-2">
                      <div className="flex items-center justify-between text-xs text-dark-400">
                        <span>{sig.type}</span>
                        <span>{sig.timestamp ? new Date(sig.timestamp).toLocaleString() : ''}</span>
                      </div>
                      <div className="text-dark-100">{sig.data?.prompt || sig.data?.selected || sig.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TasteTraining;
