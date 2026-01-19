const User = require('../models/User');
const path = require('path');

// Default brand kit structure
const defaultBrandKit = {
  colors: {
    primary: '#111111',
    secondary: '#e4d8cf',
    accent: '#b29674',
    background: '#f4f0ea',
    text: '#110f0e',
    custom: []
  },
  fonts: {
    heading: 'Space Grotesk',
    body: 'Space Grotesk',
    custom: []
  },
  logos: [],
  templates: []
};

// Get brand kit
exports.getBrandKit = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const brandKit = user.brandKit || defaultBrandKit;

    res.json({ brandKit });
  } catch (error) {
    console.error('Get brand kit error:', error);
    res.status(500).json({ error: 'Failed to get brand kit' });
  }
};

// Update entire brand kit
exports.updateBrandKit = async (req, res) => {
  try {
    const { brandKit } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { brandKit: { ...defaultBrandKit, ...brandKit } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Brand kit updated', brandKit: user.brandKit });
  } catch (error) {
    console.error('Update brand kit error:', error);
    res.status(500).json({ error: 'Failed to update brand kit' });
  }
};

// Update colors
exports.updateColors = async (req, res) => {
  try {
    const { colors } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.brandKit = user.brandKit || defaultBrandKit;
    user.brandKit.colors = {
      ...user.brandKit.colors,
      ...colors
    };

    await user.save();

    res.json({ message: 'Colors updated', colors: user.brandKit.colors });
  } catch (error) {
    console.error('Update colors error:', error);
    res.status(500).json({ error: 'Failed to update colors' });
  }
};

// Add custom color
exports.addCustomColor = async (req, res) => {
  try {
    const { name, value } = req.body;

    if (!name || !value) {
      return res.status(400).json({ error: 'Name and value are required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.brandKit = user.brandKit || defaultBrandKit;
    user.brandKit.colors.custom = user.brandKit.colors.custom || [];

    const newColor = {
      id: `color-${Date.now()}`,
      name,
      value
    };

    user.brandKit.colors.custom.push(newColor);
    await user.save();

    res.json({ message: 'Custom color added', color: newColor });
  } catch (error) {
    console.error('Add custom color error:', error);
    res.status(500).json({ error: 'Failed to add custom color' });
  }
};

// Remove custom color
exports.removeCustomColor = async (req, res) => {
  try {
    const { colorId } = req.params;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.brandKit?.colors?.custom) {
      user.brandKit.colors.custom = user.brandKit.colors.custom.filter(
        c => c.id !== colorId
      );
      await user.save();
    }

    res.json({ message: 'Custom color removed' });
  } catch (error) {
    console.error('Remove custom color error:', error);
    res.status(500).json({ error: 'Failed to remove custom color' });
  }
};

// Update fonts
exports.updateFonts = async (req, res) => {
  try {
    const { fonts } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.brandKit = user.brandKit || defaultBrandKit;
    user.brandKit.fonts = {
      ...user.brandKit.fonts,
      ...fonts
    };

    await user.save();

    res.json({ message: 'Fonts updated', fonts: user.brandKit.fonts });
  } catch (error) {
    console.error('Update fonts error:', error);
    res.status(500).json({ error: 'Failed to update fonts' });
  }
};

// Add custom font
exports.addCustomFont = async (req, res) => {
  try {
    const { name, url } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Font name is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.brandKit = user.brandKit || defaultBrandKit;
    user.brandKit.fonts.custom = user.brandKit.fonts.custom || [];

    const newFont = {
      id: `font-${Date.now()}`,
      name,
      url: url || null
    };

    user.brandKit.fonts.custom.push(newFont);
    await user.save();

    res.json({ message: 'Custom font added', font: newFont });
  } catch (error) {
    console.error('Add custom font error:', error);
    res.status(500).json({ error: 'Failed to add custom font' });
  }
};

// Remove custom font
exports.removeCustomFont = async (req, res) => {
  try {
    const { fontId } = req.params;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.brandKit?.fonts?.custom) {
      user.brandKit.fonts.custom = user.brandKit.fonts.custom.filter(
        f => f.id !== fontId
      );
      await user.save();
    }

    res.json({ message: 'Custom font removed' });
  } catch (error) {
    console.error('Remove custom font error:', error);
    res.status(500).json({ error: 'Failed to remove custom font' });
  }
};

// Upload logo
exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { name, type } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.brandKit = user.brandKit || defaultBrandKit;
    user.brandKit.logos = user.brandKit.logos || [];

    const newLogo = {
      id: `logo-${Date.now()}`,
      name: name || 'Logo',
      url: `/uploads/${req.file.filename}`,
      type: type || 'primary'
    };

    user.brandKit.logos.push(newLogo);
    await user.save();

    res.json({ message: 'Logo uploaded', logo: newLogo });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
};

// Update logo
exports.updateLogo = async (req, res) => {
  try {
    const { logoId } = req.params;
    const { name, type } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.brandKit?.logos) {
      const logo = user.brandKit.logos.find(l => l.id === logoId);
      if (logo) {
        if (name) logo.name = name;
        if (type) logo.type = type;
        await user.save();
        return res.json({ message: 'Logo updated', logo });
      }
    }

    res.status(404).json({ error: 'Logo not found' });
  } catch (error) {
    console.error('Update logo error:', error);
    res.status(500).json({ error: 'Failed to update logo' });
  }
};

// Delete logo
exports.deleteLogo = async (req, res) => {
  try {
    const { logoId } = req.params;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.brandKit?.logos) {
      user.brandKit.logos = user.brandKit.logos.filter(l => l.id !== logoId);
      await user.save();
    }

    res.json({ message: 'Logo deleted' });
  } catch (error) {
    console.error('Delete logo error:', error);
    res.status(500).json({ error: 'Failed to delete logo' });
  }
};

// Save template
exports.saveTemplate = async (req, res) => {
  try {
    const { name, settings, previewUrl } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.brandKit = user.brandKit || defaultBrandKit;
    user.brandKit.templates = user.brandKit.templates || [];

    const newTemplate = {
      id: `template-${Date.now()}`,
      name,
      settings: settings || {},
      previewUrl: previewUrl || null,
      createdAt: new Date()
    };

    user.brandKit.templates.push(newTemplate);
    await user.save();

    res.json({ message: 'Template saved', template: newTemplate });
  } catch (error) {
    console.error('Save template error:', error);
    res.status(500).json({ error: 'Failed to save template' });
  }
};

// Update template
exports.updateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, settings, previewUrl } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.brandKit?.templates) {
      const template = user.brandKit.templates.find(t => t.id === templateId);
      if (template) {
        if (name) template.name = name;
        if (settings) template.settings = settings;
        if (previewUrl) template.previewUrl = previewUrl;
        await user.save();
        return res.json({ message: 'Template updated', template });
      }
    }

    res.status(404).json({ error: 'Template not found' });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.brandKit?.templates) {
      user.brandKit.templates = user.brandKit.templates.filter(
        t => t.id !== templateId
      );
      await user.save();
    }

    res.json({ message: 'Template deleted' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
};
