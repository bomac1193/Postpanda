const defaultBase = import.meta.env.DEV ? 'http://localhost:3000' : '';
const API_BASE = (import.meta.env.VITE_API_URL || defaultBase || '').replace(/\/$/, '');

async function request(path, data) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

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
};
