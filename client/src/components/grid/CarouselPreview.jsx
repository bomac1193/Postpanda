import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './grid-components.css';

function CarouselPreview({ images, captions, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const containerRef = useRef(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const goToNext = () => {
    setCurrentIndex(prev =>
      prev < images.length - 1 ? prev + 1 : prev
    );
  };

  const goToPrevious = () => {
    setCurrentIndex(prev =>
      prev > 0 ? prev - 1 : prev
    );
  };

  const goToIndex = (index) => {
    setCurrentIndex(index);
  };

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className="carousel-preview-empty">
        <p>No images to display</p>
      </div>
    );
  }

  const currentCaption = captions?.[currentIndex] || '';

  return (
    <div className="carousel-preview" ref={containerRef}>
      <div className="carousel-preview-header">
        <div className="carousel-preview-user">
          <div className="carousel-preview-avatar" />
          <span className="carousel-preview-username">username</span>
        </div>
        {onClose && (
          <button type="button" className="carousel-preview-close" onClick={onClose}>
            &times;
          </button>
        )}
      </div>

      <div
        className="carousel-preview-container"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="carousel-preview-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={index} className="carousel-preview-slide">
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="carousel-preview-image"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              className={`carousel-nav-btn prev ${currentIndex === 0 ? 'disabled' : ''}`}
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              &lt;
            </button>
            <button
              type="button"
              className={`carousel-nav-btn next ${currentIndex === images.length - 1 ? 'disabled' : ''}`}
              onClick={goToNext}
              disabled={currentIndex === images.length - 1}
            >
              &gt;
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="carousel-preview-dots">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      <div className="carousel-preview-footer">
        <div className="carousel-preview-actions">
          <button type="button" className="carousel-action-btn">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <button type="button" className="carousel-action-btn">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button type="button" className="carousel-action-btn">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
          <button type="button" className="carousel-action-btn save">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>

        {currentCaption && (
          <div className="carousel-preview-caption">
            <span className="carousel-caption-username">username</span>
            <span className="carousel-caption-text">{currentCaption}</span>
          </div>
        )}

        <div className="carousel-preview-counter">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}

CarouselPreview.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  captions: PropTypes.arrayOf(PropTypes.string),
  onClose: PropTypes.func,
};

CarouselPreview.defaultProps = {
  captions: [],
  onClose: null,
};

export default CarouselPreview;
