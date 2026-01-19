import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './grid-components.css';

function StoryPreview({ stories, username, avatar, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressInterval = useRef(null);
  const storyDuration = 5000; // 5 seconds per story

  useEffect(() => {
    if (!isPaused && stories.length > 0) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (currentIndex < stories.length - 1) {
              setCurrentIndex(i => i + 1);
              return 0;
            } else {
              if (onClose) onClose();
              return 100;
            }
          }
          return prev + (100 / (storyDuration / 100));
        });
      }, 100);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentIndex, isPaused, stories.length, onClose]);

  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(p => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, onClose]);

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else if (onClose) {
      onClose();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  };

  const handleTapLeft = () => {
    goToPrevious();
  };

  const handleTapRight = () => {
    goToNext();
  };

  const handleTouchStart = () => {
    setIsPaused(true);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
  };

  if (!stories || stories.length === 0) {
    return (
      <div className="story-preview-empty">
        <p>No stories to display</p>
      </div>
    );
  }

  const currentStory = stories[currentIndex];

  return (
    <div className="story-preview">
      <div className="story-preview-frame">
        {/* Progress bars */}
        <div className="story-progress-bars">
          {stories.map((_, index) => (
            <div key={index} className="story-progress-track">
              <div
                className="story-progress-fill"
                style={{
                  width: index < currentIndex ? '100%' :
                         index === currentIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="story-header">
          <div className="story-user-info">
            <div
              className="story-avatar"
              style={avatar ? { backgroundImage: `url(${avatar})` } : {}}
            />
            <span className="story-username">{username || 'username'}</span>
            <span className="story-timestamp">
              {currentStory.timestamp || 'Just now'}
            </span>
          </div>
          <div className="story-header-actions">
            <button
              type="button"
              className="story-pause-btn"
              onClick={() => setIsPaused(p => !p)}
            >
              {isPaused ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              )}
            </button>
            {onClose && (
              <button type="button" className="story-close-btn" onClick={onClose}>
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          className="story-content"
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {currentStory.type === 'video' ? (
            <video
              src={currentStory.url || currentStory.image}
              className="story-media"
              autoPlay
              muted
              loop
            />
          ) : (
            <img
              src={currentStory.url || currentStory.image}
              alt={currentStory.caption || `Story ${currentIndex + 1}`}
              className="story-media"
            />
          )}

          {/* Tap areas */}
          <div className="story-tap-area left" onClick={handleTapLeft} />
          <div className="story-tap-area right" onClick={handleTapRight} />

          {/* Caption overlay */}
          {currentStory.caption && (
            <div className="story-caption-overlay">
              <p>{currentStory.caption}</p>
            </div>
          )}

          {/* Sticker overlays */}
          {currentStory.stickers && currentStory.stickers.map((sticker, index) => (
            <div
              key={index}
              className={`story-sticker ${sticker.type}`}
              style={{
                left: `${sticker.x || 50}%`,
                top: `${sticker.y || 50}%`,
              }}
            >
              {sticker.type === 'mention' && `@${sticker.value}`}
              {sticker.type === 'hashtag' && `#${sticker.value}`}
              {sticker.type === 'location' && sticker.value}
              {sticker.type === 'poll' && (
                <div className="story-poll">
                  <p>{sticker.question}</p>
                  {sticker.options?.map((option, i) => (
                    <div key={i} className="story-poll-option">{option}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="story-footer">
          <div className="story-reply-input">
            <input
              type="text"
              placeholder={`Reply to ${username || 'user'}...`}
              disabled
            />
          </div>
          <div className="story-footer-actions">
            <button type="button" className="story-action-btn">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <button type="button" className="story-action-btn">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

StoryPreview.propTypes = {
  stories: PropTypes.arrayOf(PropTypes.shape({
    url: PropTypes.string,
    image: PropTypes.string,
    type: PropTypes.oneOf(['image', 'video']),
    caption: PropTypes.string,
    timestamp: PropTypes.string,
    stickers: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string,
      value: PropTypes.string,
      x: PropTypes.number,
      y: PropTypes.number,
    })),
  })).isRequired,
  username: PropTypes.string,
  avatar: PropTypes.string,
  onClose: PropTypes.func,
};

StoryPreview.defaultProps = {
  username: 'username',
  avatar: null,
  onClose: null,
};

export default StoryPreview;
