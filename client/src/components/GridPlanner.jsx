import { useState, useRef } from 'react';
import PropTypes from 'prop-types';

function GridPlanner({ posts, selectedId, onSelect, onReorder, onExport }) {
  const [isLocked, setIsLocked] = useState(false);
  const [dragOverId, setDragOverId] = useState(null);
  const gridRef = useRef(null);

  const handleDragStart = (event, id) => {
    if (isLocked) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData('text/plain', id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (event, targetId) => {
    event.preventDefault();
    setDragOverId(null);
    if (isLocked) return;
    const sourceId = event.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== targetId) {
      onReorder(sourceId, targetId);
    }
  };

  const handleDragOver = (event, id) => {
    event.preventDefault();
    if (!isLocked) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleExportGrid = async (platform) => {
    if (!gridRef.current || posts.length === 0) return;

    const dimensions = {
      instagram: { width: 1080, height: 1080, cols: 3 },
      tiktok: { width: 1080, height: 1920, cols: 3 },
      square: { width: 1080, height: 1080, cols: 3 },
    };

    const config = dimensions[platform] || dimensions.square;
    const cellSize = config.width / config.cols;
    const rows = Math.ceil(posts.length / config.cols);
    const canvasHeight = Math.min(rows * cellSize, config.height);

    const canvas = document.createElement('canvas');
    canvas.width = config.width;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f4f0ea';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const loadImage = (src) => new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

    for (let i = 0; i < posts.length && i < rows * config.cols; i++) {
      const post = posts[i];
      const col = i % config.cols;
      const row = Math.floor(i / config.cols);
      const x = col * cellSize;
      const y = row * cellSize;

      if (post.image) {
        try {
          const img = await loadImage(post.image);
          const scale = Math.max(cellSize / img.width, cellSize / img.height);
          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;
          const offsetX = (cellSize - drawWidth) / 2;
          const offsetY = (cellSize - drawHeight) / 2;

          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, cellSize, cellSize);
          ctx.clip();
          ctx.drawImage(img, x + offsetX, y + offsetY, drawWidth, drawHeight);
          ctx.restore();
        } catch (e) {
          ctx.fillStyle = post.color || '#d3c7b5';
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      } else {
        ctx.fillStyle = post.color || '#d3c7b5';
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }

    const link = document.createElement('a');
    link.download = `postpilot-grid-${platform}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="grid-planner">
      <div className="panel-head">
        <div className="panel-head-row">
          <div>
            <h2>Grid Preview</h2>
            <p>{posts.length} planned posts</p>
          </div>
          <button
            type="button"
            className={isLocked ? 'lock-btn locked' : 'lock-btn'}
            onClick={() => setIsLocked(!isLocked)}
            title={isLocked ? 'Unlock grid to reorder' : 'Lock grid positions'}
          >
            {isLocked ? '🔒 Locked' : '🔓 Unlocked'}
          </button>
        </div>
      </div>
      {posts.length === 0 ? (
        <p className="empty-state">Add a post to start crafting your grid.</p>
      ) : (
        <>
          <div className="grid" ref={gridRef}>
            {posts.map((post) => (
              <button
                key={post.id}
                className={`grid-item ${post.id === selectedId ? 'active' : ''} ${dragOverId === post.id ? 'drag-over' : ''} ${isLocked ? 'locked' : ''}`}
                type="button"
                onClick={() => onSelect(post.id)}
                draggable={!isLocked}
                onDragStart={(event) => handleDragStart(event, post.id)}
                onDragOver={(event) => handleDragOver(event, post.id)}
                onDragLeave={handleDragLeave}
                onDrop={(event) => handleDrop(event, post.id)}
              >
                {post.image ? (
                  <img src={post.image} alt={post.caption || 'Draft post'} />
                ) : (
                  <div className="placeholder" style={{ backgroundColor: post.color }}>
                    <span>{post.caption ? post.caption.slice(0, 40) : 'New Post'}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="grid-actions">
            <span className="action-label">Export for:</span>
            <button type="button" className="ghost" onClick={() => handleExportGrid('instagram')}>
              Instagram
            </button>
            <button type="button" className="ghost" onClick={() => handleExportGrid('tiktok')}>
              TikTok
            </button>
          </div>
        </>
      )}
    </div>
  );
}

GridPlanner.propTypes = {
  posts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      caption: PropTypes.string,
      image: PropTypes.string,
      color: PropTypes.string,
    })
  ).isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onReorder: PropTypes.func.isRequired,
  onExport: PropTypes.func,
};

GridPlanner.defaultProps = {
  selectedId: null,
  onExport: null,
};

export default GridPlanner;
