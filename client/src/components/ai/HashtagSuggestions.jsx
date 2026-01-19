import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ai-components.css';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'trending', label: 'Trending' },
  { value: 'niche', label: 'Niche' },
  { value: 'branded', label: 'Branded' },
  { value: 'community', label: 'Community' },
];

const POPULARITY_LEVELS = {
  high: { label: 'High', color: '#4CAF50', minPosts: '1M+' },
  medium: { label: 'Medium', color: '#FF9800', minPosts: '100K-1M' },
  low: { label: 'Low', color: '#2196F3', minPosts: '<100K' },
};

function getPopularityLevel(hashtag) {
  const trendingTags = ['viral', 'trending', 'fyp', 'explore', 'reels', 'foryou'];
  const isTrending = trendingTags.some(tag => hashtag.toLowerCase().includes(tag));
  if (isTrending) return 'high';
  if (hashtag.length < 10) return 'medium';
  return 'low';
}

function categorizeHashtag(hashtag) {
  const trendingPatterns = ['viral', 'trending', 'fyp', 'explore', '2024', '2025', '2026'];
  const communityPatterns = ['community', 'squad', 'fam', 'tribe', 'gang'];

  const lower = hashtag.toLowerCase();
  if (trendingPatterns.some(p => lower.includes(p))) return 'trending';
  if (communityPatterns.some(p => lower.includes(p))) return 'community';
  if (lower.length > 15) return 'niche';
  return 'branded';
}

function HashtagSuggestions({ contentId, currentHashtags, onApply, onGenerate, disabled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [selectedHashtags, setSelectedHashtags] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [count, setCount] = useState(20);

  useEffect(() => {
    setHashtags([]);
    setSelectedHashtags(new Set(currentHashtags || []));
    setError('');
  }, [contentId, currentHashtags]);

  const handleGenerate = async () => {
    if (!contentId) {
      setError('No content selected');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await onGenerate({ contentId, count });
      if (result.hashtags && result.hashtags.length > 0) {
        const enrichedHashtags = result.hashtags.map(tag => ({
          tag: tag.replace(/^#/, ''),
          popularity: getPopularityLevel(tag),
          category: categorizeHashtag(tag),
        }));
        setHashtags(enrichedHashtags);
      } else {
        setError('No hashtags generated');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate hashtags');
    } finally {
      setLoading(false);
    }
  };

  const toggleHashtag = (tag) => {
    const newSelected = new Set(selectedHashtags);
    if (newSelected.has(tag)) {
      newSelected.delete(tag);
    } else {
      newSelected.add(tag);
    }
    setSelectedHashtags(newSelected);
  };

  const handleApplySelected = () => {
    onApply(Array.from(selectedHashtags));
  };

  const handleSelectAll = () => {
    const filtered = filteredHashtags.map(h => h.tag);
    setSelectedHashtags(new Set([...selectedHashtags, ...filtered]));
  };

  const handleClearSelection = () => {
    setSelectedHashtags(new Set());
  };

  const filteredHashtags = hashtags.filter(h =>
    categoryFilter === 'all' || h.category === categoryFilter
  );

  const selectedCount = selectedHashtags.size;

  return (
    <div className="ai-hashtag-suggestions">
      <div className="ai-section-header">
        <h4>Hashtag Suggestions</h4>
        <p className="ai-section-subtitle">AI-powered hashtags to boost discoverability</p>
      </div>

      <div className="ai-controls">
        <div className="ai-control-group">
          <label className="ai-label">Number of hashtags</label>
          <div className="ai-count-selector">
            {[10, 20, 30].map((n) => (
              <button
                key={n}
                type="button"
                className={`ai-chip ${count === n ? 'active' : ''}`}
                onClick={() => setCount(n)}
                disabled={disabled || loading}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="ai-generate-btn primary"
          onClick={handleGenerate}
          disabled={disabled || loading || !contentId}
        >
          {loading ? (
            <>
              <span className="ai-spinner" />
              Generating...
            </>
          ) : (
            'Generate Hashtags'
          )}
        </button>
      </div>

      {error && <p className="ai-error">{error}</p>}

      {hashtags.length > 0 && (
        <>
          <div className="ai-filter-bar">
            <div className="ai-category-filters">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  className={`ai-filter-chip ${categoryFilter === cat.value ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(cat.value)}
                >
                  {cat.label}
                  {cat.value !== 'all' && (
                    <span className="ai-filter-count">
                      {hashtags.filter(h => h.category === cat.value).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="ai-popularity-legend">
              {Object.entries(POPULARITY_LEVELS).map(([key, val]) => (
                <span key={key} className="ai-legend-item">
                  <span className="ai-legend-dot" style={{ backgroundColor: val.color }} />
                  {val.label} ({val.minPosts})
                </span>
              ))}
            </div>
          </div>

          <div className="ai-hashtag-grid">
            {filteredHashtags.map((h) => (
              <button
                key={h.tag}
                type="button"
                className={`ai-hashtag-chip ${selectedHashtags.has(h.tag) ? 'selected' : ''}`}
                onClick={() => toggleHashtag(h.tag)}
                disabled={disabled}
              >
                <span
                  className="ai-popularity-indicator"
                  style={{ backgroundColor: POPULARITY_LEVELS[h.popularity].color }}
                />
                #{h.tag}
              </button>
            ))}
          </div>

          <div className="ai-hashtag-actions">
            <div className="ai-selection-info">
              <span>{selectedCount} selected</span>
              <button type="button" className="ai-text-btn" onClick={handleSelectAll}>
                Select All
              </button>
              <button type="button" className="ai-text-btn" onClick={handleClearSelection}>
                Clear
              </button>
            </div>

            <button
              type="button"
              className="ai-apply-btn secondary"
              onClick={handleApplySelected}
              disabled={disabled || selectedCount === 0}
            >
              Apply {selectedCount} Hashtag{selectedCount !== 1 ? 's' : ''}
            </button>
          </div>
        </>
      )}

      {currentHashtags && currentHashtags.length > 0 && hashtags.length === 0 && !loading && (
        <div className="ai-current-hashtags">
          <p className="ai-label">Current Hashtags</p>
          <div className="ai-current-tags">
            {currentHashtags.map((tag) => (
              <span key={tag} className="ai-current-tag">#{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

HashtagSuggestions.propTypes = {
  contentId: PropTypes.string,
  currentHashtags: PropTypes.arrayOf(PropTypes.string),
  onApply: PropTypes.func.isRequired,
  onGenerate: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

HashtagSuggestions.defaultProps = {
  contentId: null,
  currentHashtags: [],
  disabled: false,
};

export default HashtagSuggestions;
