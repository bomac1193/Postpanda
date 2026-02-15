import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './workspace.css';

function WorkspaceSelector({ workspaces, currentWorkspace, onSelect, onCreate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    await onCreate(newWorkspaceName);
    setNewWorkspaceName('');
    setShowCreateForm(false);
    setIsOpen(false);
  };

  const getRoleBadge = (role) => {
    const badges = {
      owner: { label: 'Owner', color: '#b29674' },
      admin: { label: 'Admin', color: '#2b6cb0' },
      editor: { label: 'Editor', color: '#48bb78' },
      viewer: { label: 'Viewer', color: '#a0aec0' }
    };
    return badges[role] || badges.viewer;
  };

  return (
    <div className="workspace-selector" ref={dropdownRef}>
      <button
        type="button"
        className="workspace-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="workspace-icon">
          {currentWorkspace?.branding?.logo ? (
            <img src={currentWorkspace.branding.logo} alt="" />
          ) : (
            <span className="workspace-initial">
              {currentWorkspace?.name?.[0] || 'P'}
            </span>
          )}
        </span>
        <span className="workspace-name">
          {currentWorkspace?.name || 'Personal'}
        </span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="workspace-dropdown">
          <div className="workspace-dropdown-header">
            <span>Workspaces</span>
          </div>

          <div className="workspace-list">
            {/* Personal workspace */}
            <button
              type="button"
              className={`workspace-item ${!currentWorkspace ? 'active' : ''}`}
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
            >
              <span className="workspace-item-icon">P</span>
              <span className="workspace-item-name">Personal</span>
            </button>

            {workspaces.map((ws) => {
              const badge = getRoleBadge(ws.userRole);
              return (
                <button
                  key={ws._id}
                  type="button"
                  className={`workspace-item ${currentWorkspace?._id === ws._id ? 'active' : ''}`}
                  onClick={() => {
                    onSelect(ws);
                    setIsOpen(false);
                  }}
                >
                  <span className="workspace-item-icon">
                    {ws.branding?.logo ? (
                      <img src={ws.branding.logo} alt="" />
                    ) : (
                      ws.name[0]
                    )}
                  </span>
                  <span className="workspace-item-name">{ws.name}</span>
                  <span
                    className="workspace-role-badge"
                    style={{ backgroundColor: badge.color }}
                  >
                    {badge.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="workspace-dropdown-footer">
            {showCreateForm ? (
              <form onSubmit={handleCreate} className="create-workspace-form">
                <input
                  type="text"
                  placeholder="Workspace name"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  autoFocus
                />
                <div className="form-actions">
                  <button type="submit" className="primary">Create</button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="create-workspace-btn"
                onClick={() => setShowCreateForm(true)}
              >
                + Create Workspace
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

WorkspaceSelector.propTypes = {
  workspaces: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    userRole: PropTypes.string,
    branding: PropTypes.shape({
      logo: PropTypes.string
    })
  })).isRequired,
  currentWorkspace: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    branding: PropTypes.shape({
      logo: PropTypes.string
    })
  }),
  onSelect: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired
};

WorkspaceSelector.defaultProps = {
  currentWorkspace: null
};

export default WorkspaceSelector;
