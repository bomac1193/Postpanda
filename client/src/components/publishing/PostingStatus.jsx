import PropTypes from 'prop-types';
import './publishing.css';

const PLATFORM_INFO = {
  instagram: { label: 'Instagram', icon: 'IG', color: '#E1306C' },
  tiktok: { label: 'TikTok', icon: 'TT', color: '#000000' },
  twitter: { label: 'Twitter/X', icon: 'X', color: '#1DA1F2' },
  youtube: { label: 'YouTube', icon: 'YT', color: '#FF0000' },
  pinterest: { label: 'Pinterest', icon: 'P', color: '#E60023' },
};

function PostingStatus({ platforms, status, completed }) {
  return (
    <div className="posting-status">
      <h4 className="posting-status-title">
        {completed ? 'Publishing Complete' : 'Publishing...'}
      </h4>

      <div className="posting-status-list">
        {platforms.map((platformId) => {
          const platform = PLATFORM_INFO[platformId] || { label: platformId, icon: '?', color: '#666' };
          const platformStatus = status[platformId] || { status: 'pending', message: 'Waiting...' };

          return (
            <div
              key={platformId}
              className={`posting-status-item ${platformStatus.status}`}
            >
              <div
                className="posting-status-icon"
                style={{ backgroundColor: platform.color }}
              >
                {platform.icon}
              </div>

              <div className="posting-status-info">
                <span className="posting-status-platform">{platform.label}</span>
                <span className="posting-status-message">{platformStatus.message}</span>
              </div>

              <div className="posting-status-indicator">
                {platformStatus.status === 'pending' && (
                  <span className="posting-indicator pending" />
                )}
                {platformStatus.status === 'publishing' && (
                  <span className="posting-indicator publishing">
                    <span className="posting-spinner" />
                  </span>
                )}
                {platformStatus.status === 'success' && (
                  <span className="posting-indicator success">&#10003;</span>
                )}
                {platformStatus.status === 'error' && (
                  <span className="posting-indicator error">&times;</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!completed && (
        <div className="posting-progress-bar">
          <div
            className="posting-progress-fill"
            style={{
              width: `${(Object.values(status).filter(s => s.status === 'success' || s.status === 'error').length / platforms.length) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  );
}

PostingStatus.propTypes = {
  platforms: PropTypes.arrayOf(PropTypes.string).isRequired,
  status: PropTypes.objectOf(PropTypes.shape({
    status: PropTypes.oneOf(['pending', 'publishing', 'success', 'error']).isRequired,
    message: PropTypes.string,
  })).isRequired,
  completed: PropTypes.bool,
};

PostingStatus.defaultProps = {
  completed: false,
};

export default PostingStatus;
