import { useState } from 'react';
import PropTypes from 'prop-types';
import './linkinbio.css';

function LinkEditor({ page, onUpdatePage, onAddLink, onUpdateLink, onDeleteLink, saving }) {
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [editingLink, setEditingLink] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!newLink.title.trim() || !newLink.url.trim()) return;

    await onAddLink(newLink);
    setNewLink({ title: '', url: '' });
    setShowAddForm(false);
  };

  const handleUpdateLink = async (linkId, updates) => {
    await onUpdateLink(linkId, updates);
    setEditingLink(null);
  };

  const handlePageInfoUpdate = (field, value) => {
    onUpdatePage({ [field]: value });
  };

  const socialPlatforms = [
    { key: 'instagram', label: 'Instagram', placeholder: 'username' },
    { key: 'tiktok', label: 'TikTok', placeholder: '@username' },
    { key: 'twitter', label: 'Twitter/X', placeholder: '@username' },
    { key: 'youtube', label: 'YouTube', placeholder: 'channel URL' },
    { key: 'pinterest', label: 'Pinterest', placeholder: 'username' },
  ];

  return (
    <div className="link-editor">
      <div className="link-editor-section">
        <h4>Page Info</h4>
        <div className="link-editor-field">
          <label>Title</label>
          <input
            type="text"
            value={page.title || ''}
            onChange={(e) => handlePageInfoUpdate('title', e.target.value)}
            onBlur={(e) => handlePageInfoUpdate('title', e.target.value)}
            placeholder="My Links"
          />
        </div>
        <div className="link-editor-field">
          <label>Bio</label>
          <textarea
            value={page.bio || ''}
            onChange={(e) => handlePageInfoUpdate('bio', e.target.value)}
            onBlur={(e) => handlePageInfoUpdate('bio', e.target.value)}
            placeholder="Tell visitors about yourself..."
            rows={3}
          />
        </div>
        <div className="link-editor-field">
          <label>Avatar URL</label>
          <input
            type="text"
            value={page.avatar || ''}
            onChange={(e) => handlePageInfoUpdate('avatar', e.target.value)}
            onBlur={(e) => handlePageInfoUpdate('avatar', e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="link-editor-section">
        <div className="link-editor-section-header">
          <h4>Links</h4>
          <button
            type="button"
            className="link-add-btn"
            onClick={() => setShowAddForm(true)}
          >
            + Add Link
          </button>
        </div>

        {showAddForm && (
          <form className="link-add-form" onSubmit={handleAddLink}>
            <input
              type="text"
              placeholder="Link title"
              value={newLink.title}
              onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
            />
            <input
              type="url"
              placeholder="https://..."
              value={newLink.url}
              onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
            />
            <div className="link-add-form-actions">
              <button type="submit" className="primary">Add</button>
              <button type="button" className="ghost" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="link-list">
          {page.links?.map((link) => (
            <div key={link._id} className="link-item">
              {editingLink === link._id ? (
                <div className="link-edit-form">
                  <input
                    type="text"
                    defaultValue={link.title}
                    onBlur={(e) => handleUpdateLink(link._id, { title: e.target.value })}
                  />
                  <input
                    type="url"
                    defaultValue={link.url}
                    onBlur={(e) => handleUpdateLink(link._id, { url: e.target.value })}
                  />
                  <button
                    type="button"
                    className="link-done-btn"
                    onClick={() => setEditingLink(null)}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="link-item-info">
                    <span className="link-item-title">{link.title}</span>
                    <span className="link-item-url">{link.url}</span>
                    <span className="link-item-clicks">{link.clicks || 0} clicks</span>
                  </div>
                  <div className="link-item-actions">
                    <button
                      type="button"
                      className="link-toggle-btn"
                      onClick={() => onUpdateLink(link._id, { isActive: !link.isActive })}
                    >
                      {link.isActive ? 'On' : 'Off'}
                    </button>
                    <button
                      type="button"
                      className="link-edit-btn"
                      onClick={() => setEditingLink(link._id)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-delete-btn"
                      onClick={() => onDeleteLink(link._id)}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {(!page.links || page.links.length === 0) && (
            <p className="link-empty">No links yet. Add your first link!</p>
          )}
        </div>
      </div>

      <div className="link-editor-section">
        <h4>Social Links</h4>
        <div className="social-links-grid">
          {socialPlatforms.map(platform => (
            <div key={platform.key} className="link-editor-field">
              <label>{platform.label}</label>
              <input
                type="text"
                value={page.socialLinks?.[platform.key] || ''}
                onChange={(e) => onUpdatePage({
                  socialLinks: {
                    ...page.socialLinks,
                    [platform.key]: e.target.value
                  }
                })}
                placeholder={platform.placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      {saving && <div className="link-editor-saving">Saving...</div>}
    </div>
  );
}

LinkEditor.propTypes = {
  page: PropTypes.shape({
    title: PropTypes.string,
    bio: PropTypes.string,
    avatar: PropTypes.string,
    links: PropTypes.array,
    socialLinks: PropTypes.object,
  }).isRequired,
  onUpdatePage: PropTypes.func.isRequired,
  onAddLink: PropTypes.func.isRequired,
  onUpdateLink: PropTypes.func.isRequired,
  onDeleteLink: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

LinkEditor.defaultProps = {
  saving: false,
};

export default LinkEditor;
