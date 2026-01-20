import { useState, useRef, useEffect } from 'react';
import { X, Upload, Check, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Modal component for selecting a thumbnail for a reel
 * Allows scrubbing through video frames or uploading a custom image
 */
function ReelThumbnailSelector({ reel, videoFile, onSave, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [thumbnailBlob, setThumbnailBlob] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [canCaptureFrames, setCanCaptureFrames] = useState(false); // Only true for local blob URLs

  // Store blob URL in ref to track for cleanup
  const blobUrlRef = useRef(null);

  // Determine video source - prefer videoFile (File object) over reel.mediaUrl
  const [videoSrc, setVideoSrc] = useState(null);

  // Set up video source when component mounts or props change
  useEffect(() => {
    console.log('[ThumbnailSelector] Setting up video source');
    console.log('[ThumbnailSelector] videoFile provided:', !!videoFile, videoFile?.name);
    console.log('[ThumbnailSelector] reel provided:', !!reel, 'mediaUrl:', reel?.mediaUrl);

    // Clean up any existing blob URL
    if (blobUrlRef.current) {
      console.log('[ThumbnailSelector] Cleaning up previous blob URL');
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    if (videoFile) {
      // Create blob URL from File object - frame capture IS available
      const blobUrl = URL.createObjectURL(videoFile);
      blobUrlRef.current = blobUrl;
      console.log('[ThumbnailSelector] Created blob URL from videoFile:', blobUrl);
      setVideoSrc(blobUrl);
      setCanCaptureFrames(true); // Local blob URLs allow frame capture
      setVideoError(false);
      setIsVideoReady(false);
    } else if (reel?.mediaUrl) {
      // Use Cloudinary URL - frame capture NOT available due to CORS
      console.log('[ThumbnailSelector] Using reel mediaUrl:', reel.mediaUrl);
      setVideoSrc(reel.mediaUrl);
      setCanCaptureFrames(false); // Cross-origin videos can't be captured
      setVideoError(false);
      setIsVideoReady(false);
    } else {
      console.error('[ThumbnailSelector] No video source available');
      setVideoSrc(null);
      setCanCaptureFrames(false);
      setVideoError(true);
    }
  }, [videoFile, reel?.mediaUrl]);

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        console.log('[ThumbnailSelector] Cleaning up blob URL on unmount');
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    console.log('[ThumbnailSelector] Metadata loaded, duration:', videoRef.current?.duration);
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      // Seek to 1 second or 10% of duration
      const seekTime = Math.min(1, videoRef.current.duration * 0.1);
      console.log('[ThumbnailSelector] Seeking to:', seekTime);
      videoRef.current.currentTime = seekTime;
    }
  };

  // Handle video can play - ready to capture
  const handleCanPlay = () => {
    console.log('[ThumbnailSelector] Can play, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
    setIsVideoReady(true);
    // Pause the video to prevent playback
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Handle video load error
  const handleVideoError = (e) => {
    const video = e.target;
    const error = video?.error;
    console.error('[ThumbnailSelector] Video failed to load');
    console.error('[ThumbnailSelector] Error code:', error?.code);
    console.error('[ThumbnailSelector] Error message:', error?.message);
    console.error('[ThumbnailSelector] Video src:', video?.src);
    console.error('[ThumbnailSelector] Video networkState:', video?.networkState);
    console.error('[ThumbnailSelector] Video readyState:', video?.readyState);

    // MediaError codes: 1=ABORTED, 2=NETWORK, 3=DECODE, 4=SRC_NOT_SUPPORTED
    if (error) {
      const errorTypes = {
        1: 'MEDIA_ERR_ABORTED - Fetching was aborted',
        2: 'MEDIA_ERR_NETWORK - Network error',
        3: 'MEDIA_ERR_DECODE - Error decoding video',
        4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - Video format not supported'
      };
      console.error('[ThumbnailSelector] Error type:', errorTypes[error.code] || 'Unknown');
    }

    setVideoError(true);
  };

  // Track if we're currently seeking (dragging the slider)
  const [isSeeking, setIsSeeking] = useState(false);

  // Handle video seeked - update time display (no auto-capture to avoid performance issues)
  const handleSeeked = () => {
    if (videoRef.current && !isSeeking) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Handle seeking when slider changes - update video position for visual feedback
  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // Handle when user starts dragging the slider
  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  // Handle when user finishes dragging the slider - capture frame
  const handleSeekEnd = () => {
    setIsSeeking(false);
    captureCurrentFrame();
  };

  // Step forward/backward by small increments
  const handleStep = (direction) => {
    if (videoRef.current) {
      const step = 0.1; // 100ms
      const newTime = Math.max(0, Math.min(duration, currentTime + (direction * step)));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Capture current frame as thumbnail
  const captureCurrentFrame = () => {
    console.log('[ThumbnailSelector] Capture clicked, videoRef:', !!videoRef.current, 'canvasRef:', !!canvasRef.current, 'canCapture:', canCaptureFrames);

    if (!canCaptureFrames) {
      console.error('[ThumbnailSelector] Frame capture not available for cloud videos');
      return;
    }

    if (!videoRef.current || !canvasRef.current) {
      console.error('[ThumbnailSelector] Missing refs');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    console.log('[ThumbnailSelector] Video dimensions:', video.videoWidth, 'x', video.videoHeight);
    console.log('[ThumbnailSelector] Video ready state:', video.readyState, 'paused:', video.paused);
    console.log('[ThumbnailSelector] Video src:', video.src?.substring(0, 50));

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('[ThumbnailSelector] Video not loaded - dimensions are 0');
      alert('Video not loaded yet. Please wait for the video to load.');
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      // Draw the current frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Try to read pixels - this will fail if CORS blocks it
      try {
        ctx.getImageData(0, 0, 1, 1);
      } catch (corsError) {
        console.error('[ThumbnailSelector] CORS error - cannot capture frame from cross-origin video');
        alert('Cannot capture frame from this video due to security restrictions. Please upload a custom thumbnail image instead.');
        return;
      }

      // Convert to blob and data URL
      canvas.toBlob((blob) => {
        console.log('[ThumbnailSelector] Created blob:', blob ? `${blob.size} bytes` : 'null');
        if (blob) {
          setThumbnailBlob(blob);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          console.log('[ThumbnailSelector] Created data URL, length:', dataUrl.length);
          setThumbnailPreview(dataUrl);
        } else {
          console.error('[ThumbnailSelector] Failed to create blob');
          alert('Failed to capture frame. Please try again.');
        }
      }, 'image/jpeg', 0.9);
    } catch (err) {
      console.error('[ThumbnailSelector] Error capturing frame:', err);
      if (err.name === 'SecurityError') {
        alert('Cannot capture frame from this video due to security restrictions. Please upload a custom thumbnail image instead.');
      } else {
        alert('Failed to capture frame: ' + err.message);
      }
    }
  };

  // Handle file selection from input
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // Reset input
    e.target.value = '';
  };

  // Process an image file (from input or drag)
  const processImageFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Create blob and preview
    setThumbnailBlob(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setThumbnailPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers for custom image
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving the drop zone entirely
    if (e.currentTarget === dropZoneRef.current) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Save the selected thumbnail and close
  const handleSave = async () => {
    if (!thumbnailBlob) {
      // If no thumbnail captured yet, capture current frame first
      captureCurrentFrame();
      // Wait a bit for the capture to complete
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!thumbnailBlob) {
      alert('Please capture a frame or upload an image first');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(thumbnailBlob, thumbnailPreview);
      // onSave should close the modal on success
    } catch (err) {
      console.error('Failed to save thumbnail:', err);
      alert('Failed to save thumbnail. Please try again.');
      setIsSaving(false);
    }
  };

  // Format time as M:SS.s
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00.0';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-dark-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-dark-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <h3 className="text-lg font-medium text-dark-100">Choose Thumbnail</h3>
          <button onClick={onClose} className="text-dark-400 hover:text-dark-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-4">
            {/* Left side - Video scrubber */}
            <div>
              <p className="text-sm text-dark-400 mb-2 font-medium">Select from video</p>

              {/* Video Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-[9/16] max-h-[300px]">
                {videoError ? (
                  <div className="w-full h-full flex items-center justify-center text-dark-400 text-sm">
                    <p>Video unavailable. Use the upload option instead.</p>
                  </div>
                ) : videoSrc ? (
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    className="w-full h-full object-contain"
                    onLoadedMetadata={handleLoadedMetadata}
                    onCanPlay={handleCanPlay}
                    onSeeked={handleSeeked}
                    onError={handleVideoError}
                    muted
                    playsInline
                    preload="auto"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-dark-400 text-sm">
                    <p>Loading video...</p>
                  </div>
                )}
              </div>

              {/* Hidden canvas for capturing frames */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Scrubber controls */}
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStep(-1)}
                    className="p-1.5 bg-dark-700 rounded hover:bg-dark-600 text-dark-300 transition-colors"
                    title="Previous frame"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <input
                    type="range"
                    min="0"
                    max={duration || 1}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    onMouseDown={handleSeekStart}
                    onMouseUp={handleSeekEnd}
                    onTouchStart={handleSeekStart}
                    onTouchEnd={handleSeekEnd}
                    className="flex-1 h-2 bg-dark-600 rounded-lg appearance-none cursor-pointer accent-accent-purple"
                  />

                  <button
                    onClick={() => handleStep(1)}
                    className="p-1.5 bg-dark-700 rounded hover:bg-dark-600 text-dark-300 transition-colors"
                    title="Next frame"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between text-xs text-dark-500 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                {/* Capture button */}
                {canCaptureFrames ? (
                  <button
                    onClick={captureCurrentFrame}
                    disabled={!isVideoReady}
                    className="w-full mt-3 py-2 bg-accent-purple hover:bg-accent-purple/80 disabled:bg-dark-600 disabled:text-dark-400 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Capture Current Frame
                  </button>
                ) : (
                  <div className="mt-3 p-2 bg-dark-700/50 rounded-lg">
                    <p className="text-xs text-dark-400 text-center">
                      Frame capture unavailable for cloud videos.
                      <br />
                      Please upload a custom thumbnail image.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Custom upload and preview */}
            <div>
              <p className="text-sm text-dark-400 mb-2 font-medium">{canCaptureFrames ? 'Or upload custom image' : 'Upload custom image'}</p>

              {/* Drop zone for custom image */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                ref={dropZoneRef}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`aspect-[9/16] max-h-[300px] rounded-lg border-2 border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center gap-3 ${
                  isDraggingOver
                    ? 'border-accent-purple bg-accent-purple/10'
                    : 'border-dark-600 hover:border-dark-500 bg-dark-700/50'
                }`}
              >
                <Upload className={`w-8 h-8 ${isDraggingOver ? 'text-accent-purple' : 'text-dark-400'}`} />
                <div className="text-center">
                  <p className={`text-sm ${isDraggingOver ? 'text-accent-purple' : 'text-dark-300'}`}>
                    {isDraggingOver ? 'Drop image here' : 'Click or drag image'}
                  </p>
                  <p className="text-xs text-dark-500 mt-1">JPG, PNG, WebP</p>
                </div>
              </div>

              {/* Thumbnail preview */}
              <div className="mt-3">
                <p className="text-xs text-dark-500 mb-2">Preview:</p>
                <div className="aspect-[9/16] max-h-[120px] bg-dark-700 rounded-lg overflow-hidden">
                  {thumbnailPreview ? (
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-dark-500 text-xs">
                      No thumbnail selected
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-dark-700">
          <button onClick={onClose} className="flex-1 py-2.5 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg transition-colors font-medium">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !thumbnailPreview}
            className="flex-1 py-2.5 bg-accent-purple hover:bg-accent-purple/80 disabled:bg-dark-600 disabled:text-dark-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                OK
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReelThumbnailSelector;
