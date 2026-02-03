import { useState, useRef } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { RELIC_PACKS, tryUnlockPack } from '../../lib/reliquary';
import RelicCard, { GeneratedRelicCard } from './RelicCard';
import { Lock, Unlock, Package } from 'lucide-react';

export default function Reliquary({ characters = [], loading = false }) {
  const reliquaryUnlocks = useAppStore((s) => s.reliquaryUnlocks);
  const unlockPack = useAppStore((s) => s.unlockPack);

  // Filter to characters that have relic data (relics array or pseudonym)
  const relicCharacters = characters.filter(
    (c) => (c.lcosData?.relics && c.lcosData.relics.length > 0) || !!c.lcosData?.pseudonym
  );

  // Per-pack password state
  const [packPasswords, setPackPasswords] = useState({});
  const [packFeedback, setPackFeedback] = useState({});
  const [checking, setChecking] = useState(null);
  const inputRefs = useRef({});

  const handlePackSolve = async (e, packId) => {
    e.preventDefault();
    const password = packPasswords[packId]?.trim();
    if (!password || checking) return;

    setChecking(packId);
    setPackFeedback((f) => ({ ...f, [packId]: 'idle' }));

    const matchedId = await tryUnlockPack(password, reliquaryUnlocks);

    if (matchedId === packId) {
      unlockPack(packId);
      setPackFeedback((f) => ({ ...f, [packId]: 'success' }));
      setPackPasswords((p) => ({ ...p, [packId]: '' }));
      setTimeout(() => {
        setPackFeedback((f) => ({ ...f, [packId]: 'idle' }));
      }, 3000);
    } else {
      setPackFeedback((f) => ({ ...f, [packId]: 'wrong' }));
      setTimeout(() => {
        setPackFeedback((f) => ({ ...f, [packId]: 'idle' }));
        setPackPasswords((p) => ({ ...p, [packId]: '' }));
        inputRefs.current[packId]?.focus();
      }, 600);
    }

    setChecking(null);
  };

  return (
    <div className="space-y-10">
      {/* Your Relics — generated via relic mode */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white font-display uppercase tracking-widest">
            Your Relics
          </h2>
          <p className="text-dark-400 text-sm mt-1">
            Relics generated via the Generator's relic mode
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-dark-500 border-t-zinc-400 rounded-full animate-spin mx-auto" />
            <p className="text-dark-500 text-sm mt-3">Loading relics...</p>
          </div>
        ) : relicCharacters.length === 0 ? (
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-8 text-center">
            <Package className="w-8 h-8 text-dark-500 mx-auto mb-3" />
            <p className="text-dark-400 text-sm">
              No generated relics yet. Switch to the Generator tab and use Relic mode to create some.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relicCharacters.map((character) => (
              <GeneratedRelicCard key={character._id || character.id} character={character} />
            ))}
          </div>
        )}
      </section>

      {/* Secret Packs */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white font-display uppercase tracking-widest">
            Secret Packs
          </h2>
          <p className="text-dark-400 text-sm mt-1">
            Curated relic collections — unlock each with a password
          </p>
        </div>

        <div className="space-y-6">
          {RELIC_PACKS.map((pack) => {
            const isUnlocked = !!reliquaryUnlocks[pack.id];
            const feedback = packFeedback[pack.id] || 'idle';
            const isChecking = checking === pack.id;

            if (isUnlocked) {
              return (
                <div key={pack.id}>
                  <div
                    className={`bg-dark-800 rounded-xl border border-zinc-500/20 p-5 mb-4 transition-all ${
                      feedback === 'success' ? 'ring-2 ring-green-500/40' : ''
                    }`}
                    style={{ boxShadow: '0 0 12px 2px rgba(161,161,170,0.06)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dark-700 border border-zinc-500/30 flex items-center justify-center">
                        <Unlock className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm">{pack.name}</h3>
                        <p className="text-xs text-dark-400">{pack.description}</p>
                      </div>
                      <span className="text-xs text-dark-500">{pack.relics.length} relics</span>
                    </div>
                    {reliquaryUnlocks[pack.id]?.unlockedAt && (
                      <p className="text-[10px] text-dark-600 mt-2">
                        Unlocked {new Date(reliquaryUnlocks[pack.id].unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pack.relics.map((relic) => (
                      <RelicCard key={relic.id} relic={relic} />
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={pack.id}
                className={`bg-dark-800 rounded-xl border border-dark-700 p-5 transition-all ${
                  feedback === 'wrong' ? 'animate-[reliquaryShake_0.4s_ease-in-out]' : ''
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-dark-900 border-2 border-dark-600 flex items-center justify-center animate-pulse">
                    <Lock className="w-4 h-4 text-dark-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-dark-300 text-sm">{pack.name}</h3>
                    <p className="text-xs text-dark-500">{pack.relics.length} relics</p>
                  </div>
                </div>

                <form onSubmit={(e) => handlePackSolve(e, pack.id)} className="flex gap-3">
                  <input
                    ref={(el) => { inputRefs.current[pack.id] = el; }}
                    type="text"
                    value={packPasswords[pack.id] || ''}
                    onChange={(e) =>
                      setPackPasswords((p) => ({ ...p, [pack.id]: e.target.value }))
                    }
                    placeholder="Enter pack password..."
                    autoComplete="off"
                    spellCheck={false}
                    disabled={isChecking}
                    className="flex-1 px-4 py-2.5 bg-dark-900 border border-dark-600 rounded-lg text-white text-center font-mono tracking-wider placeholder:text-dark-500 focus:outline-none focus:border-zinc-500/50"
                  />
                  <button
                    type="submit"
                    disabled={!(packPasswords[pack.id] || '').trim() || isChecking}
                    className="px-5 py-2.5 bg-dark-700 border border-zinc-500/30 text-zinc-300 rounded-lg hover:border-zinc-400/50 hover:text-zinc-200 transition-colors text-sm disabled:opacity-50"
                    style={{ boxShadow: '0 0 12px 2px rgba(212,212,216,0.06)' }}
                  >
                    {isChecking ? '...' : 'Unlock'}
                  </button>
                </form>

                {feedback === 'wrong' && (
                  <p className="text-xs text-dark-500 text-center mt-3 italic">
                    Wrong password. Try again.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
