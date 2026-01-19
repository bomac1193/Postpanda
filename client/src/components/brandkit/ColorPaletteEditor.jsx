import { useState } from 'react';
import PropTypes from 'prop-types';
import './brandkit.css';

const COLOR_ROLES = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'text', label: 'Text' },
];

function ColorPaletteEditor({
  colors,
  onUpdateColors,
  onAddCustomColor,
  onRemoveCustomColor,
  onSelectColor,
}) {
  const [newColorName, setNewColorName] = useState('');
  const [newColorValue, setNewColorValue] = useState('#000000');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleColorChange = (key, value) => {
    onUpdateColors({ [key]: value });
  };

  const handleAddCustomColor = (e) => {
    e.preventDefault();
    if (!newColorName.trim()) return;

    onAddCustomColor({
      name: newColorName.trim(),
      value: newColorValue,
    });

    setNewColorName('');
    setNewColorValue('#000000');
    setShowAddForm(false);
  };

  const handleSelectColor = (value) => {
    if (onSelectColor) {
      onSelectColor(value);
    }
  };

  return (
    <div className="color-palette-editor">
      <div className="color-section">
        <h4>Brand Colors</h4>
        <div className="color-grid">
          {COLOR_ROLES.map(({ key, label }) => (
            <div key={key} className="color-item">
              <div className="color-input-group">
                <input
                  type="color"
                  value={colors[key] || '#000000'}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="color-picker"
                />
                <div className="color-info">
                  <span className="color-label">{label}</span>
                  <span className="color-value">{colors[key] || '#000000'}</span>
                </div>
              </div>
              <button
                type="button"
                className="color-use-btn"
                onClick={() => handleSelectColor(colors[key])}
                title="Use this color"
              >
                Use
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="color-section">
        <div className="color-section-header">
          <h4>Custom Colors</h4>
          <button
            type="button"
            className="color-add-btn"
            onClick={() => setShowAddForm(true)}
          >
            + Add
          </button>
        </div>

        {showAddForm && (
          <form className="color-add-form" onSubmit={handleAddCustomColor}>
            <input
              type="text"
              placeholder="Color name"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
            />
            <input
              type="color"
              value={newColorValue}
              onChange={(e) => setNewColorValue(e.target.value)}
              className="color-picker-small"
            />
            <input
              type="text"
              value={newColorValue}
              onChange={(e) => setNewColorValue(e.target.value)}
              className="color-hex-input"
            />
            <button type="submit" className="primary">Add</button>
            <button type="button" className="ghost" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </form>
        )}

        <div className="custom-colors-grid">
          {colors.custom?.map((color) => (
            <div key={color.id} className="custom-color-item">
              <div
                className="custom-color-swatch"
                style={{ backgroundColor: color.value }}
                onClick={() => handleSelectColor(color.value)}
              />
              <span className="custom-color-name">{color.name}</span>
              <button
                type="button"
                className="custom-color-remove"
                onClick={() => onRemoveCustomColor(color.id)}
              >
                &times;
              </button>
            </div>
          ))}

          {(!colors.custom || colors.custom.length === 0) && !showAddForm && (
            <p className="no-custom-colors">No custom colors yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

ColorPaletteEditor.propTypes = {
  colors: PropTypes.shape({
    primary: PropTypes.string,
    secondary: PropTypes.string,
    accent: PropTypes.string,
    background: PropTypes.string,
    text: PropTypes.string,
    custom: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      value: PropTypes.string,
    })),
  }).isRequired,
  onUpdateColors: PropTypes.func.isRequired,
  onAddCustomColor: PropTypes.func.isRequired,
  onRemoveCustomColor: PropTypes.func.isRequired,
  onSelectColor: PropTypes.func,
};

ColorPaletteEditor.defaultProps = {
  onSelectColor: null,
};

export default ColorPaletteEditor;
