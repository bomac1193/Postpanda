import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../../../stores/useAppStore';
import { contentApi } from '../../../lib/api';
import {
  CROP_PRESETS,
  getCroppedCloudinaryUrl,
  resolvePrimaryImageSource,
  platformDefaultCrop,
} from './constants';

const DEFAULT_DRAFT = {
  cropBox: null,
  cropAspect: 'free',
  rotation: 0,
  flipH: false,
  flipV: false,
};

function loadDrafts(post) {
  const saved = post?.editSettings?.platformDrafts || {};
  const drafts = {};
  for (const p of ['instagram', 'tiktok', 'twitter']) {
    const d = { ...DEFAULT_DRAFT, ...(saved[p] || {}) };
    // Apply platform default aspect if no custom crop exists
    if (!d.cropBox && d.cropAspect === 'free') {
      d.cropAspect = platformDefaultCrop[p] || 'free';
    }
    drafts[p] = d;
  }
  return drafts;
}

export function useQuickEdit(post) {
  const updatePost = useAppStore((s) => s.updatePost);
  const postId = post?.id || post?._id || null;

  const [editing, setEditing] = useState(false);
  const [platform, setPlatform] = useState('instagram');
  const [drafts, setDrafts] = useState({ instagram: null, tiktok: null, twitter: null });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const cropperRef = useRef(null);
  const resetCounter = useRef(0);
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;
  const platformRef = useRef(platform);
  platformRef.current = platform;

  // Reset on post change
  useEffect(() => {
    setEditing(false);
    setDrafts({ instagram: null, tiktok: null, twitter: null });
    setActiveTab('details');
  }, [post?.id, post?._id]);

  // Current draft for the active platform
  const currentDraft = drafts[platform] || DEFAULT_DRAFT;

  // --- Actions ---

  const open = () => {
    if (!resolvePrimaryImageSource(post)) return;
    const d = loadDrafts(post);
    setDrafts(d);
    const target = ['instagram', 'tiktok', 'twitter'].includes(activeTab)
      ? activeTab : 'instagram';
    setPlatform(target);
    resetCounter.current++;
    setEditing(true);
  };

  const save = async () => {
    if (!postId || saving) return;
    setSaving(true);
    try {
      const payload = {
        editSettings: {
          ...(draftsRef.current[platformRef.current] || DEFAULT_DRAFT),
          nonDestructive: true,
          activeSurface: platformRef.current,
          platformDrafts: { ...draftsRef.current },
        },
      };
      updatePost(postId, payload);
      await contentApi.update(postId, payload);
    } catch (err) {
      console.error('Quick edit save failed:', err?.response?.data || err.message);
    } finally {
      setSaving(false);
    }
  };

  const close = async () => {
    await save();
    setEditing(false);
  };

  const switchPlatform = (target) => {
    if (target === platform) return;
    setPlatform(target);
    resetCounter.current++;
  };

  const setCropAspect = (aspectId) => {
    setDrafts((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], cropAspect: aspectId, cropBox: null },
    }));
    resetCounter.current++;
  };

  const rotate = (degrees) => {
    setDrafts((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        rotation: ((prev[platform]?.rotation || 0) + degrees + 360) % 360,
      },
    }));
  };

  const flip = (axis) => {
    const key = axis === 'h' ? 'flipH' : 'flipV';
    setDrafts((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], [key]: !prev[platform]?.[key] },
    }));
  };

  const reset = () => {
    setDrafts((prev) => ({
      ...prev,
      [platform]: { ...DEFAULT_DRAFT, cropAspect: platformDefaultCrop[platform] || 'free' },
    }));
    resetCounter.current++;
  };

  const handleTabChange = (tabId) => {
    if (editing && ['instagram', 'tiktok', 'twitter'].includes(tabId)) {
      switchPlatform(tabId);
    }
    setActiveTab(tabId);
  };

  // --- Cropper callbacks (stable, zero deps) ---

  const getDefaultCoordinates = useCallback(({ imageSize }) => {
    if (!imageSize) return undefined;
    const { width: imgW, height: imgH } = imageSize;
    const d = draftsRef.current[platformRef.current] || DEFAULT_DRAFT;

    // Restore saved crop box
    if (d.cropBox && d.cropBox.width > 0 && d.cropBox.height > 0) {
      return d.cropBox;
    }

    // Compute from aspect ratio
    const ratio = CROP_PRESETS.find((p) => p.id === (d.cropAspect || 'free'))?.ratio;
    if (ratio) {
      const imgAR = imgW / imgH;
      const cropW = ratio > imgAR ? imgW : imgH * ratio;
      const cropH = ratio > imgAR ? imgW / ratio : imgH;
      return {
        left: (imgW - cropW) / 2,
        top: (imgH - cropH) / 2,
        width: cropW,
        height: cropH,
      };
    }
    return { left: 0, top: 0, width: imgW, height: imgH };
  }, []);

  const handleCropperChange = useCallback((cropper) => {
    const coords = cropper.getCoordinates();
    if (!coords) return;
    const p = platformRef.current;
    setDrafts((prev) => {
      const old = prev[p]?.cropBox;
      if (
        old &&
        Math.abs(old.left - coords.left) < 1 &&
        Math.abs(old.top - coords.top) < 1 &&
        Math.abs(old.width - coords.width) < 1 &&
        Math.abs(old.height - coords.height) < 1
      ) {
        return prev;
      }
      return {
        ...prev,
        [p]: {
          ...prev[p],
          cropBox: { left: coords.left, top: coords.top, width: coords.width, height: coords.height },
        },
      };
    });
  }, []);

  // --- Derived ---

  const cropperKey = `${platform}-${resetCounter.current}`;
  const cropperAspect = CROP_PRESETS.find((p) => p.id === (currentDraft.cropAspect || 'free'))?.ratio || undefined;
  const editedImage = editing ? resolvePrimaryImageSource(post) : null;

  const getDraft = (surface) => {
    if (editing) return drafts[surface] || DEFAULT_DRAFT;
    return post?.editSettings?.platformDrafts?.[surface] || {};
  };

  const getCroppedSrc = (surface) => {
    const cb = getDraft(surface).cropBox;
    const url = resolvePrimaryImageSource(post);
    return cb ? getCroppedCloudinaryUrl(url, cb) : url;
  };

  const getCroppedPreviewStyles = (surface) => {
    const d = getDraft(surface);
    const transforms = [];
    if (d.rotation) transforms.push(`rotate(${d.rotation}deg)`);
    if (d.flipH) transforms.push('scaleX(-1)');
    if (d.flipV) transforms.push('scaleY(-1)');
    return {
      containerStyle: { overflow: 'hidden', position: 'relative' },
      imageStyle: {
        width: '100%', height: '100%', objectFit: 'cover',
        transform: transforms.length ? transforms.join(' ') : undefined,
        transformOrigin: 'center center',
      },
    };
  };

  const getTransformedMediaStyle = (surface = null) => {
    const d = getDraft(surface || (editing ? platform : 'instagram'));
    const transforms = [];
    if (d.rotation) transforms.push(`rotate(${d.rotation}deg)`);
    if (d.flipH) transforms.push('scaleX(-1)');
    if (d.flipV) transforms.push('scaleY(-1)');
    return {
      objectFit: 'contain',
      objectPosition: '50% 50%',
      transform: transforms.length ? transforms.join(' ') : undefined,
      transformOrigin: 'center center',
      transition: editing ? 'none' : 'transform 0.2s ease',
    };
  };

  return {
    editing, platform, currentDraft, saving, activeTab, editedImage,
    cropperRef, cropperKey, cropperAspect,
    getDefaultCoordinates, handleCropperChange,
    open, close, save, reset,
    switchPlatform, setCropAspect, rotate, flip,
    handleTabChange, setActiveTab,
    getCroppedSrc, getCroppedPreviewStyles, getTransformedMediaStyle,
  };
}
