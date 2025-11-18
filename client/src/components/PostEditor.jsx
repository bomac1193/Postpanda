import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import AiCaptionPanel from './AiCaptionPanel';

function PostEditor({ post, onUpdate }) {
  const [caption, setCaption] = useState('');

  useEffect(() => {
    setCaption(post?.caption || '');
  }, [post]);

  if (!post) {
    return (
      <div className="post-editor">
        <h2>Post Editor</h2>
        <p className="muted">Select a tile from the grid to edit its caption.</p>
      </div>
    );
  }

  const handleCaptionChange = (event) => {
    const value = event.target.value;
    setCaption(value);
    onUpdate(post.id, { caption: value });
  };

  const applySuggestion = (suggestion) => {
    setCaption(suggestion);
    onUpdate(post.id, { caption: suggestion });
  };

  return (
    <div className="post-editor">
      <h2>Post Editor</h2>
      <div className="editor-preview">
        {post.image ? (
          <img src={post.image} alt="Selected post" />
        ) : (
          <div className="placeholder" style={{ backgroundColor: post.color }}>
            <span>{caption || 'Untitled draft'}</span>
          </div>
        )}
      </div>
      <label className="field">
        <span>Caption</span>
        <textarea value={caption} onChange={handleCaptionChange} placeholder="Write it in your own words" />
      </label>
      <AiCaptionPanel idea={caption} onApply={applySuggestion} />
    </div>
  );
}

PostEditor.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    caption: PropTypes.string,
    image: PropTypes.string,
    color: PropTypes.string,
  }),
  onUpdate: PropTypes.func.isRequired,
};

PostEditor.defaultProps = {
  post: null,
};

export default PostEditor;
