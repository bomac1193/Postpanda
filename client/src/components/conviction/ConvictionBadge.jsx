import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * ConvictionBadge - Compact conviction score badge
 *
 * @param {number} score - Conviction score (0-100)
 * @param {string} tier - Conviction tier (exceptional, high, medium, low)
 * @param {string} size - Badge size (xs, sm, md)
 * @param {boolean} showGlyph - Show archetype glyph
 * @param {object} archetypeMatch - Archetype match data {designation, glyph, confidence}
 */
const ConvictionBadge = ({
  score,
  tier,
  size = 'sm',
  showGlyph = false,
  archetypeMatch
}) => {
  // Tier-based styling
  const getTierStyles = () => {
    if (!score && score !== 0) {
      return {
        bg: 'bg-gray-700/50',
        text: 'text-gray-400',
        ring: 'ring-gray-600'
      };
    }

    if (score >= 80) {
      return {
        bg: 'bg-green-500/20',
        text: 'text-green-400',
        ring: 'ring-green-500'
      };
    } else if (score >= 60) {
      return {
        bg: 'bg-green-600/20',
        text: 'text-green-500',
        ring: 'ring-green-600'
      };
    } else if (score >= 40) {
      return {
        bg: 'bg-orange-500/20',
        text: 'text-orange-400',
        ring: 'ring-orange-500'
      };
    } else {
      return {
        bg: 'bg-red-600/20',
        text: 'text-red-400',
        ring: 'ring-red-600'
      };
    }
  };

  const styles = getTierStyles();

  // Size-based dimensions
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base'
  };

  return (
    <div className="flex items-center gap-1">
      <div
        className={`
          ${sizeClasses[size]}
          ${styles.bg}
          ${styles.text}
          rounded-full
          flex items-center justify-center
          ring-1 ${styles.ring}
          font-semibold
          backdrop-blur-sm
        `}
      >
        {score !== null && score !== undefined ? Math.round(score) : '?'}
      </div>

      {showGlyph && archetypeMatch?.glyph && (
        <span className={`${styles.text} ${size === 'xs' ? 'text-sm' : 'text-base'}`}>
          {archetypeMatch.glyph}
        </span>
      )}
    </div>
  );
};

export default ConvictionBadge;
