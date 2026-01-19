const defaultBase = import.meta.env.DEV ? 'http://localhost:3002' : '';
const API_BASE = (import.meta.env.VITE_API_URL || defaultBase || '').replace(/\/$/, '');

async function request(path, data, method = 'POST') {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE}${path}`, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const aiApi = {
  async generateCaptions(idea, tone) {
    const data = await request('/api/alchemy/captions', { idea, tone });
    return data.captions || [];
  },
  async generateIdeas(niche, examples) {
    const data = await request('/api/alchemy/ideas', { niche, examples });
    return data.ideas || [];
  },
  async generateContentCaptions({ contentId, tone, length }) {
    const data = await request('/api/ai/generate-caption', { contentId, tone, length });
    return data;
  },
  async generateHashtags({ contentId, count }) {
    const data = await request('/api/ai/generate-hashtags', { contentId, count });
    return data;
  },
  async analyzeContent({ contentId, creatorProfile }) {
    const data = await request('/api/ai/analyze', { contentId, creatorProfile });
    return data;
  },
  async suggestContentType({ contentId }) {
    const data = await request('/api/ai/suggest-type', { contentId });
    return data;
  },
  async getOptimalTiming({ platform }) {
    const data = await request('/api/ai/optimal-timing', { platform });
    return data;
  },
  async calculateViralityScore({ contentId }) {
    const data = await request('/api/ai/score/virality', { contentId });
    return data;
  },
  async calculateEngagementScore({ contentId }) {
    const data = await request('/api/ai/score/engagement', { contentId });
    return data;
  },
  async calculateAestheticScore({ contentId }) {
    const data = await request('/api/ai/score/aesthetic', { contentId });
    return data;
  },
};

export const postingApi = {
  async postContent({ contentId, platform, caption }) {
    const data = await request(`/api/post/content/${contentId}`, { platform, caption });
    return data;
  },
  async schedulePost({ contentId, scheduledTime, platform, autoPost }) {
    const data = await request('/api/post/schedule', { contentId, scheduledTime, platform, autoPost });
    return data;
  },
  async getScheduledPosts() {
    const data = await request('/api/post/scheduled', null, 'GET');
    return data;
  },
  async updateScheduledPost({ scheduleId, scheduledTime, platform, autoPost }) {
    const data = await request(`/api/post/schedule/${scheduleId}`, { scheduledTime, platform, autoPost }, 'PUT');
    return data;
  },
  async cancelScheduledPost({ scheduleId }) {
    const data = await request(`/api/post/schedule/${scheduleId}`, null, 'DELETE');
    return data;
  },
};

export const youtubeApi = {
  // Collections
  async getCollections() {
    const data = await request('/api/youtube/collections', null, 'GET');
    return data;
  },
  async getCollection(id) {
    const data = await request(`/api/youtube/collections/${id}`, null, 'GET');
    return data;
  },
  async createCollection(collectionData) {
    const data = await request('/api/youtube/collections', collectionData);
    return data;
  },
  async updateCollection(id, updates) {
    const data = await request(`/api/youtube/collections/${id}`, updates, 'PUT');
    return data;
  },
  async deleteCollection(id) {
    const data = await request(`/api/youtube/collections/${id}`, null, 'DELETE');
    return data;
  },

  // Videos
  async getVideos(collectionId) {
    const path = collectionId
      ? `/api/youtube/videos?collectionId=${collectionId}`
      : '/api/youtube/videos';
    const data = await request(path, null, 'GET');
    return data;
  },
  async getVideo(id) {
    const data = await request(`/api/youtube/videos/${id}`, null, 'GET');
    return data;
  },
  async createVideo(videoData) {
    const data = await request('/api/youtube/videos', videoData);
    return data;
  },
  async updateVideo(id, updates) {
    const data = await request(`/api/youtube/videos/${id}`, updates, 'PUT');
    return data;
  },
  async deleteVideo(id) {
    const data = await request(`/api/youtube/videos/${id}`, null, 'DELETE');
    return data;
  },
  async reorderVideos(collectionId, videoIds) {
    const data = await request('/api/youtube/videos/reorder', { collectionId, videoIds });
    return data;
  },
};

export const rolloutApi = {
  // Rollouts
  async getAll() {
    const data = await request('/api/rollout', null, 'GET');
    return data;
  },
  async getById(id) {
    const data = await request(`/api/rollout/${id}`, null, 'GET');
    return data;
  },
  async create(rolloutData) {
    const data = await request('/api/rollout', rolloutData);
    return data;
  },
  async update(id, updates) {
    const data = await request(`/api/rollout/${id}`, updates, 'PUT');
    return data;
  },
  async delete(id) {
    const data = await request(`/api/rollout/${id}`, null, 'DELETE');
    return data;
  },

  // Sections
  async addSection(rolloutId, sectionData) {
    const data = await request(`/api/rollout/${rolloutId}/sections`, sectionData);
    return data;
  },
  async updateSection(rolloutId, sectionId, updates) {
    const data = await request(`/api/rollout/${rolloutId}/sections/${sectionId}`, updates, 'PUT');
    return data;
  },
  async deleteSection(rolloutId, sectionId) {
    const data = await request(`/api/rollout/${rolloutId}/sections/${sectionId}`, null, 'DELETE');
    return data;
  },
  async reorderSections(rolloutId, sectionIds) {
    const data = await request(`/api/rollout/${rolloutId}/sections/reorder`, { sectionIds });
    return data;
  },

  // Collections in sections
  async addCollectionToSection(rolloutId, sectionId, collectionId) {
    const data = await request(`/api/rollout/${rolloutId}/sections/${sectionId}/collections`, { collectionId });
    return data;
  },
  async removeCollectionFromSection(rolloutId, sectionId, collectionId) {
    const data = await request(`/api/rollout/${rolloutId}/sections/${sectionId}/collections/${collectionId}`, null, 'DELETE');
    return data;
  },
};
