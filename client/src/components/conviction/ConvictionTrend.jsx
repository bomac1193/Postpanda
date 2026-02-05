import React, { useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * ConvictionTrend - Chart showing conviction score trends over time
 *
 * @param {array} scheduledPosts - Array of scheduled posts with conviction data
 * @param {object} dateRange - Start and end dates {start, end}
 * @param {string} metric - Metric to display (conviction, taste, performance)
 * @param {string} chartType - Type of chart (line, area)
 */
const ConvictionTrend = ({
  scheduledPosts = [],
  dateRange,
  metric = 'conviction',
  chartType = 'area'
}) => {
  // Process data for chart
  const chartData = useMemo(() => {
    if (!scheduledPosts || scheduledPosts.length === 0) return [];

    // Group posts by date
    const grouped = scheduledPosts.reduce((acc, post) => {
      if (!post.scheduledAt || !post.conviction) return acc;

      const date = new Date(post.scheduledAt);
      const dateKey = date.toISOString().split('T')[0];

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          scores: [],
          count: 0
        };
      }

      // Extract metric value
      let value;
      switch (metric) {
        case 'taste':
          value = post.conviction.breakdown?.taste || 0;
          break;
        case 'performance':
          value = post.conviction.breakdown?.performance || 0;
          break;
        default:
          value = post.conviction.score || 0;
      }

      acc[dateKey].scores.push(value);
      acc[dateKey].count++;

      return acc;
    }, {});

    // Calculate averages and format for chart
    return Object.values(grouped)
      .map(day => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avg: Math.round(day.scores.reduce((sum, s) => sum + s, 0) / day.scores.length),
        count: day.count
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [scheduledPosts, metric]);

  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return { direction: 'neutral', change: 0 };

    const firstHalf = chartData.slice(0, Math.ceil(chartData.length / 2));
    const secondHalf = chartData.slice(Math.ceil(chartData.length / 2));

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.avg, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.avg, 0) / secondHalf.length;

    const change = Math.round(secondAvg - firstAvg);

    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'neutral',
      change
    };
  }, [chartData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3 backdrop-blur-sm">
        <p className="text-gray-300 text-sm mb-1">{payload[0].payload.date}</p>
        <p className="text-green-400 font-semibold">
          Score: {payload[0].value}
        </p>
        <p className="text-gray-400 text-xs mt-1">
          {payload[0].payload.count} post{payload[0].payload.count !== 1 ? 's' : ''}
        </p>
      </div>
    );
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 flex flex-col items-center justify-center h-48">
        <p className="text-gray-400 text-sm">No trend data available</p>
        <p className="text-gray-500 text-xs mt-1">Schedule posts to see conviction trends</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-sm">
            {metric === 'conviction' ? 'Conviction' : metric === 'taste' ? 'Taste' : 'Performance'} Trend
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">
            {chartData.length} day{chartData.length !== 1 ? 's' : ''} with scheduled posts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {trend.direction === 'up' && (
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>+{trend.change}</span>
            </div>
          )}
          {trend.direction === 'down' && (
            <div className="flex items-center gap-1 text-red-400 text-sm">
              <TrendingDown className="w-4 h-4" />
              <span>{trend.change}</span>
            </div>
          )}
          {trend.direction === 'neutral' && (
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <Minus className="w-4 h-4" />
              <span>Stable</span>
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        {chartType === 'area' ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="convictionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="avg"
              stroke="#10b981"
              fill="url(#convictionGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ConvictionTrend;
