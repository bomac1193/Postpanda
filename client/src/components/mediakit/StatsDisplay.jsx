import { useState } from 'react';
import PropTypes from 'prop-types';
import { Instagram, Music2, Youtube, Twitter, RefreshCw } from 'lucide-react';
import './mediakit.css';

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram },
  { id: 'tiktok', name: 'TikTok', icon: Music2 },
  { id: 'youtube', name: 'YouTube', icon: Youtube },
  { id: 'twitter', name: 'X', icon: Twitter },
];

function StatsDisplay({ stats, onUpdateStats, onFetchStats }) {
  const [loading, setLoading] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [editValues, setEditValues] = useState({});

  const handleFetchStats = async () => {
    setLoading(true);
    try {
      await onFetchStats();
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (platform) => {
    const existingStat = stats.platforms?.find(p => p.name === platform.id);
    setEditingPlatform(platform.id);
    setEditValues(existingStat || {
      name: platform.id,
      followers: 0,
      engagementRate: 0,
      avgLikes: 0,
      avgComments: 0,
      avgViews: 0,
      username: ''
    });
  };

  const handleEditSave = () => {
    const updatedPlatforms = stats.platforms?.filter(p => p.name !== editingPlatform) || [];
    if (editValues.followers > 0) {
      updatedPlatforms.push(editValues);
    }
    onUpdateStats({ platforms: updatedPlatforms });
    setEditingPlatform(null);
    setEditValues({});
  };

  const handleRemovePlatform = (platformName) => {
    const updatedPlatforms = stats.platforms?.filter(p => p.name !== platformName) || [];
    onUpdateStats({ platforms: updatedPlatforms });
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="stats-display">
      <div className="stats-header">
        <h4>Platform Statistics</h4>
        <button
          type="button"
          className="fetch-stats-btn"
          onClick={handleFetchStats}
          disabled={loading}
        >
          {loading ? 'Fetching...' : 'Sync Stats'}
        </button>
      </div>

      <div className="stats-summary">
        <div className="summary-card">
          <span className="summary-value">{formatNumber(stats.totalReach || 0)}</span>
          <span className="summary-label">Total Reach</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{stats.avgEngagement || 0}%</span>
          <span className="summary-label">Avg Engagement</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{stats.platforms?.length || 0}</span>
          <span className="summary-label">Platforms</span>
        </div>
      </div>

      <div className="platforms-list">
        {PLATFORMS.map((platform) => {
          const platformStat = stats.platforms?.find(p => p.name === platform.id);
          const isEditing = editingPlatform === platform.id;
          const PlatformIcon = platform.icon;

          return (
            <div key={platform.id} className={`platform-card ${platformStat ? 'active' : ''}`}>
              <div className="platform-header">
                <span className="platform-icon"><PlatformIcon size={16} /></span>
                <span className="platform-name">{platform.name}</span>
                {platformStat && !isEditing && (
                  <div className="platform-actions">
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => handleEditStart(platform)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemovePlatform(platform.id)}
                    >
                      ×
                    </button>
                  </div>
                )}
                {!platformStat && !isEditing && (
                  <button
                    type="button"
                    className="add-platform-btn"
                    onClick={() => handleEditStart(platform)}
                  >
                    + Add
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="platform-edit-form">
                  <div className="edit-row">
                    <label>Username</label>
                    <input
                      type="text"
                      value={editValues.username || ''}
                      onChange={(e) => setEditValues({ ...editValues, username: e.target.value })}
                      placeholder="@username"
                    />
                  </div>
                  <div className="edit-row">
                    <label>Followers</label>
                    <input
                      type="number"
                      value={editValues.followers || ''}
                      onChange={(e) => setEditValues({ ...editValues, followers: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="edit-row">
                    <label>Engagement Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editValues.engagementRate || ''}
                      onChange={(e) => setEditValues({ ...editValues, engagementRate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="edit-row">
                    <label>Avg Likes</label>
                    <input
                      type="number"
                      value={editValues.avgLikes || ''}
                      onChange={(e) => setEditValues({ ...editValues, avgLikes: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="edit-row">
                    <label>Avg Comments</label>
                    <input
                      type="number"
                      value={editValues.avgComments || ''}
                      onChange={(e) => setEditValues({ ...editValues, avgComments: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="edit-buttons">
                    <button type="button" className="save-btn" onClick={handleEditSave}>
                      Save
                    </button>
                    <button type="button" className="cancel-btn" onClick={() => setEditingPlatform(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : platformStat ? (
                <div className="platform-stats">
                  <div className="stat-item">
                    <span className="stat-value">{formatNumber(platformStat.followers)}</span>
                    <span className="stat-label">Followers</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{platformStat.engagementRate}%</span>
                    <span className="stat-label">Engagement</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{formatNumber(platformStat.avgLikes)}</span>
                    <span className="stat-label">Avg Likes</span>
                  </div>
                </div>
              ) : (
                <p className="no-stats">Not connected</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

StatsDisplay.propTypes = {
  stats: PropTypes.shape({
    platforms: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      followers: PropTypes.number,
      engagementRate: PropTypes.number,
      avgLikes: PropTypes.number,
      avgComments: PropTypes.number,
      avgViews: PropTypes.number,
      username: PropTypes.string
    })),
    totalReach: PropTypes.number,
    avgEngagement: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  }).isRequired,
  onUpdateStats: PropTypes.func.isRequired,
  onFetchStats: PropTypes.func.isRequired
};

export default StatsDisplay;
