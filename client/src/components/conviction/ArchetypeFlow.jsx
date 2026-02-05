import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

/**
 * ArchetypeFlow - Timeline showing archetype distribution and variety
 *
 * @param {array} scheduledPosts - Array of scheduled posts
 * @param {object} dateRange - Start and end dates
 * @param {string} viewMode - Display mode (timeline, pie, list)
 */
const ArchetypeFlow = ({
  scheduledPosts = [],
  dateRange,
  viewMode = 'pie'
}) => {
  // Process archetype data
  const archetypeData = useMemo(() => {
    if (!scheduledPosts || scheduledPosts.length === 0) return { distribution: [], timeline: [], variety: 0 };

    // Count archetypes
    const counts = {};
    const timeline = [];

    scheduledPosts.forEach(post => {
      if (!post.conviction?.archetypeMatch) return;

      const archetype = post.conviction.archetypeMatch.designation;
      const glyph = post.conviction.archetypeMatch.glyph;

      counts[archetype] = counts[archetype] || { name: archetype, count: 0, glyph };
      counts[archetype].count++;

      if (post.scheduledAt) {
        timeline.push({
          date: new Date(post.scheduledAt),
          archetype,
          glyph,
          score: post.conviction.score
        });
      }
    });

    // Convert to array and calculate variety
    const distribution = Object.values(counts).sort((a, b) => b.count - a.count);
    const variety = distribution.length;

    // Sort timeline by date
    timeline.sort((a, b) => a.date - b.date);

    return { distribution, timeline, variety };
  }, [scheduledPosts]);

  // Colors for pie chart
  const COLORS = [
    '#10b981', // green
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#6366f1', // indigo
  ];

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{payload[0].payload.glyph}</span>
          <div>
            <p className="text-white font-semibold">{payload[0].name}</p>
            <p className="text-gray-400 text-sm">{payload[0].value} posts</p>
          </div>
        </div>
      </div>
    );
  };

  if (!archetypeData.distribution || archetypeData.distribution.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 flex flex-col items-center justify-center h-48">
        <p className="text-gray-400 text-sm">No archetype data available</p>
        <p className="text-gray-500 text-xs mt-1">Schedule posts with conviction scores</p>
      </div>
    );
  }

  if (viewMode === 'timeline') {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="mb-4">
          <h3 className="text-white font-semibold text-sm">Archetype Timeline</h3>
          <p className="text-gray-400 text-xs mt-0.5">
            {archetypeData.variety} unique archetype{archetypeData.variety !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {archetypeData.timeline.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center min-w-fit"
              title={`${item.archetype} - ${item.date.toLocaleDateString()}`}
            >
              <span className="text-2xl mb-1">{item.glyph}</span>
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                ${item.score >= 80 ? 'bg-green-500/20 text-green-400' :
                  item.score >= 60 ? 'bg-green-600/20 text-green-500' :
                  item.score >= 40 ? 'bg-orange-500/20 text-orange-400' :
                  'bg-red-600/20 text-red-400'}
              `}>
                {Math.round(item.score)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="mb-4">
          <h3 className="text-white font-semibold text-sm">Archetype Distribution</h3>
          <p className="text-gray-400 text-xs mt-0.5">
            {archetypeData.variety} archetype{archetypeData.variety !== 1 ? 's' : ''} across {scheduledPosts.length} posts
          </p>
        </div>

        <div className="space-y-2">
          {archetypeData.distribution.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{item.glyph}</span>
                <span className="text-white text-sm">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${(item.count / scheduledPosts.length) * 100}%` }}
                  />
                </div>
                <span className="text-gray-400 text-sm w-12 text-right">{item.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: pie chart
  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <div className="mb-2">
        <h3 className="text-white font-semibold text-sm">Archetype Distribution</h3>
        <p className="text-gray-400 text-xs mt-0.5">
          {archetypeData.variety} unique archetype{archetypeData.variety !== 1 ? 's' : ''}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={archetypeData.distribution}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ glyph }) => glyph}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {archetypeData.distribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-2 flex flex-wrap gap-2 justify-center">
        {archetypeData.distribution.slice(0, 3).map((item, index) => (
          <div key={index} className="flex items-center gap-1 text-xs">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-gray-300">{item.name}</span>
            <span className="text-gray-500">({item.count})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArchetypeFlow;
