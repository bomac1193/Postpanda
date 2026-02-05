import React, { useMemo } from 'react';

/**
 * GridAestheticScore - Minimal grid aesthetic score display
 */
const GridAestheticScore = ({ gridItems = [], columns = 3 }) => {
  // Calculate aesthetic score
  const scoreData = useMemo(() => {
    if (!gridItems || gridItems.length === 0) {
      return {
        overallScore: 0,
        avgConviction: 0,
        archetypeConsistency: 0,
        visualFlow: 0,
        breakdown: []
      };
    }

    // Filter items with conviction data
    const itemsWithConviction = gridItems.filter(
      item => item.conviction?.score !== null && item.conviction?.score !== undefined
    );

    if (itemsWithConviction.length === 0) {
      return {
        overallScore: 0,
        avgConviction: 0,
        archetypeConsistency: 0,
        visualFlow: 0,
        breakdown: []
      };
    }

    // 1. Average conviction score
    const avgConviction = Math.round(
      itemsWithConviction.reduce((sum, item) => sum + item.conviction.score, 0) / itemsWithConviction.length
    );

    // 2. Archetype consistency
    const archetypes = itemsWithConviction
      .map(item => item.conviction?.archetypeMatch?.designation)
      .filter(Boolean);

    let archetypeConsistency = 0;
    if (archetypes.length > 0) {
      const counts = {};
      archetypes.forEach(arch => {
        counts[arch] = (counts[arch] || 0) + 1;
      });
      const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      archetypeConsistency = Math.round((mostCommon[1] / archetypes.length) * 100);
    }

    // 3. Visual flow
    const adjacentPairs = getAdjacentPairs(itemsWithConviction, columns);
    const flowScore = adjacentPairs.length > 0
      ? adjacentPairs.filter(([i1, i2]) => {
          if (!i1?.conviction?.score || !i2?.conviction?.score) return false;
          return Math.abs(i1.conviction.score - i2.conviction.score) < 20;
        }).length / adjacentPairs.length
      : 0;

    const visualFlow = Math.round(flowScore * 100);

    // 4. Calculate weighted overall score
    const overallScore = Math.round(
      avgConviction * 0.5 +
      archetypeConsistency * 0.3 +
      visualFlow * 0.2
    );

    // Generate breakdown
    const breakdown = [
      { label: 'Conviction', score: avgConviction, weight: 50 },
      { label: 'Consistency', score: archetypeConsistency, weight: 30 },
      { label: 'Flow', score: visualFlow, weight: 20 }
    ];

    return {
      overallScore,
      avgConviction,
      archetypeConsistency,
      visualFlow,
      breakdown
    };
  }, [gridItems, columns]);

  // Get color based on score
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-dark-900/50 border border-dark-700 rounded-lg p-4">
      {/* Overall Score */}
      <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-dark-700">
        <div className="text-xs uppercase tracking-wider text-dark-400 font-medium">
          Grid Score
        </div>
        <div className={`text-3xl font-light tabular-nums ${getScoreColor(scoreData.overallScore)}`}>
          {scoreData.overallScore}
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-4">
        {scoreData.breakdown.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-dark-300 font-medium">{item.label}</span>
                <span className="text-[10px] text-dark-500 tabular-nums">{item.weight}%</span>
              </div>
              <span className="text-sm text-dark-200 tabular-nums font-mono">{item.score}</span>
            </div>
            <div className="w-full h-1 bg-dark-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-dark-400 transition-all duration-300"
                style={{ width: `${item.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to get adjacent pairs in grid
function getAdjacentPairs(items, columns) {
  const pairs = [];

  items.forEach((item, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;

    // Right neighbor
    if (col < columns - 1 && items[index + 1]) {
      pairs.push([item, items[index + 1]]);
    }

    // Bottom neighbor
    if (row < Math.floor(items.length / columns) && items[index + columns]) {
      pairs.push([item, items[index + columns]]);
    }
  });

  return pairs;
}

export default GridAestheticScore;
