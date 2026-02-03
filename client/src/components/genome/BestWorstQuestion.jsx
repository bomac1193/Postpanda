// ── Bio-Glow Classified Palette ──────────────────────────────────────────────
const GLOW = '#d4d4d8';        // zinc-300 — primary bio-glow
const GLOW_BRIGHT = '#e4e4e7'; // zinc-200 — emphasis glow
const GLOW_DIM = '#a1a1aa';    // zinc-400 — muted glow
const VIOLET = '#8b5cf6';      // accent-purple — secondary glow
const VIOLET_TEXT = '#c4b5fd';  // violet-300 — readable violet text

export { GLOW, GLOW_BRIGHT, GLOW_DIM, VIOLET, VIOLET_TEXT };

export default function BestWorstQuestion({ question, selection, onSelect }) {
  const { best, worst } = selection || {};

  const handleCardClick = (cardId) => {
    if (best === cardId) {
      onSelect(question.id, { best: null, worst });
    } else if (worst === cardId) {
      onSelect(question.id, { best, worst: null });
    } else if (!best) {
      onSelect(question.id, { best: cardId, worst });
    } else if (!worst) {
      onSelect(question.id, { best, worst: cardId });
    }
  };

  return (
    <div className="bg-dark-900/80 rounded-sm p-6 border" style={{ borderColor: `${GLOW}1a` }}>
      <p className="text-xl text-white mb-2">{question.prompt}</p>
      <p className="text-sm text-dark-400 mb-6">
        Pick your <span style={{ color: GLOW_BRIGHT }}>best</span> and <span style={{ color: VIOLET_TEXT }}>worst</span> from these cards, then lock to continue.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {question.cards.map((card) => {
          const isBest = best === card.id;
          const isWorst = worst === card.id;
          let borderColor = '#27272a';
          let shadow = 'none';
          let tag = null;
          let bg = '#0a0a0c';

          if (isBest) {
            borderColor = `${GLOW}66`;
            shadow = `0 0 10px 2px ${GLOW}1a, inset 0 0 6px 0 ${GLOW}08`;
            tag = 'BEST';
            bg = `${GLOW}06`;
          } else if (isWorst) {
            borderColor = `${VIOLET}aa`;
            shadow = `0 0 10px 2px ${VIOLET}44, inset 0 0 6px 0 ${VIOLET}11`;
            tag = 'WORST';
            bg = `${VIOLET}08`;
          }

          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className="relative p-4 rounded-sm border text-left transition-all hover:border-dark-500"
              style={{ borderColor, boxShadow: shadow, backgroundColor: bg }}
            >
              {tag && (
                <span
                  className="absolute top-2 right-2 px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-[0.2em]"
                  style={{
                    backgroundColor: isBest ? `${GLOW}11` : `${VIOLET}22`,
                    color: isBest ? GLOW_BRIGHT : VIOLET_TEXT,
                    border: `1px solid ${isBest ? `${GLOW}44` : `${VIOLET}66`}`,
                  }}
                >
                  {tag}
                </span>
              )}
              <p className="font-medium text-white pr-14">{card.label}</p>
              <p className="text-sm text-dark-400 mt-1">{card.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
