import { useState } from 'react';
import PropTypes from 'prop-types';
import './workspace.css';

const ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access except ownership' },
  { value: 'editor', label: 'Editor', description: 'Can create and edit content' },
  { value: 'viewer', label: 'Viewer', description: 'View-only access' }
];

function MemberManager({
  members,
  pendingInvites,
  currentUserRole,
  onInvite,
  onRemove,
  onUpdateRole,
  onCancelInvite
}) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [editingMember, setEditingMember] = useState(null);

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    await onInvite(inviteEmail, inviteRole);
    setInviteEmail('');
    setInviteRole('viewer');
    setShowInviteForm(false);
  };

  const handleUpdateRole = async (memberId, newRole) => {
    await onUpdateRole(memberId, newRole);
    setEditingMember(null);
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      owner: '#b29674',
      admin: '#2b6cb0',
      editor: '#48bb78',
      viewer: '#a0aec0'
    };
    return colors[role] || colors.viewer;
  };

  return (
    <div className="member-manager">
      <div className="member-header">
        <h3>Team Members</h3>
        {canManageMembers && (
          <button
            type="button"
            className="invite-btn"
            onClick={() => setShowInviteForm(true)}
          >
            + Invite
          </button>
        )}
      </div>

      {showInviteForm && (
        <form onSubmit={handleInvite} className="invite-form">
          <input
            type="email"
            placeholder="Email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          >
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <div className="form-actions">
            <button type="submit" className="primary">Send Invite</button>
            <button
              type="button"
              className="ghost"
              onClick={() => setShowInviteForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="members-list">
        {members.map((member) => (
          <div key={member.userId?._id || member.userId} className="member-item">
            <div className="member-avatar">
              {member.userId?.avatar ? (
                <img src={member.userId.avatar} alt="" />
              ) : (
                <span className="avatar-initial">
                  {(member.name || member.email)?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="member-info">
              <span className="member-name">
                {member.userId?.name || member.name || 'Unknown'}
              </span>
              <span className="member-email">
                {member.userId?.email || member.email}
              </span>
            </div>
            <div className="member-role">
              {editingMember === member.userId?._id && member.role !== 'owner' ? (
                <select
                  value={member.role}
                  onChange={(e) => handleUpdateRole(member.userId._id, e.target.value)}
                  onBlur={() => setEditingMember(null)}
                  autoFocus
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span
                  className="role-badge"
                  style={{ backgroundColor: getRoleBadgeColor(member.role) }}
                  onClick={() => canManageMembers && member.role !== 'owner' && setEditingMember(member.userId?._id)}
                >
                  {member.role}
                </span>
              )}
            </div>
            {canManageMembers && member.role !== 'owner' && (
              <button
                type="button"
                className="remove-member-btn"
                onClick={() => onRemove(member.userId?._id || member.userId)}
                title="Remove member"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {pendingInvites?.length > 0 && (
        <div className="pending-invites">
          <h4>Pending Invites</h4>
          {pendingInvites.map((invite) => (
            <div key={invite.email} className="invite-item">
              <span className="invite-email">{invite.email}</span>
              <span
                className="role-badge"
                style={{ backgroundColor: getRoleBadgeColor(invite.role) }}
              >
                {invite.role}
              </span>
              <span className="invite-expires">
                Expires: {new Date(invite.expiresAt).toLocaleDateString()}
              </span>
              {canManageMembers && (
                <button
                  type="button"
                  className="cancel-invite-btn"
                  onClick={() => onCancelInvite(invite.email)}
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="roles-legend">
        <h4>Role Permissions</h4>
        {ROLES.map((role) => (
          <div key={role.value} className="role-info">
            <span
              className="role-badge"
              style={{ backgroundColor: getRoleBadgeColor(role.value) }}
            >
              {role.label}
            </span>
            <span className="role-description">{role.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

MemberManager.propTypes = {
  members: PropTypes.arrayOf(PropTypes.shape({
    userId: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string,
        email: PropTypes.string,
        avatar: PropTypes.string
      })
    ]),
    name: PropTypes.string,
    email: PropTypes.string,
    role: PropTypes.string
  })).isRequired,
  pendingInvites: PropTypes.arrayOf(PropTypes.shape({
    email: PropTypes.string,
    role: PropTypes.string,
    expiresAt: PropTypes.string
  })),
  currentUserRole: PropTypes.string.isRequired,
  onInvite: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onUpdateRole: PropTypes.func.isRequired,
  onCancelInvite: PropTypes.func.isRequired
};

MemberManager.defaultProps = {
  pendingInvites: []
};

export default MemberManager;
