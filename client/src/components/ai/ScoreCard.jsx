import PropTypes from 'prop-types';
import './ai-components.css';

const SCORE_COLORS = {
  excellent: '#4CAF50',
  good: '#8BC34A',
  average: '#FF9800',
  poor: '#f44336',
};

function getScoreColor(score) {
  if (score >= 80) return SCORE_COLORS.excellent;
  if (score >= 60) return SCORE_COLORS.good;
  if (score >= 40) return SCORE_COLORS.average;
  return SCORE_COLORS.poor;
}

function getScoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  return 'Needs Work';
}

function ScoreCard({ label, score, description, loading }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const progress = ((score || 0) / 100) * circumference;
  const dashOffset = circumference - progress;
  const color = getScoreColor(score);

  return (
    <div className="ai-score-card" title={description}>
      <div className="ai-score-gauge">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle
            className="ai-score-bg"
            cx="40"
            cy="40"
            r={radius}
          />
          {!loading && score !== null && (
            <circle
              className="ai-score-fill"
              cx="40"
              cy="40"
              r={radius}
              stroke={color}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          )}
        </svg>
        <div className="ai-score-value" style={{ color: loading ? '#ccc' : color }}>
          {loading ? '...' : score !== null ? score : '--'}
        </div>
      </div>
      <div className="ai-score-label">{label}</div>
      {score !== null && !loading && (
        <div className="ai-score-status" style={{ color, fontSize: '0.7rem', marginTop: '0.25rem' }}>
          {getScoreLabel(score)}
        </div>
      )}
    </div>
  );
}

ScoreCard.propTypes = {
  label: PropTypes.string.isRequired,
  score: PropTypes.number,
  description: PropTypes.string,
  loading: PropTypes.bool,
};

ScoreCard.defaultProps = {
  score: null,
  description: '',
  loading: false,
};

export default ScoreCard;
