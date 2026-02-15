import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './linkinbio.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

function AnalyticsDashboard({ pageId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [pageId]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/linkinbio/${pageId}/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  if (error) {
    return <div className="analytics-error">{error}</div>;
  }

  const totalClicks = analytics?.linkStats?.reduce((sum, link) => sum + link.clicks, 0) || 0;

  return (
    <div className="analytics-dashboard">
      <div className="analytics-overview">
        <div className="analytics-stat-card">
          <span className="analytics-stat-value">{analytics?.totalViews || 0}</span>
          <span className="analytics-stat-label">Total Views</span>
        </div>
        <div className="analytics-stat-card">
          <span className="analytics-stat-value">{analytics?.uniqueVisitors || 0}</span>
          <span className="analytics-stat-label">Unique Visitors</span>
        </div>
        <div className="analytics-stat-card">
          <span className="analytics-stat-value">{totalClicks}</span>
          <span className="analytics-stat-label">Total Clicks</span>
        </div>
        <div className="analytics-stat-card">
          <span className="analytics-stat-value">
            {analytics?.totalViews ? ((totalClicks / analytics.totalViews) * 100).toFixed(1) : 0}%
          </span>
          <span className="analytics-stat-label">Click Rate</span>
        </div>
      </div>

      {analytics?.lastViewedAt && (
        <p className="analytics-last-view">
          Last viewed: {new Date(analytics.lastViewedAt).toLocaleString()}
        </p>
      )}

      <div className="analytics-links">
        <h4>Link Performance</h4>
        {analytics?.linkStats?.length > 0 ? (
          <div className="analytics-link-list">
            {analytics.linkStats
              .sort((a, b) => b.clicks - a.clicks)
              .map((link, index) => (
                <div key={link.id} className="analytics-link-item">
                  <span className="analytics-link-rank">#{index + 1}</span>
                  <span className="analytics-link-title">{link.title}</span>
                  <div className="analytics-link-bar-container">
                    <div
                      className="analytics-link-bar"
                      style={{
                        width: totalClicks ? `${(link.clicks / totalClicks) * 100}%` : '0%'
                      }}
                    />
                  </div>
                  <span className="analytics-link-clicks">{link.clicks} clicks</span>
                </div>
              ))}
          </div>
        ) : (
          <p className="analytics-empty">No link data yet</p>
        )}
      </div>

      <div className="analytics-note">
        <p>Analytics are updated in real-time as visitors interact with your page.</p>
      </div>
    </div>
  );
}

AnalyticsDashboard.propTypes = {
  pageId: PropTypes.string.isRequired,
};

export default AnalyticsDashboard;
