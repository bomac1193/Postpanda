import { useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function LearningProgressChart({ validations, timeRange }) {
  // Process validations into chart data
  const chartData = useMemo(() => {
    if (!validations || validations.length === 0) return [];

    // Group validations by date
    const groupedByDate = validations.reduce((acc, validation) => {
      const date = new Date(validation.validatedAt || validation.createdAt).toLocaleDateString();

      if (!acc[date]) {
        acc[date] = {
          date,
          validations: [],
          totalAccuracy: 0
        };
      }

      // Calculate accuracy for this validation
      const predicted = validation.predicted?.convictionScore || 0;
      const actual = validation.actual?.engagementScore || 0;
      const accuracy = validation.validation?.accuracy || calculateAccuracy(predicted, actual);

      acc[date].validations.push(validation);
      acc[date].totalAccuracy += accuracy;

      return acc;
    }, {});

    // Convert to array and calculate averages
    const dataPoints = Object.values(groupedByDate).map(group => {
      const avgAccuracy = group.totalAccuracy / group.validations.length;

      // Calculate moving average (7-day)
      const movingAvg = avgAccuracy; // Simplified for now

      return {
        date: group.date,
        accuracy: Math.round(avgAccuracy * 100) / 100,
        movingAverage: Math.round(movingAvg * 100) / 100,
        count: group.validations.length
      };
    });

    // Sort by date
    dataPoints.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Limit data points based on time range
    const limit = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : dataPoints.length;
    return dataPoints.slice(-limit);
  }, [validations, timeRange]);

  // Calculate accuracy from predicted vs actual
  function calculateAccuracy(predicted, actual) {
    if (!actual) return 0;
    const error = Math.abs(predicted - actual);
    const maxError = Math.max(predicted, actual, 100);
    return Math.max(0, 100 - (error / maxError * 100));
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-dark-700 border border-dark-600 rounded-lg p-3 shadow-lg">
        <p className="text-white font-semibold mb-2">{data.date}</p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400">Accuracy:</span>
            <span className="text-green-400 font-semibold">{data.accuracy.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400">Validations:</span>
            <span className="text-white">{data.count}</span>
          </div>
        </div>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="mb-2">No validation data available</p>
          <p className="text-sm">Post content and wait for performance metrics to build learning history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#9ca3af' }}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#9ca3af' }}
            domain={[0, 100]}
            label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
            iconType="line"
          />
          <Area
            type="monotone"
            dataKey="accuracy"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#accuracyGradient)"
            name="Prediction Accuracy"
          />
          <Line
            type="monotone"
            dataKey="movingAverage"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Trend"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Chart Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-green-500 rounded"></div>
          <span className="text-gray-400">Daily Accuracy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-accent-purple rounded" style={{ borderTop: '1px dashed #8b5cf6' }}></div>
          <span className="text-gray-400">Trend Line</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-dark-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {chartData.length > 0 ? chartData[chartData.length - 1].accuracy.toFixed(1) : 0}%
          </div>
          <div className="text-sm text-gray-400 mt-1">Latest Accuracy</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {chartData.length > 0
              ? (chartData.reduce((sum, d) => sum + d.accuracy, 0) / chartData.length).toFixed(1)
              : 0}%
          </div>
          <div className="text-sm text-gray-400 mt-1">Average Accuracy</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-accent-purple">
            {chartData.reduce((sum, d) => sum + d.count, 0)}
          </div>
          <div className="text-sm text-gray-400 mt-1">Total Validations</div>
        </div>
      </div>
    </div>
  );
}

export default LearningProgressChart;
