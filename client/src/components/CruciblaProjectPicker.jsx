import { useState, useCallback, useRef, useEffect } from 'react';
import { cruciblaApi } from '../lib/api';
import { Loader2, Check, Unlink, Package } from 'lucide-react';

/**
 * Shared Crucibla project picker dropdown.
 *
 * Props:
 *  - isOpen       : boolean – whether the dropdown is visible
 *  - targetId     : string  – the id of the item being linked (grid / collection)
 *  - currentProjectId : string|null – currently linked project id
 *  - onAssign     : (e, targetId, project, album?) => void
 *  - onUnassign   : (e, targetId) => void
 *  - onClose      : () => void
 */
export default function CruciblaProjectPicker({
  isOpen,
  targetId,
  currentProjectId,
  onAssign,
  onUnassign,
  onClose,
}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  // Fetch projects when opened
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
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, loaded]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute left-full top-0 ml-1 w-60 bg-dark-900 border border-dark-600 rounded-lg shadow-xl z-50 p-2 max-h-72 overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-xs text-dark-400 mb-2 px-1">Link to Crucibla Project</p>
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 text-dark-400 animate-spin" />
          <span className="ml-2 text-xs text-dark-400">Loading projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <p className="text-xs text-dark-500 px-1 py-2">No projects found. Is Crucibla running?</p>
      ) : (
        projects.map((project) => (
          <button
            key={project.id}
            onClick={(e) => onAssign(e, targetId, project)}
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
              </span>
            </div>
            {currentProjectId === project.id && (
              <Check className="w-3 h-3 text-dark-100 flex-shrink-0" />
            )}
          </button>
        ))
      )}
      {currentProjectId && (
        <button
          onClick={(e) => onUnassign(e, targetId)}
          className="w-full mt-2 px-2 py-1.5 text-xs text-dark-300 hover:bg-dark-600/30 rounded flex items-center gap-2 border-t border-dark-700 pt-2"
        >
          <Unlink className="w-3 h-3" />
          Unlink Project
        </button>
      )}
    </div>
  );
}
