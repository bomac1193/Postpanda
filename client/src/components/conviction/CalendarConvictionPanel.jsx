import React, { useMemo } from 'react';
import { Calendar, TrendingUp, Award, Clock, AlertTriangle } from 'lucide-react';
import ConvictionBadge from './ConvictionBadge';

/**
 * CalendarConvictionPanel - Insights sidebar for calendar view
 *
 * @param {object} dateRange - {start, end}
 * @param {array} posts - Scheduled posts in date range
 */
const CalendarConvictionPanel = ({
  dateRange,
  posts = []
}) => {
  // Calculate stats
  const stats = useMemo(() => {
    if (!posts || posts.length === 0) {
      return {
        avgScore: 0,
        highConvictionCount: 0,
        lowConvictionCount: 0,
        bestDay: null,
        worstDay: null,
        recommendations: []
      };
    }

    // Filter posts with conviction data
    const postsWithConviction = posts.filter(p => p.conviction?.score !== null && p.conviction?.score !== undefined);

    if (postsWithConviction.length === 0) {
      return {
        avgScore: 0,
        highConvictionCount: 0,
        lowConvictionCount: 0,
        bestDay: null,
        worstDay: null,
        recommendations: ['Calculate conviction scores for scheduled posts to see insights']
      };
    }

    // Calculate average
    const avgScore = Math.round(
      postsWithConviction.reduce((sum, p) => sum + p.conviction.score, 0) / postsWithConviction.length
    );

    // Count tiers
    const highConvictionCount = postsWithConviction.filter(p => p.conviction.score >= 60).length;
    const lowConvictionCount = postsWithConviction.filter(p => p.conviction.score < 40).length;

    // Find best and worst days
    const dayScores = {};
    postsWithConviction.forEach(post => {
      if (!post.scheduledAt) return;
      const date = new Date(post.scheduledAt);
      const dayKey = date.toLocaleDateString('en-US', { weekday: 'long' });

      if (!dayScores[dayKey]) {
        dayScores[dayKey] = { scores: [], count: 0 };
      }

      dayScores[dayKey].scores.push(post.conviction.score);
      dayScores[dayKey].count++;
    });

    const dayAverages = Object.entries(dayScores).map(([day, data]) => ({
      day,
      avg: Math.round(data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length),
      count: data.count
    })).sort((a, b) => b.avg - a.avg);

    const bestDay = dayAverages[0] || null;
    const worstDay = dayAverages[dayAverages.length - 1] || null;

    // Generate recommendations
    const recommendations = [];

    if (lowConvictionCount > 0) {
      recommendations.push(`Review ${lowConvictionCount} low-conviction post${lowConvictionCount !== 1 ? 's' : ''} before scheduling`);
    }

    if (avgScore < 60) {
      recommendations.push('Consider rescheduling lower-scoring content to improve overall performance');
    }

    if (bestDay && worstDay && bestDay.avg - worstDay.avg > 15) {
      recommendations.push(`${bestDay.day} shows strongest conviction - consider scheduling more posts then`);
    }

    const archetypes = postsWithConviction.map(p => p.conviction?.archetypeMatch?.designation).filter(Boolean);
    const uniqueArchetypes = new Set(archetypes);
    if (uniqueArchetypes.size === 1 && archetypes.length > 3) {
      recommendations.push('Consider diversifying content archetypes for better engagement variety');
    }

    if (recommendations.length === 0) {
      recommendations.push('Looking good! Your scheduled content shows strong conviction alignment.');
    }

    return {
      avgScore,
      highConvictionCount,
      lowConvictionCount,
      bestDay,
      worstDay,
      recommendations
    };
  }, [posts]);

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-white font-semibold text-lg flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-green-400" />
          Calendar Insights
        </h3>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <p className="text-gray-400 text-xs mb-1">Average Score</p>
            <div className="flex items-center justify-center">
              <ConvictionBadge score={stats.avgScore} size="md" />
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <p className="text-gray-400 text-xs mb-1">High Conviction</p>
            <p className="text-green-400 text-2xl font-bold">{stats.highConvictionCount}</p>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-3 text-center">
            <p className="text-gray-400 text-xs mb-1">Needs Review</p>
            <p className={`text-2xl font-bold ${stats.lowConvictionCount > 0 ? 'text-orange-400' : 'text-gray-500'}`}>
              {stats.lowConvictionCount}
            </p>
          </div>
        </div>

        {/* Best posting times */}
        {stats.bestDay && (
          <div className="mb-6">
            <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-400" />
              Best Posting Days
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-green-400" />
                  <span className="text-white text-sm font-medium">{stats.bestDay.day}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs">{stats.bestDay.count} posts</span>
                  <ConvictionBadge score={stats.bestDay.avg} size="xs" />
                </div>
              </div>

              {stats.worstDay && stats.worstDay.day !== stats.bestDay.day && (
                <div className="flex items-center justify-between bg-gray-900/30 border border-gray-700 rounded-lg p-3">
                  <span className="text-gray-300 text-sm">{stats.worstDay.day}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">{stats.worstDay.count} posts</span>
                    <ConvictionBadge score={stats.worstDay.avg} size="xs" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div>
          <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            Recommendations
          </h4>
          <div className="space-y-2">
            {stats.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`
                  flex items-start gap-2 p-3 rounded-lg text-sm
                  ${rec.includes('Review') || rec.includes('Consider')
                    ? 'bg-orange-500/10 border border-orange-500/20 text-orange-300'
                    : 'bg-green-500/10 border border-green-500/20 text-green-300'}
                `}
              >
                {rec.includes('Review') || rec.includes('Consider') ? (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <Award className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarConvictionPanel;
