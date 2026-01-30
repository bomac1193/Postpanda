const OpenAI = require('openai');

class AlchemyAiService {
  constructor() {
    this.client = null;
    this.model = process.env.OPENAI_ALCHEMY_MODEL || 'gpt-4o-mini';
  }

  getClient() {
    if (this.client) return this.client;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required to use AI caption or idea generation');
    }

    this.client = new OpenAI({ apiKey });
    return this.client;
  }

  parseJson(content) {
    if (!content) return null;
    const trimmed = String(content).trim();

    // If the model wrapped JSON in a code fence, extract the payload
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const candidate = (fenced?.[1] || trimmed).trim();

    // Attempt direct parse first
    try {
      return JSON.parse(candidate);
    } catch {
      // Fallback: pull the first JSON object from mixed text
      const objMatch = candidate.match(/\{[\s\S]*\}/);
      if (objMatch) {
        try {
          return JSON.parse(objMatch[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  fallbackCaptions(idea, tone) {
    const base = idea || 'your latest concept';
    return [
      `${base} • ${tone} mode • link in bio`,
      `${tone.toUpperCase()} energy on the feed. ${base}`,
      `${base} – let me know what you think ↓`
    ];
  }

  formattedList(text) {
    const cleaned = String(text || '')
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    return cleaned
      .split('\n')
      .map(line => line.replace(/^[0-9]+[.)-]*\s*/, '').trim())
      .filter(line => line && !['{', '}', '[', ']'].includes(line));
  }

  async generateCaptions(idea, tone = 'neutral') {
    try {
      const baseRequest = {
        model: this.model,
        temperature: 0.75,
        messages: [
          {
            role: 'system',
            content: 'You are an elite Instagram caption ghostwriter. Respond with JSON.'
          },
          {
            role: 'user',
            content: `Create 3 Instagram captions for the idea below using a ${tone} tone. Include tasteful hashtags and keep each option under 2,000 characters.
Idea: ${idea}
Return JSON in the shape {"captions":["caption 1","caption 2","caption 3"]}`
          }
        ]
      };

      // Prefer enforced JSON output; retry without if the model/API rejects it.
      let completion;
      try {
        completion = await this.getClient().chat.completions.create({
          ...baseRequest,
          response_format: { type: 'json_object' },
        });
      } catch (error) {
        completion = await this.getClient().chat.completions.create(baseRequest);
      }

      const content = completion?.choices?.[0]?.message?.content?.trim();
      const parsed = this.parseJson(content);
      if (parsed?.captions) {
        return parsed.captions.filter(Boolean).slice(0, 3);
      }

      const fallbacks = this.formattedList(content);
      if (fallbacks?.length) return fallbacks.slice(0, 3);
    } catch (error) {
      console.error('Alchemy caption generation failed:', error.message);
      return this.fallbackCaptions(idea, tone);
    }

    return this.fallbackCaptions(idea, tone);
  }

  fallbackIdeas(niche) {
    return Array.from({ length: 5 }).map((_, index) => ({
      title: `${niche} concept ${index + 1}`,
      description: `Share a perspective on ${niche} with a behind-the-scenes angle.`,
      format: 'reel'
    }));
  }

  async generateIdeas(niche, examples = []) {
    try {
      const formattedExamples = examples
        .map((example, index) => `${index + 1}. ${example}`)
        .join('\n');

      const baseRequest = {
        model: this.model,
        temperature: 0.65,
        messages: [
          {
            role: 'system',
            content: 'You are a content strategist for fashion-forward Instagram creators. Respond with JSON.'
          },
          {
            role: 'user',
            content: `Generate 10 Instagram content ideas tailored for the niche "${niche}". Use insights from the creator's previous posts if provided.
Previous posts:
${formattedExamples || 'None provided'}

Return JSON in the shape {"ideas":[{"title":"","description":"","format":"reel|photo|carousel"}]}`
          }
        ]
      };

      let completion;
      try {
        completion = await this.getClient().chat.completions.create({
          ...baseRequest,
          response_format: { type: 'json_object' },
        });
      } catch (error) {
        completion = await this.getClient().chat.completions.create(baseRequest);
      }

      const content = completion?.choices?.[0]?.message?.content?.trim();
      const parsed = this.parseJson(content);
      if (parsed?.ideas?.length) {
        return parsed.ideas.slice(0, 10).map(idea => ({
          title: idea.title || 'Untitled concept',
          description: idea.description || '',
          format: idea.format || 'reel'
        }));
      }

      const fallbacks = this.formattedList(content);
      if (fallbacks?.length) {
        return fallbacks.slice(0, 10).map(item => ({
          title: item.slice(0, 80),
          description: item,
          format: 'reel'
        }));
      }
    } catch (error) {
      console.error('Alchemy idea generation failed:', error.message);
      return this.fallbackIdeas(niche);
    }

    return this.fallbackIdeas(niche);
  }
}

module.exports = new AlchemyAiService();
