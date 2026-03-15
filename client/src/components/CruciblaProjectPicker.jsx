import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { cruciblaApi } from '../lib/api';
import { Loader2, Check, Unlink, ChevronRight } from 'lucide-react';

const VIEWPORT_MARGIN = 12;
const PANEL_GAP = 8;

function getPanelPosition(anchorElement, panelElement, preferredPlacement) {
  const anchorRect = anchorElement.getBoundingClientRect();
  const panelWidth = panelElement.offsetWidth || 240;
  const panelHeight = panelElement.offsetHeight || 320;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const clampLeft = (value) => {
    const minLeft = VIEWPORT_MARGIN;
    const maxLeft = Math.max(VIEWPORT_MARGIN, viewportWidth - panelWidth - VIEWPORT_MARGIN);
    return Math.min(Math.max(minLeft, value), maxLeft);
  };

  if (preferredPlacement === 'bottom-end') {
    const spaceBelow = viewportHeight - anchorRect.bottom - PANEL_GAP - VIEWPORT_MARGIN;
    const spaceAbove = anchorRect.top - PANEL_GAP - VIEWPORT_MARGIN;
    const openAbove = spaceBelow < Math.min(panelHeight, 220) && spaceAbove > spaceBelow;

    return {
      left: clampLeft(anchorRect.right - panelWidth),
      top: openAbove
        ? Math.max(VIEWPORT_MARGIN, anchorRect.top - PANEL_GAP - Math.min(panelHeight, spaceAbove))
        : anchorRect.bottom + PANEL_GAP,
      maxHeight: Math.max(140, openAbove ? spaceAbove : spaceBelow),
    };
  }

  let left = anchorRect.right + PANEL_GAP;
  if (left + panelWidth > viewportWidth - VIEWPORT_MARGIN) {
    left = anchorRect.left - panelWidth - PANEL_GAP;
  }

  let top = anchorRect.top;
  if (top + panelHeight > viewportHeight - VIEWPORT_MARGIN) {
    top = Math.max(VIEWPORT_MARGIN, viewportHeight - panelHeight - VIEWPORT_MARGIN);
  }

  return {
    left: clampLeft(left),
    top,
    maxHeight: Math.max(140, viewportHeight - top - VIEWPORT_MARGIN),
  };
}

export default function CruciblaProjectPicker({
  isOpen,
  targetId,
  currentProjectId,
  currentAlbumName = null,
  anchorElement = null,
  preferredPlacement = 'right-start',
  onAssign,
  onUnassign,
  onClose,
}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [panelStyle, setPanelStyle] = useState({
    left: 0,
    top: 0,
    maxHeight: 288,
  });
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen || loaded) return;
    let cancelled = false;

    setLoading(true);
    cruciblaApi.getProjects()
      .then((data) => {
        if (!cancelled) {
          setProjects(data);
          setLoaded(true);
        }
      })
      .catch((err) => console.error('Failed to fetch Crucibla projects:', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, loaded]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedProject(null);
    }
  }, [isOpen, targetId]);

  useEffect(() => {
    if (!isOpen) return;

    const handler = (e) => {
      if (ref.current?.contains(e.target)) return;
      if (anchorElement?.contains?.(e.target)) return;
      onClose();
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [anchorElement, isOpen, onClose]);

  useLayoutEffect(() => {
    if (!isOpen || !anchorElement || !ref.current) return;

    const updatePosition = () => {
      if (!anchorElement.isConnected || !ref.current) return;
      setPanelStyle(getPanelPosition(anchorElement, ref.current, preferredPlacement));
    };

    const rafId = window.requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorElement, isOpen, loading, preferredPlacement, projects.length, selectedProject]);

  if (!isOpen || !anchorElement || typeof document === 'undefined') return null;

  return createPortal(
    <div
      data-crucibla-picker-root="true"
      ref={ref}
      className="fixed w-60 bg-dark-900 border border-dark-600 rounded-lg shadow-2xl z-[120] p-2 overflow-y-auto"
      style={panelStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {!selectedProject ? (
        <p className="text-xs text-dark-400 mb-2 px-1">Link to Crucibla Project</p>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedProject(null);
          }}
          className="flex items-center gap-1 text-xs text-dark-400 hover:text-dark-200 mb-2 px-1"
        >
          <ChevronRight className="w-3 h-3 rotate-180" />
          {selectedProject.name}
        </button>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 text-dark-400 animate-spin" />
          <span className="ml-2 text-xs text-dark-400">Loading projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <p className="text-xs text-dark-500 px-1 py-2">No projects found. Is Crucibla running?</p>
      ) : selectedProject ? (
        <>
          <button
            type="button"
            onClick={(e) => onAssign(e, targetId, selectedProject, null)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded hover:bg-dark-700 text-xs text-dark-400 italic"
          >
            Project only (no album)
          </button>
          <div className="border-t border-dark-700 my-1" />
          {selectedProject.albums.map((album) => (
            <button
              key={album.name}
              type="button"
              onClick={(e) => onAssign(e, targetId, selectedProject, album)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-left rounded hover:bg-dark-700 ${
                currentProjectId === selectedProject.id && currentAlbumName === album.name ? 'bg-dark-700' : ''
              }`}
            >
              {album.group_color && (
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: album.group_color }}
                />
              )}
              <span className="text-xs text-dark-200 truncate">{album.name}</span>
              {currentProjectId === selectedProject.id && currentAlbumName === album.name && (
                <Check className="w-3 h-3 text-dark-100 flex-shrink-0 ml-auto" />
              )}
            </button>
          ))}
        </>
      ) : (
        projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (project.albums?.length) {
                setSelectedProject(project);
                return;
              }
              onAssign(e, targetId, project, null);
            }}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-left rounded hover:bg-dark-700 ${
              currentProjectId === project.id ? 'bg-dark-700' : ''
            }`}
          >
            {project.group_color && (
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.group_color }}
              />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-xs text-dark-200 truncate block">{project.name}</span>
              <span className="text-xs text-dark-500">
                {project.type}{project.era ? ` · ${project.era}` : ''}
                {project.albums?.length ? ` · ${project.albums.length} album${project.albums.length > 1 ? 's' : ''}` : ''}
              </span>
            </div>
            {project.albums?.length ? (
              <ChevronRight className="w-3 h-3 text-dark-500 flex-shrink-0" />
            ) : currentProjectId === project.id ? (
              <Check className="w-3 h-3 text-dark-100 flex-shrink-0" />
            ) : null}
          </button>
        ))
      )}

      {currentProjectId && (
        <button
          type="button"
          onClick={(e) => onUnassign(e, targetId)}
          className="w-full mt-2 px-2 py-1.5 text-xs text-dark-300 hover:bg-dark-600/30 rounded flex items-center gap-2 border-t border-dark-700 pt-2"
        >
          <Unlink className="w-3 h-3" />
          Unlink Project
        </button>
      )}
    </div>,
    document.body
  );
}
