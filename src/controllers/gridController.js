const Grid = require('../models/Grid');
const Content = require('../models/Content');

// Create new grid
exports.createGrid = async (req, res) => {
  try {
    const { name, platform, columns, totalRows } = req.body;

    // Initialize empty cells
    const cells = [];
    for (let row = 0; row < (totalRows || 3); row++) {
      for (let col = 0; col < (columns || 3); col++) {
        cells.push({
          position: { row, col },
          isEmpty: true
        });
      }
    }

    const grid = new Grid({
      userId: req.userId,
      name: name || 'Untitled Grid',
      platform: platform || 'instagram',
      columns: columns || 3,
      totalRows: totalRows || 3,
      cells
    });

    await grid.save();

    res.status(201).json({
      message: 'Grid created successfully',
      grid
    });
  } catch (error) {
    console.error('Create grid error:', error);
    res.status(500).json({ error: 'Failed to create grid' });
  }
};

// Get all grids for user
exports.getAllGrids = async (req, res) => {
  try {
    const grids = await Grid.find({ userId: req.userId })
      .populate('cells.contentId')
      .sort({ updatedAt: -1 });

    res.json({ grids });
  } catch (error) {
    console.error('Get grids error:', error);
    res.status(500).json({ error: 'Failed to get grids' });
  }
};

// Get grid by ID
exports.getGridById = async (req, res) => {
  try {
    const grid = await Grid.findOne({ _id: req.params.id, userId: req.userId })
      .populate('cells.contentId');

    if (!grid) {
      return res.status(404).json({ error: 'Grid not found' });
    }

    res.json({ grid });
  } catch (error) {
    console.error('Get grid error:', error);
    res.status(500).json({ error: 'Failed to get grid' });
  }
};

// Update grid
exports.updateGrid = async (req, res) => {
  try {
    const { name, platform, columns, isActive } = req.body;

    const grid = await Grid.findOne({ _id: req.params.id, userId: req.userId });
    if (!grid) {
      return res.status(404).json({ error: 'Grid not found' });
    }

    if (name) grid.name = name;
    if (platform) grid.platform = platform;
    if (columns) grid.columns = columns;
    if (isActive !== undefined) grid.isActive = isActive;

    await grid.save();

    res.json({
      message: 'Grid updated successfully',
      grid
    });
  } catch (error) {
    console.error('Update grid error:', error);
    res.status(500).json({ error: 'Failed to update grid' });
  }
};

// Delete grid
exports.deleteGrid = async (req, res) => {
  try {
    const grid = await Grid.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!grid) {
      return res.status(404).json({ error: 'Grid not found' });
    }

    res.json({ message: 'Grid deleted successfully' });
  } catch (error) {
    console.error('Delete grid error:', error);
    res.status(500).json({ error: 'Failed to delete grid' });
  }
};

// Add row to grid
exports.addRow = async (req, res) => {
  try {
    const grid = await Grid.findOne({ _id: req.params.id, userId: req.userId });
    if (!grid) {
      return res.status(404).json({ error: 'Grid not found' });
    }

    const newRow = grid.totalRows;
    for (let col = 0; col < grid.columns; col++) {
      grid.cells.push({
        position: { row: newRow, col },
        isEmpty: true
      });
    }

    grid.totalRows += 1;
    await grid.save();

    res.json({
      message: 'Row added successfully',
      grid
    });
  } catch (error) {
    console.error('Add row error:', error);
    res.status(500).json({ error: 'Failed to add row' });
  }
};

// Remove row from grid
exports.removeRow = async (req, res) => {
  try {
    const grid = await Grid.findOne({ _id: req.params.id, userId: req.userId });
    if (!grid) {
      return res.status(404).json({ error: 'Grid not found' });
    }

    if (grid.totalRows <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last row' });
    }

    const lastRow = grid.totalRows - 1;
    grid.cells = grid.cells.filter(cell => cell.position.row !== lastRow);
    grid.totalRows -= 1;

    await grid.save();

    res.json({
      message: 'Row removed successfully',
      grid
    });
  } catch (error) {
    console.error('Remove row error:', error);
    res.status(500).json({ error: 'Failed to remove row' });
  }
};

// Add content to grid
exports.addContentToGrid = async (req, res) => {
  try {
    const { contentId, row, col } = req.body;

    const grid = await Grid.findOne({ _id: req.params.id, userId: req.userId });
    if (!grid) {
      return res.status(404).json({ error: 'Grid not found' });
    }

    // Verify content exists and belongs to user
    const content = await Content.findOne({ _id: contentId, userId: req.userId });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Find the cell
    const cell = grid.cells.find(c => c.position.row === row && c.position.col === col);
    if (!cell) {
      return res.status(404).json({ error: 'Cell not found' });
    }

    // Update cell
    cell.contentId = contentId;
    cell.isEmpty = false;

    await grid.save();

    res.json({
      message: 'Content added to grid successfully',
      grid: await Grid.findById(grid._id).populate('cells.contentId')
    });
  } catch (error) {
    console.error('Add content to grid error:', error);
    res.status(500).json({ error: 'Failed to add content to grid' });
  }
};

// Remove content from grid
exports.removeContentFromGrid = async (req, res) => {
  try {
    const { row, col } = req.body;

    const grid = await Grid.findOne({ _id: req.params.id, userId: req.userId });
    if (!grid) {
      return res.status(404).json({ error: 'Grid not found' });
    }

    const cell = grid.cells.find(c => c.position.row === row && c.position.col === col);
    if (!cell) {
      return res.status(404).json({ error: 'Cell not found' });
    }

    cell.contentId = null;
    cell.isEmpty = true;

    await grid.save();

    res.json({
      message: 'Content removed from grid successfully',
      grid
    });
  } catch (error) {
    console.error('Remove content from grid error:', error);
    res.status(500).json({ error: 'Failed to remove content from grid' });
  }
};

// Reorder content in grid
exports.reorderContent = async (req, res) => {
  try {
    const { moves } = req.body; // Array of { from: {row, col}, to: {row, col} }

    const grid = await Grid.findOne({ _id: req.params.id, userId: req.userId });
    if (!grid) {
      return res.status(404).json({ error: 'Grid not found' });
    }

    // Apply all moves
    for (const move of moves) {
      const fromCell = grid.cells.find(c => c.position.row === move.from.row && c.position.col === move.from.col);
      const toCell = grid.cells.find(c => c.position.row === move.to.row && c.position.col === move.to.col);

      if (fromCell && toCell) {
        // Swap content
        const tempContent = toCell.contentId;
        const tempIsEmpty = toCell.isEmpty;

        toCell.contentId = fromCell.contentId;
        toCell.isEmpty = fromCell.isEmpty;

        fromCell.contentId = tempContent;
        fromCell.isEmpty = tempIsEmpty;
      }
    }

    await grid.save();

    res.json({
      message: 'Content reordered successfully',
      grid: await Grid.findById(grid._id).populate('cells.contentId')
    });
  } catch (error) {
    console.error('Reorder content error:', error);
    res.status(500).json({ error: 'Failed to reorder content' });
  }
};

// Get grid preview
exports.getGridPreview = async (req, res) => {
  try {
    const grid = await Grid.findOne({ _id: req.params.id, userId: req.userId })
      .populate('cells.contentId');

    if (!grid) {
      return res.status(404).json({ error: 'Grid not found' });
    }

    // Format grid for preview
    const preview = {
      name: grid.name,
      platform: grid.platform,
      columns: grid.columns,
      rows: grid.totalRows,
      cells: grid.cells.map(cell => ({
        position: cell.position,
        content: cell.isEmpty ? null : {
          id: cell.contentId._id,
          thumbnailUrl: cell.contentId.thumbnailUrl || cell.contentId.mediaUrl,
          mediaType: cell.contentId.mediaType,
          caption: cell.contentId.caption,
          aiScores: cell.contentId.aiScores
        }
      }))
    };

    res.json({ preview });
  } catch (error) {
    console.error('Get grid preview error:', error);
    res.status(500).json({ error: 'Failed to get grid preview' });
  }
};
