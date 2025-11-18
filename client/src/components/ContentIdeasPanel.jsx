import { useState } from 'react';
import { aiApi } from '../lib/api';

function ContentIdeasPanel() {
  const [niche, setNiche] = useState('club culture');
  const [examples, setExamples] = useState('neon dj booth recap');
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!niche.trim()) return;

    setLoading(true);
    setError('');
    try {
      const exampleList = examples
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean);
      const result = await aiApi.generateIdeas(niche.trim(), exampleList);
      setIdeas(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ideas-panel">
      <div className="panel-head">
        <h2>Content Ideas</h2>
        <p>Spin up new shots and reels.</p>
      </div>
      <form onSubmit={handleGenerate} className="ideas-form">
        <label className="field">
          <span>Niche</span>
          <input type="text" value={niche} onChange={(event) => setNiche(event.target.value)} placeholder="fashion" />
        </label>
        <label className="field">
          <span>Previous themes (optional)</span>
          <textarea value={examples} onChange={(event) => setExamples(event.target.value)} placeholder="night rooftop recap" />
        </label>
        <button type="submit" className="ghost" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Ideas'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      <ul className="ideas-list">
        {ideas.map((idea) => (
          <li key={idea.title}>
            <div>
              <h4>
                {idea.title}
                <span className="badge">{idea.format}</span>
              </h4>
              <p>{idea.description}</p>
            </div>
          </li>
        ))}
        {!ideas.length && <p className="muted">No ideas yet. Ask the muse.</p>}
      </ul>
    </div>
  );
}

export default ContentIdeasPanel;
