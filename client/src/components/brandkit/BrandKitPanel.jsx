import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ColorPaletteEditor from './ColorPaletteEditor';
import LogoManager from './LogoManager';
import FontSelector from './FontSelector';
import './brandkit.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002';

function BrandKitPanel({ onSelectColor, onSelectFont, onSelectLogo }) {
  const [brandKit, setBrandKit] = useState(null);
  const [activeTab, setActiveTab] = useState('colors');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBrandKit();
  }, []);

  const fetchBrandKit = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/brandkit`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setBrandKit(data.brandKit);
    } catch (err) {
      setError('Failed to load brand kit');
    } finally {
      setLoading(false);
    }
  };

  const updateColors = async (colors) => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/brandkit/colors`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ colors }),
      });
      const data = await response.json();
      setBrandKit(prev => ({ ...prev, colors: data.colors }));
    } catch (err) {
      setError('Failed to update colors');
    } finally {
      setSaving(false);
    }
  };

  const addCustomColor = async (color) => {
    try {
      const response = await fetch(`${API_BASE}/api/brandkit/colors/custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(color),
      });
      const data = await response.json();
      setBrandKit(prev => ({
        ...prev,
        colors: {
          ...prev.colors,
          custom: [...(prev.colors.custom || []), data.color]
        }
      }));
    } catch (err) {
      setError('Failed to add custom color');
    }
  };

  const removeCustomColor = async (colorId) => {
    try {
      await fetch(`${API_BASE}/api/brandkit/colors/custom/${colorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setBrandKit(prev => ({
        ...prev,
        colors: {
          ...prev.colors,
          custom: prev.colors.custom.filter(c => c.id !== colorId)
        }
      }));
    } catch (err) {
      setError('Failed to remove custom color');
    }
  };

  const updateFonts = async (fonts) => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/brandkit/fonts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ fonts }),
      });
      const data = await response.json();
      setBrandKit(prev => ({ ...prev, fonts: data.fonts }));
    } catch (err) {
      setError('Failed to update fonts');
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file, name, type) => {
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('name', name);
    formData.append('type', type);

    try {
      const response = await fetch(`${API_BASE}/api/brandkit/logos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });
      const data = await response.json();
      setBrandKit(prev => ({
        ...prev,
        logos: [...(prev.logos || []), data.logo]
      }));
      return data.logo;
    } catch (err) {
      setError('Failed to upload logo');
      return null;
    }
  };

  const deleteLogo = async (logoId) => {
    try {
      await fetch(`${API_BASE}/api/brandkit/logos/${logoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setBrandKit(prev => ({
        ...prev,
        logos: prev.logos.filter(l => l.id !== logoId)
      }));
    } catch (err) {
      setError('Failed to delete logo');
    }
  };

  if (loading) {
    return <div className="brandkit-loading">Loading brand kit...</div>;
  }

  return (
    <div className="brandkit-panel">
      <div className="brandkit-header">
        <h3>Brand Kit</h3>
        {saving && <span className="brandkit-saving">Saving...</span>}
      </div>

      {error && <div className="brandkit-error">{error}</div>}

      <div className="brandkit-tabs">
        <button
          type="button"
          className={`brandkit-tab ${activeTab === 'colors' ? 'active' : ''}`}
          onClick={() => setActiveTab('colors')}
        >
          Colors
        </button>
        <button
          type="button"
          className={`brandkit-tab ${activeTab === 'fonts' ? 'active' : ''}`}
          onClick={() => setActiveTab('fonts')}
        >
          Fonts
        </button>
        <button
          type="button"
          className={`brandkit-tab ${activeTab === 'logos' ? 'active' : ''}`}
          onClick={() => setActiveTab('logos')}
        >
          Logos
        </button>
      </div>

      <div className="brandkit-content">
        {activeTab === 'colors' && brandKit && (
          <ColorPaletteEditor
            colors={brandKit.colors}
            onUpdateColors={updateColors}
            onAddCustomColor={addCustomColor}
            onRemoveCustomColor={removeCustomColor}
            onSelectColor={onSelectColor}
          />
        )}

        {activeTab === 'fonts' && brandKit && (
          <FontSelector
            fonts={brandKit.fonts}
            onUpdateFonts={updateFonts}
            onSelectFont={onSelectFont}
          />
        )}

        {activeTab === 'logos' && brandKit && (
          <LogoManager
            logos={brandKit.logos}
            onUploadLogo={uploadLogo}
            onDeleteLogo={deleteLogo}
            onSelectLogo={onSelectLogo}
          />
        )}
      </div>
    </div>
  );
}

BrandKitPanel.propTypes = {
  onSelectColor: PropTypes.func,
  onSelectFont: PropTypes.func,
  onSelectLogo: PropTypes.func,
};

BrandKitPanel.defaultProps = {
  onSelectColor: null,
  onSelectFont: null,
  onSelectLogo: null,
};

export default BrandKitPanel;
