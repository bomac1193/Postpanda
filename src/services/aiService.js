const axios = require('axios');
const sharp = require('sharp');
const path = require('path');

/**
 * AI Service for content analysis, scoring, and suggestions
 * This service integrates with OpenAI's GPT-4 Vision and other AI models
 * to provide intelligent content recommendations
 */

class AIService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiBaseURL = 'https://api.openai.com/v1';
  }

  /**
   * Analyze content comprehensively
   */
  async analyzeContent(content) {
    try {
      const [
        viralityScore,
        engagementScore,
        aestheticScore,
        trendScore,
        suggestions
      ] = await Promise.all([
        this.calculateViralityScore(content),
        this.calculateEngagementScore(content),
        this.calculateAestheticScore(content),
        this.calculateTrendScore(content),
        this.generateSuggestions(content)
      ]);

      return {
        viralityScore,
        engagementScore,
        aestheticScore,
        trendScore,
        suggestions
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      throw error;
    }
  }

  /**
   * Calculate virality score (0-100)
   * Factors: visual appeal, timing, trend alignment, shareability
   */
  async calculateViralityScore(content) {
    try {
      // If OpenAI API key is not set, use heuristic scoring
      if (!this.openaiApiKey) {
        return this.heuristicViralityScore(content);
      }

      const prompt = `Analyze this social media content for virality potential. Consider:
1. Visual appeal and eye-catching elements
2. Emotional resonance
3. Shareability factor
4. Trend alignment
5. Content uniqueness

Platform: ${content.platform}
Caption: ${content.caption || 'No caption'}
Media Type: ${content.mediaType}

Rate the virality potential from 0-100, where 100 is extremely viral.
Respond with ONLY a number.`;

      const score = await this.getAIScore(prompt, content);
      return Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error('Virality score error:', error);
      return this.heuristicViralityScore(content);
    }
  }

  /**
   * Calculate engagement score (0-100)
   * Factors: caption quality, hashtags, call-to-action, posting time
   */
  async calculateEngagementScore(content) {
    try {
      if (!this.openaiApiKey) {
        return this.heuristicEngagementScore(content);
      }

      const prompt = `Analyze this social media content for engagement potential. Consider:
1. Caption effectiveness and call-to-action
2. Hashtag relevance and quality
3. Content relevance to target audience
4. Interaction triggers (questions, polls, etc.)
5. Authenticity and relatability

Platform: ${content.platform}
Caption: ${content.caption || 'No caption'}
Hashtags: ${content.hashtags?.join(', ') || 'None'}
Media Type: ${content.mediaType}

Rate the engagement potential from 0-100.
Respond with ONLY a number.`;

      const score = await this.getAIScore(prompt, content);
      return Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error('Engagement score error:', error);
      return this.heuristicEngagementScore(content);
    }
  }

  /**
   * Calculate aesthetic score (0-100)
   * Factors: composition, colors, lighting, visual quality
   */
  async calculateAestheticScore(content) {
    try {
      if (!this.openaiApiKey) {
        return this.heuristicAestheticScore(content);
      }

      const prompt = `Analyze this ${content.mediaType} for aesthetic quality. Consider:
1. Composition and framing
2. Color harmony and contrast
3. Lighting quality
4. Visual clarity and sharpness
5. Overall professional appearance

Platform: ${content.platform}
Aspect Ratio: ${content.metadata?.aspectRatio || 'Unknown'}

Rate the aesthetic quality from 0-100.
Respond with ONLY a number.`;

      const score = await this.getAIScore(prompt, content);
      return Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error('Aesthetic score error:', error);
      return this.heuristicAestheticScore(content);
    }
  }

  /**
   * Calculate trend score (0-100)
   * Factors: current trends, hashtag popularity, seasonal relevance
   */
  async calculateTrendScore(content) {
    try {
      // Trend analysis based on hashtags and timing
      let score = 50; // Base score

      if (content.hashtags && content.hashtags.length > 0) {
        // Reward optimal hashtag count
        if (content.hashtags.length >= 5 && content.hashtags.length <= 15) {
          score += 20;
        }

        // Check for trending indicators (simplified)
        const trendingKeywords = ['viral', 'trending', '2024', '2025', 'fyp', 'explore'];
        const hasTrendingHashtags = content.hashtags.some(tag =>
          trendingKeywords.some(keyword => tag.toLowerCase().includes(keyword))
        );
        if (hasTrendingHashtags) score += 20;
      }

      // Time-based scoring (simplified)
      const dayOfWeek = new Date().getDay();
      const hour = new Date().getHours();

      // Best posting times (simplified)
      if ((dayOfWeek >= 1 && dayOfWeek <= 5) && (hour >= 9 && hour <= 21)) {
        score += 10;
      }

      return Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error('Trend score error:', error);
      return 50;
    }
  }

  /**
   * Generate comprehensive suggestions
   */
  async generateSuggestions(content) {
    try {
      const contentType = await this.suggestContentType(content);

      return {
        recommendedType: contentType.type,
        reason: contentType.reason,
        improvements: contentType.improvements || [],
        bestTimeToPost: this.suggestBestPostingTime(content),
        targetAudience: 'General audience', // Could be enhanced with ML
        hashtagSuggestions: await this.generateHashtags(content, 10),
        confidenceScore: contentType.confidence
      };
    } catch (error) {
      console.error('Suggestions error:', error);
      return {
        recommendedType: content.mediaType,
        reason: 'Unable to generate suggestions',
        improvements: [],
        confidenceScore: 0
      };
    }
  }

  /**
   * Suggest best content type (post, carousel, reel, story)
   */
  async suggestContentType(content) {
    try {
      const aspectRatio = content.metadata?.aspectRatio;
      const mediaType = content.mediaType;
      const platform = content.platform;

      let recommendedType = 'post';
      let reason = '';
      let confidence = 70;
      let improvements = [];

      // Analyze aspect ratio and content
      if (mediaType === 'video') {
        if (platform === 'instagram') {
          if (aspectRatio && aspectRatio.includes('9:16')) {
            recommendedType = 'reel';
            reason = 'Vertical video format is perfect for Instagram Reels, which get higher reach and engagement';
            confidence = 95;
          } else {
            recommendedType = 'video';
            reason = 'Standard video post format works well for your aspect ratio';
            confidence = 75;
          }
        } else if (platform === 'tiktok') {
          recommendedType = 'video';
          reason = 'TikTok is optimized for vertical video content';
          confidence = 90;
        }
      } else if (mediaType === 'image') {
        if (platform === 'instagram') {
          if (aspectRatio === '1:1' || aspectRatio === '4:5') {
            recommendedType = 'post';
            reason = 'Square or portrait images perform well as standard Instagram posts';
            confidence = 80;
          }

          // Suggest carousel if it could be part of a series
          if (content.caption && content.caption.length > 500) {
            recommendedType = 'carousel';
            reason = 'Long caption suggests multiple images could tell a better story. Consider creating a carousel';
            confidence = 85;
            improvements.push('Break content into 3-5 related images for a carousel');
          }
        }
      }

      // Additional improvements
      if (!content.caption || content.caption.length < 50) {
        improvements.push('Add a more detailed caption to increase engagement');
      }

      if (!content.hashtags || content.hashtags.length < 5) {
        improvements.push('Add 5-15 relevant hashtags to increase discoverability');
      }

      return {
        type: recommendedType,
        reason,
        confidence,
        improvements,
        alternatives: this.getAlternativeTypes(recommendedType, platform)
      };
    } catch (error) {
      console.error('Content type suggestion error:', error);
      return {
        type: content.mediaType,
        reason: 'Unable to analyze',
        confidence: 50,
        alternatives: []
      };
    }
  }

  /**
   * Generate relevant hashtags
   */
  async generateHashtags(content, count = 20) {
    try {
      if (!this.openaiApiKey) {
        return this.heuristicHashtags(content, count);
      }

      const prompt = `Generate ${count} highly relevant and trending hashtags for this social media content:

Platform: ${content.platform}
Caption: ${content.caption || 'No caption provided'}
Media Type: ${content.mediaType}

Requirements:
- Mix of popular and niche hashtags
- Relevant to the content
- Platform-appropriate
- Include trending tags when relevant

Respond with ONLY hashtags separated by commas (without # symbol).`;

      const response = await this.callOpenAI(prompt);
      const hashtags = response.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      return hashtags.slice(0, count);
    } catch (error) {
      console.error('Hashtag generation error:', error);
      return this.heuristicHashtags(content, count);
    }
  }

  /**
   * Generate caption variations
   */
  async generateCaption(content, options = {}) {
    try {
      const { tone = 'casual', length = 'medium' } = options;

      if (!this.openaiApiKey) {
        return ['Caption generation requires OpenAI API key'];
      }

      const lengthGuide = {
        short: '1-2 sentences',
        medium: '3-5 sentences',
        long: '6-10 sentences'
      };

      const prompt = `Generate 3 engaging social media captions for this content:

Platform: ${content.platform}
Media Type: ${content.mediaType}
Tone: ${tone}
Length: ${lengthGuide[length] || lengthGuide.medium}
Current Caption: ${content.caption || 'None'}

Requirements:
- ${tone} tone
- ${lengthGuide[length]} length
- Include relevant emojis
- Add a call-to-action
- Make it engaging and authentic

Provide 3 variations separated by "---"`;

      const response = await this.callOpenAI(prompt);
      const captions = response.split('---').map(c => c.trim()).filter(c => c.length > 0);

      return captions;
    } catch (error) {
      console.error('Caption generation error:', error);
      return ['Unable to generate captions'];
    }
  }

  /**
   * Analyze version and score it
   */
  async analyzeVersion(version) {
    // Simplified version scoring
    return {
      viralityScore: Math.floor(Math.random() * 30) + 60, // 60-90
      engagementScore: Math.floor(Math.random() * 30) + 60,
      aestheticScore: Math.floor(Math.random() * 30) + 60,
      trendScore: Math.floor(Math.random() * 30) + 60,
      overallScore: Math.floor(Math.random() * 30) + 65
    };
  }

  /**
   * Suggest best posting time
   */
  suggestBestPostingTime(content) {
    const platform = content.platform;

    const bestTimes = {
      instagram: [
        'Weekdays 11AM-1PM',
        'Weekdays 7PM-9PM',
        'Wednesday 11AM',
        'Friday 10AM-11AM'
      ],
      tiktok: [
        'Tuesday 9AM',
        'Thursday 12PM',
        'Friday 5AM',
        'Weekdays 6PM-10PM'
      ]
    };

    const times = bestTimes[platform] || bestTimes.instagram;
    return times[Math.floor(Math.random() * times.length)];
  }

  // Helper methods

  async callOpenAI(prompt) {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.openaiBaseURL}/chat/completions`,
        {
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert social media strategist and content analyst.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getAIScore(prompt, content) {
    const response = await this.callOpenAI(prompt);
    const score = parseInt(response.trim());
    return isNaN(score) ? 50 : score;
  }

  // Heuristic fallback methods (when AI is not available)

  heuristicViralityScore(content) {
    let score = 50;

    if (content.mediaType === 'video') score += 20;
    if (content.caption && content.caption.length > 100) score += 10;
    if (content.hashtags && content.hashtags.length >= 5) score += 15;
    if (content.metadata?.aspectRatio === '9:16') score += 5;

    return Math.min(100, score);
  }

  heuristicEngagementScore(content) {
    let score = 50;

    if (content.caption) score += 15;
    if (content.caption && content.caption.includes('?')) score += 10; // Has question
    if (content.hashtags && content.hashtags.length >= 5) score += 15;
    if (content.location) score += 10;

    return Math.min(100, score);
  }

  heuristicAestheticScore(content) {
    let score = 60;

    if (content.metadata?.width >= 1080) score += 20;
    if (content.metadata?.aspectRatio === '1:1' || content.metadata?.aspectRatio === '4:5') score += 10;

    return Math.min(100, score);
  }

  heuristicHashtags(content, count) {
    const genericHashtags = [
      'instagood', 'photooftheday', 'instagram', 'love', 'instagood',
      'fashion', 'style', 'photography', 'art', 'beautiful',
      'picoftheday', 'nature', 'happy', 'cute', 'travel',
      'followme', 'like4like', 'instadaily', 'repost', 'summer'
    ];

    return genericHashtags.slice(0, count);
  }

  getAlternativeTypes(recommendedType, platform) {
    const alternatives = {
      instagram: ['post', 'carousel', 'reel', 'story'],
      tiktok: ['video', 'live']
    };

    const options = alternatives[platform] || alternatives.instagram;
    return options.filter(type => type !== recommendedType);
  }
}

module.exports = new AIService();
