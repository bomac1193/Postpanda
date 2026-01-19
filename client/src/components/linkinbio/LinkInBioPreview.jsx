import PropTypes from 'prop-types';
import './linkinbio.css';

function LinkInBioPreview({ page }) {
  const { title, bio, avatar, theme, links, socialLinks } = page;
  const activeLinks = links?.filter(l => l.isActive) || [];

  const getButtonStyle = () => {
    const baseStyle = {
      backgroundColor: theme.buttonStyle === 'outlined' ? 'transparent' : theme.buttonColor,
      color: theme.buttonStyle === 'outlined' ? theme.buttonColor : theme.buttonTextColor,
      border: theme.buttonStyle === 'outlined' ? `2px solid ${theme.buttonColor}` : 'none',
    };

    if (theme.buttonStyle === 'soft') {
      baseStyle.backgroundColor = `${theme.buttonColor}20`;
      baseStyle.color = theme.buttonColor;
    }

    if (theme.buttonStyle === 'rounded') {
      baseStyle.borderRadius = '999px';
    }

    return baseStyle;
  };

  const socialIcons = {
    instagram: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    tiktok: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    twitter: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    youtube: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    pinterest: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 0a12 12 0 0 0-4.373 23.178c-.07-.937-.134-2.377.028-3.401.146-.926.943-3.994.943-3.994s-.241-.481-.241-1.193c0-1.118.648-1.953 1.455-1.953.686 0 1.018.515 1.018 1.133 0 .69-.44 1.722-.667 2.678-.19.802.402 1.456 1.193 1.456 1.431 0 2.53-1.509 2.53-3.687 0-1.928-1.386-3.276-3.366-3.276-2.293 0-3.64 1.72-3.64 3.497 0 .693.267 1.436.6 1.84.066.08.076.15.056.231-.061.255-.197.802-.224.914-.035.148-.116.18-.268.108-1-.466-1.626-1.929-1.626-3.104 0-2.527 1.836-4.849 5.292-4.849 2.779 0 4.937 1.98 4.937 4.628 0 2.76-1.74 4.98-4.155 4.98-.811 0-1.574-.421-1.835-.92l-.499 1.903c-.181.696-.67 1.568-.997 2.099A12 12 0 1 0 12 0z"/>
      </svg>
    ),
  };

  return (
    <div
      className="linkinbio-preview-frame"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily,
      }}
    >
      <div className="linkinbio-preview-content">
        <div className="linkinbio-preview-header">
          {avatar ? (
            <img src={avatar} alt={title} className="linkinbio-preview-avatar" />
          ) : (
            <div className="linkinbio-preview-avatar-placeholder" />
          )}
          <h2 className="linkinbio-preview-title" style={{ color: theme.textColor }}>
            {title || 'My Links'}
          </h2>
          {bio && (
            <p className="linkinbio-preview-bio" style={{ color: theme.textColor }}>
              {bio}
            </p>
          )}
        </div>

        <div className="linkinbio-preview-links">
          {activeLinks.map((link) => (
            <a
              key={link._id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`linkinbio-preview-link ${theme.buttonStyle}`}
              style={getButtonStyle()}
            >
              {link.title}
            </a>
          ))}

          {activeLinks.length === 0 && (
            <p className="linkinbio-preview-empty">No links added yet</p>
          )}
        </div>

        {socialLinks && Object.values(socialLinks).some(v => v) && (
          <div className="linkinbio-preview-socials">
            {Object.entries(socialLinks).map(([platform, value]) => {
              if (!value) return null;
              return (
                <a
                  key={platform}
                  href={value.startsWith('http') ? value : `https://${platform}.com/${value}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="linkinbio-preview-social"
                  style={{ color: theme.textColor }}
                >
                  {socialIcons[platform] || platform}
                </a>
              );
            })}
          </div>
        )}

        <div className="linkinbio-preview-footer">
          <span style={{ color: theme.textColor, opacity: 0.5 }}>
            Powered by PostPilot
          </span>
        </div>
      </div>
    </div>
  );
}

LinkInBioPreview.propTypes = {
  page: PropTypes.shape({
    title: PropTypes.string,
    bio: PropTypes.string,
    avatar: PropTypes.string,
    theme: PropTypes.shape({
      backgroundColor: PropTypes.string,
      textColor: PropTypes.string,
      buttonStyle: PropTypes.string,
      buttonColor: PropTypes.string,
      buttonTextColor: PropTypes.string,
      fontFamily: PropTypes.string,
    }),
    links: PropTypes.array,
    socialLinks: PropTypes.object,
  }).isRequired,
};

export default LinkInBioPreview;
