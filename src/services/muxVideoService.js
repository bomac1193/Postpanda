const muxService = require('./muxService');

const MASTER_URL_TTL_MS = 23 * 60 * 60 * 1000;

const toMillis = (value) => {
  if (!value) return 0;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const hasFreshMuxSource = (video = {}) => {
  if (!video.videoUrl) {
    return false;
  }

  if (!video.muxMasterAccessExpiresAt) {
    return true;
  }

  return toMillis(video.muxMasterAccessExpiresAt) > Date.now() + 60 * 1000;
};

const isMuxVideo = (video = {}) =>
  video?.storageProvider === 'mux' || Boolean(video?.muxUploadId || video?.muxAssetId);

const deriveVideoAssetState = (video = {}) => {
  if (isMuxVideo(video)) {
    if (
      video.muxUploadStatus === 'errored'
      || video.muxAssetStatus === 'errored'
      || video.muxMasterStatus === 'errored'
    ) {
      return 'errored';
    }

    if (video.muxAssetStatus === 'ready' && hasFreshMuxSource(video)) {
      return 'ready';
    }

    if (video.muxUploadId || video.muxAssetId) {
      return 'processing';
    }

    return 'missing';
  }

  return video.videoUrl ? 'ready' : 'missing';
};

const buildMuxVideoUpdates = ({ upload, asset, currentVideo = {} }) => {
  const updates = {
    storageProvider: 'mux',
  };

  if (upload) {
    if (upload.id) updates.muxUploadId = upload.id;
    if (upload.status) updates.muxUploadStatus = upload.status;
    if (upload.asset_id) updates.muxAssetId = upload.asset_id;
  }

  if (asset) {
    if (asset.id) updates.muxAssetId = asset.id;
    if (asset.status) updates.muxAssetStatus = asset.status;
    if (typeof asset.duration === 'number' && (!currentVideo.durationSeconds || currentVideo.durationSeconds <= 0)) {
      updates.durationSeconds = asset.duration;
    }

    if (asset.master?.status) {
      updates.muxMasterStatus = asset.master.status;
    }

    if (asset.master?.url) {
      updates.videoUrl = asset.master.url;
      updates.muxMasterAccessExpiresAt = new Date(Date.now() + MASTER_URL_TTL_MS);
    } else if (!hasFreshMuxSource(currentVideo)) {
      updates.videoUrl = '';
      updates.muxMasterAccessExpiresAt = null;
    }
  }

  return updates;
};

const shouldRefreshMuxVideo = (video = {}, { requestMasterAccess = false, force = false } = {}) => {
  if (!muxService.isConfigured() || !isMuxVideo(video)) {
    return false;
  }

  if (force) {
    return true;
  }

  if (!video.muxAssetId) {
    return true;
  }

  if (video.muxAssetStatus !== 'ready') {
    return true;
  }

  if (requestMasterAccess && !hasFreshMuxSource(video)) {
    return true;
  }

  return false;
};

const applyUpdatesToDocument = async (doc, updates = {}) => {
  let changed = false;

  Object.entries(updates).forEach(([key, value]) => {
    const currentValue = doc[key];
    const currentNormalized = currentValue instanceof Date ? currentValue.getTime() : currentValue;
    const nextNormalized = value instanceof Date ? value.getTime() : value;

    if (currentNormalized !== nextNormalized) {
      doc[key] = value;
      changed = true;
    }
  });

  if (changed && typeof doc.save === 'function') {
    await doc.save();
  }

  return doc;
};

async function syncYoutubeVideo(videoDoc, { requestMasterAccess = false, force = false } = {}) {
  if (!shouldRefreshMuxVideo(videoDoc, { requestMasterAccess, force })) {
    return videoDoc;
  }

  let upload = null;
  let asset = null;

  if (videoDoc.muxUploadId) {
    try {
      upload = await muxService.getUpload(videoDoc.muxUploadId);
    } catch (error) {
      console.error(`Failed to fetch Mux upload ${videoDoc.muxUploadId}:`, error.message);
    }
  }

  const assetId = videoDoc.muxAssetId || upload?.asset_id || null;
  if (assetId) {
    try {
      asset = await muxService.getAsset(assetId);
      const masterMissing = asset?.status === 'ready' && !asset?.master?.url;

      if (requestMasterAccess && masterMissing && asset?.master?.status !== 'preparing') {
        asset = await muxService.enableTemporaryMasterAccess(assetId);
      }
    } catch (error) {
      console.error(`Failed to fetch Mux asset ${assetId}:`, error.message);
    }
  }

  const updates = buildMuxVideoUpdates({
    upload,
    asset,
    currentVideo: videoDoc.toObject ? videoDoc.toObject() : videoDoc,
  });

  return applyUpdatesToDocument(videoDoc, updates);
}

const serializeYoutubeVideo = (videoDoc) => {
  const video = videoDoc?.toObject ? videoDoc.toObject() : { ...videoDoc };
  video.videoAssetState = deriveVideoAssetState(video);
  video.videoReady = video.videoAssetState === 'ready';
  return video;
};

async function resolveYoutubeVideoSource(videoDoc) {
  if (!isMuxVideo(videoDoc)) {
    if (!videoDoc.videoUrl) {
      throw new Error('Video asset missing');
    }

    return {
      videoUrl: videoDoc.videoUrl,
      video: videoDoc,
    };
  }

  const refreshedVideo = await syncYoutubeVideo(videoDoc, {
    requestMasterAccess: true,
    force: !hasFreshMuxSource(videoDoc),
  });

  if (!refreshedVideo.videoUrl) {
    throw new Error(
      refreshedVideo.muxAssetStatus === 'ready'
        ? 'Mux master download is still preparing'
        : 'Mux asset is still processing'
    );
  }

  return {
    videoUrl: refreshedVideo.videoUrl,
    video: refreshedVideo,
  };
}

module.exports = {
  isMuxVideo,
  deriveVideoAssetState,
  buildMuxVideoUpdates,
  shouldRefreshMuxVideo,
  syncYoutubeVideo,
  serializeYoutubeVideo,
  resolveYoutubeVideoSource,
};
