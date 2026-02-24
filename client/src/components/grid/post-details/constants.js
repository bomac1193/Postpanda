// Crop aspect ratio presets
export const CROP_PRESETS = [
  { id: 'free', label: 'Free', ratio: null },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:5', label: '4:5', ratio: 4/5 },
  { id: '9:16', label: '9:16', ratio: 9/16 },
  { id: '16:9', label: '16:9', ratio: 16/9 },
  { id: '4:3', label: '4:3', ratio: 4/3 },
  { id: '3:4', label: '3:4', ratio: 3/4 },
];

// Platform tabs
export const PLATFORMS = [
  { id: 'details', name: 'Details' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'twitter', name: 'X/Twitter' },
];

export const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// cropBox is stored in PIXELS (Cropper's native format): { left, top, width, height }
// null = no saved crop (use full image or aspect-based default)
export const createDefaultDraft = () => ({
  scale: 100,
  rotation: 0,
  fitMode: 'native',
  flipH: false,
  flipV: false,
  brightness: 100,
  contrast: 100,
  cropAspect: 'free',
  cropBox: null,
});

// Generate a Cloudinary URL with crop transformation applied.
// cropBox is { left, top, width, height } in source image pixels.
export const getCroppedCloudinaryUrl = (url, cropBox) => {
  if (!cropBox || !url || !url.includes('cloudinary.com')) return url;
  // Only apply if pixel format (has `left`); skip old percentage format (has `x`)
  if (typeof cropBox.left !== 'number') return url;
  const { left, top, width, height } = cropBox;
  if (!width || !height) return url;
  const params = `c_crop,x_${Math.round(left)},y_${Math.round(top)},w_${Math.round(width)},h_${Math.round(height)}`;
  return url.replace('/upload/', `/upload/${params}/`);
};

export const normalizeMediaValue = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof value === 'object') {
    return normalizeMediaValue(value.url || value.secure_url || value.src || value.mediaUrl);
  }
  return null;
};

export const resolvePrimaryImageSource = (post) => {
  if (!post) return null;
  return normalizeMediaValue(post.originalImage)
    || normalizeMediaValue(post.image)
    || normalizeMediaValue(Array.isArray(post.images) ? post.images[0] : null)
    || normalizeMediaValue(post.mediaUrl)
    || null;
};

export function calculateCropConviction(baseScore, settings, platform, cropBoxArg) {
  let modifier = 0;
  let hint = null;

  const scale = settings.scale || 100;
  const fitMode = settings.fitMode || 'native';
  const cb = cropBoxArg;

  // 1. Scale optimality (max ±8 pts)
  const optimalScale = { instagram: 100, tiktok: 115, twitter: 100 };
  const scaleDiff = Math.abs(scale - (optimalScale[platform] || 100));
  const scaleModifier = -Math.min(8, scaleDiff / 12.5);
  modifier += scaleModifier;

  // 2. Composition centering via crop position (max ±5 pts)
  // cropBox is now in pixels { left, top, width, height } or null
  const cropCenterX = cb ? (cb.left + cb.width / 2) : 50;
  const cropCenterY = cb ? (cb.top + cb.height / 2) : 50;
  const centerOffset = cb ? Math.sqrt((cropCenterX / cb.width * 100 - 50) ** 2 + (cropCenterY / cb.height * 100 - 50) ** 2) : 0;
  const centerBias = { instagram: 0.5, tiktok: 0.3, twitter: 0.1 };
  const centerModifier = -Math.min(5, (centerOffset / 40) * (centerBias[platform] || 0.3));
  modifier += centerModifier;

  if (centerOffset > 25 && (centerBias[platform] || 0) > 0.2) {
    const gain = Math.round(Math.abs(centerModifier));
    if (gain >= 2) hint = `Center crop for +${gain}`;
  }

  // 3. Fit mode (max ±5 pts)
  const fitScores = {
    fill:    { instagram: 3, tiktok: 5, twitter: 3 },
    native:  { instagram: 0, tiktok: 0, twitter: 0 },
    contain: { instagram: -5, tiktok: -8, twitter: -3 },
  };
  modifier += (fitScores[fitMode]?.[platform] || 0);

  if (fitMode === 'contain' && !hint) {
    const gain = Math.abs(fitScores.contain[platform] || 0) + (fitScores.fill[platform] || 0);
    if (gain >= 5) hint = `Use Fill for +${gain}`;
  }

  const delta = Math.round(modifier);
  const score = Math.max(0, Math.min(100, baseScore + delta));
  return { score, delta, hint };
}

// Default crop aspect per platform
export const platformDefaultCrop = { instagram: '1:1', tiktok: '9:16', twitter: '16:9' };
