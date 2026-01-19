import { useState } from 'react';
import PropTypes from 'prop-types';
import './ai-components.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getHourLabel(hour) {
  if (hour === 0) return '12a';
  if (hour === 12) return '12p';
  if (hour < 12) return `${hour}a`;
  return `${hour - 12}p`;
}

function getColorForValue(value, maxValue) {
  if (value === 0 || maxValue === 0) return '#e8e2d9';
  const intensity = value / maxValue;

  if (intensity >= 0.8) return '#2E7D32';
  if (intensity >= 0.6) return '#4CAF50';
  if (intensity >= 0.4) return '#8BC34A';
  if (intensity >= 0.2) return '#C5E1A5';
  return '#DCEDC8';
}

function BestTimeHeatmap({ data, platform, onCellClick }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  if (!data || !data.length) {
    return (
      <div className="ai-heatmap-container">
        <div className="ai-heatmap-empty">
          <p>No timing data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.flat());

  const handleCellHover = (day, hour, value, event) => {
    const rect = event.target.getBoundingClientRect();
    setTooltip({
      day: DAYS[day],
      hour: getHourLabel(hour),
      value,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleCellLeave = () => {
    setTooltip(null);
  };

  const handleCellClick = (day, hour, value) => {
    setSelectedCell({ day, hour });
    if (onCellClick) {
      onCellClick({ day: DAYS[day], hour, value });
    }
  };

  return (
    <div className="ai-heatmap-container">
      <div className="ai-section-header">
        <h4>Best Times to Post</h4>
        <p className="ai-section-subtitle">
          Engagement heatmap for {platform || 'your audience'}
        </p>
      </div>

      <div className="ai-heatmap-wrapper">
        <div className="ai-heatmap-grid">
          <div className="ai-heatmap-corner" />
          {HOURS.map((hour) => (
            <div key={hour} className="ai-heatmap-header">
              {hour % 3 === 0 ? getHourLabel(hour) : ''}
            </div>
          ))}

          {DAYS.map((day, dayIndex) => (
            <div key={day} className="ai-heatmap-row">
              <div className="ai-heatmap-row-label">{day}</div>
              {HOURS.map((hour) => {
                const value = data[dayIndex]?.[hour] || 0;
                const isSelected = selectedCell?.day === dayIndex && selectedCell?.hour === hour;

                return (
                  <div
                    key={hour}
                    className={`ai-heatmap-cell ${isSelected ? 'selected' : ''}`}
                    style={{ backgroundColor: getColorForValue(value, maxValue) }}
                    onMouseEnter={(e) => handleCellHover(dayIndex, hour, value, e)}
                    onMouseLeave={handleCellLeave}
                    onClick={() => handleCellClick(dayIndex, hour, value)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${day} ${getHourLabel(hour)}: ${value}% engagement`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="ai-heatmap-legend">
        <span>Low</span>
        <div className="ai-heatmap-legend-gradient" />
        <span>High</span>
      </div>

      {tooltip && (
        <div
          className="ai-heatmap-tooltip"
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <strong>{tooltip.day} {tooltip.hour}</strong>
          <span>{tooltip.value}% engagement</span>
        </div>
      )}
    </div>
  );
}

BestTimeHeatmap.propTypes = {
  data: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  platform: PropTypes.string,
  onCellClick: PropTypes.func,
};

BestTimeHeatmap.defaultProps = {
  data: null,
  platform: 'Instagram',
  onCellClick: null,
};

export default BestTimeHeatmap;
