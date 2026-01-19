import { useState } from 'react';
import { GripVertical, Trash2, Plus, Edit3, Check, X } from 'lucide-react';
import CollectionCard from './CollectionCard';

function RolloutSection({
  section,
  index,
  collections,
  onUpdate,
  onDelete,
  onAddCollection,
  onRemoveCollection,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(section.name);

  const handleSaveName = () => {
    if (!editedName.trim()) return;
    onUpdate({ name: editedName.trim() });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedName(section.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') handleCancelEdit();
  };

  return (
    <div
      className={`rollout-section ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="rollout-section-header">
        <div className="rollout-section-drag-handle">
          <GripVertical size={18} />
        </div>

        <div className="rollout-section-title">
          {isEditing ? (
            <div className="rollout-section-edit">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <button type="button" onClick={handleSaveName} className="icon-btn">
                <Check size={16} />
              </button>
              <button type="button" onClick={handleCancelEdit} className="icon-btn">
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <span className="rollout-section-order">Phase {index + 1}</span>
              <h3>{section.name}</h3>
            </>
          )}
        </div>

        <div className="rollout-section-actions">
          {!isEditing && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                setEditedName(section.name);
                setIsEditing(true);
              }}
              title="Rename"
            >
              <Edit3 size={16} />
            </button>
          )}
          <button
            type="button"
            className="icon-btn danger"
            onClick={onDelete}
            title="Delete section"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="rollout-section-content">
        {collections.length === 0 ? (
          <div className="rollout-section-empty">
            <p>No collections in this section</p>
          </div>
        ) : (
          <div className="rollout-section-collections">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onRemove={() => onRemoveCollection(collection.id)}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          className="rollout-section-add-btn"
          onClick={onAddCollection}
        >
          <Plus size={16} />
          <span>Add Collection</span>
        </button>
      </div>
    </div>
  );
}

export default RolloutSection;
