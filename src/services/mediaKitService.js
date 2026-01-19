/**
 * Media Kit Service
 * Handles stats fetching and export generation
 */

class MediaKitService {
  constructor() {
    this.templates = {
      minimal: {
        name: 'Minimal',
        description: 'Clean and simple layout',
        colors: { primary: '#000000', accent: '#333333' }
      },
      professional: {
        name: 'Professional',
        description: 'Business-focused design',
        colors: { primary: '#1a365d', accent: '#2b6cb0' }
      },
      creative: {
        name: 'Creative',
        description: 'Bold and artistic',
        colors: { primary: '#553c9a', accent: '#9f7aea' }
      },
      bold: {
        name: 'Bold',
        description: 'High contrast and impactful',
        colors: { primary: '#c53030', accent: '#f56565' }
      }
    };
  }

  /**
   * Fetch platform stats for a user
   * In production, this would connect to social media APIs
   */
  async fetchPlatformStats(userId, platform) {
    // Simulated stats - in production, fetch from actual APIs
    const mockStats = {
      instagram: {
        followers: Math.floor(Math.random() * 50000) + 10000,
        engagementRate: (Math.random() * 5 + 2).toFixed(2),
        avgLikes: Math.floor(Math.random() * 2000) + 500,
        avgComments: Math.floor(Math.random() * 100) + 20,
        avgViews: Math.floor(Math.random() * 10000) + 2000
      },
      tiktok: {
        followers: Math.floor(Math.random() * 100000) + 20000,
        engagementRate: (Math.random() * 8 + 3).toFixed(2),
        avgLikes: Math.floor(Math.random() * 5000) + 1000,
        avgComments: Math.floor(Math.random() * 200) + 50,
        avgViews: Math.floor(Math.random() * 50000) + 10000
      },
      youtube: {
        followers: Math.floor(Math.random() * 30000) + 5000,
        engagementRate: (Math.random() * 4 + 1).toFixed(2),
        avgLikes: Math.floor(Math.random() * 1000) + 200,
        avgComments: Math.floor(Math.random() * 50) + 10,
        avgViews: Math.floor(Math.random() * 20000) + 5000
      },
      twitter: {
        followers: Math.floor(Math.random() * 20000) + 5000,
        engagementRate: (Math.random() * 3 + 1).toFixed(2),
        avgLikes: Math.floor(Math.random() * 500) + 100,
        avgComments: Math.floor(Math.random() * 30) + 5,
        avgViews: Math.floor(Math.random() * 5000) + 1000
      }
    };

    return mockStats[platform] || null;
  }

  /**
   * Fetch all platform stats for a user
   */
  async fetchAllStats(userId) {
    const platforms = ['instagram', 'tiktok', 'youtube', 'twitter'];
    const stats = {};

    for (const platform of platforms) {
      stats[platform] = await this.fetchPlatformStats(userId, platform);
    }

    // Calculate totals
    const totalReach = Object.values(stats).reduce((sum, s) => sum + (s?.followers || 0), 0);
    const avgEngagement = Object.values(stats)
      .filter(s => s)
      .reduce((sum, s, _, arr) => sum + parseFloat(s.engagementRate) / arr.length, 0)
      .toFixed(2);

    return {
      platforms: stats,
      totalReach,
      avgEngagement
    };
  }

  /**
   * Generate HTML for media kit export
   */
  generateHTML(mediaKit) {
    const { sections, customization, template } = mediaKit;
    const templateColors = this.templates[template]?.colors || this.templates.professional.colors;

    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: '${customization.fontFamily || 'Inter'}', sans-serif;
          background: ${customization.backgroundColor || '#ffffff'};
          color: #333;
          line-height: 1.6;
        }
        .media-kit {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          ${customization.headerImage ? `
            background-image: url('${customization.headerImage}');
            background-size: cover;
            background-position: center;
            padding: 60px 40px;
            color: white;
            border-radius: 12px;
          ` : ''}
        }
        .profile-image {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid ${customization.primaryColor || templateColors.primary};
          margin-bottom: 16px;
        }
        h1 { font-size: 2rem; margin-bottom: 8px; color: ${customization.primaryColor || templateColors.primary}; }
        h2 { font-size: 1.5rem; margin-bottom: 16px; color: ${customization.primaryColor || templateColors.primary}; }
        h3 { font-size: 1.1rem; margin-bottom: 12px; }
        .section { margin-bottom: 40px; }
        .bio { font-size: 1.1rem; color: #666; max-width: 600px; margin: 0 auto; }
        .categories { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 16px; }
        .category { background: ${customization.accentColor || templateColors.accent}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .stat-card { background: #f8f9fa; padding: 24px; border-radius: 12px; text-align: center; }
        .stat-platform { font-size: 0.9rem; color: #666; margin-bottom: 8px; text-transform: capitalize; }
        .stat-followers { font-size: 2rem; font-weight: 700; color: ${customization.primaryColor || templateColors.primary}; }
        .stat-label { font-size: 0.85rem; color: #888; }
        .stat-engagement { font-size: 1.2rem; color: ${customization.accentColor || templateColors.accent}; margin-top: 8px; }
        .services-list { display: grid; gap: 16px; }
        .service-item { background: #f8f9fa; padding: 20px; border-radius: 12px; border-left: 4px solid ${customization.accentColor || templateColors.accent}; }
        .service-name { font-weight: 600; margin-bottom: 8px; }
        .service-price { color: ${customization.accentColor || templateColors.accent}; font-weight: 600; }
        .service-description { font-size: 0.9rem; color: #666; margin-top: 8px; }
        .portfolio-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .portfolio-item { background: #f8f9fa; border-radius: 12px; overflow: hidden; }
        .portfolio-image { width: 100%; height: 150px; object-fit: cover; }
        .portfolio-info { padding: 16px; }
        .portfolio-title { font-weight: 600; }
        .portfolio-brand { font-size: 0.85rem; color: ${customization.accentColor || templateColors.accent}; }
        .contact-section { text-align: center; background: ${customization.primaryColor || templateColors.primary}; color: white; padding: 40px; border-radius: 12px; }
        .contact-section h2 { color: white; }
        .contact-info { margin-top: 20px; }
        .contact-item { margin: 8px 0; }
        .social-links { display: flex; gap: 16px; justify-content: center; margin-top: 20px; }
        .social-link { color: white; text-decoration: none; opacity: 0.9; }
        .social-link:hover { opacity: 1; }
      </style>
    `;

    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${mediaKit.name}</title>${styles}</head><body><div class="media-kit">`;

    // About section
    if (sections.about?.enabled) {
      html += `
        <div class="header section">
          ${sections.about.profileImage ? `<img src="${sections.about.profileImage}" alt="Profile" class="profile-image">` : ''}
          <h1>${sections.about.headline || mediaKit.name}</h1>
          ${sections.about.location ? `<p style="color: #666; margin-bottom: 16px;">${sections.about.location}</p>` : ''}
          <p class="bio">${sections.about.bio || ''}</p>
          ${sections.about.categories?.length ? `
            <div class="categories">
              ${sections.about.categories.map(c => `<span class="category">${c}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }

    // Stats section
    if (sections.stats?.enabled && sections.stats.platforms?.length) {
      html += `
        <div class="section">
          <h2>Audience & Reach</h2>
          <div class="stats-grid">
            ${sections.stats.platforms.map(p => `
              <div class="stat-card">
                <div class="stat-platform">${p.name}</div>
                <div class="stat-followers">${this.formatNumber(p.followers)}</div>
                <div class="stat-label">Followers</div>
                <div class="stat-engagement">${p.engagementRate}% Engagement</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Services section
    if (sections.services?.enabled && sections.services.items?.length) {
      html += `
        <div class="section">
          <h2>Services & Rates</h2>
          <div class="services-list">
            ${sections.services.items.map(s => `
              <div class="service-item">
                <div class="service-name">${s.name}</div>
                ${customization.showRates && s.price ? `<div class="service-price">${s.price}</div>` : ''}
                <div class="service-description">${s.description || ''}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Portfolio section
    if (sections.portfolio?.enabled && sections.portfolio.items?.length) {
      html += `
        <div class="section">
          <h2>Previous Work</h2>
          <div class="portfolio-grid">
            ${sections.portfolio.items.map(p => `
              <div class="portfolio-item">
                ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}" class="portfolio-image">` : ''}
                <div class="portfolio-info">
                  <div class="portfolio-title">${p.title}</div>
                  ${p.brandName ? `<div class="portfolio-brand">${p.brandName}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Contact section
    if (sections.contact?.enabled) {
      html += `
        <div class="contact-section section">
          <h2>Let's Work Together</h2>
          <div class="contact-info">
            ${sections.contact.email ? `<div class="contact-item">${sections.contact.email}</div>` : ''}
            ${sections.contact.website ? `<div class="contact-item">${sections.contact.website}</div>` : ''}
          </div>
          <div class="social-links">
            ${sections.contact.socialLinks?.instagram ? `<a href="https://instagram.com/${sections.contact.socialLinks.instagram}" class="social-link">Instagram</a>` : ''}
            ${sections.contact.socialLinks?.tiktok ? `<a href="https://tiktok.com/@${sections.contact.socialLinks.tiktok}" class="social-link">TikTok</a>` : ''}
            ${sections.contact.socialLinks?.youtube ? `<a href="https://youtube.com/${sections.contact.socialLinks.youtube}" class="social-link">YouTube</a>` : ''}
            ${sections.contact.socialLinks?.twitter ? `<a href="https://twitter.com/${sections.contact.socialLinks.twitter}" class="social-link">Twitter</a>` : ''}
          </div>
        </div>
      `;
    }

    html += `</div></body></html>`;
    return html;
  }

  /**
   * Format large numbers (e.g., 10000 -> 10K)
   */
  formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  /**
   * Get available templates
   */
  getTemplates() {
    return Object.entries(this.templates).map(([key, value]) => ({
      id: key,
      ...value
    }));
  }
}

module.exports = new MediaKitService();
