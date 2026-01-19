import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ScoreCard from './ScoreCard';
import ImprovementSuggestions from './ImprovementSuggestions';
import './ai-components.css';

const SCORE_DESCRIPTIONS = {
  virality: 'Measures potential for shares, saves, and organic reach based on content appeal and trend alignment',
  engagement: 'Predicts likes, comments, and interactions based on caption quality, hashtags, and call-to-actions',
  aesthetic: 'Evaluates visual quality including composition, lighting, colors, and overall professional appearance',
  trend: 'Assesses alignment with current trends, optimal hashtag usage, and timing relevance',
};

function PerformancePredictor({ contentId, onAnalyze, disabled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scores, setScores] = useState({
    viralityScore: null,
    engagementScore: null,
    aestheticScore: null,
    trendScore: null,
  });
  const [suggestions, setSuggestions] = useState(null);
  const [creatorInsights, setCreatorInsights] = useState(null);

  useEffect(() => {
    setScores({
      viralityScore: null,
      engagementScore: null,
      aestheticScore: null,
      trendScore: null,
    });
    setSuggestions(null);
    setCreatorInsights(null);
    setError('');
  }, [contentId]);

  const handleAnalyze = async () => {
    if (!contentId) {
      setError('No content selected');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await onAnalyze({ contentId });

      if (result.aiScores) {
        setScores({
          viralityScore: result.aiScores.viralityScore,
          engagementScore: result.aiScores.engagementScore,
          aestheticScore: result.aiScores.aestheticScore,
          trendScore: result.aiScores.trendScore,
        });
      }

      if (result.aiSuggestions) {
        setSuggestions(result.aiSuggestions);
      }

      if (result.creatorInsights) {
        setCreatorInsights(result.creatorInsights);
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze content');
    } finally {
      setLoading(false);
    }
  };

  const overallScore = scores.viralityScore !== null
    ? Math.round(
        (scores.viralityScore + scores.engagementScore + scores.aestheticScore + scores.trendScore) / 4
      )
    : null;

  const hasScores = scores.viralityScore !== null;

  return (
    <div className="ai-performance-predictor">
      <div className="ai-section-header">
        <h4>Performance Predictor</h4>
        <p className="ai-section-subtitle">AI-powered analysis of your content's potential</p>
      </div>

      <div className="ai-scores-grid">
        <ScoreCard
          label="Virality"
          score={scores.viralityScore}
          description={SCORE_DESCRIPTIONS.virality}
          loading={loading}
        />
        <ScoreCard
          label="Engagement"
          score={scores.engagementScore}
          description={SCORE_DESCRIPTIONS.engagement}
          loading={loading}
        />
        <ScoreCard
          label="Aesthetic"
          score={scores.aestheticScore}
          description={SCORE_DESCRIPTIONS.aesthetic}
          loading={loading}
        />
        <ScoreCard
          label="Trend"
          score={scores.trendScore}
          description={SCORE_DESCRIPTIONS.trend}
          loading={loading}
        />
      </div>

      {hasScores && (
        <div className="ai-overall-score">
          <div className="ai-overall-label">Overall Score</div>
          <div className="ai-overall-value" style={{
            color: overallScore >= 70 ? '#4CAF50' : overallScore >= 50 ? '#FF9800' : '#f44336'
          }}>
            {overallScore}/100
          </div>
        </div>
      )}

      <button
        type="button"
        className="ai-analyze-btn"
        onClick={handleAnalyze}
        disabled={disabled || loading || !contentId}
      >
        {loading ? (
          <>
            <span className="ai-spinner" />
            Analyzing...
          </>
        ) : hasScores ? (
          'Re-analyze Content'
        ) : (
          'Analyze Content'
        )}
      </button>

      {error && <p className="ai-error">{error}</p>}

      {suggestions && (
        <ImprovementSuggestions
          suggestions={suggestions}
          creatorInsights={creatorInsights}
        />
      )}
    </div>
  );
}

PerformancePredictor.propTypes = {
  contentId: PropTypes.string,
  onAnalyze: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

PerformancePredictor.defaultProps = {
  contentId: null,
  disabled: false,
};

export default PerformancePredictor;
