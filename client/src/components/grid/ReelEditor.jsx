import { useState, useRef } from 'react';
import { X, Play, Image, Music, Hash, MapPin, AtSign, Clock, Save, Trash2, Shield, Eye, Disc, User, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { formatDuration } from '../../utils/videoUtils';
import { useAppStore } from '../../stores/useAppStore';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-dark-600 text-dark-200' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-600 text-white' },
  { value: 'published', label: 'Published', color: 'bg-green-600 text-white' },
];

const PRIVACY_OPTIONS = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'FRIENDS_ONLY', label: 'Friends Only' },
  { value: 'MUTUAL_FOLLOW_FRIENDS', label: 'Mutual Followers' },
  { value: 'SELF_ONLY', label: 'Only Me' },
];

const TIKTOK_CAPTION_LIMIT = 2200;
const TIKTOK_TITLE_LIMIT = 150;
const HASHTAG_LIMIT = 30;

function ToggleRow({ label, enabled, onChange }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-dark-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-dark-100' : 'bg-dark-600'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-dark-900 transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

/**
 * TikTok Reel editor — status workflow, privacy, duet/stitch/comment toggles
 */
function ReelEditor({ reel, onSave, onDelete, onClose, onChangeThumbnail, onPlay }) {
  const user = useAppStore((state) => state.user);
  const profiles = useAppStore((state) => state.profiles);
  const currentProfileId = useAppStore((state) => state.currentProfileId);
  const currentProfile = profiles?.find(p => (p._id || p.id) === currentProfileId) || null;
  const profileAvatar = currentProfile?.avatar || user?.profileImage || user?.avatar;

  // Core fields
  const [caption, setCaption] = useState(reel?.caption || '');
  const [hashtags, setHashtags] = useState(reel?.hashtags?.join(' ') || '');
  const [location, setLocation] = useState(reel?.location || '');
  const [mentions, setMentions] = useState(reel?.mentions?.join(' ') || '');
  const [audioTrack, setAudioTrack] = useState(reel?.audioTrack || '');
  const [scheduledFor, setScheduledFor] = useState(
    reel?.scheduledFor ? new Date(reel.scheduledFor).toISOString().slice(0, 16) : ''
  );

  // Status workflow
  const [status, setStatus] = useState(reel?.status || 'draft');

  // TikTok-specific settings
  const tiktokSettings = reel?.editSettings?.tiktok || {};
  const [privacyLevel, setPrivacyLevel] = useState(tiktokSettings.privacyLevel || 'SELF_ONLY');
  const [disableDuet, setDisableDuet] = useState(tiktokSettings.disableDuet ?? false);
  const [disableStitch, setDisableStitch] = useState(tiktokSettings.disableStitch ?? false);
  const [disableComment, setDisableComment] = useState(tiktokSettings.disableComment ?? false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFYP, setShowFYP] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const hashtagCount = hashtags.trim()
    ? hashtags.trim().split(/\s+/).filter(h => h.startsWith('#') || h.length > 0).length
    : 0;

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'scheduled' && !scheduledFor) {
      alert('Set a schedule date before marking as Scheduled.');
      return;
    }
    setStatus(newStatus);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Auto-promote to scheduled if a date is set and status is still draft
      const resolvedStatus = (scheduledFor && status === 'draft') ? 'scheduled' : status;
      if (resolvedStatus !== status) setStatus(resolvedStatus);

      const updates = {
        caption: caption.trim(),
        hashtags: hashtags.trim().split(/\s+/).filter(h => h).map(h => (h.startsWith('#') ? h : `#${h}`)),
        location: location.trim(),
        mentions: mentions.trim().split(/\s+/).filter(m => m).map(m => (m.startsWith('@') ? m : `@${m}`)),
        audioTrack: audioTrack.trim(),
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        scheduledTime: scheduledFor ? new Date(scheduledFor) : null,
        scheduledPlatforms: resolvedStatus === 'scheduled' ? ['tiktok'] : [],
        autoPost: resolvedStatus === 'scheduled',
        status: resolvedStatus,
        editSettings: {
          ...(reel?.editSettings || {}),
          tiktok: {
            privacyLevel,
            disableDuet,
            disableStitch,
            disableComment,
          },
        },
      };
      await onSave(updates);
    } catch (err) {
      console.error('Failed to save reel:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete();
    } catch (err) {
      console.error('Failed to delete reel:', err);
      alert('Failed to delete reel. Please try again.');
    }
  };

  const statusColor = STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-dark-600 text-dark-200';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-dark-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-dark-700 flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left side — Video preview */}
        <div className="flex-1 bg-black flex flex-col">
          <div className="flex-1 relative flex items-center justify-center p-4">
            <div className="relative h-full max-h-[70vh] aspect-[9/16] bg-dark-900 rounded-xl overflow-hidden shadow-2xl">
              {/* Video / Image / Placeholder */}
              {reel?.mediaUrl ? (
                <video
                  ref={videoRef}
                  src={reel.mediaUrl}
                  poster={reel.thumbnailUrl}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  onClick={togglePlay}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : reel?.thumbnailUrl ? (
                <img src={reel.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-dark-700 flex items-center justify-center">
                  <span className="text-dark-500">No preview</span>
                </div>
              )}

              {/* Play button overlay */}
              {!isPlaying && (
                <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/60 transition-colors">
                    <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                  </div>
                </button>
              )}

              {/* Duration badge */}
              {reel?.metadata?.duration && (
                <div className="absolute top-2 left-2 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-white pointer-events-none">
                  {formatDuration(reel.metadata.duration)}
                </div>
              )}

              {/* Status badge */}
              <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-medium pointer-events-none ${statusColor}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </div>

              {/* Right side — profile avatar + music disc (always visible) */}
              <div className="absolute right-2 bottom-16 flex flex-col items-center gap-3 pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-dark-600 border-2 border-white flex items-center justify-center overflow-hidden">
                  {profileAvatar ? (
                    <img src={profileAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-dark-300" />
                  )}
                </div>
                <div
                  className="w-10 h-10 bg-gradient-to-br from-dark-600 to-dark-800 rounded-full flex items-center justify-center border-2 border-dark-500"
                  style={{ animation: isPlaying ? 'spin 3s linear infinite' : 'none' }}
                >
                  <Disc className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* For You Page overlay — just the top tabs */}
              {showFYP && (
                <div className="absolute top-0 left-0 right-0 pointer-events-none pt-2 pb-1">
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-white/40 text-[11px]">Following</span>
                    <span className="text-white text-[11px] font-semibold border-b border-white pb-0.5">For You</span>
                  </div>
                </div>
              )}

              {/* Comments overlay — post-vanity comments */}
              {showComments && (
                <div className="absolute bottom-0 left-0 right-0 bg-dark-900/95 rounded-t-xl pointer-events-none" style={{ height: '45%' }}>
                  <div className="flex items-center justify-between px-3 py-2 border-b border-dark-700">
                    <span className="text-white/70 text-[11px] font-medium">Comments</span>
                    <X className="w-3 h-3 text-dark-500" />
                  </div>
                  <div className="px-3 py-2 space-y-2.5 overflow-hidden">
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-dark-700 shrink-0" />
                      <div>
                        <span className="text-white/40 text-[9px] font-medium">jay_mkz</span>
                        <p className="text-white/60 text-[9px] leading-tight">how did you get that texture in the second half</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-dark-700 shrink-0" />
                      <div>
                        <span className="text-white/40 text-[9px] font-medium">nneka.wav</span>
                        <p className="text-white/60 text-[9px] leading-tight">been looking for this sound for weeks lol</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-dark-700 shrink-0" />
                      <div>
                        <span className="text-white/40 text-[9px] font-medium">dami.loops</span>
                        <p className="text-white/60 text-[9px] leading-tight">do you have a longer version of this?</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2 border-t border-dark-700">
                    <div className="h-7 bg-dark-700/60 rounded-full flex items-center px-3">
                      <span className="text-white/20 text-[9px]">Add comment...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom overlay — caption + music */}
              <div className="absolute left-2 right-12 bottom-2 pointer-events-none">
                <p className="text-white font-bold text-xs mb-0.5">
                  {currentProfile?.username || user?.username || user?.brandName || 'username'}
                </p>
                <p className="text-white/90 text-[10px] line-clamp-2 leading-tight">
                  {caption || 'Your caption will appear here...'}
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Music className="w-3 h-3 text-white" />
                  <div className="overflow-hidden">
                    <p className="text-white/80 text-[10px] truncate">
                      {audioTrack || 'Original audio - your_username'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview overlay toggles */}
          <div className="px-4 pb-2 flex gap-2">
            <button
              onClick={() => { setShowFYP(!showFYP); if (!showFYP) setShowComments(false); }}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${showFYP ? 'bg-white text-dark-900' : 'bg-dark-700 text-dark-400 hover:text-dark-200'}`}
            >
              For You Page
            </button>
            <button
              onClick={() => { setShowComments(!showComments); if (!showComments) setShowFYP(false); }}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${showComments ? 'bg-white text-dark-900' : 'bg-dark-700 text-dark-400 hover:text-dark-200'}`}
            >
              Comments
            </button>
          </div>

          {/* Cover image row */}
          <div className="px-4 pb-4">
            <div className="flex items-center gap-3 bg-dark-700 rounded-lg p-2">
              {reel?.thumbnailUrl ? (
                <img
                  src={reel.thumbnailUrl}
                  alt="Cover"
                  className="w-10 h-14 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-14 bg-dark-600 rounded flex items-center justify-center">
                  <Image className="w-4 h-4 text-dark-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-dark-300 truncate">Cover image</p>
                <p className="text-[10px] text-dark-500">Shown in feed grid</p>
              </div>
              <button
                onClick={onChangeThumbnail}
                className="px-3 py-1.5 bg-dark-600 hover:bg-dark-500 text-dark-200 rounded text-xs transition-colors"
              >
                Change
              </button>
            </div>
          </div>
        </div>

        {/* Right side — Editor panel */}
        <div className="w-96 flex-shrink-0 flex flex-col border-l border-dark-700">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-dark-700">
            <h3 className="text-sm font-medium text-dark-100">Edit Details</h3>
            <button onClick={onClose} className="text-dark-400 hover:text-dark-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Posting notification banner */}
          {isSaving && (
            <div className="px-3 py-2 border-b border-dark-700 bg-dark-800">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-dark-400/30 border-t-dark-400 rounded-full animate-spin shrink-0" />
                <p className="text-xs text-dark-300">Saving to TikTok...</p>
              </div>
            </div>
          )}
          {!isSaving && reel?.status === 'published' && reel?.publishedAt && (
            <div className="px-3 py-2 border-b border-green-500/20 bg-green-500/5">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-green-300">
                    Published {new Date(reel.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                {reel.platformPostUrl && (
                  <a
                    href={reel.platformPostUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-green-400 hover:text-green-300 shrink-0"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}
          {!isSaving && reel?.status === 'failed' && (
            <div className="px-3 py-2 border-b border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <p className="text-xs text-red-300">{reel.lastError || 'Posting failed — check your TikTok connection'}</p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Status row */}
            <div className="flex gap-1.5">
              {STATUS_OPTIONS.map((opt) => {
                const isActive = status === opt.value;
                let btnClass = 'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ';
                if (isActive) {
                  btnClass += opt.color;
                } else {
                  btnClass += 'bg-dark-700 text-dark-400 hover:text-dark-200';
                }
                return (
                  <button key={opt.value} className={btnClass} onClick={() => handleStatusChange(opt.value)}>
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Caption */}
            <div>
              <label className="flex items-center justify-between text-xs font-medium text-dark-400 mb-1">
                <span>Caption</span>
                <span className={caption.length > TIKTOK_CAPTION_LIMIT ? 'text-red-400' : ''}>
                  {caption.length}/{TIKTOK_CAPTION_LIMIT}
                </span>
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={3}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-2.5 py-2 text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-dark-100 resize-none"
              />
              {caption.length > TIKTOK_TITLE_LIMIT && (
                <p className="text-amber-400 text-[10px] mt-0.5">
                  TikTok shows the first ~150 characters as the post title. Current: {caption.length} chars.
                </p>
              )}
            </div>

            {/* Hashtags */}
            <div>
              <label className="flex items-center justify-between text-xs font-medium text-dark-400 mb-1">
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  Hashtags
                </span>
                <span className={hashtagCount > HASHTAG_LIMIT ? 'text-red-400' : ''}>
                  {hashtagCount}/{HASHTAG_LIMIT}
                </span>
              </label>
              <textarea
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#viral #trending"
                rows={2}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-2.5 py-2 text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-dark-100 resize-none"
              />
            </div>

            {/* Audio */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-dark-400 mb-1">
                <Music className="w-3 h-3" />
                Audio
              </label>
              <input
                type="text"
                value={audioTrack}
                onChange={(e) => setAudioTrack(e.target.value)}
                placeholder="Original audio"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-2.5 py-2 text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-dark-100"
              />
            </div>

            {/* TikTok Settings card */}
            <div className="border border-dark-600 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Shield className="w-3.5 h-3.5 text-dark-400" />
                <span className="text-xs font-medium text-dark-300">TikTok Settings</span>
              </div>

              {/* Privacy */}
              <div className="mb-2">
                <label className="flex items-center gap-1 text-xs text-dark-400 mb-1">
                  <Eye className="w-3 h-3" />
                  Privacy
                </label>
                <select
                  value={privacyLevel}
                  onChange={(e) => setPrivacyLevel(e.target.value)}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-2.5 py-2 text-sm text-dark-100 focus:outline-none focus:border-dark-100 appearance-none"
                >
                  {PRIVACY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggles */}
              <div className="border-t border-dark-600 pt-2 mt-2">
                <ToggleRow
                  label="Allow Comments"
                  enabled={!disableComment}
                  onChange={(on) => setDisableComment(!on)}
                />
                <ToggleRow
                  label="Allow Duet"
                  enabled={!disableDuet}
                  onChange={(on) => setDisableDuet(!on)}
                />
                <ToggleRow
                  label="Allow Stitch"
                  enabled={!disableStitch}
                  onChange={(on) => setDisableStitch(!on)}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-dark-400 mb-1">
                <MapPin className="w-3 h-3" />
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-2.5 py-2 text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-dark-100"
              />
            </div>

            {/* Mentions */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-dark-400 mb-1">
                <AtSign className="w-3 h-3" />
                Mentions
              </label>
              <input
                type="text"
                value={mentions}
                onChange={(e) => setMentions(e.target.value)}
                placeholder="@username"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-2.5 py-2 text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-dark-100"
              />
            </div>

            {/* Schedule */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-dark-400 mb-1">
                <Clock className="w-3 h-3" />
                Schedule
              </label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-2.5 py-2 text-sm text-dark-100 focus:outline-none focus:border-dark-100"
              />
            </div>

            {/* Video Info */}
            {reel?.metadata && (
              <div className="p-2 bg-dark-700/50 rounded-lg">
                <p className="text-xs text-dark-500 mb-1.5 font-medium">Video Info</p>
                <div className="space-y-0.5 text-xs">
                  {reel.metadata.width && reel.metadata.height && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-dark-500">Resolution</span>
                        <span className="text-dark-300">{reel.metadata.width}x{reel.metadata.height}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-dark-500">Aspect Ratio</span>
                        <span className={`text-dark-300 ${reel.metadata.width < reel.metadata.height ? '' : 'text-amber-400'}`}>
                          {reel.metadata.width < reel.metadata.height ? '9:16 (vertical)' : `${reel.metadata.width}:${reel.metadata.height} (not vertical)`}
                        </span>
                      </div>
                    </>
                  )}
                  {reel.metadata.duration && (
                    <div className="flex justify-between">
                      <span className="text-dark-500">Duration</span>
                      <span className="text-dark-300">{formatDuration(reel.metadata.duration)}</span>
                    </div>
                  )}
                  {reel.metadata.fileSize && (
                    <div className="flex justify-between">
                      <span className="text-dark-500">Size</span>
                      <span className="text-dark-300">{(reel.metadata.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-dark-700 space-y-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-2.5 bg-dark-100 hover:bg-white disabled:bg-dark-600 disabled:text-dark-400 text-dark-900 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 bg-dark-700 hover:bg-dark-600 text-dark-300 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 py-2 text-dark-300 hover:bg-dark-600/30 border border-dark-500/30 rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div
            className="absolute inset-0 bg-black/50 flex items-center justify-center"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="bg-dark-800 rounded-xl p-6 w-full max-w-sm border border-dark-700"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-lg font-medium text-dark-100 mb-2">Delete Reel?</h4>
              <p className="text-dark-400 text-sm mb-4">
                This will permanently delete this reel. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 bg-dark-100 hover:bg-white text-dark-900 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReelEditor;
