import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';

const CompareSlider = React.memo(function CompareSlider({
  originalSrc,
  upscaledSrc,
  mediaStyle,
}) {
  const [position, setPosition] = useState(50);
  const dragging = useRef(false);
  const containerRef = useRef(null);

  const updatePosition = useCallback((clientX) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      updatePosition(e.clientX);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [updatePosition]);

  const handleMouseDown = (e) => {
    dragging.current = true;
    updatePosition(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none"
      onMouseDown={handleMouseDown}
    >
      {/* Base layer: original */}
      <img
        src={originalSrc}
        alt="Original"
        className="w-full h-full"
        style={mediaStyle}
        draggable={false}
      />
      {/* Top layer: upscaled, clipped */}
      <img
        src={upscaledSrc}
        alt="Upscaled"
        className="absolute inset-0 w-full h-full"
        style={{ ...mediaStyle, clipPath: `inset(0 ${100 - position}% 0 0)` }}
        draggable={false}
      />
      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
        style={{ left: `${position}%` }}
      />
      {/* Drag handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <SlidersHorizontal className="w-4 h-4 text-dark-900" />
      </div>
      {/* Labels */}
      <span className="absolute top-3 left-3 px-2 py-0.5 text-xs font-medium bg-black/60 text-white rounded backdrop-blur-sm pointer-events-none">
        Original
      </span>
      <span className="absolute top-3 right-3 px-2 py-0.5 text-xs font-medium bg-black/60 text-white rounded backdrop-blur-sm pointer-events-none">
        Upscaled
      </span>
    </div>
  );
});

export default CompareSlider;
