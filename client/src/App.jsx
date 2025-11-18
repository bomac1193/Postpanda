import { useEffect, useMemo, useState } from 'react';
import GridPlanner from './components/GridPlanner';
import PostEditor from './components/PostEditor';
import ContentIdeasPanel from './components/ContentIdeasPanel';
import './App.css';

const STORAGE_KEY = 'minimal-grid-posts';
const COLOR_SWATCHES = ['#d3c7b5', '#c7d3bd', '#cfdce1', '#e0c0cf', '#f6e0c8'];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function App() {
  const [posts, setPosts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [newCaption, setNewCaption] = useState('');
  const [newColor, setNewColor] = useState(COLOR_SWATCHES[0]);
  const [file, setFile] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPosts(parsed);
        if (parsed[0]) {
          setSelectedId(parsed[0].id);
        }
      } catch (error) {
        console.warn('Failed to parse stored posts', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }, [posts]);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedId) || null,
    [posts, selectedId]
  );

  const handleAddPost = async (event) => {
    event.preventDefault();
    if (!newCaption.trim() && !file) return;

    let image = null;
    if (file) {
      image = await fileToDataUrl(file);
    }

    const newPost = {
      id: crypto.randomUUID(),
      caption: newCaption.trim(),
      image,
      color: newColor,
      createdAt: Date.now(),
    };

    setPosts((prev) => [newPost, ...prev]);
    setSelectedId(newPost.id);
    setNewCaption('');
    setFile(null);
  };

  const handleUpdatePost = (id, updates) => {
    setPosts((prev) => prev.map((post) => (post.id === id ? { ...post, ...updates } : post)));
  };

  const handleReorder = (sourceId, targetId) => {
    if (sourceId === targetId) return;
    setPosts((prev) => {
      const sourceIndex = prev.findIndex((p) => p.id === sourceId);
      const targetIndex = prev.findIndex((p) => p.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
  };

  return (
    <div className="app-shell">
      <header>
        <div>
          <h1>Post Alchemy Lab</h1>
          <p className="subtitle">Draft a grid. Summon your captions.</p>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <form className="add-post" onSubmit={handleAddPost}>
            <h2>Add New Post</h2>
            <label className="field">
              <span>Image (optional)</span>
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            <label className="field">
              <span>Color swatch</span>
              <div className="swatches">
                {COLOR_SWATCHES.map((color) => (
                  <button
                    type="button"
                    key={color}
                    className={color === newColor ? 'swatch active' : 'swatch'}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewColor(color)}
                  />
                ))}
              </div>
            </label>
            <label className="field">
              <span>Caption draft</span>
              <textarea value={newCaption} onChange={(e) => setNewCaption(e.target.value)} placeholder="What's the vibe?" />
            </label>
            <button type="submit" className="primary">
              Add Post
            </button>
          </form>

          <GridPlanner
            posts={posts}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReorder={handleReorder}
          />
        </section>

        <section className="panel">
          <PostEditor post={selectedPost} onUpdate={handleUpdatePost} />
          <ContentIdeasPanel />
        </section>
      </main>
    </div>
  );
}

export default App;
