import { useState } from 'react';
import {
  GitBranch,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Zap,
  Brain
} from 'lucide-react';

function GenomeEvolutionTimeline({ history, timeRange }) {
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleExpanded = (id) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getArchetypeGlyph = (archetype) => {
    const glyphs = {
      Architect: '🏛️',
      Maven: '💎',
      Maverick: '⚡',
      Artisan: '🎨',
      Sage: '🧙',
      Alchemist: '🔮',
      Titan: '⚔️',
      Muse: '🌙',
      Oracle: '👁️',
      Phoenix: '🔥'
    };
    return glyphs[archetype] || '📊';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 mb-2">No genome evolution data yet</p>
        <p className="text-gray-500 text-sm">
          Your taste genome will evolve as you post content and receive performance feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-accent-purple via-purple-500/50 to-transparent"></div>

        {/* Timeline items */}
        <div className="space-y-6">
          {history.map((item, index) => {
            const isExpanded = expandedItems.has(item._id || index);
            const hasDetails = item.adjustments && item.adjustments.length > 0;

            return (
              <div key={item._id || index} className="relative pl-16">
                {/* Timeline dot */}
                <div className="absolute left-4 w-5 h-5 bg-accent-purple rounded-full border-4 border-dark-900 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white" />
                </div>

                {/* Timeline content card */}
                <div className="bg-dark-700 rounded-lg p-4 border border-dark-600 hover:border-accent-purple/30 transition-colors">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <GitBranch className="w-4 h-4 text-accent-purple" />
                        <h3 className="font-semibold text-white">
                          {item.event || 'Genome Update'}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-400">
                        {new Date(item.timestamp || item.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {hasDetails && (
                      <button
                        onClick={() => toggleExpanded(item._id || index)}
                        className="p-1 hover:bg-dark-600 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Summary */}
                  {item.summary && (
                    <p className="text-sm text-gray-300 mb-3">
                      {item.summary}
                    </p>
                  )}

                  {/* Key changes (always visible) */}
                  {item.keyChanges && item.keyChanges.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {item.keyChanges.map((change, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          {getChangeIcon(change.delta)}
                          <span className="text-gray-400">{change.label}:</span>
                          <span className={`font-semibold ${getChangeColor(change.delta)}`}>
                            {change.delta > 0 ? '+' : ''}{change.delta.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Archetype changes */}
                  {item.archetypeChanges && item.archetypeChanges.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.archetypeChanges.map((change, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1.5 bg-dark-800 rounded-lg border border-dark-600 flex items-center gap-2"
                        >
                          <span className="text-lg">{getArchetypeGlyph(change.archetype)}</span>
                          <span className="text-sm text-gray-300">{change.archetype}</span>
                          <div className="flex items-center gap-1">
                            {getChangeIcon(change.confidenceChange)}
                            <span className={`text-sm font-semibold ${getChangeColor(change.confidenceChange)}`}>
                              {change.confidenceChange > 0 ? '+' : ''}{(change.confidenceChange * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Detailed adjustments (expandable) */}
                  {isExpanded && item.adjustments && item.adjustments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-dark-600">
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">Detailed Adjustments</h4>
                      <div className="space-y-2">
                        {item.adjustments.map((adjustment, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">{adjustment.component}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{adjustment.before.toFixed(3)}</span>
                              <span className="text-gray-600">→</span>
                              <span className="text-white font-semibold">{adjustment.after.toFixed(3)}</span>
                              <span className={`font-semibold ${getChangeColor(adjustment.after - adjustment.before)}`}>
                                ({adjustment.after - adjustment.before > 0 ? '+' : ''}
                                {((adjustment.after - adjustment.before) * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reason/trigger */}
                      {item.reason && (
                        <div className="mt-3 p-3 bg-dark-800 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">Trigger:</p>
                          <p className="text-sm text-gray-300">{item.reason}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Validation reference */}
                  {item.validationId && (
                    <div className="mt-3 text-xs text-gray-500">
                      Validation ID: {item.validationId}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      {history.length > 0 && (
        <div className="mt-6 pt-6 border-t border-dark-700">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-purple">{history.length}</div>
              <div className="text-sm text-gray-400 mt-1">Total Updates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {history.filter(h => h.keyChanges?.some(c => c.delta > 0)).length}
              </div>
              <div className="text-sm text-gray-400 mt-1">Improvements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {new Set(history.flatMap(h => h.archetypeChanges?.map(a => a.archetype) || [])).size}
              </div>
              <div className="text-sm text-gray-400 mt-1">Archetypes Adjusted</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GenomeEvolutionTimeline;
