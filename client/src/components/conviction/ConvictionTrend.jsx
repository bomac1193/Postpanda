import React, { useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ConvictionTrend = ({
  scheduledPosts = [],
  dateRange,
  metric = 'conviction',
  chartType = 'area'
}) => {
  const chartData = useMemo(() => {
    if (!scheduledPosts || scheduledPosts.length === 0) return [];

    const grouped = scheduledPosts.reduce((acc, post) => {
      if (!post.scheduledAt || !post.conviction) return acc;

      const date = new Date(post.scheduledAt);
      const dateKey = date.toISOString().split('T')[0];

      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, scores: [], count: 0 };
      }

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

    return Object.values(grouped)
      .map(day => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avg: Math.round(day.scores.reduce((sum, s) => sum + s, 0) / day.scores.length),
        count: day.count
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [scheduledPosts, metric]);

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

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-3">
        <p className="text-dark-300 text-sm mb-1">{payload[0].payload.date}</p>
        <p className="text-dark-100 font-semibold">
          Score: {payload[0].value}
        </p>
        <p className="text-dark-400 text-xs mt-1">
          {payload[0].payload.count} post{payload[0].payload.count !== 1 ? 's' : ''}
        </p>
      </div>
    );
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-dark-800 rounded-lg p-6 flex flex-col items-center justify-center h-48">
        <p className="text-dark-400 text-sm">No trend data available</p>
        <p className="text-dark-500 text-xs mt-1">Schedule posts to see conviction trends</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-dark-100 font-semibold text-sm">
            {metric === 'conviction' ? 'Conviction' : metric === 'taste' ? 'Taste' : 'Performance'} Trend
          </h3>
          <p className="text-dark-400 text-xs mt-0.5">
            {chartData.length} day{chartData.length !== 1 ? 's' : ''} with scheduled posts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {trend.direction === 'up' && (
            <span className="text-dark-300 text-sm">{'\u2191'} +{trend.change}</span>
          )}
          {trend.direction === 'down' && (
            <span className="text-dark-300 text-sm">{'\u2193'} {trend.change}</span>
          )}
          {trend.direction === 'neutral' && (
            <span className="text-dark-400 text-sm">Stable</span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        {chartType === 'area' ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="convictionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#66023C" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#66023C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" stroke="#52525b" style={{ fontSize: '12px' }} />
            <YAxis stroke="#52525b" style={{ fontSize: '12px' }} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="avg"
              stroke="#66023C"
              fill="url(#convictionGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" stroke="#52525b" style={{ fontSize: '12px' }} />
            <YAxis stroke="#52525b" style={{ fontSize: '12px' }} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#66023C"
              strokeWidth={2}
              dot={{ fill: '#66023C', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ConvictionTrend;
