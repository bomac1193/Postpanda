export async function extractVideoFrame(file, options = {}) {
  const captureAtSeconds = options.captureAtSeconds ?? 1;
  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    await new Promise((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Failed to read video metadata'));
    });

    const durationSeconds = Number.isFinite(video.duration) ? video.duration : 0;
    const targetTime = durationSeconds > 0
      ? Math.min(captureAtSeconds, Math.max(durationSeconds / 2, 0))
      : 0;

    await new Promise((resolve, reject) => {
      const handleReady = () => resolve();
      const handleError = () => reject(new Error('Failed to capture video frame'));

      if (targetTime > 0) {
        video.onseeked = handleReady;
        video.onerror = handleError;
        video.currentTime = targetTime;
      } else {
        video.onloadeddata = handleReady;
        video.onerror = handleError;
      }
    });

    const sourceWidth = video.videoWidth || 1280;
    const sourceHeight = video.videoHeight || 720;
    const maxWidth = 1280;
    const width = Math.min(sourceWidth, maxWidth);
    const height = Math.round((sourceHeight / sourceWidth) * width);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context unavailable');
    }

    ctx.drawImage(video, 0, 0, width, height);

    return {
      thumbnailDataUrl: canvas.toDataURL('image/jpeg', 0.88),
      durationSeconds,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function formatDuration(seconds) {
  if (!seconds || !Number.isFinite(seconds)) {
    return '0:00';
  }

  const totalSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function getPlannerVideoAssetState(video = {}) {
  if (video.videoAssetState) {
    return video.videoAssetState;
  }

  if (video.storageProvider === 'mux' || video.muxUploadId || video.muxAssetId) {
    if (video.muxUploadStatus === 'errored' || video.muxAssetStatus === 'errored' || video.muxMasterStatus === 'errored') {
      return 'errored';
    }
    if (video.muxAssetStatus === 'ready' && video.videoUrl) {
      return 'ready';
    }
    if (video.muxUploadId || video.muxAssetId) {
      return 'processing';
    }
    return 'missing';
  }

  return video.videoUrl ? 'ready' : 'missing';
}

export function hasPlannerVideoAttachment(video = {}) {
  const assetState = getPlannerVideoAssetState(video);
  return assetState !== 'missing' && assetState !== 'errored';
}
