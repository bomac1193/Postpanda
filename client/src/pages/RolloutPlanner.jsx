import { useState, useRef } from 'react';
import { Plus, ChevronDown, Trash2, Edit3, Check, X } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import {
  RolloutSection,
  CollectionPicker,
} from '../components/rollout';
import '../components/rollout/rollout.css';

function RolloutPlanner() {
  const {
    rollouts,
    currentRollout,
    currentRolloutId,
    youtubeCollections,
    rolloutsLoading,
    addRollout,
    updateRollout,
    deleteRollout,
    setCurrentRollout,
    addRolloutSection,
    updateRolloutSection,
    deleteRolloutSection,
    reorderRolloutSections,
    addCollectionToSection,
    removeCollectionFromSection,
  } = useAppStore();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newRolloutName, setNewRolloutName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [pickerSectionId, setPickerSectionId] = useState(null);
  const [draggedSectionIndex, setDraggedSectionIndex] = useState(null);
  const dropdownRef = useRef(null);

  const handleCreateRollout = async () => {
    if (!newRolloutName.trim()) return;
    try {
      await addRollout({ name: newRolloutName.trim() });
      setNewRolloutName('');
      setIsCreating(false);
      setDropdownOpen(false);
    } catch (error) {
      console.error('Failed to create rollout:', error);
    }
  };

  const handleSelectRollout = (rollout) => {
    setCurrentRollout(rollout._id);
    setDropdownOpen(false);
  };

  const handleDeleteRollout = async () => {
    if (!currentRolloutId) return;
    if (window.confirm('Delete this rollout?')) {
      try {
        await deleteRollout(currentRolloutId);
      } catch (error) {
        console.error('Failed to delete rollout:', error);
      }
    }
  };

  const handleStartEditName = () => {
    if (!currentRollout) return;
    setEditedName(currentRollout.name);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!currentRolloutId || !editedName.trim()) return;
    try {
      await updateRollout(currentRolloutId, { name: editedName.trim() });
      setEditingName(false);
    } catch (error) {
      console.error('Failed to update rollout:', error);
    }
  };

  const handleCancelEditName = () => {
    setEditingName(false);
    setEditedName('');
  };

  const handleAddSection = async () => {
    if (!currentRolloutId) return;
    try {
      await addRolloutSection(currentRolloutId, { name: `Phase ${(currentRollout?.sections?.length || 0) + 1}` });
    } catch (error) {
      console.error('Failed to add section:', error);
    }
  };

  const handleUpdateSection = async (sectionId, updates) => {
    if (!currentRolloutId) return;
    try {
      await updateRolloutSection(currentRolloutId, sectionId, updates);
    } catch (error) {
      console.error('Failed to update section:', error);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!currentRolloutId) return;
    try {
      await deleteRolloutSection(currentRolloutId, sectionId);
    } catch (error) {
      console.error('Failed to delete section:', error);
    }
  };

  const handleDragStart = (index) => {
    setDraggedSectionIndex(index);
  };

  const handleDragOver = async (e, index) => {
    e.preventDefault();
    if (draggedSectionIndex === null || draggedSectionIndex === index) return;
    try {
      await reorderRolloutSections(currentRolloutId, draggedSectionIndex, index);
      setDraggedSectionIndex(index);
    } catch (error) {
      console.error('Failed to reorder sections:', error);
    }
  };

  const handleDragEnd = () => {
    setDraggedSectionIndex(null);
  };

  const handleOpenPicker = (sectionId) => {
    setPickerSectionId(sectionId);
  };

  const handleClosePicker = () => {
    setPickerSectionId(null);
  };

  const handleAddCollection = async (collectionId) => {
    if (!currentRolloutId || !pickerSectionId) return;
    try {
      await addCollectionToSection(currentRolloutId, pickerSectionId, collectionId);
    } catch (error) {
      console.error('Failed to add collection to section:', error);
    }
  };

  const handleRemoveCollection = async (sectionId, collectionId) => {
    if (!currentRolloutId) return;
    try {
      await removeCollectionFromSection(currentRolloutId, sectionId, collectionId);
    } catch (error) {
      console.error('Failed to remove collection from section:', error);
    }
  };

  const getCollectionById = (id) => {
    // Support both _id (MongoDB) and id (legacy local storage)
    return youtubeCollections.find(c => c._id === id || c.id === id);
  };

  const currentSectionCollectionIds = pickerSectionId
    ? currentRollout?.sections?.find(s => s.id === pickerSectionId)?.collectionIds || []
    : [];

  if (rolloutsLoading) {
    return (
      <div className="rollout-page">
        <div className="rollout-empty">
          <div className="rollout-empty-content">
            <p>Loading rollouts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rollout-page">
      <div className="rollout-header">
        <div className="rollout-header-left">
          <h1>Rollout Planner</h1>
          <p className="rollout-subtitle">Organize your campaign phases</p>
        </div>
      </div>

      <div className="rollout-toolbar">
        <div className="rollout-selector" ref={dropdownRef}>
          <button
            type="button"
            className="rollout-dropdown-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span>{currentRollout?.name || 'Select Rollout'}</span>
            <ChevronDown size={18} />
          </button>

          {dropdownOpen && (
            <div className="rollout-dropdown">
              {rollouts.length > 0 && (
                <div className="rollout-dropdown-list">
                  {rollouts.map((rollout) => (
                    <button
                      key={rollout._id}
                      type="button"
                      className={`rollout-dropdown-item ${rollout._id === currentRolloutId ? 'active' : ''}`}
                      onClick={() => handleSelectRollout(rollout)}
                    >
                      <span className="rollout-dropdown-item-name">{rollout.name}</span>
                      <span className={`rollout-status-badge ${rollout.status}`}>
                        {rollout.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="rollout-dropdown-footer">
                {isCreating ? (
                  <div className="rollout-create-form">
                    <input
                      type="text"
                      value={newRolloutName}
                      onChange={(e) => setNewRolloutName(e.target.value)}
                      placeholder="Rollout name..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateRollout();
                        if (e.key === 'Escape') setIsCreating(false);
                      }}
                    />
                    <button type="button" onClick={handleCreateRollout} className="rollout-create-confirm">
                      <Check size={16} />
                    </button>
                    <button type="button" onClick={() => setIsCreating(false)} className="rollout-create-cancel">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="rollout-create-btn"
                    onClick={() => setIsCreating(true)}
                  >
                    <Plus size={16} />
                    <span>New Rollout</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {currentRollout && (
          <div className="rollout-actions">
            {editingName ? (
              <div className="rollout-edit-name">
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
                  className="rollout-action-btn"
                  onClick={handleStartEditName}
                  title="Rename"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  type="button"
                  className="rollout-action-btn danger"
                  onClick={handleDeleteRollout}
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!currentRollout ? (
        <div className="rollout-empty">
          <div className="rollout-empty-content">
            <h2>No Rollout Selected</h2>
            <p>Select an existing rollout or create a new one to get started.</p>
            <button
              type="button"
              className="primary"
              onClick={() => {
                setDropdownOpen(true);
                setIsCreating(true);
              }}
            >
              <Plus size={18} />
              Create Rollout
            </button>
          </div>
        </div>
      ) : (
        <div className="rollout-content">
          <div className="rollout-sections">
            {currentRollout.sections
              .sort((a, b) => a.order - b.order)
              .map((section, index) => (
                <RolloutSection
                  key={section.id}
                  section={section}
                  index={index}
                  collections={section.collectionIds.map(getCollectionById).filter(Boolean)}
                  onUpdate={(updates) => handleUpdateSection(section.id, updates)}
                  onDelete={() => handleDeleteSection(section.id)}
                  onAddCollection={() => handleOpenPicker(section.id)}
                  onRemoveCollection={(collectionId) => handleRemoveCollection(section.id, collectionId)}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedSectionIndex === index}
                />
              ))}

            <button
              type="button"
              className="rollout-add-section"
              onClick={handleAddSection}
            >
              <Plus size={20} />
              <span>Add Section</span>
            </button>
          </div>
        </div>
      )}

      {pickerSectionId && (
        <CollectionPicker
          collections={youtubeCollections}
          selectedIds={currentSectionCollectionIds}
          onSelect={handleAddCollection}
          onClose={handleClosePicker}
        />
      )}
    </div>
  );
}

export default RolloutPlanner;
