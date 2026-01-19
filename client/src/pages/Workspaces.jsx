import { useState, useEffect, useCallback } from 'react';
import {
  WorkspaceSelector,
  MemberManager,
  ApprovalQueue,
  RolePermissions
} from '../components/workspace';
import '../components/workspace/workspace.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002';

function Workspaces() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [members, setMembers] = useState({ owner: null, members: [], pendingInvites: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue');
  const [selectedMember, setSelectedMember] = useState(null);
  const [error, setError] = useState(null);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/workspace`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch workspaces');
      const data = await response.json();
      setWorkspaces(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async (workspaceId) => {
    try {
      const response = await fetch(`${API_BASE}/api/workspace/${workspaceId}/members`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();
      setMembers(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchMembers(selectedWorkspace._id);
    }
  }, [selectedWorkspace, fetchMembers]);

  const handleCreateWorkspace = async (name) => {
    try {
      const response = await fetch(`${API_BASE}/api/workspace`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name })
      });
      if (!response.ok) throw new Error('Failed to create workspace');
      const newWorkspace = await response.json();
      setWorkspaces(prev => [...prev, { ...newWorkspace, userRole: 'owner' }]);
      setSelectedWorkspace({ ...newWorkspace, userRole: 'owner' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectWorkspace = async (workspace) => {
    if (!workspace) {
      setSelectedWorkspace(null);
      setMembers({ owner: null, members: [], pendingInvites: [] });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/workspace/${workspace._id}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch workspace');
      const data = await response.json();
      setSelectedWorkspace({ ...data, userRole: workspace.userRole });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInviteMember = async (email, role) => {
    try {
      const response = await fetch(`${API_BASE}/api/workspace/${selectedWorkspace._id}/invite`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email, role })
      });
      if (!response.ok) throw new Error('Failed to send invite');
      await fetchMembers(selectedWorkspace._id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member from the workspace?')) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/workspace/${selectedWorkspace._id}/members/${memberId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );
      if (!response.ok) throw new Error('Failed to remove member');
      await fetchMembers(selectedWorkspace._id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateMemberRole = async (memberId, role) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/workspace/${selectedWorkspace._id}/members/${memberId}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ role })
        }
      );
      if (!response.ok) throw new Error('Failed to update member');
      await fetchMembers(selectedWorkspace._id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdatePermissions = async (memberId, permissions) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/workspace/${selectedWorkspace._id}/members/${memberId}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ permissions })
        }
      );
      if (!response.ok) throw new Error('Failed to update permissions');
      await fetchMembers(selectedWorkspace._id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelInvite = async (email) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/workspace/${selectedWorkspace._id}/invite/${encodeURIComponent(email)}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders()
        }
      );
      if (!response.ok) throw new Error('Failed to cancel invite');
      await fetchMembers(selectedWorkspace._id);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchApprovalQueue = async (workspaceId, status) => {
    try {
      const url = status
        ? `${API_BASE}/api/approval/workspace/${workspaceId}?status=${status}`
        : `${API_BASE}/api/approval/workspace/${workspaceId}`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch queue');
      return await response.json();
    } catch (err) {
      setError(err.message);
      return { items: [] };
    }
  };

  const handleApprove = async (itemId, feedback) => {
    try {
      const response = await fetch(`${API_BASE}/api/approval/${itemId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ feedback })
      });
      if (!response.ok) throw new Error('Failed to approve');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (itemId, feedback) => {
    try {
      const response = await fetch(`${API_BASE}/api/approval/${itemId}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ feedback })
      });
      if (!response.ok) throw new Error('Failed to reject');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRequestRevision = async (itemId, feedback) => {
    try {
      const response = await fetch(`${API_BASE}/api/approval/${itemId}/revision`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ feedback })
      });
      if (!response.ok) throw new Error('Failed to request revision');
    } catch (err) {
      setError(err.message);
    }
  };

  const userRole = selectedWorkspace?.userRole || 'viewer';
  const canApprove = userRole === 'owner' || userRole === 'admin';
  const isOwner = userRole === 'owner';

  if (loading) {
    return (
      <div className="workspaces-page">
        <p>Loading workspaces...</p>
      </div>
    );
  }

  return (
    <div className="workspaces-page">
      {error && (
        <div className="error-banner" onClick={() => setError(null)}>
          {error}
        </div>
      )}

      <div className="workspaces-page-header">
        <h1>Team Workspaces</h1>
        <WorkspaceSelector
          workspaces={workspaces}
          currentWorkspace={selectedWorkspace}
          onSelect={handleSelectWorkspace}
          onCreate={handleCreateWorkspace}
        />
      </div>

      {!selectedWorkspace ? (
        <div className="workspaces-grid">
          {workspaces.length === 0 ? (
            <div className="empty-state">
              <h3>No Workspaces Yet</h3>
              <p>Create a workspace to collaborate with your team.</p>
              <button
                type="button"
                onClick={() => handleCreateWorkspace('My Team')}
              >
                Create Your First Workspace
              </button>
            </div>
          ) : (
            workspaces.map((ws) => (
              <div
                key={ws._id}
                className="workspace-card"
                onClick={() => handleSelectWorkspace(ws)}
              >
                <div className="workspace-card-header">
                  <div className="workspace-card-icon">
                    {ws.branding?.logo ? (
                      <img src={ws.branding.logo} alt="" />
                    ) : (
                      ws.name[0]
                    )}
                  </div>
                  <div className="workspace-card-title">
                    <h3 className="workspace-card-name">{ws.name}</h3>
                    <span className="workspace-card-members">
                      {ws.members?.length || 1} member{ws.members?.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="workspace-card-stats">
                  <div className="workspace-stat">
                    <span className="workspace-stat-value">
                      {ws.analytics?.pendingApproval || 0}
                    </span>
                    <span className="workspace-stat-label">Pending</span>
                  </div>
                  <div className="workspace-stat">
                    <span className="workspace-stat-value">
                      {ws.analytics?.publishedThisMonth || 0}
                    </span>
                    <span className="workspace-stat-label">Published</span>
                  </div>
                  <div className="workspace-stat">
                    <span className="workspace-stat-value">
                      {ws.analytics?.totalContent || 0}
                    </span>
                    <span className="workspace-stat-label">Total</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="workspace-detail">
          <div className="workspace-sidebar">
            <MemberManager
              members={members.members}
              pendingInvites={members.pendingInvites}
              currentUserRole={userRole}
              onInvite={handleInviteMember}
              onRemove={handleRemoveMember}
              onUpdateRole={handleUpdateMemberRole}
              onCancelInvite={handleCancelInvite}
            />

            {selectedMember && selectedMember.role !== 'owner' && (
              <RolePermissions
                member={selectedMember}
                onUpdatePermissions={handleUpdatePermissions}
                isOwner={isOwner}
              />
            )}
          </div>

          <div className="workspace-main">
            <div className="workspace-tabs">
              <button
                type="button"
                className={`workspace-tab ${activeTab === 'queue' ? 'active' : ''}`}
                onClick={() => setActiveTab('queue')}
              >
                Approval Queue
              </button>
              <button
                type="button"
                className={`workspace-tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
            </div>

            {activeTab === 'queue' && (
              <ApprovalQueue
                workspaceId={selectedWorkspace._id}
                canApprove={canApprove}
                onApprove={handleApprove}
                onReject={handleReject}
                onRequestRevision={handleRequestRevision}
                fetchQueue={fetchApprovalQueue}
              />
            )}

            {activeTab === 'settings' && isOwner && (
              <div className="workspace-settings">
                <h3>Workspace Settings</h3>
                <div className="settings-form">
                  <div className="form-group">
                    <label>Require Approval</label>
                    <select
                      value={selectedWorkspace.settings?.requireApproval ? 'yes' : 'no'}
                      onChange={() => {}}
                    >
                      <option value="yes">Yes - All content needs approval</option>
                      <option value="no">No - Direct publishing allowed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Approval Levels</label>
                    <select
                      value={selectedWorkspace.settings?.approvalLevels || 1}
                      onChange={() => {}}
                    >
                      <option value="1">1 approval required</option>
                      <option value="2">2 approvals required</option>
                      <option value="3">3 approvals required</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Default Role for New Members</label>
                    <select
                      value={selectedWorkspace.settings?.defaultMemberRole || 'viewer'}
                      onChange={() => {}}
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Workspaces;
