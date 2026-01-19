import { useState, useEffect } from 'react';
import LinkEditor from '../components/linkinbio/LinkEditor';
import ThemeCustomizer from '../components/linkinbio/ThemeCustomizer';
import LinkInBioPreview from '../components/linkinbio/LinkInBioPreview';
import AnalyticsDashboard from '../components/linkinbio/AnalyticsDashboard';
import '../components/linkinbio/linkinbio.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002';

function LinkInBio() {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [activeTab, setActiveTab] = useState('links');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/linkinbio`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.pages) {
        setPages(data.pages);
        if (data.pages.length > 0 && !selectedPage) {
          setSelectedPage(data.pages[0]);
        }
      }
    } catch (err) {
      setError('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const createPage = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/linkinbio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: 'My Links',
          slug: `links-${Date.now()}`,
        }),
      });
      const data = await response.json();
      if (data.linkInBio) {
        setPages(prev => [data.linkInBio, ...prev]);
        setSelectedPage(data.linkInBio);
      }
    } catch (err) {
      setError('Failed to create page');
    }
  };

  const updatePage = async (updates) => {
    if (!selectedPage) return;
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE}/api/linkinbio/${selectedPage._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (data.page) {
        setSelectedPage(data.page);
        setPages(prev => prev.map(p => p._id === data.page._id ? data.page : p));
      }
    } catch (err) {
      setError('Failed to update page');
    } finally {
      setSaving(false);
    }
  };

  const updateTheme = async (theme) => {
    if (!selectedPage) return;
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE}/api/linkinbio/${selectedPage._id}/theme`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ theme }),
      });
      const data = await response.json();
      if (data.theme) {
        setSelectedPage(prev => ({ ...prev, theme: data.theme }));
      }
    } catch (err) {
      setError('Failed to update theme');
    } finally {
      setSaving(false);
    }
  };

  const addLink = async (linkData) => {
    if (!selectedPage) return;

    try {
      const response = await fetch(`${API_BASE}/api/linkinbio/${selectedPage._id}/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(linkData),
      });
      const data = await response.json();
      if (data.link) {
        setSelectedPage(prev => ({
          ...prev,
          links: [...prev.links, data.link]
        }));
      }
    } catch (err) {
      setError('Failed to add link');
    }
  };

  const updateLink = async (linkId, updates) => {
    if (!selectedPage) return;

    try {
      const response = await fetch(`${API_BASE}/api/linkinbio/${selectedPage._id}/links/${linkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (data.link) {
        setSelectedPage(prev => ({
          ...prev,
          links: prev.links.map(l => l._id === linkId ? data.link : l)
        }));
      }
    } catch (err) {
      setError('Failed to update link');
    }
  };

  const deleteLink = async (linkId) => {
    if (!selectedPage) return;

    try {
      await fetch(`${API_BASE}/api/linkinbio/${selectedPage._id}/links/${linkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setSelectedPage(prev => ({
        ...prev,
        links: prev.links.filter(l => l._id !== linkId)
      }));
    } catch (err) {
      setError('Failed to delete link');
    }
  };

  const togglePublish = async () => {
    if (!selectedPage) return;

    try {
      const response = await fetch(`${API_BASE}/api/linkinbio/${selectedPage._id}/publish`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setSelectedPage(prev => ({ ...prev, isPublished: data.isPublished }));
    } catch (err) {
      setError('Failed to toggle publish status');
    }
  };

  if (loading) {
    return (
      <div className="linkinbio-loading">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="linkinbio-page">
      <div className="linkinbio-header">
        <div className="linkinbio-header-left">
          <h1>Link in Bio</h1>
          <p className="linkinbio-subtitle">Create your custom link page</p>
        </div>
        <div className="linkinbio-header-actions">
          <button type="button" className="linkinbio-create-btn primary" onClick={createPage}>
            + New Page
          </button>
        </div>
      </div>

      {error && <div className="linkinbio-error">{error}</div>}

      {pages.length === 0 ? (
        <div className="linkinbio-empty">
          <h2>No pages yet</h2>
          <p>Create your first link in bio page to get started</p>
          <button type="button" className="primary" onClick={createPage}>
            Create Page
          </button>
        </div>
      ) : (
        <div className="linkinbio-layout">
          <div className="linkinbio-sidebar">
            <div className="linkinbio-pages-list">
              {pages.map(page => (
                <button
                  key={page._id}
                  type="button"
                  className={`linkinbio-page-item ${selectedPage?._id === page._id ? 'active' : ''}`}
                  onClick={() => setSelectedPage(page)}
                >
                  <span className="linkinbio-page-title">{page.title}</span>
                  <span className="linkinbio-page-slug">/{page.slug}</span>
                  <span className={`linkinbio-page-status ${page.isPublished ? 'published' : 'draft'}`}>
                    {page.isPublished ? 'Live' : 'Draft'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {selectedPage && (
            <div className="linkinbio-main">
              <div className="linkinbio-editor">
                <div className="linkinbio-tabs">
                  <button
                    type="button"
                    className={`linkinbio-tab ${activeTab === 'links' ? 'active' : ''}`}
                    onClick={() => setActiveTab('links')}
                  >
                    Links
                  </button>
                  <button
                    type="button"
                    className={`linkinbio-tab ${activeTab === 'theme' ? 'active' : ''}`}
                    onClick={() => setActiveTab('theme')}
                  >
                    Theme
                  </button>
                  <button
                    type="button"
                    className={`linkinbio-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                  >
                    Analytics
                  </button>
                </div>

                <div className="linkinbio-tab-content">
                  {activeTab === 'links' && (
                    <LinkEditor
                      page={selectedPage}
                      onUpdatePage={updatePage}
                      onAddLink={addLink}
                      onUpdateLink={updateLink}
                      onDeleteLink={deleteLink}
                      saving={saving}
                    />
                  )}
                  {activeTab === 'theme' && (
                    <ThemeCustomizer
                      theme={selectedPage.theme}
                      onUpdateTheme={updateTheme}
                      saving={saving}
                    />
                  )}
                  {activeTab === 'analytics' && (
                    <AnalyticsDashboard pageId={selectedPage._id} />
                  )}
                </div>

                <div className="linkinbio-actions">
                  <button
                    type="button"
                    className={`linkinbio-publish-btn ${selectedPage.isPublished ? 'secondary' : 'primary'}`}
                    onClick={togglePublish}
                  >
                    {selectedPage.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  {selectedPage.isPublished && (
                    <a
                      href={`/bio/${selectedPage.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="linkinbio-view-btn ghost"
                    >
                      View Page
                    </a>
                  )}
                </div>
              </div>

              <div className="linkinbio-preview-container">
                <h3>Preview</h3>
                <LinkInBioPreview page={selectedPage} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LinkInBio;
