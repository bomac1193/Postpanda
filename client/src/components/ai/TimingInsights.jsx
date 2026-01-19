import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BestTimeHeatmap from './BestTimeHeatmap';
import './ai-components.css';

function TimingInsights({ platform, onFetchTiming, disabled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timingData, setTimingData] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(platform || 'instagram');

  const PLATFORMS = ['instagram', 'tiktok', 'twitter', 'youtube', 'pinterest'];

  useEffect(() => {
    if (platform) {
      setSelectedPlatform(platform);
    }
  }, [platform]);

  const handleFetchTiming = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await onFetchTiming({ platform: selectedPlatform });
      setTimingData(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch timing data');
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (cellData) => {
    console.log('Selected time slot:', cellData);
  };

  return (
    <div className="ai-timing-insights">
      <div className="ai-section-header">
        <h4>Optimal Posting Times</h4>
        <p className="ai-section-subtitle">
          Discover when your audience is most active
        </p>
      </div>

      <div className="ai-timing-controls">
        <div className="ai-control-group">
          <label className="ai-label">Platform</label>
          <div className="ai-chip-group">
            {PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                className={`ai-chip ${selectedPlatform === p ? 'active' : ''}`}
                onClick={() => setSelectedPlatform(p)}
                disabled={disabled || loading}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="ai-generate-btn primary"
          onClick={handleFetchTiming}
          disabled={disabled || loading}
        >
          {loading ? (
            <>
              <span className="ai-spinner" />
              Loading...
            </>
          ) : (
            'Get Timing Insights'
          )}
        </button>
      </div>

      {error && <p className="ai-error">{error}</p>}

      {timingData && (
        <>
          <BestTimeHeatmap
            data={timingData.heatmapData}
            platform={selectedPlatform}
            onCellClick={handleCellClick}
          />

          {timingData.bestWindows && timingData.bestWindows.length > 0 && (
            <div className="ai-timing-summary">
              <h5 className="ai-improvements-title">Best Posting Windows</h5>
              <div className="ai-timing-cards">
                {timingData.bestWindows.map((window, index) => (
                  <div key={index} className="ai-timing-card">
                    <p className="ai-timing-card-title">{window.label}</p>
                    <p className="ai-timing-card-value">{window.time}</p>
                    {window.engagement && (
                      <p className="ai-timing-card-subtitle">
                        {window.engagement}% higher engagement
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {timingData.insights && timingData.insights.length > 0 && (
            <div className="ai-timing-tips">
              <h5 className="ai-improvements-title">Timing Tips</h5>
              <ul className="ai-improvements-list">
                {timingData.insights.map((insight, index) => (
                  <li key={index} className="ai-improvement-item">
                    <span className="ai-improvement-icon">i</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {timingData.peakHours && (
            <div className="ai-peak-hours">
              <h5 className="ai-improvements-title">Peak Activity Hours</h5>
              <div className="ai-peak-hours-grid">
                {timingData.peakHours.map((peak, index) => (
                  <div key={index} className="ai-peak-hour-item">
                    <span className="ai-peak-day">{peak.day}</span>
                    <span className="ai-peak-time">{peak.time}</span>
                    <span className="ai-peak-score" style={{
                      color: peak.score >= 80 ? '#4CAF50' : peak.score >= 60 ? '#FF9800' : '#f44336'
                    }}>
                      {peak.score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!timingData && !loading && !error && (
        <div className="ai-timing-placeholder">
          <p className="muted">
            Click "Get Timing Insights" to see when your audience is most active
          </p>
        </div>
      )}
    </div>
  );
}

TimingInsights.propTypes = {
  platform: PropTypes.string,
  onFetchTiming: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

TimingInsights.defaultProps = {
  platform: 'instagram',
  disabled: false,
};

export default TimingInsights;
