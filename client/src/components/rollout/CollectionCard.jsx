import { X, Folder } from 'lucide-react';

function CollectionCard({ collection, onRemove }) {
  return (
    <div className="collection-card">
      <div className="collection-card-icon">
        <Folder size={20} />
      </div>
      <div className="collection-card-content">
        <span className="collection-card-name">{collection.name}</span>
        {collection.tags && collection.tags.length > 0 && (
          <div className="collection-card-tags">
            {collection.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="collection-tag">{tag}</span>
            ))}
            {collection.tags.length > 3 && (
              <span className="collection-tag-more">+{collection.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        className="collection-card-remove"
        onClick={onRemove}
        title="Remove from section"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default CollectionCard;
