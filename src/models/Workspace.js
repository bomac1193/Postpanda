const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  name: {
    type: String
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'editor', 'viewer'],
    default: 'viewer'
  },
  permissions: {
    canCreateContent: { type: Boolean, default: false },
    canEditContent: { type: Boolean, default: false },
    canDeleteContent: { type: Boolean, default: false },
    canPublish: { type: Boolean, default: false },
    canApprove: { type: Boolean, default: false },
    canInviteMembers: { type: Boolean, default: false },
    canManageSettings: { type: Boolean, default: false }
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const inviteSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer'],
    default: 'viewer'
  },
  token: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    default: ''
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [memberSchema],
  pendingInvites: [inviteSchema],
  settings: {
    requireApproval: { type: Boolean, default: true },
    approvalLevels: { type: Number, default: 1 },
    allowMemberInvites: { type: Boolean, default: false },
    defaultMemberRole: { type: String, enum: ['editor', 'viewer'], default: 'viewer' },
    brandKit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notifyOnSubmission: { type: Boolean, default: true },
    notifyOnApproval: { type: Boolean, default: true }
  },
  branding: {
    logo: { type: String },
    color: { type: String, default: '#b29674' }
  },
  analytics: {
    totalContent: { type: Number, default: 0 },
    pendingApproval: { type: Number, default: 0 },
    publishedThisMonth: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
workspaceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Generate slug from name
workspaceSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    const baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    this.slug = `${baseSlug}-${Date.now().toString(36)}`;
  }
  next();
});

// Method to check if user is a member
workspaceSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.userId.toString() === userId.toString()) ||
         this.ownerId.toString() === userId.toString();
};

// Method to get member by userId
workspaceSchema.methods.getMember = function(userId) {
  if (this.ownerId.toString() === userId.toString()) {
    return { userId: this.ownerId, role: 'owner', permissions: getDefaultPermissions('owner') };
  }
  return this.members.find(m => m.userId.toString() === userId.toString());
};

// Method to check permission
workspaceSchema.methods.hasPermission = function(userId, permission) {
  const member = this.getMember(userId);
  if (!member) return false;
  if (member.role === 'owner' || member.role === 'admin') return true;
  return member.permissions?.[permission] === true;
};

// Get default permissions for a role
function getDefaultPermissions(role) {
  const permissions = {
    owner: {
      canCreateContent: true,
      canEditContent: true,
      canDeleteContent: true,
      canPublish: true,
      canApprove: true,
      canInviteMembers: true,
      canManageSettings: true
    },
    admin: {
      canCreateContent: true,
      canEditContent: true,
      canDeleteContent: true,
      canPublish: true,
      canApprove: true,
      canInviteMembers: true,
      canManageSettings: false
    },
    editor: {
      canCreateContent: true,
      canEditContent: true,
      canDeleteContent: false,
      canPublish: false,
      canApprove: false,
      canInviteMembers: false,
      canManageSettings: false
    },
    viewer: {
      canCreateContent: false,
      canEditContent: false,
      canDeleteContent: false,
      canPublish: false,
      canApprove: false,
      canInviteMembers: false,
      canManageSettings: false
    }
  };
  return permissions[role] || permissions.viewer;
}

workspaceSchema.statics.getDefaultPermissions = getDefaultPermissions;

module.exports = mongoose.model('Workspace', workspaceSchema);
