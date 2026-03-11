import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Upload, ImagePlus, Loader2, Check, AlertTriangle, ChevronDown } from 'lucide-react';
import { matchFilesToVideos } from '../../lib/thumbnailMatcher';
import { compressImageFile } from '../../lib/imageUtils';
import { youtubeApi } from '../../lib/api';

const CONFIDENCE_COLORS = {
  exact: { dot: 'bg-green-400', text: 'text-green-400', label: 'Exact' },
  high: { dot: 'bg-blue-400', text: 'text-blue-400', label: 'High' },
  medium: { dot: 'bg-amber-400', text: 'text-amber-400', label: 'Medium' },
  low: { dot: 'bg-red-400', text: 'text-red-400', label: 'Low' },
};

/**
 * Generate a tiny JPEG preview (~3-5KB) from a File.
 * Uses createImageBitmap for fast native decode + resize, instead of
 * loading the full file via blob URL (which forces the browser to decode
 * the entire 5-20MB source image just for an 80px preview).
 */
async function generatePreview(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 135;
    const ctx = canvas.getContext('2d');
    // Black background — pillarbox/letterbox for non-16:9 sources
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 240, 135);
    // Fit image within canvas, preserving aspect ratio (never crop)
    const scale = Math.min(240 / bitmap.width, 135 / bitmap.height);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const x = Math.round((240 - w) / 2);
    const y = Math.round((135 - h) / 2);
    ctx.drawImage(bitmap, x, y, w, h);
    bitmap.close();
    return canvas.toDataURL('image/jpeg', 0.5);
  } catch {
    // Fallback for unsupported formats
    return URL.createObjectURL(file);
  }
}

/**
 * Bulk thumbnail replacement modal.
 * Drop files → auto-match to videos → preview → apply.
 */
function YouTubeBulkReplace({ isOpen, onClose, videos, onReplace, scope, onScopeChange }) {
  const [matches, setMatches] = useState([]);       // { file, video, confidence, score, previewUrl }
  const [unmatched, setUnmatched] = useState([]);    // { file, previewUrl }
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [allVideos, setAllVideos] = useState(null);  // For 'all' scope
  const [isDragging, setIsDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [assignDropdown, setAssignDropdown] = useState(null);
  const dragCounterRef = useRef(0);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch all videos when scope is 'all'
  useEffect(() => {
    if (!isOpen) return;
    if (scope === 'all' && !allVideos) {
      youtubeApi.getVideos().then(data => {
        const vids = (data.videos || []).map(v => ({ ...v, id: v._id || v.id }));
        setAllVideos(vids);
      }).catch(err => {
        console.error('Failed to fetch all videos:', err);
        setAllVideos([]);
      });
    }
  }, [isOpen, scope, allVideos]);

  // Reset state when modal closes — revoke any blob URL fallbacks
  useEffect(() => {
    if (!isOpen) {
      setMatches(prev => {
        prev.forEach(m => {
          if (m.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(m.previewUrl);
        });
        return [];
      });
      setUnmatched(prev => {
        prev.forEach(u => {
          if (u.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(u.previewUrl);
        });
        return [];
      });
      setApplying(false);
      setProgress({ current: 0, total: 0 });
      setAllVideos(null);
      setScanning(false);
      setScanCount(0);
      setFailedCount(0);
      setAssignDropdown(null);
    }
  }, [isOpen]);

  // Close assign dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAssignDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const activeVideos = scope === 'all' ? (allVideos || []) : videos;

  // Get videos not currently matched
  const unmatchedVideos = activeVideos.filter(v => {
    const vid = v._id || v.id;
    return !matches.some(m => (m.video._id || m.video.id) === vid);
  });

  // Process dropped/scanned files: match to videos, show immediately, previews load async
  const processFiles = useCallback((files) => {
    const imageFiles = Array.from(files).filter(f =>
      f.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(f.name)
    );
    if (imageFiles.length === 0) return;

    // Run matcher (instant — just string comparisons)
    const result = matchFilesToVideos(imageFiles, activeVideos);

    // Show matches IMMEDIATELY with empty previews (no blocking)
    const newMatches = result.matched.map(m => ({
      ...m,
      previewUrl: '',
    }));
    const newUnmatched = result.unmatched.map(f => ({
      file: f,
      previewUrl: '',
    }));

    setMatches(prev => {
      const base = prev.length;
      const updated = [...prev, ...newMatches];

      // Generate tiny previews in background — fills in as each resolves
      newMatches.forEach((m, idx) => {
        generatePreview(m.file).then(url => {
          setMatches(current => current.map((item, j) =>
            j === base + idx ? { ...item, previewUrl: url } : item
          ));
        });
      });

      return updated;
    });

    setUnmatched(prev => {
      const base = prev.length;
      const updated = [...prev, ...newUnmatched];

      newUnmatched.forEach((u, idx) => {
        generatePreview(u.file).then(url => {
          setUnmatched(current => current.map((item, j) =>
            j === base + idx ? { ...item, previewUrl: url } : item
          ));
        });
      });

      return updated;
    });
  }, [activeVideos]);

  // Remove a match → file goes to unmatched, video freed
  const removeMatch = useCallback((index) => {
    setMatches(prev => {
      const removed = prev[index];
      const next = [...prev];
      next.splice(index, 1);
      setUnmatched(u => [...u, { file: removed.file, previewUrl: removed.previewUrl }]);
      return next;
    });
  }, []);

  // Manually assign unmatched file to a video
  const assignToVideo = useCallback((unmatchedIndex, video) => {
    setUnmatched(prev => {
      const item = prev[unmatchedIndex];
      const next = [...prev];
      next.splice(unmatchedIndex, 1);
      setMatches(m => [...m, {
        file: item.file,
        video,
        confidence: 'manual',
        score: 0,
        previewUrl: item.previewUrl,
      }]);
      return next;
    });
    setAssignDropdown(null);
  }, []);

  // Remove an unmatched file entirely
  const removeUnmatched = useCallback((index) => {
    setUnmatched(prev => {
      const item = prev[index];
      if (item.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(item.previewUrl);
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  }, []);

  // Apply: single pipeline — each worker compresses then uploads, real-time progress
  const handleApply = useCallback(async () => {
    if (matches.length === 0) return;
    setApplying(true);
    setFailedCount(0);

    const total = matches.length;
    setProgress({ current: 0, total });

    const CONCURRENCY = 6;
    const MAX_RETRIES = 2;
    let nextIndex = 0;
    let completed = 0;
    let failed = 0;

    async function worker() {
      while (nextIndex < matches.length) {
        const i = nextIndex++;
        const match = matches[i];

        // 1. Compress (createImageBitmap — fast, no FileReader)
        let compressed;
        try {
          compressed = await compressImageFile(match.file);
        } catch (err) {
          console.error('Compress failed:', match.video.title, err);
          failed++;
          setFailedCount(failed);
          completed++;
          setProgress({ current: completed, total });
          continue;
        }

        // 2. Upload with retry
        let success = false;
        const videoId = match.video._id || match.video.id;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          try {
            await onReplace(videoId, compressed, { originalFilename: match.file.name });
            success = true;
            break;
          } catch (err) {
            if (attempt < MAX_RETRIES) {
              await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            } else {
              console.error(`Failed after ${MAX_RETRIES + 1} attempts:`, match.video.title, err);
            }
          }
        }

        if (!success) {
          failed++;
          setFailedCount(failed);
        }

        completed++;
        setProgress({ current: completed, total });
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, matches.length) }, () => worker())
    );

    // Clean up any blob URL fallbacks
    matches.forEach(m => {
      if (m.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(m.previewUrl);
    });
    unmatched.forEach(u => {
      if (u.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(u.previewUrl);
    });

    if (failed === 0) {
      setTimeout(() => {
        setApplying(false);
        setMatches([]);
        setUnmatched([]);
        onClose();
      }, 600);
    } else {
      setApplying(false);
      setMatches([]);
      setUnmatched([]);
    }
  }, [matches, unmatched, onReplace, onClose]);

  // Drag handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;
    if (e.dataTransfer?.files) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  }, [processFiles]);

  const scanFolder = useCallback(async () => {
    if (!window.showDirectoryPicker) return;
    try {
      setScanning(true);
      setScanCount(0);
      const dirHandle = await window.showDirectoryPicker();
      const imageFiles = [];
      let count = 0;

      async function readDir(handle) {
        for await (const entry of handle.values()) {
          if (entry.kind === 'file') {
            if (/\.(jpe?g|png|webp)$/i.test(entry.name)) {
              const file = await entry.getFile();
              imageFiles.push(file);
              count++;
              setScanCount(count);
            }
          } else if (entry.kind === 'directory') {
            await readDir(entry);
          }
        }
      }

      await readDir(dirHandle);
      if (imageFiles.length > 0) {
        processFiles(imageFiles);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to scan folder:', err);
      }
    } finally {
      setScanning(false);
      setScanCount(0);
    }
  }, [processFiles]);

  if (!isOpen) return null;

  const totalItems = matches.length + unmatched.length;
  const pct = progress.total ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl w-[900px] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <ImagePlus className="w-5 h-5 text-dark-100" />
            <h2 className="text-lg font-semibold text-dark-100">Replace Thumbnails</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Scope toggle */}
            <div className="flex items-center h-8 bg-dark-900 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => onScopeChange('collection')}
                className={`h-7 px-3 rounded-md text-xs font-medium transition-colors ${
                  scope === 'collection'
                    ? 'bg-dark-100 text-dark-900'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                This Collection
              </button>
              <button
                onClick={() => onScopeChange('all')}
                className={`h-7 px-3 rounded-md text-xs font-medium transition-colors ${
                  scope === 'all'
                    ? 'bg-dark-100 text-dark-900'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                All Videos
              </button>
            </div>
            <button onClick={onClose} className="p-1.5 text-dark-400 hover:text-dark-200 hover:bg-dark-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Loading all videos */}
          {scope === 'all' && !allVideos && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-dark-300 animate-spin mr-2" />
              <span className="text-dark-400">Loading all videos...</span>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mb-5 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-dark-100 bg-dark-700'
                : 'border-dark-600 hover:border-dark-500 hover:bg-dark-700/30'
            }`}
          >
            <Upload className="w-8 h-8 text-dark-400 mx-auto mb-2" />
            <p className="text-sm text-dark-300">
              Drop image files here or <span className="text-dark-100">click to browse</span>
            </p>
            <p className="text-xs text-dark-500 mt-1">
              Files are matched to videos by filename → title similarity
            </p>
            {window.showDirectoryPicker && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); scanFolder(); }}
                disabled={scanning}
                className="mt-2 text-xs text-dark-400 hover:text-white transition-colors disabled:opacity-50"
              >
                {scanning ? (
                  <span className="flex items-center gap-1.5 justify-center">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Scanning{scanCount > 0 ? ` (${scanCount} found)` : '...'}
                  </span>
                ) : (
                  'or scan a folder'
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* Applying progress — single continuous bar */}
          {applying && (
            <div className="mb-5 bg-dark-900 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-dark-300 animate-spin" />
                  <span className="text-sm text-dark-200">
                    Replacing {progress.current} of {progress.total}...
                  </span>
                </div>
                <span className="text-xs text-dark-400">
                  {pct}%
                  {failedCount > 0 && <span className="text-red-400 ml-2">{failedCount} failed</span>}
                </span>
              </div>
              <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-dark-100 transition-[width] duration-150 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {/* Completion summary — shown when some failed */}
          {!applying && failedCount > 0 && progress.total > 0 && (
            <div className="mb-5 bg-dark-900 rounded-xl p-4 border border-red-900/40">
              <div className="flex items-center gap-3 mb-1">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-sm text-dark-200">
                  {progress.total - failedCount} replaced, {failedCount} failed
                </span>
              </div>
              <p className="text-xs text-dark-500 ml-8">
                Failed thumbnails were retried 2 times. Try scanning the folder again for remaining items.
              </p>
            </div>
          )}

          {/* Matched section */}
          {matches.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                Matched ({matches.length})
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {matches.map((match, i) => {
                  const conf = CONFIDENCE_COLORS[match.confidence] || { dot: 'bg-gray-400', text: 'text-gray-400', label: 'Manual' };
                  return (
                    <div key={i} className="bg-dark-900 rounded-lg overflow-hidden border border-dark-700">
                      {/* Side-by-side thumbnails */}
                      <div className="flex h-20">
                        {/* Old thumbnail */}
                        <div className="w-1/2 bg-dark-800 relative">
                          {match.video.thumbnail ? (
                            <img
                              src={match.video.thumbnail}
                              alt="Old"
                              className="w-full h-full object-cover opacity-60"
                              decoding="async"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-dark-600 text-xs">No thumb</div>
                          )}
                          <span className="absolute bottom-0.5 left-1 text-[9px] text-dark-400 bg-dark-900/70 px-1 rounded">old</span>
                        </div>
                        {/* Arrow separator */}
                        <div className="w-px bg-dark-600" />
                        {/* New thumbnail */}
                        <div className="w-1/2 relative">
                          {match.previewUrl ? (
                            <img
                              src={match.previewUrl}
                              alt="New"
                              className="w-full h-full object-cover"
                              decoding="async"
                            />
                          ) : (
                            <div className="w-full h-full bg-dark-700 animate-pulse" />
                          )}
                          <span className="absolute bottom-0.5 right-1 text-[9px] text-dark-200 bg-dark-900/70 px-1 rounded">new</span>
                        </div>
                      </div>
                      {/* Info */}
                      <div className="px-2 py-1.5 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-dark-200 truncate">{match.video.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                            <span className={`text-[10px] ${conf.text}`}>{conf.label}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeMatch(i)}
                          className="p-1 text-dark-500 hover:text-dark-300 hover:bg-dark-700 rounded flex-shrink-0"
                          title="Remove match"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unmatched section */}
          {unmatched.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Unmatched ({unmatched.length})
              </h3>
              <div className="space-y-2">
                {unmatched.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-dark-900 rounded-lg px-3 py-2 border border-dark-700">
                    {/* Preview */}
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="w-12 h-8 object-cover rounded flex-shrink-0"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-12 h-8 bg-dark-700 rounded flex-shrink-0 animate-pulse" />
                    )}
                    {/* Filename */}
                    <span className="text-xs text-dark-300 truncate flex-1 min-w-0">{item.file.name}</span>
                    {/* Assign dropdown */}
                    <div className="relative" ref={assignDropdown === i ? dropdownRef : undefined}>
                      <button
                        onClick={() => setAssignDropdown(assignDropdown === i ? null : i)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-dark-400 hover:text-dark-200 bg-dark-800 hover:bg-dark-700 rounded transition-colors"
                      >
                        Assign to
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {assignDropdown === i && (
                        <div className="absolute right-0 top-full mt-1 w-56 max-h-48 overflow-y-auto bg-dark-800 border border-dark-600 rounded-lg shadow-xl z-50">
                          {unmatchedVideos.length === 0 ? (
                            <div className="p-3 text-xs text-dark-500 text-center">All videos matched</div>
                          ) : (
                            unmatchedVideos.map(v => (
                              <button
                                key={v._id || v.id}
                                onClick={() => assignToVideo(i, v)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-dark-700 text-left transition-colors"
                              >
                                {v.thumbnail ? (
                                  <img src={v.thumbnail} alt="" className="w-8 h-5 object-cover rounded flex-shrink-0" decoding="async" />
                                ) : (
                                  <div className="w-8 h-5 bg-dark-700 rounded flex-shrink-0" />
                                )}
                                <span className="text-xs text-dark-200 truncate">{v.title}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {/* Remove */}
                    <button
                      onClick={() => removeUnmatched(i)}
                      className="p-1 text-dark-500 hover:text-dark-300 hover:bg-dark-700 rounded flex-shrink-0"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {totalItems === 0 && !applying && failedCount === 0 && (
            <div className="text-center py-8 text-dark-500 text-sm">
              Drop or browse image files above to start matching
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-dark-700">
          <span className="text-xs text-dark-500">
            {activeVideos.length} video{activeVideos.length !== 1 ? 's' : ''} in scope
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-dark-300 hover:text-dark-100 hover:bg-dark-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={matches.length === 0 || applying}
              className="px-4 py-2 text-sm font-medium bg-dark-100 hover:bg-white text-dark-900 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {applying ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Applying...
                </span>
              ) : (
                `Apply ${matches.length} Replacement${matches.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default YouTubeBulkReplace;
