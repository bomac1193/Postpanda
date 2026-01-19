import { useState, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Menu } from 'lucide-react';
import GridPlanner from './components/GridPlanner';
import PostEditor from './components/PostEditor';
import ContentIdeasPanel from './components/ContentIdeasPanel';
import { Sidebar } from './components/layout';
import Calendar from './pages/Calendar';
import LinkInBio from './pages/LinkInBio';
import MediaKit from './pages/MediaKit';
import Workspaces from './pages/Workspaces';
import RolloutPlanner from './pages/RolloutPlanner';
import './App.css';

const STORAGE_KEY = 'minimal-grid-posts';
const COLOR_SWATCHES = ['#d3c7b5', '#c7d3bd', '#cfdce1', '#e0c0cf', '#f6e0c8'];
const DEFAULT_CROP = { scale: 1, offsetX: 0, offsetY: 0 };
const DEFAULT_CROP_RECT = { x: 10, y: 10, width: 80, height: 80 };

const normalizePost = (post) => {
  const originalImage = post?.originalImage || post?.image || null;
  const versions =
    post?.versions && post.versions.length
      ? post.versions
      : originalImage
      ? [
          {
            id: 'version-original',
            label: 'Original',
            image: originalImage,
            createdAt: post?.createdAt || Date.now(),
          },
        ]
      : [];

  return {
    ...post,
    originalImage,
    image: post?.image || originalImage,
    crop: {
      scale: post?.crop?.scale ?? DEFAULT_CROP.scale,
      offsetX: post?.crop?.offsetX ?? DEFAULT_CROP.offsetX,
      offsetY: post?.crop?.offsetY ?? DEFAULT_CROP.offsetY,
    },
    cropRect: {
      x: post?.cropRect?.x ?? DEFAULT_CROP_RECT.x,
      y: post?.cropRect?.y ?? DEFAULT_CROP_RECT.y,
      width: post?.cropRect?.width ?? DEFAULT_CROP_RECT.width,
      height: post?.cropRect?.height ?? DEFAULT_CROP_RECT.height,
    },
    versions,
  };
};

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function GridPage() {
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
        const normalized = parsed.map(normalizePost);
        setPosts(normalized);
        if (normalized[0]) {
          setSelectedId(normalized[0].id);
        }
      } catch (error) {
        console.warn('Failed to parse stored posts', error);
      }
    }
  }, []);

  useEffect(() => {
    const seed = localStorage.getItem('alchemy_seed');
    if (seed) {
      try {
        const parsed = JSON.parse(seed);
        const originalImage = parsed.originalImageUrl || parsed.imageUrl || parsed.thumbnailUrl || null;
        const seededPost = normalizePost({
          id: crypto.randomUUID(),
          caption: parsed.caption || '',
          image: parsed.imageUrl || parsed.thumbnailUrl || parsed.originalImageUrl || null,
          originalImage,
          versions: originalImage
            ? [
                {
                  id: `version-${Date.now()}`,
                  label: 'Original',
                  image: originalImage,
                  createdAt: Date.now(),
                },
              ]
            : [],
          color: parsed.color || COLOR_SWATCHES[0],
          createdAt: Date.now(),
        });
        setPosts((prev) => [seededPost, ...prev]);
        setSelectedId(seededPost.id);
      } catch (error) {
        console.warn('Failed to parse alchemy seed', error);
      } finally {
        localStorage.removeItem('alchemy_seed');
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
    let originalImage = null;
    if (file) {
      originalImage = await fileToDataUrl(file);
      image = originalImage;
    }

    const versions =
      originalImage || image
        ? [
            {
              id: `version-${Date.now()}`,
              label: 'Original',
              image: originalImage || image,
              createdAt: Date.now(),
            },
          ]
        : [];

    const newPost = normalizePost({
      id: crypto.randomUUID(),
      caption: newCaption.trim(),
      image,
      originalImage,
      versions,
      color: newColor,
      createdAt: Date.now(),
    });

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
    <>
      <div className="page-header">
        <h1>Post Alchemy Lab</h1>
        <p className="subtitle">Draft a grid. Summon your captions.</p>
      </div>

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
    </>
  );
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell with-sidebar">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <header className="app-header">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </header>
        <div className="app-content">
          <Routes>
            <Route path="/" element={<GridPage />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/linkinbio" element={<LinkInBio />} />
            <Route path="/mediakit" element={<MediaKit />} />
            <Route path="/workspaces" element={<Workspaces />} />
            <Route path="/rollout" element={<RolloutPlanner />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename="/alchemy">
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
