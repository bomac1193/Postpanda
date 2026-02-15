import { useState, useEffect, useCallback } from 'react';
import { MediaKitEditor, MediaKitPreview } from '../components/mediakit';
import '../components/mediakit/mediakit.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

function MediaKit() {
  const [mediaKits, setMediaKits] = useState([]);
  const [selectedKit, setSelectedKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchMediaKits = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/mediakit`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch media kits');
      const data = await response.json();
      setMediaKits(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMediaKits();
  }, [fetchMediaKits]);

  const handleCreateKit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/mediakit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'My Media Kit' })
      });

      if (!response.ok) throw new Error('Failed to create media kit');
      const newKit = await response.json();
      setMediaKits(prev => [newKit, ...prev]);
      setSelectedKit(newKit);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectKit = (kit) => {
    setSelectedKit(kit);
  };

  const handleUpdateKit = async (updates) => {
    if (!selectedKit) return;

    // Optimistic update
    const updatedKit = { ...selectedKit, ...updates };
    if (updates.sections) {
      updatedKit.sections = { ...selectedKit.sections, ...updates.sections };
    }
    if (updates.customization) {
      updatedKit.customization = { ...selectedKit.customization, ...updates.customization };
    }
    setSelectedKit(updatedKit);

    // Debounced save
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/mediakit/${selectedKit._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update media kit');
      const saved = await response.json();
      setSelectedKit(saved);
      setMediaKits(prev => prev.map(k => k._id === saved._id ? saved : k));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/mediakit/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');
      const stats = await response.json();

      // Convert stats to platform array format
      const platforms = Object.entries(stats.platforms)
        .filter(([_, data]) => data)
        .map(([name, data]) => ({
          name,
          ...data
        }));

      // Update the selected kit's stats
      handleUpdateKit({
        sections: {
          ...selectedKit.sections,
          stats: {
            ...selectedKit.sections?.stats,
            platforms,
            totalReach: stats.totalReach,
            avgEngagement: stats.avgEngagement
          }
        }
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExportHTML = async () => {
    if (!selectedKit) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/mediakit/${selectedKit._id}/export/html`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedKit.slug || 'media-kit'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePublish = async () => {
    if (!selectedKit) return;

    try {
      await handleUpdateKit({ isPublished: !selectedKit.isPublished });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteKit = async () => {
    if (!selectedKit) return;
    if (!window.confirm('Are you sure you want to delete this media kit?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/mediakit/${selectedKit._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete media kit');
      setMediaKits(prev => prev.filter(k => k._id !== selectedKit._id));
      setSelectedKit(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBack = () => {
    setSelectedKit(null);
  };

  if (loading) {
    return (
      <div className="mediakit-page">
        <p>Loading media kits...</p>
      </div>
    );
  }

  return (
    <div className="mediakit-page">
      {error && (
        <div className="mediakit-error" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      {!selectedKit ? (
        <>
          <div className="mediakit-page-header">
            <h1>Media Kits</h1>
            <div className="mediakit-header-actions">
              <button type="button" className="primary" onClick={handleCreateKit}>
                + Create Media Kit
              </button>
            </div>
          </div>

          {mediaKits.length === 0 ? (
            <div className="empty-state">
              <h3>No Media Kits Yet</h3>
              <p>Create a professional media kit to share with brands and partners.</p>
              <button type="button" onClick={handleCreateKit}>
                Create Your First Media Kit
              </button>
            </div>
          ) : (
            <div className="mediakit-list">
              {mediaKits.map((kit) => (
                <div
                  key={kit._id}
                  className="mediakit-card"
                  onClick={() => handleSelectKit(kit)}
                >
                  <div className="mediakit-card-name">{kit.name}</div>
                  <div className="mediakit-card-template">{kit.template} template</div>
                  <div className="mediakit-card-stats">
                    <span>{kit.analytics?.totalViews || 0} views</span>
                    <span>{kit.analytics?.downloads || 0} downloads</span>
                    {kit.isPublished && <span>Published</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mediakit-page-header">
            <button type="button" className="secondary" onClick={handleBack}>
              ← Back
            </button>
            <div className="mediakit-header-actions">
              {saving && <span className="saving-indicator">Saving...</span>}
              <button type="button" className="secondary" onClick={handleDeleteKit}>
                Delete
              </button>
              <button type="button" className="secondary" onClick={handleExportHTML}>
                Export HTML
              </button>
              <button type="button" className="primary" onClick={handlePublish}>
                {selectedKit.isPublished ? 'Unpublish' : 'Publish'}
              </button>
            </div>
          </div>

          {selectedKit.isPublished && selectedKit.slug && (
            <div className="published-notice">
              Public URL: <a href={`${API_BASE}/api/mediakit/public/${selectedKit.slug}`} target="_blank" rel="noopener noreferrer">
                {API_BASE}/api/mediakit/public/{selectedKit.slug}
              </a>
            </div>
          )}

          <div className="mediakit-workspace">
            <div className="mediakit-editor-panel">
              <div className="panel-header">
                <input
                  type="text"
                  value={selectedKit.name}
                  onChange={(e) => handleUpdateKit({ name: e.target.value })}
                  placeholder="Media Kit Name"
                />
              </div>
              <MediaKitEditor
                mediaKit={selectedKit}
                onUpdate={handleUpdateKit}
                onFetchStats={handleFetchStats}
              />
            </div>

            <div className="mediakit-preview-panel">
              <div className="panel-header">
                <h2>Preview</h2>
                <div className="panel-actions">
                  <button type="button" onClick={handleExportHTML}>
                    Download
                  </button>
                </div>
              </div>
              <div className="preview-wrapper">
                <MediaKitPreview mediaKit={selectedKit} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MediaKit;
