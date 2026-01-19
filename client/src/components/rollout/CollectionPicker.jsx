import { useState, useMemo } from 'react';
import { X, Search, Folder, Plus, Tag } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

function CollectionPicker({ collections, selectedIds, onSelect, onClose }) {
  const { addYoutubeCollection } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionTags, setNewCollectionTags] = useState('');

  const allTags = useMemo(() => {
    const tags = new Set();
    collections.forEach((c) => {
      (c.tags || []).forEach((t) => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [collections]);

  const filteredCollections = useMemo(() => {
    return collections.filter((collection) => {
      const matchesSearch = !searchQuery ||
        collection.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every((tag) => (collection.tags || []).includes(tag));

      // Support both _id (MongoDB) and id (legacy)
      const collectionId = collection._id || collection.id;
      const notSelected = !selectedIds.includes(collectionId);

      return matchesSearch && matchesTags && notSelected;
    });
  }, [collections, searchQuery, selectedTags, selectedIds]);

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    const tags = newCollectionTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t);

    try {
      const newCollection = await addYoutubeCollection({
        name: newCollectionName.trim(),
        tags,
      });

      // Support both _id (MongoDB) and id (legacy)
      onSelect(newCollection._id || newCollection.id);
      setNewCollectionName('');
      setNewCollectionTags('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create collection:', error);
    }
  };

  return (
    <div className="collection-picker-overlay" onClick={onClose}>
      <div className="collection-picker" onClick={(e) => e.stopPropagation()}>
        <div className="collection-picker-header">
          <h3>Add Collection</h3>
          <button type="button" className="collection-picker-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="collection-picker-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {allTags.length > 0 && (
          <div className="collection-picker-tags">
            <div className="collection-picker-tags-label">
              <Tag size={14} />
              <span>Filter by tags:</span>
            </div>
            <div className="collection-picker-tags-list">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`collection-picker-tag ${selectedTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => handleToggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="collection-picker-list">
          {filteredCollections.length === 0 ? (
            <div className="collection-picker-empty">
              <p>No collections found</p>
            </div>
          ) : (
            filteredCollections.map((collection) => (
              <button
                key={collection._id || collection.id}
                type="button"
                className="collection-picker-item"
                onClick={() => onSelect(collection._id || collection.id)}
              >
                <div className="collection-picker-item-icon">
                  <Folder size={20} />
                </div>
                <div className="collection-picker-item-content">
                  <span className="collection-picker-item-name">{collection.name}</span>
                  {collection.tags && collection.tags.length > 0 && (
                    <div className="collection-picker-item-tags">
                      {collection.tags.map((tag) => (
                        <span key={tag} className="collection-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="collection-picker-footer">
          {isCreating ? (
            <div className="collection-picker-create-form">
              <input
                type="text"
                placeholder="Collection name..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                autoFocus
              />
              <input
                type="text"
                placeholder="Tags (comma-separated)..."
                value={newCollectionTags}
                onChange={(e) => setNewCollectionTags(e.target.value)}
              />
              <div className="collection-picker-create-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={handleCreateCollection}
                >
                  Create & Add
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="collection-picker-create-btn"
              onClick={() => setIsCreating(true)}
            >
              <Plus size={16} />
              <span>Create New Collection</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CollectionPicker;
