import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ai-components.css';

const TONES = [
  { value: 'casual', label: 'Casual', description: 'Friendly, conversational' },
  { value: 'professional', label: 'Professional', description: 'Polished, authoritative' },
  { value: 'playful', label: 'Playful', description: 'Fun, energetic' },
  { value: 'inspirational', label: 'Inspirational', description: 'Motivational, uplifting' },
  { value: 'gothic', label: 'Gothic', description: 'Dark, mysterious' },
  { value: 'dark luxury', label: 'Dark Luxury', description: 'Elegant, opulent' },
  { value: 'sensual', label: 'Sensual', description: 'Alluring, intimate' },
  { value: 'euphoric', label: 'Euphoric', description: 'Excited, joyful' },
];

const LENGTHS = [
  { value: 'short', label: 'Short', description: '1-2 sentences' },
  { value: 'medium', label: 'Medium', description: '3-5 sentences' },
  { value: 'long', label: 'Long', description: '6-10 sentences' },
];

function CaptionGenerator({ contentId, currentCaption, platform, onApply, onGenerate, disabled }) {
  const [tone, setTone] = useState('casual');
  const [length, setLength] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captions, setCaptions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    setCaptions([]);
    setSelectedIndex(null);
    setError('');
  }, [contentId]);

  const handleGenerate = async () => {
    if (!contentId) {
      setError('No content selected');
      return;
    }

    setLoading(true);
    setError('');
    setCaptions([]);
    setSelectedIndex(null);

    try {
      const result = await onGenerate({ contentId, tone, length });
      if (result.captions && result.captions.length > 0) {
        setCaptions(result.captions);
      } else {
        setError('No captions generated');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate captions');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const handleApply = (caption, index) => {
    setSelectedIndex(index);
    onApply(caption);
  };

  return (
    <div className="ai-caption-generator">
      <div className="ai-section-header">
        <h4>AI Caption Generator</h4>
        <p className="ai-section-subtitle">Generate engaging captions tailored to your content</p>
      </div>

      <div className="ai-controls">
        <div className="ai-control-group">
          <label className="ai-label">Tone</label>
          <div className="ai-chip-group">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`ai-chip ${tone === t.value ? 'active' : ''}`}
                onClick={() => setTone(t.value)}
                disabled={disabled || loading}
                title={t.description}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ai-control-group">
          <label className="ai-label">Length</label>
          <div className="ai-chip-group">
            {LENGTHS.map((l) => (
              <button
                key={l.value}
                type="button"
                className={`ai-chip ${length === l.value ? 'active' : ''}`}
                onClick={() => setLength(l.value)}
                disabled={disabled || loading}
                title={l.description}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {platform && (
          <div className="ai-platform-badge">
            <span className="ai-label">Platform:</span>
            <span className="platform-tag">{platform}</span>
          </div>
        )}
      </div>

      <div className="ai-actions">
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
            'Generate Captions'
          )}
        </button>

        {captions.length > 0 && (
          <button
            type="button"
            className="ai-regenerate-btn ghost"
            onClick={handleRegenerate}
            disabled={disabled || loading}
          >
            Regenerate
          </button>
        )}
      </div>

      {error && <p className="ai-error">{error}</p>}

      {captions.length > 0 && (
        <div className="ai-results">
          <p className="ai-results-label">Generated Captions</p>
          <div className="ai-caption-list">
            {captions.map((caption, index) => (
              <button
                key={index}
                type="button"
                className={`ai-caption-option ${selectedIndex === index ? 'selected' : ''}`}
                onClick={() => handleApply(caption, index)}
                disabled={disabled}
              >
                <span className="ai-caption-number">Option {index + 1}</span>
                <p className="ai-caption-text">{caption}</p>
                {selectedIndex === index && <span className="ai-applied-badge">Applied</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentCaption && captions.length === 0 && !loading && (
        <div className="ai-current-caption">
          <p className="ai-label">Current Caption</p>
          <p className="ai-caption-preview">{currentCaption}</p>
        </div>
      )}
    </div>
  );
}

CaptionGenerator.propTypes = {
  contentId: PropTypes.string,
  currentCaption: PropTypes.string,
  platform: PropTypes.string,
  onApply: PropTypes.func.isRequired,
  onGenerate: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

CaptionGenerator.defaultProps = {
  contentId: null,
  currentCaption: '',
  platform: 'instagram',
  disabled: false,
};

export default CaptionGenerator;
