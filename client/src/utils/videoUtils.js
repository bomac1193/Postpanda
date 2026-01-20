/**
 * Generates a thumbnail from a video file
 * @param {File} videoFile - The video file to generate a thumbnail from
 * @returns {Promise<Object>} Object containing thumbnail blob, URL, and video metadata
 */
export const generateVideoThumbnail = (videoFile) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let objectUrl = null;
    let hasResolved = false;

    const cleanup = () => {
      // Remove event listeners to prevent memory leaks
      video.onloadedmetadata = null;
      video.oncanplaythrough = null;
      video.onseeked = null;
      video.onerror = null;
      // Clear video source to stop any pending loads
      video.src = '';
      video.load();
      // Revoke the object URL
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };

    const captureFrame = () => {
      if (hasResolved) return;

      console.log('[Thumbnail] Attempting capture, dimensions:', video.videoWidth, 'x', video.videoHeight);
      console.log('[Thumbnail] Video readyState:', video.readyState, 'currentTime:', video.currentTime);

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.error('[Thumbnail] Video has 0 dimensions, cannot generate thumbnail');
        cleanup();
        reject(new Error('Video has invalid dimensions'));
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Check if the frame is black (could mean video isn't ready)
      const imageData = ctx.getImageData(0, 0, Math.min(100, canvas.width), Math.min(100, canvas.height));
      const pixels = imageData.data;
      let totalBrightness = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        totalBrightness += pixels[i] + pixels[i + 1] + pixels[i + 2];
      }
      const avgBrightness = totalBrightness / (pixels.length / 4) / 3;
      console.log('[Thumbnail] Average brightness:', avgBrightness.toFixed(2));

      canvas.toBlob((blob) => {
        console.log('[Thumbnail] Generated blob:', blob ? `${blob.size} bytes` : 'null');

        if (!blob) {
          console.error('[Thumbnail] Failed to create blob from canvas');
          cleanup();
          reject(new Error('Failed to create thumbnail blob'));
          return;
        }

        hasResolved = true;
        const result = {
          thumbnailBlob: blob,
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          aspectRatio: `${video.videoWidth}:${video.videoHeight}`,
          isVertical: video.videoHeight > video.videoWidth
        };

        // Clean up before resolving
        cleanup();
        resolve(result);
      }, 'image/jpeg', 0.85);
    };

    video.onloadedmetadata = () => {
      console.log('[Thumbnail] Metadata loaded, duration:', video.duration);
      // Seek to 1 second or 10% of duration, whichever is smaller
      // But at least 0.5 seconds to get past potential black intro frames
      const seekTime = Math.max(0.5, Math.min(1, video.duration * 0.1));
      console.log('[Thumbnail] Seeking to:', seekTime);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      console.log('[Thumbnail] Video seeked to:', video.currentTime);
      // Wait a small amount for the frame to be fully decoded/rendered
      // Use requestAnimationFrame to ensure the frame is painted
      requestAnimationFrame(() => {
        // Additional small delay to ensure frame is ready
        setTimeout(() => {
          captureFrame();
        }, 50);
      });
    };

    video.onerror = (e) => {
      console.error('[Thumbnail] Video load error:', e);
      cleanup();
      reject(new Error('Failed to load video'));
    };

    // Create object URL and store reference for cleanup
    objectUrl = URL.createObjectURL(videoFile);
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;
    video.load();
  });
};

/**
 * Format duration in seconds to MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
