import PropTypes from 'prop-types';

function GridPlanner({ posts, selectedId, onSelect, onReorder }) {
  const handleDragStart = (event, id) => {
    event.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = (event, targetId) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData('text/plain');
    if (sourceId) {
      onReorder(sourceId, targetId);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <div className="grid-planner">
      <div className="panel-head">
        <h2>Grid Preview</h2>
        <p>{posts.length} planned posts</p>
      </div>
      {posts.length === 0 ? (
        <p className="empty-state">Add a post to start crafting your grid.</p>
      ) : (
        <div className="grid">
          {posts.map((post) => (
            <button
              key={post.id}
              className={post.id === selectedId ? 'grid-item active' : 'grid-item'}
              type="button"
              onClick={() => onSelect(post.id)}
              draggable
              onDragStart={(event) => handleDragStart(event, post.id)}
              onDragOver={handleDragOver}
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
};

GridPlanner.defaultProps = {
  selectedId: null,
};

export default GridPlanner;
