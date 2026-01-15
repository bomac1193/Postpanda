import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import AiCaptionPanel from './AiCaptionPanel';

const DEFAULT_CROP = { scale: 1, offsetX: 0, offsetY: 0 };
const DEFAULT_CROP_RECT = { x: 10, y: 10, width: 80, height: 80 };
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

// Snap points for precise positioning
const ZOOM_SNAP_POINTS = [1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
const OFFSET_SNAP_POINTS = [-50, -25, 0, 25, 50];
const SNAP_THRESHOLD = 3; // How close to snap point to trigger snap

const snapToNearest = (value, snapPoints, threshold) => {
  for (const point of snapPoints) {
    if (Math.abs(value - point) <= threshold) {
      return point;
    }
  }
  return value;
};

const ASPECT_RATIOS = [
  { label: 'Square 1:1', value: '1:1' },
  { label: 'Portrait 4:5', value: '4:5' },
  { label: 'Portrait 9:16 (TikTok)', value: '9:16' },
  { label: 'Landscape 16:9', value: '16:9' },
  { label: 'Free', value: 'free' },
];

const parseRatio = (value) => {
  if (value === 'free') return null;
  const [w, h] = value.split(':').map(Number);
  if (!w || !h) return null;
  return w / h;
};

const getRatioDetails = (value) => {
  if (value === 'free') return null;
  const [width, height] = value.split(':').map(Number);
  if (!width || !height) return null;
  return { width, height, value: width / height };
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getOffsetFromPosition = (position, size) => {
  const travel = Math.max(0, 100 - size);
  if (!travel) return 0;
  const normalized = position / travel;
  return clamp(normalized * 100 - 50, -50, 50);
};

const deriveCropFromRect = (rect) => {
  const safeWidth = rect.width || DEFAULT_CROP_RECT.width;
  const safeHeight = rect.height || DEFAULT_CROP_RECT.height;
  return {
    scale: clamp(100 / safeWidth, MIN_ZOOM, MAX_ZOOM),
    offsetX: getOffsetFromPosition(rect.x || 0, safeWidth),
    offsetY: getOffsetFromPosition(rect.y || 0, safeHeight),
  };
};

const generateCroppedImage = (src, rect) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const cropX = (rect.x / 100) * img.naturalWidth;
      const cropY = (rect.y / 100) * img.naturalHeight;
      const cropWidth = (rect.width / 100) * img.naturalWidth;
      const cropHeight = (rect.height / 100) * img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, cropWidth);
      canvas.height = Math.max(1, cropHeight);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = reject;
    img.src = src;
  });

function PostEditor({ post, onUpdate }) {
  const [caption, setCaption] = useState('');
  const [cropRect, setCropRect] = useState(DEFAULT_CROP_RECT);
  const [cropPosition, setCropPosition] = useState({ x: DEFAULT_CROP.offsetX, y: DEFAULT_CROP.offsetY });
  const [zoom, setZoom] = useState(DEFAULT_CROP.scale);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [snapEnabled, setSnapEnabled] = useState(true);
  const cropRectRef = useRef(DEFAULT_CROP_RECT);
  const postIdentifier = post?._id || post?.id || null;
  const ratioDetails = useMemo(() => getRatioDetails(aspectRatio), [aspectRatio]);
  const ratioValue = ratioDetails?.value ?? null;
  const displayImage = post?.image || post?.originalImage;

  useEffect(() => {
    if (!post) {
      setCaption('');
      setCropRect(DEFAULT_CROP_RECT);
      cropRectRef.current = DEFAULT_CROP_RECT;
      setCropPosition({ x: DEFAULT_CROP.offsetX, y: DEFAULT_CROP.offsetY });
      setZoom(DEFAULT_CROP.scale);
      return;
    }

    setCaption(post.caption || '');
    const nextRect = post.cropRect || DEFAULT_CROP_RECT;
    setCropRect(nextRect);
    cropRectRef.current = nextRect;
    const nextCrop = post.crop || deriveCropFromRect(nextRect);
    setCropPosition({
      x: nextCrop.offsetX ?? DEFAULT_CROP.offsetX,
      y: nextCrop.offsetY ?? DEFAULT_CROP.offsetY,
    });
    setZoom(clamp(nextCrop.scale ?? DEFAULT_CROP.scale, MIN_ZOOM, MAX_ZOOM));
  }, [post]);

  const syncCropToParent = (overrides = {}) => {
    if (!postIdentifier) return;
    const payload = {
      crop: {
        scale: overrides.scale ?? zoom,
        offsetX: overrides.offsetX ?? cropPosition.x,
        offsetY: overrides.offsetY ?? cropPosition.y,
      },
    };

    if (overrides.cropRect) {
      payload.cropRect = overrides.cropRect;
    }

    onUpdate(postIdentifier, payload);
  };

  const handleCaptionChange = (event) => {
    if (!postIdentifier) return;
    const value = event.target.value;
    setCaption(value);
    onUpdate(postIdentifier, { caption: value });
  };

  const applySuggestion = (suggestion) => {
    if (!postIdentifier) return;
    setCaption(suggestion);
    onUpdate(postIdentifier, { caption: suggestion });
  };

  const handleCropPositionChange = (nextPosition) => {
    let x = nextPosition.x;
    let y = nextPosition.y;
    if (snapEnabled) {
      x = snapToNearest(x, OFFSET_SNAP_POINTS, SNAP_THRESHOLD);
      y = snapToNearest(y, OFFSET_SNAP_POINTS, SNAP_THRESHOLD);
    }
    const snappedPosition = { x, y };
    setCropPosition(snappedPosition);
    syncCropToParent({ offsetX: x, offsetY: y });
  };

  const updateZoom = (value) => {
    let parsed = clamp(typeof value === 'number' ? value : parseFloat(value) || zoom, MIN_ZOOM, MAX_ZOOM);
    if (snapEnabled) {
      parsed = snapToNearest(parsed, ZOOM_SNAP_POINTS, 0.08);
    }
    setZoom(parsed);
    syncCropToParent({ scale: parsed });
  };

  const handleCropComplete = (area) => {
    if (!area) return;
    const normalizedRect = {
      x: area.x,
      y: area.y,
      width: area.width,
      height: area.height,
    };
    setCropRect(normalizedRect);
    cropRectRef.current = normalizedRect;
    syncCropToParent({ cropRect: normalizedRect });
  };

  const handleResetCrop = () => {
    const resetRect = { ...DEFAULT_CROP_RECT };
    setCropPosition({ x: DEFAULT_CROP.offsetX, y: DEFAULT_CROP.offsetY });
    setZoom(DEFAULT_CROP.scale);
    setCropRect(resetRect);
    cropRectRef.current = resetRect;
    syncCropToParent({
      scale: DEFAULT_CROP.scale,
      offsetX: DEFAULT_CROP.offsetX,
      offsetY: DEFAULT_CROP.offsetY,
      cropRect: resetRect,
    });
  };

  const handleRevertImage = () => {
    if (!post?.originalImage || !postIdentifier) return;
    setCropPosition({ x: DEFAULT_CROP.offsetX, y: DEFAULT_CROP.offsetY });
    setZoom(DEFAULT_CROP.scale);
    const resetRect = { ...DEFAULT_CROP_RECT };
    setCropRect(resetRect);
    cropRectRef.current = resetRect;
    onUpdate(postIdentifier, {
      image: post.originalImage,
      crop: { ...DEFAULT_CROP },
      cropRect: resetRect,
    });
  };

  const handleAspectRatioChange = (event) => {
    setAspectRatio(event.target.value);
  };

  const handleApplyCrop = async () => {
    if (!displayImage || !postIdentifier) return;
    const rect = cropRectRef.current || cropRect;
    try {
      const croppedImage = await generateCroppedImage(displayImage, rect);
      const newVersion = {
        id: `version-${Date.now()}`,
        label: `Crop ${(post.versions?.length || 0) + 1}`,
        image: croppedImage,
        createdAt: Date.now(),
        cropRect: rect,
      };
      const versions = [...(post.versions || []), newVersion];
      onUpdate(postIdentifier, {
        image: croppedImage,
        versions,
        cropRect: rect,
        crop: {
          scale: zoom,
          offsetX: cropPosition.x,
          offsetY: cropPosition.y,
        },
      });
    } catch (error) {
      console.error('Crop failed', error);
    }
  };

  const handleSelectVersion = (versionId) => {
    if (!postIdentifier) return;
    const version = post.versions?.find((v) => v.id === versionId);
    if (!version) return;
    const nextRect = version.cropRect || DEFAULT_CROP_RECT;
    setCropRect(nextRect);
    cropRectRef.current = nextRect;
    const derivedCrop = deriveCropFromRect(nextRect);
    setCropPosition({ x: derivedCrop.offsetX, y: derivedCrop.offsetY });
    setZoom(clamp(derivedCrop.scale, MIN_ZOOM, MAX_ZOOM));
    onUpdate(postIdentifier, {
      image: version.image,
      cropRect: nextRect,
      crop: derivedCrop,
    });
  };

  if (!post) {
    return (
      <div className="post-editor">
        <h2>Post Editor</h2>
        <p className="muted">Select a tile from the grid to edit its caption.</p>
      </div>
    );
  }

  const previewAspect = ratioDetails ? `${ratioDetails.width} / ${ratioDetails.height}` : '1 / 1';
  const previewStyle = { aspectRatio: previewAspect };

  return (
    <div className="post-editor">
      <h2>Post Editor</h2>
      <div className="editor-preview" style={previewStyle}>
        {displayImage ? (
          <div className="editor-preview-frame">
            <Cropper
              image={displayImage}
              crop={cropPosition}
              zoom={zoom}
              aspect={ratioValue || undefined}
              cropShape="rect"
              showGrid
              restrictPosition={false}
              onCropChange={handleCropPositionChange}
              onZoomChange={updateZoom}
              onCropComplete={handleCropComplete}
            />
          </div>
        ) : (
          <div className="placeholder" style={{ backgroundColor: post.color }}>
            <span>{caption || 'Untitled draft'}</span>
          </div>
        )}
      </div>

      <p className="drag-hint">Drag image to position • Scroll or pinch to zoom</p>

      <div className="crop-controls">
        <label className="field zoom-field">
          <span>Zoom</span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step="0.01"
            value={zoom}
            onChange={(event) => updateZoom(event.target.value)}
          />
          <small>{zoom.toFixed(2)}x{snapEnabled && ZOOM_SNAP_POINTS.includes(zoom) ? ' ●' : ''}</small>
        </label>
        <label className="field">
          <span>Aspect ratio</span>
          <select value={aspectRatio} onChange={handleAspectRatioChange}>
            {ASPECT_RATIOS.map((ratio) => (
              <option key={ratio.value} value={ratio.value}>
                {ratio.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field snap-toggle">
          <span>Snap zoom</span>
          <button
            type="button"
            className={snapEnabled ? 'snap-btn active' : 'snap-btn'}
            onClick={() => setSnapEnabled(!snapEnabled)}
          >
            {snapEnabled ? 'ON' : 'OFF'}
          </button>
        </label>
      </div>

      <div className="crop-actions">
        <button type="button" className="ghost" onClick={handleResetCrop}>
          Reset crop
        </button>
        <button type="button" className="ghost" onClick={handleRevertImage} disabled={!post.originalImage}>
          Revert to original
        </button>
        <button type="button" className="secondary" onClick={handleApplyCrop} disabled={!displayImage}>
          Apply crop &amp; save version
        </button>
      </div>

      {post.versions?.length > 0 && (
        <div className="versions-panel">
          <span className="field-label">Versions</span>
          <div className="versions-list">
            {post.versions.map((version) => (
              <button
                type="button"
                key={version.id}
                className={`version-chip ${version.image === post.image ? 'active' : ''}`}
                onClick={() => handleSelectVersion(version.id)}
              >
                {version.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="field">
        <span>Caption</span>
        <textarea value={caption} onChange={handleCaptionChange} placeholder="Write it in your own words" />
      </label>
      <AiCaptionPanel idea={caption} onApply={applySuggestion} />
    </div>
  );
}

PostEditor.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    caption: PropTypes.string,
    image: PropTypes.string,
    originalImage: PropTypes.string,
    color: PropTypes.string,
    versions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        image: PropTypes.string.isRequired,
        cropRect: PropTypes.shape({
          x: PropTypes.number,
          y: PropTypes.number,
          width: PropTypes.number,
          height: PropTypes.number,
        }),
      })
    ),
    crop: PropTypes.shape({
      scale: PropTypes.number,
      offsetX: PropTypes.number,
      offsetY: PropTypes.number,
    }),
    cropRect: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
      width: PropTypes.number,
      height: PropTypes.number,
    }),
  }),
  onUpdate: PropTypes.func.isRequired,
};

PostEditor.defaultProps = {
  post: null,
};

export default PostEditor;
