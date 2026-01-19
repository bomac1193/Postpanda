import PropTypes from 'prop-types';
import './ai-components.css';

function ImprovementSuggestions({ suggestions, creatorInsights }) {
  if (!suggestions && !creatorInsights) return null;

  const improvements = suggestions?.improvements || [];
  const actionItems = creatorInsights?.actionItems || [];
  const hookIdeas = creatorInsights?.hookIdeas || suggestions?.hookIdeas || [];
  const captionIdeas = creatorInsights?.captionIdeas || [];
  const similarCreators = creatorInsights?.similarCreators || [];
  const platformRec = creatorInsights?.platformRecommendation;
  const nicheAlignment = creatorInsights?.nicheAlignment;

  const allSuggestions = [
    ...improvements.map(text => ({ text, type: 'improvement' })),
    ...actionItems.map(text => ({ text, type: 'action' })),
  ];

  return (
    <div className="ai-improvements">
      {platformRec && (
        <div className="ai-platform-recommendation">
          <h5 className="ai-improvements-title">Best Platform</h5>
          <div className="ai-platform-rec-card">
            <span className="ai-platform-name">{platformRec.platform}</span>
            <span className="ai-platform-confidence">
              {platformRec.confidence}% confidence
            </span>
            <p className="ai-platform-rationale">{platformRec.rationale}</p>
          </div>
        </div>
      )}

      {nicheAlignment && (
        <div className="ai-niche-alignment">
          <h5 className="ai-improvements-title">Niche Alignment</h5>
          <div className="ai-niche-card">
            <div className="ai-niche-score">
              <span className="ai-niche-value">{nicheAlignment.score}</span>
              <span className="ai-niche-label">/100</span>
            </div>
            <p className="ai-niche-notes">{nicheAlignment.notes}</p>
            {nicheAlignment.strengths?.length > 0 && (
              <div className="ai-niche-section">
                <span className="ai-niche-section-label">Strengths:</span>
                <div className="ai-niche-tags">
                  {nicheAlignment.strengths.map((s, i) => (
                    <span key={i} className="ai-niche-tag strength">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {nicheAlignment.gaps?.length > 0 && (
              <div className="ai-niche-section">
                <span className="ai-niche-section-label">Areas to Improve:</span>
                <div className="ai-niche-tags">
                  {nicheAlignment.gaps.map((g, i) => (
                    <span key={i} className="ai-niche-tag gap">{g}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {allSuggestions.length > 0 && (
        <>
          <h5 className="ai-improvements-title">Recommendations</h5>
          <ul className="ai-improvements-list">
            {allSuggestions.map((item, index) => (
              <li key={index} className="ai-improvement-item">
                <span className="ai-improvement-icon">
                  {item.type === 'action' ? '!' : '+'}
                </span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {hookIdeas.length > 0 && (
        <div className="ai-hook-ideas">
          <h5 className="ai-improvements-title">Hook Ideas</h5>
          <ul className="ai-improvements-list">
            {hookIdeas.map((hook, index) => (
              <li key={index} className="ai-improvement-item hook">
                <span className="ai-improvement-icon hook-icon">H</span>
                <span>{hook}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {captionIdeas.length > 0 && (
        <div className="ai-caption-ideas">
          <h5 className="ai-improvements-title">Caption Ideas</h5>
          <ul className="ai-improvements-list">
            {captionIdeas.map((caption, index) => (
              <li key={index} className="ai-improvement-item caption">
                <span className="ai-improvement-icon caption-icon">C</span>
                <span>{caption}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {similarCreators.length > 0 && (
        <div className="ai-similar-creators">
          <h5 className="ai-improvements-title">Similar Creators</h5>
          <div className="ai-creators-list">
            {similarCreators.map((creator, index) => (
              <div key={index} className="ai-creator-card">
                <div className="ai-creator-header">
                  <span className="ai-creator-name">{creator.name}</span>
                  {creator.handle && (
                    <span className="ai-creator-handle">{creator.handle}</span>
                  )}
                </div>
                {creator.overlap && (
                  <p className="ai-creator-overlap">{creator.overlap}</p>
                )}
                {creator.performanceNote && (
                  <p className="ai-creator-performance">{creator.performanceNote}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {suggestions?.bestTimeToPost && (
        <div className="ai-best-time">
          <h5 className="ai-improvements-title">Best Time to Post</h5>
          <p className="ai-best-time-value">{suggestions.bestTimeToPost}</p>
        </div>
      )}

      {suggestions?.recommendedType && (
        <div className="ai-recommended-type">
          <h5 className="ai-improvements-title">Recommended Format</h5>
          <div className="ai-type-card">
            <span className="ai-type-name">{suggestions.recommendedType}</span>
            {suggestions.confidenceScore && (
              <span className="ai-type-confidence">
                {suggestions.confidenceScore}% match
              </span>
            )}
            {suggestions.reason && (
              <p className="ai-type-reason">{suggestions.reason}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

ImprovementSuggestions.propTypes = {
  suggestions: PropTypes.shape({
    improvements: PropTypes.arrayOf(PropTypes.string),
    hookIdeas: PropTypes.arrayOf(PropTypes.string),
    bestTimeToPost: PropTypes.string,
    recommendedType: PropTypes.string,
    reason: PropTypes.string,
    confidenceScore: PropTypes.number,
  }),
  creatorInsights: PropTypes.shape({
    actionItems: PropTypes.arrayOf(PropTypes.string),
    hookIdeas: PropTypes.arrayOf(PropTypes.string),
    captionIdeas: PropTypes.arrayOf(PropTypes.string),
    platformRecommendation: PropTypes.shape({
      platform: PropTypes.string,
      confidence: PropTypes.number,
      rationale: PropTypes.string,
    }),
    nicheAlignment: PropTypes.shape({
      score: PropTypes.number,
      notes: PropTypes.string,
      strengths: PropTypes.arrayOf(PropTypes.string),
      gaps: PropTypes.arrayOf(PropTypes.string),
    }),
    similarCreators: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      handle: PropTypes.string,
      overlap: PropTypes.string,
      performanceNote: PropTypes.string,
    })),
  }),
};

ImprovementSuggestions.defaultProps = {
  suggestions: null,
  creatorInsights: null,
};

export default ImprovementSuggestions;
