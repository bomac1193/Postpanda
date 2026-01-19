import { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, Trash2, Edit3, Check, X, Video, Youtube } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import '../components/youtube/youtube.css';

function YouTubePlanner() {
  const {
    youtubeCollections,
    youtubeCollectionsLoading,
    currentCollectionId,
    youtubeVideos,
    youtubeVideosLoading,
    addYoutubeCollection,
    updateYoutubeCollection,
    deleteYoutubeCollection,
    setCurrentCollection,
    fetchYoutubeVideos,
    addYoutubeVideo,
    updateYoutubeVideo,
    deleteYoutubeVideo,
  } = useAppStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    thumbnail: '',
    status: 'draft',
    scheduledDate: '',
  });

  const dropdownRef = useRef(null);

  const currentCollection = youtubeCollections.find(c => c._id === currentCollectionId);
  const collectionVideos = youtubeVideos.filter(v => v.collectionId === currentCollectionId);

  // Fetch videos when collection changes
  useEffect(() => {
    if (currentCollectionId) {
      fetchYoutubeVideos(currentCollectionId).catch(console.error);
    }
  }, [currentCollectionId, fetchYoutubeVideos]);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;
    try {
      await addYoutubeCollection({ name: newCollectionName.trim() });
      setNewCollectionName('');
      setIsCreating(false);
      setDropdownOpen(false);
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  };

  const handleSelectCollection = (collection) => {
    setCurrentCollection(collection._id);
    setDropdownOpen(false);
  };

  const handleDeleteCollection = async () => {
    if (!currentCollectionId) return;
    if (window.confirm('Delete this collection and all its videos?')) {
      try {
        await deleteYoutubeCollection(currentCollectionId);
      } catch (error) {
        console.error('Failed to delete collection:', error);
      }
    }
  };

  const handleStartEditName = () => {
    if (!currentCollection) return;
    setEditedName(currentCollection.name);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!currentCollectionId || !editedName.trim()) return;
    try {
      await updateYoutubeCollection(currentCollectionId, { name: editedName.trim() });
      setEditingName(false);
    } catch (error) {
      console.error('Failed to update collection:', error);
    }
  };

  const handleCancelEditName = () => {
    setEditingName(false);
    setEditedName('');
  };

  const handleOpenVideoModal = (video = null) => {
    if (video) {
      setEditingVideo(video);
      setVideoForm({
        title: video.title || '',
        description: video.description || '',
        thumbnail: video.thumbnail || '',
        status: video.status || 'draft',
        scheduledDate: video.scheduledDate ? video.scheduledDate.slice(0, 16) : '',
      });
    } else {
      setEditingVideo(null);
      setVideoForm({
        title: '',
        description: '',
        thumbnail: '',
        status: 'draft',
        scheduledDate: '',
      });
    }
    setVideoModalOpen(true);
  };

  const handleCloseVideoModal = () => {
    setVideoModalOpen(false);
    setEditingVideo(null);
  };

  const handleSaveVideo = async () => {
    if (!videoForm.title.trim()) return;

    const videoData = {
      title: videoForm.title.trim(),
      description: videoForm.description.trim(),
      thumbnail: videoForm.thumbnail.trim(),
      status: videoForm.status,
      scheduledDate: videoForm.scheduledDate || null,
      collectionId: currentCollectionId,
    };

    try {
      if (editingVideo) {
        await updateYoutubeVideo(editingVideo._id, videoData);
      } else {
        await addYoutubeVideo(videoData);
      }
      handleCloseVideoModal();
    } catch (error) {
      console.error('Failed to save video:', error);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (window.confirm('Delete this video?')) {
      try {
        await deleteYoutubeVideo(videoId);
      } catch (error) {
        console.error('Failed to delete video:', error);
      }
    }
  };

  if (youtubeCollectionsLoading) {
    return (
      <div className="youtube-page">
        <div className="youtube-loading">Loading collections...</div>
      </div>
    );
  }

  return (
    <div className="youtube-page">
      <div className="youtube-header">
        <div className="youtube-header-left">
          <h1>YouTube Planner</h1>
          <p className="youtube-subtitle">Plan and organize your YouTube videos</p>
        </div>
      </div>

      <div className="youtube-toolbar">
        <div className="youtube-selector" ref={dropdownRef}>
          <button
            type="button"
            className="youtube-dropdown-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <Youtube size={18} />
            <span>{currentCollection?.name || 'Select Collection'}</span>
            <ChevronDown size={18} />
          </button>

          {dropdownOpen && (
            <div className="youtube-dropdown">
              {youtubeCollections.length > 0 && (
                <div className="youtube-dropdown-list">
                  {youtubeCollections.map((collection) => (
                    <button
                      key={collection._id}
                      type="button"
                      className={`youtube-dropdown-item ${collection._id === currentCollectionId ? 'active' : ''}`}
                      onClick={() => handleSelectCollection(collection)}
                    >
                      <span
                        className="youtube-collection-color"
                        style={{ background: collection.color || '#6366f1' }}
                      />
                      <span className="youtube-dropdown-item-name">{collection.name}</span>
                      <span className="youtube-dropdown-item-count">
                        {collection.videoCount || 0} videos
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="youtube-dropdown-footer">
                {isCreating ? (
                  <div className="youtube-create-form">
                    <input
                      type="text"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="Collection name..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateCollection();
                        if (e.key === 'Escape') setIsCreating(false);
                      }}
                    />
                    <button type="button" onClick={handleCreateCollection} className="youtube-create-confirm">
                      <Check size={16} />
                    </button>
                    <button type="button" onClick={() => setIsCreating(false)} className="youtube-create-cancel">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="youtube-create-btn"
                    onClick={() => setIsCreating(true)}
                  >
                    <Plus size={16} />
                    <span>New Collection</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {currentCollection && (
          <div className="youtube-actions">
            {editingName ? (
              <div className="youtube-edit-name">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEditName();
                  }}
                  autoFocus
                />
                <button type="button" onClick={handleSaveName}>
                  <Check size={16} />
                </button>
                <button type="button" onClick={handleCancelEditName}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="youtube-action-btn"
                  onClick={handleStartEditName}
                  title="Rename"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  type="button"
                  className="youtube-action-btn danger"
                  onClick={handleDeleteCollection}
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!currentCollection ? (
        <div className="youtube-empty">
          <div className="youtube-empty-content">
            <h2>No Collection Selected</h2>
            <p>Select an existing collection or create a new one to get started.</p>
            <button
              type="button"
              className="primary"
              onClick={() => {
                setDropdownOpen(true);
                setIsCreating(true);
              }}
            >
              <Plus size={18} />
              Create Collection
            </button>
          </div>
        </div>
      ) : (
        <div className="youtube-content">
          {currentCollection.tags && currentCollection.tags.length > 0 && (
            <div className="youtube-collection-info">
              <span
                className="youtube-collection-color"
                style={{ background: currentCollection.color || '#6366f1' }}
              />
              <div className="youtube-collection-tags">
                {currentCollection.tags.map((tag) => (
                  <span key={tag} className="youtube-tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          <div className="youtube-videos">
            {youtubeVideosLoading ? (
              <div className="youtube-loading">Loading videos...</div>
            ) : (
              <>
                {collectionVideos.map((video) => (
                  <div key={video._id} className="youtube-video-card">
                    <div className="youtube-video-thumbnail">
                      {video.thumbnail ? (
                        <img src={video.thumbnail} alt={video.title} />
                      ) : (
                        <div className="youtube-video-thumbnail-placeholder">
                          <Video size={48} />
                        </div>
                      )}
                      <span className={`youtube-video-status ${video.status}`}>
                        {video.status}
                      </span>
                    </div>
                    <div className="youtube-video-content">
                      <h4 className="youtube-video-title">{video.title}</h4>
                      {video.description && (
                        <p className="youtube-video-description">{video.description}</p>
                      )}
                      <div className="youtube-video-actions">
                        <button
                          type="button"
                          className="youtube-video-btn"
                          onClick={() => handleOpenVideoModal(video)}
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          className="youtube-video-btn danger"
                          onClick={() => handleDeleteVideo(video._id)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="youtube-add-video"
                  onClick={() => handleOpenVideoModal()}
                >
                  <Plus size={32} />
                  <span>Add Video</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {videoModalOpen && (
        <div className="youtube-modal-overlay" onClick={handleCloseVideoModal}>
          <div className="youtube-modal" onClick={(e) => e.stopPropagation()}>
            <div className="youtube-modal-header">
              <h3>{editingVideo ? 'Edit Video' : 'Add Video'}</h3>
              <button
                type="button"
                className="youtube-modal-close"
                onClick={handleCloseVideoModal}
              >
                <X size={20} />
              </button>
            </div>
            <div className="youtube-modal-body">
              <div className="youtube-form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  placeholder="Video title..."
                />
              </div>
              <div className="youtube-form-group">
                <label>Description</label>
                <textarea
                  value={videoForm.description}
                  onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                  placeholder="Video description..."
                />
              </div>
              <div className="youtube-form-group">
                <label>Thumbnail URL</label>
                <input
                  type="text"
                  value={videoForm.thumbnail}
                  onChange={(e) => setVideoForm({ ...videoForm, thumbnail: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="youtube-form-group">
                <label>Status</label>
                <select
                  value={videoForm.status}
                  onChange={(e) => setVideoForm({ ...videoForm, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
              </div>
              {videoForm.status === 'scheduled' && (
                <div className="youtube-form-group">
                  <label>Scheduled Date</label>
                  <input
                    type="datetime-local"
                    value={videoForm.scheduledDate}
                    onChange={(e) => setVideoForm({ ...videoForm, scheduledDate: e.target.value })}
                  />
                </div>
              )}
            </div>
            <div className="youtube-modal-footer">
              <button type="button" className="secondary" onClick={handleCloseVideoModal}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleSaveVideo}>
                {editingVideo ? 'Save Changes' : 'Add Video'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default YouTubePlanner;
