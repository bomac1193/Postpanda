const axios = require('axios');
const crypto = require('crypto');

const MUX_API_BASE = 'https://api.mux.com/video/v1';

const getTokenId = () => process.env.MUX_TOKEN_ID || '';
const getTokenSecret = () => process.env.MUX_TOKEN_SECRET || '';

const isConfigured = () => Boolean(getTokenId() && getTokenSecret());

const getClientOrigin = () =>
  `${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173'}`.replace(/\/+$/, '');

const getMuxClient = () => {
  if (!isConfigured()) {
    throw new Error('Mux is not configured');
  }

  return axios.create({
    baseURL: MUX_API_BASE,
    timeout: 60000,
    auth: {
      username: getTokenId(),
      password: getTokenSecret(),
    },
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

const unwrapMuxResponse = (response) => response?.data?.data || response?.data || null;

const createExternalId = () => crypto.randomUUID();

async function createDirectUpload({ filename = '', corsOrigin, externalId } = {}) {
  const client = getMuxClient();
  const payload = {
    cors_origin: corsOrigin || getClientOrigin(),
    new_asset_settings: {
      master_access: 'temporary',
      video_quality: process.env.MUX_VIDEO_QUALITY || 'basic',
      passthrough: externalId || createExternalId(),
    },
  };

  const response = await client.post('/uploads', payload);
  return unwrapMuxResponse(response);
}

async function getUpload(uploadId) {
  const client = getMuxClient();
  const response = await client.get(`/uploads/${uploadId}`);
  return unwrapMuxResponse(response);
}

async function getAsset(assetId) {
  const client = getMuxClient();
  const response = await client.get(`/assets/${assetId}`);
  return unwrapMuxResponse(response);
}

async function enableTemporaryMasterAccess(assetId) {
  const client = getMuxClient();
  const response = await client.put(`/assets/${assetId}/master-access`, {
    master_access: 'temporary',
  });
  return unwrapMuxResponse(response);
}

module.exports = {
  isConfigured,
  getClientOrigin,
  createDirectUpload,
  getUpload,
  getAsset,
  enableTemporaryMasterAccess,
};
