import PropTypes from 'prop-types';
import './ai-components.css';

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
              stroke="#d4d4d8"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          )}
        </svg>
        <div className="ai-score-value" style={{ color: loading ? '#3f3f46' : '#66023C' }}>
          {loading ? '...' : score !== null ? score : '--'}
        </div>
      </div>
      <div className="ai-score-label">{label}</div>
      {score !== null && !loading && (
        <div className="ai-score-status" style={{ color: '#71717a', fontSize: '0.7rem', marginTop: '0.25rem' }}>
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
