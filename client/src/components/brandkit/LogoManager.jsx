import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import './brandkit.css';

const LOGO_TYPES = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'icon', label: 'Icon' },
  { value: 'wordmark', label: 'Wordmark' },
];

function LogoManager({ logos, onUploadLogo, onDeleteLogo, onSelectLogo }) {
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newLogoName, setNewLogoName] = useState('');
  const [newLogoType, setNewLogoType] = useState('primary');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await onUploadLogo(file, newLogoName || 'Logo', newLogoType);
      setNewLogoName('');
      setNewLogoType('primary');
      setShowUploadForm(false);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    setUploading(true);
    try {
      await onUploadLogo(file, 'Logo', 'primary');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectLogo = (logo) => {
    if (onSelectLogo) {
      onSelectLogo(logo);
    }
  };

  return (
    <div className="logo-manager">
      <div className="logo-section">
        <div className="logo-section-header">
          <h4>Brand Logos</h4>
          <button
            type="button"
            className="logo-add-btn"
            onClick={() => setShowUploadForm(true)}
          >
            + Upload
          </button>
        </div>

        {showUploadForm && (
          <div className="logo-upload-form">
            <input
              type="text"
              placeholder="Logo name"
              value={newLogoName}
              onChange={(e) => setNewLogoName(e.target.value)}
            />
            <select
              value={newLogoType}
              onChange={(e) => setNewLogoType(e.target.value)}
            >
              {LOGO_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              ref={fileInputRef}
              disabled={uploading}
            />
            <button
              type="button"
              className="ghost"
              onClick={() => setShowUploadForm(false)}
            >
              Cancel
            </button>
          </div>
        )}

        <div
          className="logo-drop-zone"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {uploading ? (
            <p>Uploading...</p>
          ) : (
            <p>Drag & drop a logo here</p>
          )}
        </div>

        <div className="logos-grid">
          {logos?.map((logo) => (
            <div key={logo.id} className="logo-item">
              <img
                src={logo.url}
                alt={logo.name}
                className="logo-preview"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('logoUrl', logo.url);
                  e.dataTransfer.setData('logoData', JSON.stringify(logo));
                }}
                onClick={() => handleSelectLogo(logo)}
              />
              <div className="logo-info">
                <span className="logo-name">{logo.name}</span>
                <span className="logo-type">{logo.type}</span>
              </div>
              <div className="logo-actions">
                <button
                  type="button"
                  className="logo-use-btn"
                  onClick={() => handleSelectLogo(logo)}
                >
                  Use
                </button>
                <button
                  type="button"
                  className="logo-delete-btn"
                  onClick={() => onDeleteLogo(logo.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {(!logos || logos.length === 0) && (
            <p className="no-logos">No logos uploaded yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

LogoManager.propTypes = {
  logos: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    url: PropTypes.string,
    type: PropTypes.string,
  })),
  onUploadLogo: PropTypes.func.isRequired,
  onDeleteLogo: PropTypes.func.isRequired,
  onSelectLogo: PropTypes.func,
};

LogoManager.defaultProps = {
  logos: [],
  onSelectLogo: null,
};

export default LogoManager;
