import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { aiApi } from '../lib/api';

const TONES = ['gothic', 'playful', 'dark luxury', 'sensual', 'euphoric'];

function AiCaptionPanel({ idea, disabled, onApply }) {
  const [inputIdea, setInputIdea] = useState(idea || '');
  const [tone, setTone] = useState(TONES[2]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captions, setCaptions] = useState([]);

  useEffect(() => {
    setInputIdea(idea || '');
  }, [idea]);

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!inputIdea.trim()) return;

    setLoading(true);
    setError('');
    try {
      const options = await aiApi.generateCaptions(inputIdea.trim(), tone);
      setCaptions(options);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-panel">
      <div className="panel-head">
        <h3>AI Caption Suggestions</h3>
        <p>Feed the muse in seconds.</p>
      </div>
      <form onSubmit={handleGenerate} className="ai-form">
        <label className="field">
          <span>Idea</span>
          <textarea value={inputIdea} onChange={(event) => setInputIdea(event.target.value)} disabled={disabled || loading} placeholder="nightclub fit check, latex dress, red lights" />
        </label>
        <label className="field">
          <span>Tone</span>
          <select value={tone} onChange={(event) => setTone(event.target.value)} disabled={disabled || loading}>
            {TONES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="secondary" disabled={disabled || loading}>
          {loading ? 'Summoning...' : 'Generate Captions'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      <div className="suggestions">
        {captions.map((caption, index) => (
          <button key={caption} className="suggestion" type="button" onClick={() => onApply(caption)} disabled={disabled}>
            <span>Option {index + 1}</span>
            <p>{caption}</p>
          </button>
        ))}
        {!captions.length && <p className="muted">No suggestions yet.</p>}
      </div>
    </div>
  );
}

AiCaptionPanel.propTypes = {
  idea: PropTypes.string,
  disabled: PropTypes.bool,
  onApply: PropTypes.func.isRequired,
};

AiCaptionPanel.defaultProps = {
  idea: '',
  disabled: false,
};

export default AiCaptionPanel;
