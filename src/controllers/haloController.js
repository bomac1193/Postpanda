const Halo = require('../models/Halo');

const formatTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags
      .map(tag => tag && tag.trim())
      .filter(Boolean)
      .map(tag => tag.replace(/[#@]/g, '').toLowerCase());
  }
  return tags
    .split(',')
    .map(tag => tag && tag.trim())
    .filter(Boolean)
    .map(tag => tag.replace(/[#@]/g, '').toLowerCase());
};

const serializeHalo = (halo, userId) => {
  const hasAccess = halo.hasAccess(userId);
  const hasSchedule = Array.isArray(halo.schedule) && halo.schedule.length > 0;
  const schedulePreview = hasSchedule
    ? halo.schedule.slice(0, 3).map(entry => ({
        title: entry.title,
        platform: entry.platform,
        deliverable: entry.deliverable,
        dayOffset: entry.dayOffset,
        dueDate: entry.dueDate
      }))
    : [];
  return {
    _id: halo._id,
    type: halo.type,
    title: halo.title,
    description: halo.description,
    niche: halo.niche,
    tags: halo.tags,
    priceCredits: halo.priceCredits,
    promptText: hasAccess ? halo.promptText : undefined,
    promptPreview: hasAccess
      ? halo.promptText
      : `${halo.promptText?.slice(0, 160) || ''}${halo.promptText && halo.promptText.length > 160 ? '…' : ''}`,
    referenceImages: hasAccess ? halo.referenceImages : (halo.referenceImages || []).slice(0, 1),
    lutFiles: hasAccess ? halo.lutFiles : [],
    labelType: halo.labelType,
    projectName: halo.projectName,
    launchDate: halo.launchDate,
    hasSchedule,
    schedule: hasAccess ? halo.schedule : undefined,
    schedulePreview,
    scheduleFiles: hasAccess ? halo.scheduleFiles : [],
    hasAccess,
    status: halo.status,
    stats: halo.stats,
    owner: halo.ownerId ? {
      _id: halo.ownerId._id,
      name: halo.ownerId.name
    } : null,
    buyers: halo.buyers?.length || 0,
    createdAt: halo.createdAt,
    updatedAt: halo.updatedAt
  };
};

exports.createHalo = async (req, res) => {
  try {
    const {
      title,
      description,
      promptText,
      priceCredits,
      tags,
      niche,
      status,
      type = 'halo',
      labelType,
      projectName,
      launchDate,
      schedule,
      scheduleJson
    } = req.body;

    if (!title || !promptText) {
      return res.status(400).json({ error: 'Title and prompt text are required' });
    }

    const referenceImages = (req.files?.referenceImages || []).map(file => ({
      url: `/uploads/${file.filename}`,
      originalName: file.originalname
    }));

    const lutFiles = (req.files?.lutFiles || []).map(file => ({
      url: `/uploads/${file.filename}`,
      originalName: file.originalname
    }));

    const scheduleFiles = (req.files?.scheduleFiles || []).map(file => ({
      url: `/uploads/${file.filename}`,
      originalName: file.originalname
    }));

    let parsedSchedule = [];
    const rawSchedule = scheduleJson || schedule;
    if (rawSchedule) {
      try {
        const scheduleData = typeof rawSchedule === 'string' ? JSON.parse(rawSchedule) : rawSchedule;
        if (Array.isArray(scheduleData)) {
          parsedSchedule = scheduleData.map(entry => ({
            title: entry.title || '',
            description: entry.description || '',
            platform: entry.platform || '',
            deliverable: entry.deliverable || '',
            dayOffset: typeof entry.dayOffset === 'number' ? entry.dayOffset : undefined,
            dueDate: entry.dueDate ? new Date(entry.dueDate) : undefined
          }));
        } else {
          return res.status(400).json({ error: 'Schedule must be an array' });
        }
      } catch (error) {
        return res.status(400).json({ error: 'Invalid schedule JSON' });
      }
    }

    const halo = new Halo({
      ownerId: req.userId,
      type,
      title,
      description,
      promptText,
      priceCredits: Number(priceCredits) || 0,
      tags: formatTags(tags),
      niche,
      status: status || 'published',
      referenceImages,
      lutFiles,
      labelType: type === 'rollout' ? (labelType || 'independent') : undefined,
      projectName: type === 'rollout' ? projectName : undefined,
      launchDate: type === 'rollout' && launchDate ? new Date(launchDate) : undefined,
      schedule: type === 'rollout' ? parsedSchedule : [],
      scheduleFiles: type === 'rollout' ? scheduleFiles : []
    });

    await halo.save();
    await halo.populate('ownerId', 'name');

    res.status(201).json({
      message: 'Halo published successfully',
      halo: serializeHalo(halo, req.userId)
    });
  } catch (error) {
    console.error('Create halo error:', error);
    res.status(500).json({ error: 'Failed to publish halo' });
  }
};

exports.listHalos = async (req, res) => {
  try {
    const { mine, type } = req.query;
    const filter = mine === 'true'
      ? { ownerId: req.userId }
      : { status: 'published' };
    if (type) {
      filter.type = type;
    }

    const halos = await Halo.find(filter)
      .sort({ createdAt: -1 })
      .populate('ownerId', 'name');

    res.json({
      halos: halos.map(halo => serializeHalo(halo, req.userId))
    });
  } catch (error) {
    console.error('List halos error:', error);
    res.status(500).json({ error: 'Failed to fetch halos' });
  }
};

exports.getHalo = async (req, res) => {
  try {
    const halo = await Halo.findById(req.params.id).populate('ownerId', 'name');
    if (!halo) {
      return res.status(404).json({ error: 'Halo not found' });
    }
    res.json({
      halo: serializeHalo(halo, req.userId)
    });
  } catch (error) {
    console.error('Get halo error:', error);
    res.status(500).json({ error: 'Failed to fetch halo' });
  }
};

exports.purchaseHalo = async (req, res) => {
  try {
    const halo = await Halo.findById(req.params.id);
    if (!halo) {
      return res.status(404).json({ error: 'Halo not found' });
    }

    if (halo.ownerId.equals(req.userId)) {
      return res.status(400).json({ error: 'You already own this halo' });
    }

    const hasAccess = halo.buyers?.some(buyer => buyer.userId?.equals(req.userId));
    if (hasAccess) {
      return res.status(400).json({ error: 'Halo already unlocked' });
    }

    halo.buyers.push({ userId: req.userId });
    halo.stats.downloads = (halo.stats.downloads || 0) + 1;
    await halo.save();
    await halo.populate('ownerId', 'name');

    res.json({
      message: 'Halo unlocked successfully',
      halo: serializeHalo(halo, req.userId)
    });
  } catch (error) {
    console.error('Purchase halo error:', error);
    res.status(500).json({ error: 'Failed to unlock halo' });
  }
};
