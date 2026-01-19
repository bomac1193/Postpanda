import { useMemo } from 'react';
import PropTypes from 'prop-types';
import './mediakit.css';

function MediaKitPreview({ mediaKit }) {
  const { sections, customization, template } = mediaKit;

  const templateColors = useMemo(() => {
    const templates = {
      minimal: { primary: '#000000', accent: '#333333' },
      professional: { primary: '#1a365d', accent: '#2b6cb0' },
      creative: { primary: '#553c9a', accent: '#9f7aea' },
      bold: { primary: '#c53030', accent: '#f56565' }
    };
    return templates[template] || templates.professional;
  }, [template]);

  const primaryColor = customization?.primaryColor || templateColors.primary;
  const accentColor = customization?.accentColor || templateColors.accent;
  const bgColor = customization?.backgroundColor || '#ffffff';
  const fontFamily = customization?.fontFamily || 'Inter';

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div
      className="mediakit-preview"
      style={{
        '--mk-primary': primaryColor,
        '--mk-accent': accentColor,
        '--mk-bg': bgColor,
        '--mk-font': fontFamily
      }}
    >
      <div className="mk-preview-container">
        {/* About Section */}
        {sections?.about?.enabled !== false && (
          <div className="mk-section mk-about">
            {sections.about?.profileImage && (
              <img
                src={sections.about.profileImage}
                alt="Profile"
                className="mk-profile-image"
              />
            )}
            <h1 className="mk-headline">
              {sections.about?.headline || mediaKit.name || 'Creator Name'}
            </h1>
            {sections.about?.location && (
              <p className="mk-location">{sections.about.location}</p>
            )}
            {sections.about?.bio && (
              <p className="mk-bio">{sections.about.bio}</p>
            )}
            {sections.about?.categories?.length > 0 && (
              <div className="mk-categories">
                {sections.about.categories.map((cat, i) => (
                  <span key={i} className="mk-category">{cat}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats Section */}
        {sections?.stats?.enabled !== false && sections?.stats?.platforms?.length > 0 && (
          <div className="mk-section mk-stats">
            <h2 className="mk-section-title">Audience & Reach</h2>
            <div className="mk-stats-grid">
              {sections.stats.platforms.map((platform, i) => (
                <div key={i} className="mk-stat-card">
                  <span className="mk-platform-name">{platform.name}</span>
                  <span className="mk-followers">{formatNumber(platform.followers)}</span>
                  <span className="mk-followers-label">Followers</span>
                  <span className="mk-engagement">{platform.engagementRate}% Engagement</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services Section */}
        {sections?.services?.enabled !== false && sections?.services?.items?.length > 0 && (
          <div className="mk-section mk-services">
            <h2 className="mk-section-title">Services & Rates</h2>
            <div className="mk-services-list">
              {sections.services.items.map((service, i) => (
                <div key={i} className="mk-service-item">
                  <div className="mk-service-header">
                    <span className="mk-service-name">{service.name}</span>
                    {customization?.showRates && service.price && (
                      <span className="mk-service-price">{service.price}</span>
                    )}
                  </div>
                  {service.description && (
                    <p className="mk-service-desc">{service.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio Section */}
        {sections?.portfolio?.enabled !== false && sections?.portfolio?.items?.length > 0 && (
          <div className="mk-section mk-portfolio">
            <h2 className="mk-section-title">Previous Work</h2>
            <div className="mk-portfolio-grid">
              {sections.portfolio.items.map((item, i) => (
                <div key={i} className="mk-portfolio-item">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="mk-portfolio-image"
                    />
                  )}
                  <div className="mk-portfolio-info">
                    <span className="mk-portfolio-title">{item.title}</span>
                    {item.brandName && (
                      <span className="mk-portfolio-brand">{item.brandName}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Section */}
        {sections?.contact?.enabled !== false && (
          <div className="mk-section mk-contact">
            <h2 className="mk-section-title">Let's Work Together</h2>
            <div className="mk-contact-info">
              {sections.contact?.email && (
                <p className="mk-contact-item">{sections.contact.email}</p>
              )}
              {sections.contact?.website && (
                <p className="mk-contact-item">{sections.contact.website}</p>
              )}
            </div>
            <div className="mk-social-links">
              {sections.contact?.socialLinks?.instagram && (
                <span className="mk-social-link">Instagram</span>
              )}
              {sections.contact?.socialLinks?.tiktok && (
                <span className="mk-social-link">TikTok</span>
              )}
              {sections.contact?.socialLinks?.youtube && (
                <span className="mk-social-link">YouTube</span>
              )}
              {sections.contact?.socialLinks?.twitter && (
                <span className="mk-social-link">Twitter</span>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!sections?.about?.enabled &&
          !sections?.stats?.enabled &&
          !sections?.services?.enabled &&
          !sections?.portfolio?.enabled &&
          !sections?.contact?.enabled) && (
          <div className="mk-empty">
            <p>Enable sections to see your media kit preview</p>
          </div>
        )}
      </div>
    </div>
  );
}

MediaKitPreview.propTypes = {
  mediaKit: PropTypes.shape({
    name: PropTypes.string,
    template: PropTypes.string,
    sections: PropTypes.object,
    customization: PropTypes.object
  }).isRequired
};

export default MediaKitPreview;
