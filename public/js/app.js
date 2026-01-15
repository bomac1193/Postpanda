// PostPilot Frontend Application
class PostPilot {
  constructor() {
    this.apiBase = '/api';
    this.token = localStorage.getItem('postpilot_token');
    this.currentUser = null;
    this.currentGrid = null;
    this.currentContent = [];
    this.draggedCell = null;
    this.selectedCells = []; // For multi-select drag
    this.defaultCrop = { scale: 0.3, offsetX: 0, offsetY: 0, cropSize: 100, aspectRatio: '1:1' };
    this.liteEditCell = null;
    this.liteEditCrop = { ...this.defaultCrop };
    this.liteEditDrag = { active: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 };
    this.creatorProfileKey = 'postpilot_creator_profile';
    this.creatorProfileDefaults = {
      niche: 'Modern lifestyle creator',
      voice: 'Optimistic mentor energy',
      aesthetic: 'Warm minimal editorial',
      goals: 'Grow an engaged community and drive meaningful conversions',
      targetAudience: 'Creative entrepreneurs',
      tastes: 'Slow luxury, cinematic color grading',
      inspiration: [],
      platformFocus: ['instagram', 'tiktok']
    };
    this._creatorProfileCache = null;
    this._influencerSuggestionsCache = null;
    this.influencerSuggestionsKey = 'postpilot_influencer_suggestions';
    this.influencerSearchQuery = '';
    this.lastAISuggestions = null;
    this.influencerLibrary = [
      {
        tags: ['modern', 'lifestyle', 'fashion', 'daily', 'supermodel', 'dj'],
        creators: [
          { name: 'Matilda Djerf', handle: '@matildadjerf', platform: 'instagram' },
          { name: 'Chriselle Lim', handle: '@chrisellelim', platform: 'instagram' },
          { name: 'Brittany Xavier', handle: '@brittanyxavier', platform: 'instagram' },
          { name: 'Alexis Foreman', handle: '@alexisforeman', platform: 'instagram' },
          { name: 'Peggy Gou', handle: '@peggygou_', platform: 'instagram' },
          { name: 'Honey Dijon', handle: '@honeydijonmusic', platform: 'instagram' }
        ]
      },
      {
        tags: ['sustainable', 'ethical', 'slow', 'activist'],
        creators: [
          { name: 'Aja Barber', handle: '@ajabarber', platform: 'instagram' },
          { name: 'Kristen Leo', handle: '@kristenleo', platform: 'instagram' },
          { name: 'Valeria Hinojosa', handle: '@waterthruskin', platform: 'instagram' }
        ]
      },
      {
        tags: ['beauty', 'wellness', 'makeup', 'skincare'],
        creators: [
          { name: 'Katie Jane Hughes', handle: '@katiejanehughes', platform: 'instagram' },
          { name: 'Rowi Singh', handle: '@rowisingh', platform: 'instagram' },
          { name: 'Brad Mondo', handle: '@bradmondonyc', platform: 'tiktok' }
        ]
      },
      {
        tags: ['creative', 'entrepreneur', 'coach', 'business'],
        creators: [
          { name: 'Jenna Kutcher', handle: '@jennakutcher', platform: 'instagram' },
          { name: 'Erin On Demand', handle: '@erinondemand', platform: 'youtube' },
          { name: 'Jasmine Star', handle: '@jasminestar', platform: 'instagram' },
          { name: 'Justin Welsh', handle: '@justinwelsh', platform: 'twitter' }
        ]
      },
      {
        tags: ['interior', 'design', 'architecture', 'pinterest'],
        creators: [
          { name: 'Kelly Wearstler', handle: '@kellywearstler', platform: 'instagram' },
          { name: 'Athena Calderone', handle: '@eyeswoon', platform: 'instagram' },
          { name: 'Joy Cho', handle: '@ohjoy', platform: 'pinterest' }
        ]
      },
      {
        tags: ['tech', 'product', 'startup', 'web3'],
        creators: [
          { name: 'Alex Lieberman', handle: '@businessbarista', platform: 'tiktok' },
          { name: 'Kat Cole', handle: '@katcoleatl', platform: 'twitter' },
          { name: 'Li Jin', handle: '@ljin18', platform: 'twitter' }
        ]
      },
      {
        tags: ['streamer', 'gaming', 'twitch', 'e-sports'],
        creators: [
          { name: 'Pokimane', handle: '@pokimane', platform: 'twitch' },
          { name: 'Valkyrae', handle: '@valkyrae', platform: 'youtube' },
          { name: 'Dexter Black', handle: '@ninja', platform: 'twitch' }
        ]
      },
      {
        tags: ['spicy', 'exclusive', 'onlyfans', 'glamour'],
        creators: [
          { name: 'Jem Wolfie', handle: '@jemwolfie', platform: 'onlyfans' },
          { name: 'Abigail Ratchford', handle: '@abigailratchford', platform: 'instagram' },
          { name: 'Daisy Keech', handle: '@daisykeech', platform: 'instagram' }
        ]
      },
      {
        tags: ['pinterest', 'diy', 'craft', 'home'],
        creators: [
          { name: 'Geneva Vanderzeil', handle: '@genevavanderzeil', platform: 'pinterest' },
          { name: 'Studio DIY', handle: '@studiodiy', platform: 'pinterest' }
        ]
      }
    ];
    this.marketplace = {
      halos: [],
      rollouts: [],
      myHalos: [],
      myRollouts: []
    };
    this.rolloutImportsKey = 'postpilot_rollout_imports';
    this.rolloutImports = this.loadRolloutImports();
    this.marketplaceFilter = 'all';
    window.app = this; // Make available globally for collections manager
    this.init();
  }

  async init() {
    this.setupEventListeners();

    // Check for OAuth callbacks
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('google')) {
      this.handleGoogleCallback(urlParams);
      return;
    }
    if (urlParams.has('instagram_login')) {
      this.handleInstagramLoginCallback(urlParams);
      return;
    }

    if (this.token) {
      await this.loadCurrentUser();
    } else {
      this.showAuthModal();
    }
    this.loadDashboard();
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        if (view) {
          this.switchView(view);
        }
      });
    });

    // Auth
    document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
    document.getElementById('authForm')?.addEventListener('submit', (e) => this.handleAuth(e));
    document.getElementById('authSwitchLink')?.addEventListener('click', (e) => this.toggleAuthMode(e));
    document.getElementById('closeAuthModal')?.addEventListener('click', () => this.hideAuthModal());
    document.getElementById('googleSignInBtn')?.addEventListener('click', () => this.handleGoogleSignIn());
    document.getElementById('instagramSignInBtn')?.addEventListener('click', () => this.handleInstagramSignIn());

    // Upload
    document.getElementById('uploadContentBtn')?.addEventListener('click', () => this.showUploadModal());
    document.getElementById('closeUploadModal')?.addEventListener('click', () => this.hideUploadModal());
    document.getElementById('cancelUpload')?.addEventListener('click', () => this.hideUploadModal());
    document.getElementById('uploadForm')?.addEventListener('submit', (e) => this.handleUpload(e));
    document.getElementById('mediaFile')?.addEventListener('change', (e) => this.previewFile(e));
    document.getElementById('generateCaptionBtn')?.addEventListener('click', () => this.generateCaption());

    // Grid
    document.getElementById('createGridBtn')?.addEventListener('click', () => this.createGrid());
    document.getElementById('saveGridBtn')?.addEventListener('click', () => this.saveGrid());
    document.getElementById('addRowBtn')?.addEventListener('click', () => this.addRow());
    document.getElementById('removeRowBtn')?.addEventListener('click', () => this.removeRow());
    document.getElementById('gridColumns')?.addEventListener('change', (e) => this.updateGridColumns(e));
    document.getElementById('gridSelector')?.addEventListener('change', (e) => this.loadGrid(e.target.value));

    // Content Modal
    document.getElementById('closeContentModal')?.addEventListener('click', () => this.hideContentModal());
    document.getElementById('analyzeAgainBtn')?.addEventListener('click', () => this.analyzeContent());
    document.getElementById('addToGridBtn')?.addEventListener('click', () => this.addContentToGrid());

    // Social Accounts
    document.getElementById('connectSocial')?.addEventListener('click', () => this.showSocialModal());
    document.getElementById('closeSocialModal')?.addEventListener('click', () => this.hideSocialModal());
    document.getElementById('connectInstagramBtn')?.addEventListener('click', () => this.connectInstagram());
    document.getElementById('disconnectInstagramBtn')?.addEventListener('click', () => this.disconnectInstagram());
    document.getElementById('connectTikTokBtn')?.addEventListener('click', () => this.connectTikTok());
    document.getElementById('disconnectTikTokBtn')?.addEventListener('click', () => this.disconnectTikTok());
    document.getElementById('alchemyNav')?.addEventListener('click', () => this.openAlchemyLab());

    // Lite editor modal
    document.getElementById('liteEditSaveBtn')?.addEventListener('click', () => this.saveLiteEdit());
    document.getElementById('liteEditCancelBtn')?.addEventListener('click', () => this.closeLiteEdit());
    document.getElementById('closeLiteEditModal')?.addEventListener('click', () => this.closeLiteEdit());
    document.getElementById('liteEditResetBtn')?.addEventListener('click', () => this.resetLiteEdit());
    document.getElementById('liteEditScale')?.addEventListener('input', () => this.handleLiteEditInput());
    document.getElementById('liteEditCropSize')?.addEventListener('input', () => this.handleLiteEditCropSize());
    document.getElementById('liteEditAspectRatio')?.addEventListener('change', () => this.handleLiteEditAspectRatio());
    this.initLiteEditDrag();
    document.getElementById('saveCreatorProfileBtn')?.addEventListener('click', () => this.saveCreatorProfile());
    document.getElementById('addInfluencerBtn')?.addEventListener('click', () => this.addInfluencerFromDropdown());
    document.getElementById('saveContentMetadataBtn')?.addEventListener('click', () => this.saveContentMetadata());
    document.getElementById('autoTitleBtn')?.addEventListener('click', () => this.applyHookSuggestion('first'));
    document.getElementById('shuffleTitleBtn')?.addEventListener('click', () => this.applyHookSuggestion('random'));
    document.getElementById('autoCaptionBtn')?.addEventListener('click', () => this.applyCaptionSuggestion('first'));
    document.getElementById('shuffleCaptionBtn')?.addEventListener('click', () => this.applyCaptionSuggestion('random'));
    document.getElementById('creatorInfluencerSearch')?.addEventListener('input', (e) => this.handleInfluencerSearch(e.target.value));
    document.getElementById('haloForm')?.addEventListener('submit', (e) => this.handleHaloSubmit(e));
    document.getElementById('refreshMarketplaceBtn')?.addEventListener('click', () => this.loadMarketplace(true));
    const haloTypeSelect = document.getElementById('haloTypeSelect');
    haloTypeSelect?.addEventListener('change', (e) => this.toggleHaloFormType(e.target.value));
    this.toggleHaloFormType(haloTypeSelect?.value || 'halo');
    document.querySelectorAll('.marketplace-tab').forEach(tab => {
      tab.addEventListener('click', (event) => {
        const mode = event.currentTarget.dataset.marketTab;
        this.setMarketplaceFilter(mode);
      });
    });

    this.populateCreatorProfileForm();
    this.renderGrowthLab();
  }

  getDefaultCrop() {
    return { ...this.defaultCrop };
  }

  normalizeGrid(grid) {
    if (!grid || !Array.isArray(grid.cells)) return;
    grid.cells.forEach(cell => {
      if (!cell.crop) {
        cell.crop = this.getDefaultCrop();
      }
    });
  }

  normalizeCellCrop(cell) {
    if (!cell.crop) {
      cell.crop = this.getDefaultCrop();
    }
    return cell.crop;
  }

  updateCachedContent(updatedContent, { refreshLibrary = true } = {}) {
    if (!updatedContent) return;
    if (Array.isArray(this.currentContent)) {
      const index = this.currentContent.findIndex(item => item._id === updatedContent._id);
      if (index !== -1) {
        this.currentContent[index] = updatedContent;
      }
    }
    if (refreshLibrary) {
      this.loadContentLibrary();
    }
  }

  getStoredCreatorProfile() {
    if (!this._creatorProfileCache) {
      try {
        const stored = localStorage.getItem(this.creatorProfileKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          this._creatorProfileCache = { ...this.creatorProfileDefaults, ...parsed };
        } else {
          this._creatorProfileCache = { ...this.creatorProfileDefaults };
        }
      } catch (_) {
        this._creatorProfileCache = { ...this.creatorProfileDefaults };
      }
    }
    return { ...this._creatorProfileCache };
  }

  setStoredCreatorProfile(profile) {
    this._creatorProfileCache = { ...this.creatorProfileDefaults, ...(profile || {}) };
    if (!Array.isArray(this._creatorProfileCache.inspiration)) {
      this._creatorProfileCache.inspiration = [];
    }
    if (!Array.isArray(this._creatorProfileCache.platformFocus) || !this._creatorProfileCache.platformFocus.length) {
      this._creatorProfileCache.platformFocus = [...this.creatorProfileDefaults.platformFocus];
    }
    localStorage.setItem(this.creatorProfileKey, JSON.stringify(this._creatorProfileCache));
  }

  getCreatorProfileForRequest() {
    return this.getStoredCreatorProfile();
  }

  populateCreatorProfileForm() {
    const profile = this.getStoredCreatorProfile();
    const setValue = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.value = value || '';
    };

    setValue('creatorNiche', profile.niche);
    setValue('creatorVoice', profile.voice);
    setValue('creatorAesthetic', profile.aesthetic);
    setValue('creatorAudience', profile.targetAudience);
    setValue('creatorGoals', profile.goals);
    setValue('creatorTastes', profile.tastes);
    setValue('creatorInspiration', (profile.inspiration || []).join(', '));

    const platformInputs = document.querySelectorAll('input[name="creatorPlatform"]');
    platformInputs.forEach(input => {
      input.checked = Array.isArray(profile.platformFocus)
        ? profile.platformFocus.includes(input.value)
        : false;
    });

    this.populateInfluencerDropdown(profile);
    this.renderCreatorInfluencerList(profile);
    this.updateSuggestedInfluencerHint();
  }

  collectCreatorProfileFromForm() {
    const read = (id) => document.getElementById(id)?.value.trim() || '';
    const inspiration = this.splitList(read('creatorInspiration'));
    const platformInputs = Array.from(document.querySelectorAll('input[name="creatorPlatform"]:checked'));
    const platformFocus = platformInputs.length ? platformInputs.map(input => input.value) : this.creatorProfileDefaults.platformFocus;

    return {
      niche: read('creatorNiche') || this.creatorProfileDefaults.niche,
      voice: read('creatorVoice') || this.creatorProfileDefaults.voice,
      aesthetic: read('creatorAesthetic') || this.creatorProfileDefaults.aesthetic,
      targetAudience: read('creatorAudience') || this.creatorProfileDefaults.targetAudience,
      goals: read('creatorGoals') || this.creatorProfileDefaults.goals,
      tastes: read('creatorTastes') || this.creatorProfileDefaults.tastes,
      inspiration,
      platformFocus
    };
  }

  splitList(value) {
    if (!value) return [];
    return value
      .split(',')
      .map(token => token.replace(/[@#]/g, '').trim())
      .filter(Boolean);
  }

  saveCreatorProfile() {
    const profile = this.collectCreatorProfileFromForm();
    this.setStoredCreatorProfile(profile);
    this.showNotification('Creator profile saved. Future AI analysis will use it automatically.', 'success');
    this.populateCreatorProfileForm();
    this.renderGrowthLab();
  }

  loadRolloutImports() {
    try {
      const stored = localStorage.getItem(this.rolloutImportsKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  saveRolloutImports(imports) {
    this.rolloutImports = Array.isArray(imports) ? imports : [];
    localStorage.setItem(this.rolloutImportsKey, JSON.stringify(this.rolloutImports));
  }

  getInfluencerSuggestions() {
    if (!this._influencerSuggestionsCache) {
      try {
        const stored = localStorage.getItem(this.influencerSuggestionsKey);
        this._influencerSuggestionsCache = stored ? JSON.parse(stored) : [];
      } catch (_) {
        this._influencerSuggestionsCache = [];
      }
    }
    return Array.isArray(this._influencerSuggestionsCache) ? [...this._influencerSuggestionsCache] : [];
  }

  saveInfluencerSuggestions(list) {
    this._influencerSuggestionsCache = Array.isArray(list) ? list : [];
    localStorage.setItem(this.influencerSuggestionsKey, JSON.stringify(this._influencerSuggestionsCache));
  }

  mergeInfluencerSuggestions(creators = []) {
    if (!Array.isArray(creators) || !creators.length) return;
    const suggestions = this.getInfluencerSuggestions();
    const existingHandles = new Set(suggestions.map(item => (item.handle || item.name || '').toLowerCase()));
    let added = false;

    creators.forEach(creator => {
      const key = (creator.handle || creator.name || '').toLowerCase();
      if (!key || existingHandles.has(key)) return;
      existingHandles.add(key);
      suggestions.push({
        name: creator.name || creator.handle || 'Creator',
        handle: creator.handle || creator.name,
        platform: creator.platform,
        overlap: creator.overlap,
        performanceNote: creator.performanceNote
      });
      added = true;
    });

    if (added) {
      this.saveInfluencerSuggestions(suggestions);
      this.populateInfluencerDropdown();
      this.updateSuggestedInfluencerHint();
      this.renderGrowthLab();
    }
  }

  handleInfluencerSearch(value) {
    this.influencerSearchQuery = (value || '').trim();
    this.populateInfluencerDropdown();
  }

  toggleHaloFormType(type) {
    const form = document.getElementById('haloForm');
    if (!form) return;
    if (type === 'rollout') {
      form.classList.add('show-rollout');
    } else {
      form.classList.remove('show-rollout');
    }
  }

  setMarketplaceFilter(mode) {
    if (!mode) return;
    this.marketplaceFilter = mode;
    document.querySelectorAll('.marketplace-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.marketTab === mode);
    });
    this.renderMarketplace();
  }

  getInfluencerDirectory(profile = this.getStoredCreatorProfile()) {
    const directory = [];
    const normalizedNiche = (profile.niche || '').toLowerCase();
    const tasteTokens = (profile.tastes || '').toLowerCase().split(/[,\s]/).filter(Boolean);
    this.influencerLibrary.forEach(entry => {
      const match = entry.tags.some(tag =>
        normalizedNiche.includes(tag) || tasteTokens.some(taste => taste.includes(tag))
      );
      if (match) {
        directory.push(...entry.creators);
      }
    });

    // Always add general inspiration plus AI discovered influencers
    this.getInfluencerSuggestions().forEach(creator => {
      if (!creator.handle && !creator.name) return;
      directory.push({
        name: creator.name || creator.handle,
        handle: creator.handle || creator.name,
        platform: creator.platform || 'instagram',
        overlap: creator.overlap,
        performanceNote: creator.performanceNote
      });
    });

    const seen = new Set();
    return directory.filter(entry => {
      const key = (entry.handle || entry.name || '').toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  populateInfluencerDropdown(profile = this.getStoredCreatorProfile()) {
    const select = document.getElementById('creatorInfluencerSelect');
    if (!select) return;
    const options = ['<option value="">Select or discover…</option>'];
    const directory = this.getInfluencerDirectory(profile);
    const search = (this.influencerSearchQuery || '').toLowerCase();
    const filtered = directory.filter(entry => {
      if (!search) return true;
      return (
        (entry.handle || '').toLowerCase().includes(search) ||
        (entry.name || '').toLowerCase().includes(search) ||
        (entry.platform || '').toLowerCase().includes(search)
      );
    });

    filtered.forEach(creator => {
      const value = creator.handle || creator.name;
      if (!value) return;
      const badge = creator.platform ? `• ${creator.platform}` : '';
      options.push(`<option value="${value}">${creator.handle || creator.name} ${badge}</option>`);
    });

    select.innerHTML = options.join('');
    const searchInput = document.getElementById('creatorInfluencerSearch');
    if (searchInput) {
      searchInput.value = this.influencerSearchQuery;
    }
  }

  renderCreatorInfluencerList(profile = this.getStoredCreatorProfile()) {
    const list = document.getElementById('creatorInfluencerList');
    if (!list) return;
    const inspiration = profile.inspiration || [];

    if (!inspiration.length) {
      list.innerHTML = '<li class="text-muted">Add at least one creator to give the AI a compass.</li>';
      return;
    }

    list.innerHTML = inspiration.map(handle => `
      <li>
        <span>${handle}</span>
        <button type="button" data-handle="${handle}" aria-label="Remove ${handle}">×</button>
      </li>
    `).join('');

    list.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => this.removeInfluencerFromProfile(btn.dataset.handle));
    });
  }

  updateSuggestedInfluencerHint() {
    const hint = document.getElementById('suggestedInfluencerHint');
    if (!hint) return;
    const total = this.getInfluencerSuggestions().length;
    hint.textContent = total
      ? `${total} new suggestion${total === 1 ? '' : 's'} waiting in Growth Finder`
      : 'Run another analysis to discover aligned creators.';
  }

  addInfluencerFromDropdown() {
    const select = document.getElementById('creatorInfluencerSelect');
    if (!select || !select.value) {
      this.showNotification('Select an influencer to add first', 'warning');
      return;
    }
    this.addInfluencerToProfile(select.value);
  }

  addInfluencerToProfile(handle) {
    if (!handle) return;
    const normalized = handle.startsWith('@')
      ? handle
      : `@${handle.replace(/[@#]/g, '').trim()}`;
    const profile = this.getStoredCreatorProfile();
    if (!profile.inspiration) profile.inspiration = [];
    if (profile.inspiration.some(entry => entry.toLowerCase() === normalized.toLowerCase())) {
      this.showNotification('Already in your inspiration list', 'info');
      return;
    }
    profile.inspiration.push(normalized);
    this.setStoredCreatorProfile(profile);
    this.populateCreatorProfileForm();
    this.renderGrowthLab();
    this.showNotification(`${normalized} added to your alignment list`, 'success');
  }

  removeInfluencerFromProfile(handle) {
    if (!handle) return;
    const profile = this.getStoredCreatorProfile();
    profile.inspiration = (profile.inspiration || []).filter(entry => entry !== handle);
    this.setStoredCreatorProfile(profile);
    this.populateCreatorProfileForm();
    this.renderGrowthLab();
  }

  getGridCropStyle(crop) {
    const normalized = crop || this.getDefaultCrop();
    const offsetX = normalized.offsetX || 0;
    const offsetY = normalized.offsetY || 0;
    return `transform: translate(calc(-50% + ${offsetX}%), calc(-50% + ${offsetY}%)) scale(${normalized.scale});`;
  }

  formatCredits(value) {
    const credits = Number(value) || 0;
    return credits > 0 ? `${credits} credits` : 'Free';
  }

  escapeHTML(value) {
    if (!value) return '';
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  renderTagChips(tags = []) {
    if (!Array.isArray(tags) || !tags.length) return '';
    return `
      <div class="tag-chips">
        ${tags.slice(0, 4).map(tag => `<span class="tag-chip">${this.escapeHTML(tag)}</span>`).join('')}
      </div>
    `;
  }

  // View Management
  switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => {
      v.classList.remove('active');
      v.style.display = 'none';
    });
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const view = document.getElementById(`${viewName}View`);
    if (view) {
      view.classList.add('active');
      view.style.display = 'block';
      const navButton = document.querySelector(`[data-view="${viewName}"]`);
      if (navButton) {
        navButton.classList.add('active');
      }

      // Load data for the view
      switch(viewName) {
        case 'dashboard':
          this.loadDashboard();
          break;
        case 'content':
          this.loadContentLibrary();
          break;
        case 'collections':
          if (window.collectionsManager) {
            window.collectionsManager.loadCollections();
          }
          break;
        case 'grid':
          this.loadGrids();
          break;
        case 'analytics':
          this.loadAnalytics();
          break;
        case 'marketplace':
          this.loadMarketplace();
          break;
        case 'growth':
          this.renderGrowthLab();
          break;
      }
    }
  }

  // Auth Methods
  async handleAuth(e) {
    e.preventDefault();
    const isLogin = document.getElementById('authModalTitle').textContent === 'Login';

    const data = {
      email: document.getElementById('authEmail').value,
      password: document.getElementById('authPassword').value
    };

    if (!isLogin) {
      data.name = document.getElementById('authName').value;
    }

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await this.api(endpoint, 'POST', data, false);

      if (response.token) {
        this.token = response.token;
        localStorage.setItem('postpilot_token', this.token);
        this.currentUser = response.user;
        this.hideAuthModal();
        this.showNotification('Welcome to PostPilot!', 'success');
        this.loadDashboard();
      }
    } catch (error) {
      this.showNotification(error.message || 'Authentication failed', 'error');
    }
  }

  toggleAuthMode(e) {
    e.preventDefault();
    const isLogin = document.getElementById('authModalTitle').textContent === 'Login';

    if (isLogin) {
      document.getElementById('authModalTitle').textContent = 'Sign Up';
      document.getElementById('authSubmitBtn').textContent = 'Sign Up';
      document.getElementById('authSwitchText').textContent = 'Already have an account?';
      document.getElementById('authSwitchLink').textContent = 'Login';
      document.getElementById('nameGroup').style.display = 'block';
    } else {
      document.getElementById('authModalTitle').textContent = 'Login';
      document.getElementById('authSubmitBtn').textContent = 'Login';
      document.getElementById('authSwitchText').textContent = "Don't have an account?";
      document.getElementById('authSwitchLink').textContent = 'Sign up';
      document.getElementById('nameGroup').style.display = 'none';
    }
  }

  async loadCurrentUser() {
    try {
      const response = await this.api('/auth/me');
      this.currentUser = response.user;
      document.querySelector('.user-name').textContent = this.currentUser.name;
    } catch (error) {
      this.logout();
    }
  }

  logout() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('postpilot_token');
    this.showAuthModal();
  }

  handleGoogleSignIn() {
    // Redirect to Google OAuth
    window.location.href = '/api/auth/google';
  }

  handleInstagramSignIn() {
    // Redirect to Instagram OAuth for login
    window.location.href = '/api/auth/instagram/login';
  }

  handleGoogleCallback(urlParams) {
    const status = urlParams.get('google');
    const token = urlParams.get('token');
    const message = urlParams.get('message');

    // Clear URL parameters
    window.history.replaceState({}, document.title, '/');

    if (status === 'success' && token) {
      this.token = token;
      localStorage.setItem('postpilot_token', this.token);
      this.showNotification('Successfully signed in with Google!', 'success');
      this.loadCurrentUser().then(() => {
        this.loadDashboard();
      });
    } else if (message === 'credentials_missing') {
      this.showNotification('Google OAuth not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.', 'error');
      this.showAuthModal();
    } else {
      this.showNotification('Google sign-in failed. Please try again.', 'error');
      this.showAuthModal();
    }
  }

  handleInstagramLoginCallback(urlParams) {
    const status = urlParams.get('instagram_login');
    const token = urlParams.get('token');
    const message = urlParams.get('message');

    // Clear URL parameters
    window.history.replaceState({}, document.title, '/');

    if (status === 'success' && token) {
      this.token = token;
      localStorage.setItem('postpilot_token', this.token);
      this.showNotification('Successfully signed in with Instagram!', 'success');
      this.loadCurrentUser().then(() => {
        this.loadDashboard();
      });
    } else if (message === 'credentials_missing') {
      this.showNotification('Instagram OAuth not configured. Please add INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET to your .env file.', 'error');
      this.showAuthModal();
    } else {
      this.showNotification('Instagram sign-in failed. Please try again.', 'error');
      this.showAuthModal();
    }
  }

  // Modal Management
  showAuthModal() {
    document.getElementById('authModal').classList.add('active');
  }

  hideAuthModal() {
    document.getElementById('authModal').classList.remove('active');
  }

  showUploadModal() {
    document.getElementById('uploadModal').classList.add('active');
  }

  hideUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
    document.getElementById('uploadForm').reset();
    document.getElementById('filePreview').innerHTML = '';
  }

  async showSocialModal() {
    document.getElementById('socialAccountsModal').classList.add('active');
    await this.loadSocialStatus();
  }

  hideSocialModal() {
    document.getElementById('socialAccountsModal').classList.remove('active');
  }

  async loadSocialStatus() {
    try {
      const response = await this.api('/auth/social/status');

      // Update Instagram status
      const instagramStatus = document.getElementById('instagramStatus');
      const connectInstagramBtn = document.getElementById('connectInstagramBtn');
      const disconnectInstagramBtn = document.getElementById('disconnectInstagramBtn');

      if (response.instagram.connected) {
        instagramStatus.textContent = `Connected${response.instagram.username ? ' as ' + response.instagram.username : ''}`;
        instagramStatus.classList.add('connected');
        connectInstagramBtn.style.display = 'none';
        disconnectInstagramBtn.style.display = 'block';
      } else {
        instagramStatus.textContent = 'Not connected';
        instagramStatus.classList.remove('connected');
        connectInstagramBtn.style.display = 'block';
        disconnectInstagramBtn.style.display = 'none';
      }

      // Update TikTok status
      const tiktokStatus = document.getElementById('tiktokStatus');
      const connectTikTokBtn = document.getElementById('connectTikTokBtn');
      const disconnectTikTokBtn = document.getElementById('disconnectTikTokBtn');

      if (response.tiktok.connected) {
        tiktokStatus.textContent = `Connected${response.tiktok.username ? ' as ' + response.tiktok.username : ''}`;
        tiktokStatus.classList.add('connected');
        connectTikTokBtn.style.display = 'none';
        disconnectTikTokBtn.style.display = 'block';
      } else {
        tiktokStatus.textContent = 'Not connected';
        tiktokStatus.classList.remove('connected');
        connectTikTokBtn.style.display = 'block';
        disconnectTikTokBtn.style.display = 'none';
      }
    } catch (error) {
      console.error('Failed to load social status:', error);
    }
  }

  connectInstagram() {
    window.location.href = '/api/auth/instagram';
  }

  async disconnectInstagram() {
    try {
      await this.api('/auth/instagram/disconnect', 'POST');
      this.showNotification('Instagram disconnected successfully', 'success');
      this.loadSocialStatus();
    } catch (error) {
      this.showNotification('Failed to disconnect Instagram', 'error');
    }
  }

  connectTikTok() {
    window.location.href = '/api/auth/tiktok';
  }

  async disconnectTikTok() {
    try {
      await this.api('/auth/tiktok/disconnect', 'POST');
      this.showNotification('TikTok disconnected successfully', 'success');
      this.loadSocialStatus();
    } catch (error) {
      this.showNotification('Failed to disconnect TikTok', 'error');
    }
  }

  showContentModal(content) {
    const modal = document.getElementById('contentModal');
    modal.classList.add('active');
    modal.dataset.contentId = content._id;
    this.populateCreatorProfileForm();

    document.getElementById('contentPreviewImage').src = content.thumbnailUrl || content.mediaUrl;
    document.getElementById('contentDetailTitle').textContent = content.title;
    document.getElementById('contentDetailCaption').textContent = content.caption || 'No caption';
    const titleInput = document.getElementById('contentTitleEdit');
    const captionInput = document.getElementById('contentCaptionEdit');
    if (titleInput) titleInput.value = content.title || '';
    if (captionInput) captionInput.value = content.caption || '';

    // Display AI scores
    this.displayScores(content.aiScores);
    this.displayRecommendations(content.aiSuggestions);
  }

  hideContentModal() {
    document.getElementById('contentModal').classList.remove('active');
  }

  // Dashboard
  async loadDashboard() {
    try {
      const [content, grids] = await Promise.all([
        this.api('/content'),
        this.api('/grid')
      ]);

      document.getElementById('totalContent').textContent = content.content?.length || 0;
      document.getElementById('totalGrids').textContent = grids.grids?.length || 0;

      const scheduled = content.content?.filter(c => c.status === 'scheduled').length || 0;
      document.getElementById('scheduledPosts').textContent = scheduled;

      const avgScore = this.calculateAverageScore(content.content || []);
      document.getElementById('avgScore').textContent = avgScore;

    } catch (error) {
      console.error('Dashboard load error:', error);
    }
  }

  calculateAverageScore(content) {
    if (!content.length) return 0;
    const total = content.reduce((sum, item) => {
      return sum + (item.aiScores?.overallScore || 0);
    }, 0);
    return Math.round(total / content.length);
  }

  // Content Library
  async loadContentLibrary() {
    try {
      const response = await this.api('/content');
      this.currentContent = response.content || [];

      const container = document.getElementById('contentLibrary');
      container.innerHTML = '';

      if (this.currentContent.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6b7280;">No content yet. Upload your first piece!</p>';
        return;
      }

      this.currentContent.forEach(content => {
        const item = this.createContentItem(content);
        container.appendChild(item);
      });
    } catch (error) {
      console.error('Content library load error:', error);
    }
  }

  createContentItem(content) {
    const div = document.createElement('div');
    div.className = 'content-item';
    div.onclick = () => this.showContentModal(content);

    div.innerHTML = `
      <img src="${content.thumbnailUrl || content.mediaUrl}" alt="${content.title}" class="content-item-image">
      <div class="content-item-info">
        <div class="content-item-title">${content.title}</div>
        <div class="content-item-meta">
          <span>${content.platform}</span>
          <span class="content-score">${content.aiScores?.overallScore || 0}/100</span>
        </div>
      </div>
    `;

    return div;
  }

  // Upload
  previewFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.getElementById('filePreview');
      if (file.type.startsWith('image/')) {
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; border-radius: 0.5rem;">`;
      } else if (file.type.startsWith('video/')) {
        preview.innerHTML = `<video src="${e.target.result}" controls style="max-width: 100%; border-radius: 0.5rem;"></video>`;
      }

      // Show AI suggestion
      this.showContentTypeSuggestion(file);
    };
    reader.readAsDataURL(file);
  }

  async showContentTypeSuggestion(file) {
    const suggestionsDiv = document.getElementById('aiSuggestions');
    suggestionsDiv.style.display = 'block';

    if (file.type.startsWith('video/')) {
      document.getElementById('suggestionText').textContent =
        '💡 This video would work great as a Reel on Instagram or a standard video on TikTok for maximum engagement!';
    } else {
      document.getElementById('suggestionText').textContent =
        '💡 Consider using this as a carousel post with multiple images to tell a story and increase engagement!';
    }
  }

  async handleUpload(e) {
    e.preventDefault();

    const formData = new FormData();
    const fileInput = document.getElementById('mediaFile');
    formData.append('media', fileInput.files[0]);
    formData.append('title', document.getElementById('contentTitle').value);
    formData.append('caption', document.getElementById('contentCaption').value);
    formData.append('platform', document.getElementById('contentPlatform').value);
    formData.append('mediaType', document.getElementById('contentMediaType').value);

    try {
      const response = await this.apiUpload('/content', formData);
      this.showNotification('Content uploaded successfully!', 'success');
      this.hideUploadModal();

      // Analyze the content
      await this.analyzeContent(response.content._id);
      this.loadContentLibrary();
    } catch (error) {
      this.showNotification(error.message || 'Upload failed', 'error');
    }
  }

  async generateCaption() {
    const contentId = document.getElementById('contentModal').dataset.contentId;
    if (!contentId) return;

    try {
      const response = await this.api('/ai/generate-caption', 'POST', {
        contentId,
        tone: 'casual',
        length: 'medium',
        creatorProfile: this.getCreatorProfileForRequest()
      });

      if (response.captions && response.captions.length > 0) {
        const captionInput = document.getElementById('contentCaptionEdit');
        if (captionInput) captionInput.value = response.captions[0];
        this.showNotification('Caption generated!', 'success');
      }
    } catch (error) {
      console.error('Caption generation error:', error);
    }
  }

  async saveContentMetadata() {
    const contentId = document.getElementById('contentModal').dataset.contentId;
    if (!contentId) return;

    const title = document.getElementById('contentTitleEdit')?.value || '';
    const caption = document.getElementById('contentCaptionEdit')?.value || '';

    try {
      const response = await this.api(`/content/${contentId}`, 'PUT', {
        title: title.trim(),
        caption: caption.trim()
      });
      this.showNotification('Post details updated', 'success');
      this.updateCachedContent(response.content);
      document.getElementById('contentDetailTitle').textContent = response.content.title;
      document.getElementById('contentDetailCaption').textContent = response.content.caption || 'No caption';
    } catch (error) {
      console.error('Metadata save error:', error);
      this.showNotification('Failed to update post details', 'error');
    }
  }

  // AI Analysis
  async analyzeContent(contentId = null) {
    const id = contentId || document.getElementById('contentModal').dataset.contentId;
    if (!id) return;

    try {
      this.showNotification('Analyzing content with AI...', 'info');

      const response = await this.api('/ai/analyze', 'POST', {
        contentId: id,
        creatorProfile: this.getCreatorProfileForRequest()
      });

      this.showNotification('Analysis complete!', 'success');
      this.mergeInfluencerSuggestions(response.creatorInsights?.similarCreators);

      // Refresh content display
      const content = await this.api(`/content/${id}`);
      this.updateCachedContent(content.content, { refreshLibrary: false });
      this.displayScores(content.content.aiScores);
      this.displayRecommendations(content.content.aiSuggestions);

    } catch (error) {
      this.showNotification('Analysis failed', 'error');
    }
  }

  displayScores(scores) {
    if (!scores) return;

    this.animateScore('scoreVirality', scores.viralityScore);
    this.animateScore('scoreEngagement', scores.engagementScore);
    this.animateScore('scoreAesthetic', scores.aestheticScore);
    this.animateScore('scoreTrend', scores.trendScore);
    this.animateScore('scoreOverall', scores.overallScore);
  }

  animateScore(elementId, value) {
    const fill = document.getElementById(elementId);
    const valueSpan = document.getElementById(elementId + 'Value');

    if (fill && valueSpan) {
      setTimeout(() => {
        fill.style.width = value + '%';
        valueSpan.textContent = value + '/100';
      }, 100);
    }
  }

  displayRecommendations(suggestions) {
    const container = document.getElementById('recommendationsList');
    if (!container) return;
    this.lastAISuggestions = suggestions;

    if (!suggestions) {
      container.innerHTML = '<p class="text-muted">Run an analysis to unlock tailored recommendations.</p>';
      return;
    }

    const improvements = suggestions.improvements && suggestions.improvements.length
      ? `<div class="recommendation-subsection">
          <p><strong>Improvements:</strong></p>
          <ul>${suggestions.improvements.map(imp => `<li>${imp}</li>`).join('')}</ul>
        </div>`
      : '';

    const platformBlock = suggestions.platformRecommendation
      ? `<div class="recommendation-subsection">
          <p><strong>Best Platform:</strong> ${suggestions.platformRecommendation} ${suggestions.platformConfidence ? `(${suggestions.platformConfidence}% fit)` : ''}</p>
          <p class="text-muted">${suggestions.platformReason || ''}</p>
        </div>`
      : '';

    const captionIdeas = suggestions.captionIdeas && suggestions.captionIdeas.length
      ? `<div class="recommendation-subsection">
          <p><strong>Caption Starters</strong></p>
          <ol>${suggestions.captionIdeas.map(idea => `<li>${idea}</li>`).join('')}</ol>
        </div>`
      : '';

    const hookIdeas = suggestions.hookIdeas && suggestions.hookIdeas.length
      ? `<div class="recommendation-subsection">
          <p><strong>Hook Ideas</strong></p>
          <ol>${suggestions.hookIdeas.map(hook => `<li>${hook}</li>`).join('')}</ol>
        </div>`
      : '';

    const similarCreators = suggestions.similarCreators && suggestions.similarCreators.length
      ? `<div class="recommendation-subsection">
          <p><strong>Benchmark Creators</strong></p>
          <ul class="similar-creator-list">
            ${suggestions.similarCreators.map(creator => `
              <li>
                <span class="creator-handle">${creator.handle || creator.name}</span>
                <small>${creator.overlap || 'Similar tone & niche'} — ${creator.performanceNote || ''}</small>
              </li>
            `).join('')}
          </ul>
        </div>`
      : '';

    const actionItems = suggestions.actionItems && suggestions.actionItems.length
      ? `<div class="recommendation-subsection">
          <p><strong>Action Items</strong></p>
          <ul>${suggestions.actionItems.map(item => `<li>${item}</li>`).join('')}</ul>
        </div>`
      : '';

    const creatorInsights = suggestions.creatorInsights?.nicheAlignment
      ? `<div class="recommendation-subsection">
          <p><strong>Niche Alignment Score:</strong> ${suggestions.creatorInsights.nicheAlignment.score}/100</p>
          <p class="text-muted">${suggestions.creatorInsights.nicheAlignment.notes}</p>
        </div>`
      : '';

    container.innerHTML = `
      <div class="recommendation-subsection">
        <p><strong>Recommended Type:</strong> ${suggestions.recommendedType || 'N/A'}</p>
        <p><strong>Reason:</strong> ${suggestions.reason || 'No recommendation available'}</p>
        <p><strong>Best Time to Post:</strong> ${suggestions.bestTimeToPost || 'Anytime'}</p>
      </div>
      ${platformBlock}
      ${creatorInsights}
      ${improvements}
      ${captionIdeas}
      ${hookIdeas}
      ${similarCreators}
      ${actionItems}
    `;
  }

  pickSuggestion(list, mode = 'first') {
    if (!Array.isArray(list) || !list.length) return null;
    if (mode === 'random') {
      return list[Math.floor(Math.random() * list.length)];
    }
    return list[0];
  }

  applyHookSuggestion(mode = 'first') {
    const input = document.getElementById('contentTitleEdit');
    if (!input) return;
    const hooks = this.lastAISuggestions?.hookIdeas || this.lastAISuggestions?.captionIdeas || [];
    let suggestion = this.pickSuggestion(hooks, mode);
    if (!suggestion) {
      suggestion = this.generateHookIdeaFromProfile(mode);
    }
    if (!suggestion) {
      this.showNotification('Run AI analysis to unlock hook ideas first.', 'warning');
      return;
    }
    input.value = suggestion;
    this.showNotification('Hook applied. Remember to save post details.', 'success');
  }

  applyCaptionSuggestion(mode = 'first') {
    const input = document.getElementById('contentCaptionEdit');
    if (!input) return;
    const captions = this.lastAISuggestions?.captionIdeas || [];
    let suggestion = this.pickSuggestion(captions, mode);
    if (!suggestion) {
      suggestion = this.generateCaptionIdeaFromProfile(mode);
    }
    if (!suggestion) {
      this.showNotification('Run AI analysis to generate caption ideas first.', 'warning');
      return;
    }
    input.value = suggestion;
    this.showNotification('Caption applied. Hit Save to update the post.', 'success');
  }

  renderGrowthLab() {
    this.renderGrowthAlignedList();
    this.renderGrowthSuggestedList();
    this.renderGrowthProfilePulse();
  }

  renderGrowthAlignedList() {
    const list = document.getElementById('growthAlignedList');
    if (!list) return;
    const inspiration = this.getStoredCreatorProfile().inspiration || [];
    if (!inspiration.length) {
      list.innerHTML = '<li class="text-muted">Add aligned creators to give recommendations more context.</li>';
      return;
    }
    list.innerHTML = inspiration.map(handle => `<li>${handle}</li>`).join('');
  }

  renderGrowthSuggestedList() {
    const container = document.getElementById('growthSuggestedList');
    if (!container) return;
    const suggestions = this.getInfluencerSuggestions();
    const existing = new Set((this.getStoredCreatorProfile().inspiration || []).map(item => item.toLowerCase()));
    if (!suggestions.length) {
      container.innerHTML = '<p class="text-muted">Run more analyses to discover fresh creators.</p>';
      return;
    }
    container.innerHTML = suggestions.map(creator => `
      <div class="creator-card">
        <strong>${creator.handle || creator.name}</strong>
        <p class="text-muted">${creator.overlap || 'Similar tone & audience'}</p>
        ${creator.performanceNote ? `<small>${creator.performanceNote}</small>` : ''}
        ${existing.has((creator.handle || creator.name || '').toLowerCase()) ? '<small>Already in your profile</small>' : `<button class="btn btn-sm btn-secondary" type="button" data-handle="${creator.handle || creator.name}">Align with this creator</button>`}
      </div>
    `).join('');
    container.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => this.addInfluencerToProfile(btn.dataset.handle));
    });
  }

  renderGrowthProfilePulse() {
    const container = document.getElementById('growthProfilePulse');
    if (!container) return;
    const profile = this.getStoredCreatorProfile();
    const inspirationCount = profile.inspiration?.length || 0;
    const suggestionsCount = this.getInfluencerSuggestions().length;
    container.innerHTML = `
      <p><strong>Primary niche:</strong> ${profile.niche}</p>
      <p><strong>Voice:</strong> ${profile.voice}</p>
      <p><strong>Aligned creators:</strong> ${inspirationCount}</p>
      <p><strong>New suggestions queued:</strong> ${suggestionsCount}</p>
    `;
  }

  async loadMarketplace(forceReload = false) {
    if (!this.token) return;
    try {
      const [
        halosRes,
        rolloutsRes,
        myHalosRes,
        myRolloutsRes
      ] = await Promise.all([
        this.api('/halo?type=halo'),
        this.api('/halo?type=rollout'),
        this.api('/halo?mine=true&type=halo'),
        this.api('/halo?mine=true&type=rollout')
      ]);
      this.marketplace.halos = halosRes.halos || [];
      this.marketplace.rollouts = rolloutsRes.halos || [];
      this.marketplace.myHalos = myHalosRes.halos || [];
      this.marketplace.myRollouts = myRolloutsRes.halos || [];
      this.renderMarketplace();
      this.updateMarketplaceStats();
    } catch (error) {
      console.error('Marketplace load error:', error);
      this.showNotification('Failed to load marketplace', 'error');
    }
  }

  renderMarketplace() {
    const haloMarketGrid = document.getElementById('haloMarketplaceGrid');
    const rolloutMarketGrid = document.getElementById('rolloutMarketplaceGrid');
    const haloInventoryGrid = document.getElementById('haloInventoryGrid');
    const rolloutInventoryGrid = document.getElementById('rolloutInventoryGrid');
    const rolloutImportsList = document.getElementById('rolloutImportsList');
    const haloMarketSection = document.getElementById('haloMarketplaceSection');
    const rolloutMarketSection = document.getElementById('rolloutMarketplaceSection');
    const haloInventorySection = document.getElementById('haloInventorySection');
    const rolloutInventorySection = document.getElementById('rolloutInventorySection');
    if (!haloMarketGrid || !rolloutMarketGrid || !haloInventoryGrid || !rolloutInventoryGrid) return;

    const showHalos = this.marketplaceFilter !== 'rollout';
    const showRollouts = this.marketplaceFilter !== 'halo';

    haloMarketGrid.innerHTML = this.marketplace.halos.length
      ? this.marketplace.halos.map(halo => this.renderHaloCard(halo, { isOwned: halo.hasAccess })).join('')
      : '<p class="text-muted">No halos published yet. Be the first to sell your vibe.</p>';

    rolloutMarketGrid.innerHTML = this.marketplace.rollouts.length
      ? this.marketplace.rollouts.map(rollout => this.renderRolloutCard(rollout, { isOwned: rollout.hasAccess })).join('')
      : '<p class="text-muted">No rollout templates yet. Labels can upload schedules and calendars here.</p>';

    haloInventoryGrid.innerHTML = this.marketplace.myHalos.length
      ? this.marketplace.myHalos.map(halo => this.renderHaloCard(halo, { showOwner: false, isOwned: true })).join('')
      : '<p class="text-muted">Unlock or publish halos to build your library.</p>';

    rolloutInventoryGrid.innerHTML = this.marketplace.myRollouts.length
      ? this.marketplace.myRollouts.map(rollout => this.renderRolloutCard(rollout, { showOwner: false, isOwned: true })).join('')
      : '<p class="text-muted">Unlock rollout templates to import their schedules.</p>';

    if (rolloutImportsList) {
      rolloutImportsList.innerHTML = this.rolloutImports.length
        ? this.rolloutImports.map(importItem => `
            <li>
              <div>
                <strong>${importItem.title}</strong>
                <small>${new Date(importItem.importedAt).toLocaleString()}</small>
              </div>
              <button type="button" data-id="${importItem.haloId}">Apply again</button>
            </li>
          `).join('')
        : '<li class="text-muted">Import a rollout template to see it here.</li>';
      rolloutImportsList.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => this.importRolloutSchedule(btn.dataset.id, { reapply: true }));
      });
    }

    haloMarketSection?.classList.toggle('is-hidden', !showHalos);
    haloInventorySection?.classList.toggle('is-hidden', !showHalos);
    rolloutMarketSection?.classList.toggle('is-hidden', !showRollouts);
    rolloutInventorySection?.classList.toggle('is-hidden', !showRollouts);
  }

  updateMarketplaceStats() {
    const haloStat = document.getElementById('marketStatHalos');
    const rolloutStat = document.getElementById('marketStatRollouts');
    if (haloStat) haloStat.textContent = this.marketplace.halos.length;
    if (rolloutStat) rolloutStat.textContent = this.marketplace.rollouts.length;
  }

  renderHaloCard(halo, { showOwner = true, isOwned = false } = {}) {
    const coverImage = halo.referenceImages?.[0]?.url;
    const hasAccess = halo.hasAccess;
    const heroPreview = coverImage
      ? `<div class="halo-cover" style="background-image:url('${coverImage}')"></div>`
      : '';
    const tagChips = this.renderTagChips(halo.tags);
    const promptBlock = hasAccess
      ? `<pre class="halo-prompt">${this.escapeHTML(halo.promptText)}</pre>`
      : `<p class="halo-lock">Unlock to reveal the full prompt & assets.</p><p class="text-muted">${this.escapeHTML(halo.promptPreview)}</p>`;

    const referenceSection = halo.referenceImages && halo.referenceImages.length
      ? `<div class="halo-assets">
          ${halo.referenceImages.map(img => `
            <img src="${img.url}" alt="${halo.title} reference">
          `).join('')}
        </div>`
      : '';

    const lutSection = hasAccess && halo.lutFiles?.length
      ? `<div class="halo-assets">
          <strong>LUT files</strong>
          ${halo.lutFiles.map(lut => `
            <a href="${lut.url}" download class="link-muted">${lut.originalName || 'Download LUT'}</a>
          `).join('')}
        </div>`
      : '';

    const ownerBlock = showOwner && halo.owner
      ? `<small>By ${halo.owner.name}</small>`
      : '';

    const actions = hasAccess
      ? `<div class="halo-actions">
          <button class="btn btn-sm btn-secondary" type="button" onclick="postPilot.copyHaloPrompt('${halo._id}')">Copy prompt</button>
          ${halo.referenceImages?.length ? `<a class="btn btn-sm btn-primary" href="${halo.referenceImages[0].url}" download>Download refs</a>` : ''}
        </div>`
      : `<div class="halo-actions">
          <button class="btn btn-sm btn-primary" type="button" onclick="postPilot.purchaseHalo('${halo._id}')">
            Unlock for ${this.formatCredits(halo.priceCredits)}
          </button>
        </div>`;

    return `
      <article class="halo-card">
        <header>
          <div>
            <h4>${halo.title}</h4>
            ${ownerBlock}
          </div>
          <span class="price-badge">${this.formatCredits(halo.priceCredits)}</span>
        </header>
        ${heroPreview}
        <p>${this.escapeHTML(halo.description || '')}</p>
        ${tagChips}
        ${promptBlock}
        ${referenceSection}
        ${lutSection}
        ${actions}
      </article>
    `;
  }

  renderRolloutCard(halo, { showOwner = true, isOwned = false } = {}) {
    const hasAccess = halo.hasAccess;
    const schedule = halo.schedule || halo.schedulePreview || [];
    const tagChips = this.renderTagChips(halo.tags);
    const launchInfo = halo.launchDate ? `<small>Launch: ${new Date(halo.launchDate).toLocaleDateString()}</small>` : '';
    const scheduleBlock = schedule.length
      ? `<div class="schedule-preview">
          ${schedule.slice(0, 4).map(entry => `
            <div class="timeline-row">
              <div>
                <strong>${this.escapeHTML(entry.title || 'Untitled')}</strong>
                <small>${entry.platform || 'Multi-platform'} · ${entry.dayOffset !== undefined ? `Day ${entry.dayOffset >= 0 ? '+' : ''}${entry.dayOffset}` : (entry.dueDate ? new Date(entry.dueDate).toLocaleDateString() : '')}</small>
              </div>
            </div>
          `).join('')}
        </div>`
      : '<p class="text-muted">No schedule provided yet.</p>';

    const ownerBlock = showOwner && halo.owner
      ? `<small>By ${halo.owner.name}</small>`
      : '';

    const scheduleFilesSection = hasAccess && halo.scheduleFiles?.length
      ? `<div class="halo-assets">
          <strong>Schedule files</strong>
          ${halo.scheduleFiles.map(file => `
            <a href="${file.url}" download class="link-muted">${file.originalName || 'Download schedule'}</a>
          `).join('')}
        </div>`
      : '';

    const actions = hasAccess
      ? `<div class="halo-actions">
          <button class="btn btn-sm btn-secondary" type="button" onclick="postPilot.copyHaloPrompt('${halo._id}')">Copy prompt</button>
          ${halo.hasSchedule ? `<button class="btn btn-sm btn-primary" type="button" onclick="postPilot.importRolloutSchedule('${halo._id}')">Import schedule</button>` : ''}
        </div>`
      : `<div class="halo-actions">
          <button class="btn btn-sm btn-primary" type="button" onclick="postPilot.purchaseHalo('${halo._id}')">
            Unlock for ${this.formatCredits(halo.priceCredits)}
          </button>
        </div>`;

    return `
      <article class="halo-card">
        <header>
          <div>
            <h4>${halo.title}</h4>
            ${ownerBlock}
            ${halo.projectName ? `<small>${halo.projectName}</small>` : ''}
            ${launchInfo}
          </div>
          <div style="display:flex; flex-direction:column; gap:0.35rem; align-items:flex-end;">
            <span class="price-badge">${this.formatCredits(halo.priceCredits)}</span>
            ${halo.labelType ? `<span class="label-badge">${halo.labelType}</span>` : ''}
          </div>
        </header>
        ${tagChips}
        <p>${this.escapeHTML(halo.description || '')}</p>
        ${scheduleBlock}
        ${scheduleFilesSection}
        ${actions}
      </article>
    `;
  }

  async handleHaloSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    try {
      this.showNotification('Publishing halo…', 'info');
      await this.apiUpload('/halo', formData);
      this.showNotification('Halo published', 'success');
      form.reset();
      this.toggleHaloFormType(document.getElementById('haloTypeSelect')?.value || 'halo');
      this.loadMarketplace(true);
    } catch (error) {
      console.error('Publish halo error:', error);
      this.showNotification(error.message || 'Failed to publish halo', 'error');
    }
  }

  async purchaseHalo(haloId) {
    try {
      await this.api(`/halo/${haloId}/purchase`, 'POST');
      this.showNotification('Halo unlocked', 'success');
      this.loadMarketplace(true);
    } catch (error) {
      console.error('Purchase halo error:', error);
      this.showNotification(error.message || 'Failed to unlock halo', 'error');
    }
  }

  findHaloById(haloId) {
    return [
      ...(this.marketplace.halos || []),
      ...(this.marketplace.rollouts || []),
      ...(this.marketplace.myHalos || []),
      ...(this.marketplace.myRollouts || [])
    ].find(item => item._id === haloId);
  }

  importRolloutSchedule(haloId, { reapply = false } = {}) {
    let halo = this.findHaloById(haloId);
    if ((!halo || !halo.hasAccess || !(halo.schedule && halo.schedule.length)) && reapply) {
      const cached = this.rolloutImports.find(entry => entry.haloId === haloId);
      if (cached) {
        halo = { title: cached.title, schedule: cached.schedule, hasAccess: true };
      }
    }
    if (!halo || !(halo.schedule && halo.schedule.length)) {
      this.showNotification('Unlock this rollout template before importing.', 'warning');
      return;
    }
    const importEntry = {
      haloId,
      title: halo.projectName || halo.title,
      importedAt: new Date().toISOString(),
      schedule: halo.schedule
    };
    const updatedImports = [importEntry, ...this.rolloutImports].slice(0, 10);
    this.saveRolloutImports(updatedImports);
    this.showNotification(reapply ? 'Schedule reapplied to your planner' : 'Rollout schedule imported to your planner', 'success');
    this.renderMarketplace();
  }

  async copyHaloPrompt(haloId) {
    const halo = [...(this.marketplace.halos || []), ...(this.marketplace.myHalos || [])]
      .find(item => item._id === haloId);
    if (!halo || !halo.promptText) {
      this.showNotification('Unlock the halo to copy its prompt.', 'warning');
      return;
    }
    try {
      await navigator.clipboard.writeText(halo.promptText);
      this.showNotification('Prompt copied to clipboard', 'success');
    } catch (error) {
      console.error('Clipboard error:', error);
      this.showNotification('Unable to copy prompt', 'error');
    }
  }

  generateHookIdeaFromProfile(mode = 'first') {
    const profile = this.getStoredCreatorProfile();
    const hooks = [
      `POV: ${profile.targetAudience || 'your people'} finally ${profile.goals ? profile.goals.toLowerCase() : 'step behind the curtain'}.`,
      `${(profile.niche || 'This vibe')} in one line: ${profile.tastes || 'sleek + cinematic'} + ${profile.voice || 'bold energy'}.`,
      `Stop scrolling if you're a ${profile.targetAudience || 'creator'} who craves ${profile.aesthetic || 'editorial drama'}.`
    ];
    return this.pickSuggestion(hooks, mode);
  }

  generateCaptionIdeaFromProfile(mode = 'first') {
    const profile = this.getStoredCreatorProfile();
    const captions = [
      `${profile.voice || 'Dreamy mentor'} energy. ${profile.tastes || 'Warm light'} + ${profile.aesthetic || 'cinematic frames'} to remind ${profile.targetAudience || 'creatives'} why they showed up. Save to build your own ${profile.niche || 'halo'}.`,
      `Tonight’s vibe: ${profile.niche || 'Modern muse'} with ${profile.tastes || 'heavy bass + velvet lighting'}. Drop a 🔥 if you’re streaming this mood or send to a friend who needs it.`,
      `This is what ${profile.goals || 'obsessed with craft'} looks like IRL. Bookmark for your next mood board + tell me which frame hits hardest.`
    ];
    return this.pickSuggestion(captions, mode);
  }

  // Grid Management
  async loadGrids() {
    try {
      const response = await this.api('/grid');
      const grids = response.grids || [];

      const selector = document.getElementById('gridSelector');
      selector.innerHTML = '<option value="">Select a grid...</option>';

      grids.forEach(grid => {
        const option = document.createElement('option');
        option.value = grid._id;
        option.textContent = grid.name;
        selector.appendChild(option);
      });

      if (grids.length > 0) {
        this.loadGrid(grids[0]._id);
        selector.value = grids[0]._id;
      }
    } catch (error) {
      console.error('Grids load error:', error);
    }
  }

  async loadGrid(gridId) {
    if (!gridId) return;

    try {
      const response = await this.api(`/grid/${gridId}`);
      this.currentGrid = response.grid;
      this.normalizeGrid(this.currentGrid);

      document.getElementById('gridName').value = this.currentGrid.name;
      document.getElementById('gridPlatform').value = this.currentGrid.platform;
      document.getElementById('gridColumns').value = this.currentGrid.columns;

      this.renderGrid();
    } catch (error) {
      console.error('Grid load error:', error);
    }
  }

  async createGrid() {
    const name = prompt('Enter grid name:');
    if (!name) return;

    try {
      const response = await this.api('/grid', 'POST', {
        name,
        platform: 'instagram',
        columns: 3,
        totalRows: 3
      });

      this.currentGrid = response.grid;
      this.normalizeGrid(this.currentGrid);
      this.showNotification('Grid created!', 'success');
      this.loadGrids();
      this.renderGrid();
    } catch (error) {
      this.showNotification('Failed to create grid', 'error');
    }
  }

  renderGrid() {
    if (!this.currentGrid) {
      this.renderEmptyGrid();
      return;
    }
    this.normalizeGrid(this.currentGrid);

    const container = document.getElementById('instagramGrid');
    container.style.gridTemplateColumns = `repeat(${this.currentGrid.columns}, 1fr)`;
    container.innerHTML = '';

    this.currentGrid.cells.forEach(cell => {
      const cellDiv = this.createGridCell(cell);
      container.appendChild(cellDiv);
    });
  }

  renderEmptyGrid() {
    const container = document.getElementById('instagramGrid');
    container.innerHTML = '';
    container.style.gridTemplateColumns = 'repeat(3, 1fr)';

    for (let i = 0; i < 9; i++) {
      const cell = this.createEmptyGridCell(i);
      container.appendChild(cell);
    }
  }

  createGridCell(cell) {
    const div = document.createElement('div');
    div.className = 'grid-cell';
    div.dataset.row = cell.position.row;
    div.dataset.col = cell.position.col;

    if (cell.isEmpty) {
      div.innerHTML = '<span class="grid-cell-placeholder">+</span>';
      div.onclick = () => this.selectContentForCell(cell.position);
    } else {
      div.classList.add('filled');
      const content = cell.contentId;
      if (content) {
        const crop = this.normalizeCellCrop(cell);
        const cropStyle = this.getGridCropStyle(crop);
        const mediaSrc = content.mediaUrl || content.thumbnailUrl;
        div.innerHTML = `
          <div class="grid-cell-media">
            <img src="${mediaSrc}" alt="${content.title}" draggable="false" class="grid-cell-image" style="${cropStyle}">
          </div>
          <div class="grid-cell-drag-handle" title="Drag to reorder (Shift+click for multi-select)">⋮⋮</div>
          <div class="grid-cell-actions">
            <button class="grid-cell-btn" onclick="postPilot.removeFromGrid(${cell.position.row}, ${cell.position.col})">✕</button>
            <button class="grid-cell-btn" onclick="postPilot.openLiteEditor(${cell.position.row}, ${cell.position.col})">🛠</button>
            <button class="grid-cell-btn" onclick="postPilot.openAlchemyCell(${cell.position.row}, ${cell.position.col})">✦</button>
          </div>
        `;
      }
    }

    // Check if this cell is selected
    const isSelected = this.selectedCells.some(
      s => s.row === cell.position.row && s.col === cell.position.col
    );
    if (isSelected) {
      div.classList.add('selected');
    }

    if (!cell.isEmpty) {
      div.setAttribute('draggable', true);

      // Handle click for selection (with shift for multi-select)
      div.addEventListener('click', (event) => {
        // Ignore clicks on action buttons
        if (event.target.closest('.grid-cell-actions') || event.target.closest('.grid-cell-btn')) return;
        // Ignore clicks on drag handle
        if (event.target.closest('.grid-cell-drag-handle')) return;

        // For shift+click, prevent default and handle selection
        if (event.shiftKey) {
          event.preventDefault();
          event.stopPropagation();
          this.handleCellClick(cell.position, event);
          return;
        }

        // Regular click - only clear selection if not already selected
        this.handleCellClick(cell.position, event);
      });
    } else {
      div.removeAttribute('draggable');
    }

    div.addEventListener('dragstart', (event) => this.handleGridDragStart(cell, event));
    div.addEventListener('dragover', (event) => this.handleGridDragOver(event, div));
    div.addEventListener('dragleave', () => div.classList.remove('drag-over'));
    div.addEventListener('drop', (event) => this.handleGridDrop(event, cell.position, div));
    div.addEventListener('dragend', () => {
      this.draggedCell = null;
      div.classList.remove('drag-over');
    });

    return div;
  }

  handleCellClick(position, event) {
    // Only Shift+click toggles selection
    if (event.shiftKey) {
      const index = this.selectedCells.findIndex(
        s => s.row === position.row && s.col === position.col
      );

      const cellEl = document.querySelector(
        `.grid-cell[data-row="${position.row}"][data-col="${position.col}"]`
      );

      if (index >= 0) {
        // Deselect
        this.selectedCells.splice(index, 1);
        if (cellEl) cellEl.classList.remove('selected');
      } else {
        // Select
        this.selectedCells.push({ ...position });
        if (cellEl) cellEl.classList.add('selected');
      }
    }
    // Regular clicks do nothing - selection persists until Shift+click
  }

  clearCellSelection() {
    this.selectedCells = [];
    document.querySelectorAll('.grid-cell.selected').forEach(el => {
      el.classList.remove('selected');
    });
  }

  createEmptyGridCell(index) {
    const div = document.createElement('div');
    div.className = 'grid-cell';
    div.innerHTML = '<span class="grid-cell-placeholder">+</span>';
    return div;
  }

  handleGridDragStart(cell, event) {
    if (cell.isEmpty) {
      event.preventDefault();
      return;
    }

    // Check if dragging a selected cell - if so, drag all selected cells
    const isSelected = this.selectedCells.some(
      s => s.row === cell.position.row && s.col === cell.position.col
    );

    if (isSelected && this.selectedCells.length > 1) {
      // Dragging multiple selected cells
      this.draggedCell = this.selectedCells.slice(); // Copy array
      event.dataTransfer.setData('application/json', JSON.stringify(this.selectedCells));
    } else {
      // Single cell drag
      this.draggedCell = cell.position;
      this.selectedCells = [{ ...cell.position }];
      event.dataTransfer.setData('application/json', JSON.stringify([cell.position]));
    }

    event.dataTransfer.effectAllowed = 'move';

    // Add visual feedback for multi-drag
    if (Array.isArray(this.draggedCell) && this.draggedCell.length > 1) {
      const dragImage = document.createElement('div');
      dragImage.className = 'drag-ghost';
      dragImage.textContent = `${this.draggedCell.length} items`;
      document.body.appendChild(dragImage);
      event.dataTransfer.setDragImage(dragImage, 30, 20);
      setTimeout(() => dragImage.remove(), 0);
    }
  }

  handleGridDragOver(event, element) {
    if (event.dataTransfer?.types?.includes('Files')) {
      event.preventDefault();
      element.classList.add('drag-over');
      event.dataTransfer.dropEffect = 'copy';
      return;
    }
    if (!this.draggedCell) return;
    event.preventDefault();
    element.classList.add('drag-over');
    event.dataTransfer.dropEffect = 'move';
  }

  handleGridDrop(event, targetPosition, element) {
    event.preventDefault();
    element.classList.remove('drag-over');

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.draggedCell = null;
      this.selectedCells = [];
      this.uploadFileToGrid(files[0], targetPosition);
      return;
    }

    if (!this.draggedCell) return;

    let sourcePositions = [];
    try {
      const payload = event.dataTransfer.getData('application/json');
      if (payload) {
        sourcePositions = JSON.parse(payload);
        // Ensure it's an array
        if (!Array.isArray(sourcePositions)) {
          sourcePositions = [sourcePositions];
        }
      }
    } catch (_) {
      // Fallback to stored position
      if (Array.isArray(this.draggedCell)) {
        sourcePositions = this.draggedCell;
      } else {
        sourcePositions = [this.draggedCell];
      }
    }

    if (sourcePositions.length === 0) return;

    // Don't drop on self
    const droppingOnSelf = sourcePositions.some(
      s => s.row === targetPosition.row && s.col === targetPosition.col
    );
    if (droppingOnSelf && sourcePositions.length === 1) {
      this.draggedCell = null;
      return;
    }

    this.draggedCell = null;
    this.moveGridContentMultiple(sourcePositions, targetPosition);
  }

  async moveGridContentMultiple(sourcePositions, targetPosition) {
    if (!this.currentGrid) return;

    try {
      // Calculate target index in the linear grid
      const cols = this.currentGrid.columns;
      const targetIndex = targetPosition.row * cols + targetPosition.col;

      // Sort source positions by their current index
      const sortedSources = sourcePositions
        .map(pos => ({
          pos,
          index: pos.row * cols + pos.col
        }))
        .sort((a, b) => a.index - b.index);

      // Build moves array - move each source to consecutive positions starting at target
      const moves = sortedSources.map((source, i) => {
        const newIndex = targetIndex + i;
        const newRow = Math.floor(newIndex / cols);
        const newCol = newIndex % cols;
        return {
          from: source.pos,
          to: { row: newRow, col: newCol }
        };
      });

      const response = await this.api(`/grid/${this.currentGrid._id}/reorder`, 'POST', { moves });
      this.currentGrid = response.grid;
      this.normalizeGrid(this.currentGrid);

      // Update selected cells to their new positions (keep selection)
      this.selectedCells = moves.map(move => ({ ...move.to }));

      this.renderGrid();
      this.showNotification(`${moves.length} item${moves.length > 1 ? 's' : ''} rearranged`, 'success');
    } catch (error) {
      this.showNotification('Failed to move content', 'error');
    }
  }

  async moveGridContent(from, to) {
    if (!this.currentGrid) return;
    try {
      const response = await this.api(`/grid/${this.currentGrid._id}/reorder`, 'POST', {
        moves: [{ from, to }]
      });
      this.currentGrid = response.grid;
      this.normalizeGrid(this.currentGrid);
      this.renderGrid();
      this.showNotification('Grid rearranged', 'success');
    } catch (error) {
      this.showNotification('Failed to move content', 'error');
    }
  }

  openLiteEditor(row, col) {
    if (!this.currentGrid) return;
    const cell = this.currentGrid.cells.find(c => c.position.row === row && c.position.col === col);
    if (!cell || cell.isEmpty || !cell.contentId) {
      this.showNotification('Select a cell with content first.', 'warning');
      return;
    }
    const content = cell.contentId;
    this.normalizeCellCrop(cell);
    this.liteEditCell = { row, col };
    // Merge with defaults to ensure all properties exist
    this.liteEditCrop = {
      ...this.getDefaultCrop(),
      ...cell.crop
    };
    const imageEl = document.getElementById('liteEditImage');
    const mediaSrc = content.originalMediaUrl || content.mediaUrl || content.thumbnailUrl;
    imageEl.src = mediaSrc;
    imageEl.alt = cell.contentId.title || 'Grid item';
    this.updateLiteEditInputs();
    this.updateLitePreview();
    document.getElementById('liteEditModal').classList.add('active');
  }

  initLiteEditDrag() {
    const canvas = document.getElementById('liteEditCanvas');
    if (!canvas) return;

    // Mouse events
    canvas.addEventListener('mousedown', (e) => this.startLiteEditDrag(e));
    document.addEventListener('mousemove', (e) => this.moveLiteEditDrag(e));
    document.addEventListener('mouseup', () => this.endLiteEditDrag());

    // Touch events
    canvas.addEventListener('touchstart', (e) => this.startLiteEditDrag(e), { passive: false });
    document.addEventListener('touchmove', (e) => this.moveLiteEditDrag(e), { passive: false });
    document.addEventListener('touchend', () => this.endLiteEditDrag());

    // Scroll to zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.03 : 0.03;
      const newScale = Math.max(0.2, Math.min(1.5, this.liteEditCrop.scale + delta));
      this.liteEditCrop.scale = newScale;
      document.getElementById('liteEditScale').value = newScale;
      this.updateLitePreview();
    }, { passive: false });
  }

  startLiteEditDrag(e) {
    if (!this.liteEditCell) return;
    e.preventDefault();
    const point = e.touches ? e.touches[0] : e;
    this.liteEditDrag = {
      active: true,
      startX: point.clientX,
      startY: point.clientY,
      startOffsetX: this.liteEditCrop.offsetX,
      startOffsetY: this.liteEditCrop.offsetY
    };
  }

  moveLiteEditDrag(e) {
    if (!this.liteEditDrag.active) return;
    e.preventDefault();
    const point = e.touches ? e.touches[0] : e;
    const canvas = document.getElementById('liteEditCanvas');
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const deltaX = point.clientX - this.liteEditDrag.startX;
    const deltaY = point.clientY - this.liteEditDrag.startY;

    // Convert pixel delta to percentage for grid compatibility
    const percentX = (deltaX / canvasRect.width) * 100;
    const percentY = (deltaY / canvasRect.height) * 100;

    // Calculate raw offsets
    let offsetX = this.liteEditDrag.startOffsetX + percentX;
    let offsetY = this.liteEditDrag.startOffsetY + percentY;

    // Snap to grid points
    const snapPoints = [-50, -25, 0, 25, 50];
    const snapThreshold = 4; // How close to snap

    offsetX = this.snapToPoint(offsetX, snapPoints, snapThreshold);
    offsetY = this.snapToPoint(offsetY, snapPoints, snapThreshold);

    // Clamp to bounds
    this.liteEditCrop.offsetX = Math.max(-80, Math.min(80, offsetX));
    this.liteEditCrop.offsetY = Math.max(-80, Math.min(80, offsetY));

    this.updateLitePreview();
  }

  snapToPoint(value, snapPoints, threshold) {
    for (const point of snapPoints) {
      if (Math.abs(value - point) <= threshold) {
        return point;
      }
    }
    return value;
  }

  endLiteEditDrag() {
    this.liteEditDrag.active = false;
  }

  handleLiteEditInput() {
    if (!this.liteEditCell) return;
    const scaleInput = document.getElementById('liteEditScale');
    if (!scaleInput) return;
    this.liteEditCrop.scale = parseFloat(scaleInput.value) || 1;
    this.updateLitePreview();
  }

  handleLiteEditCropSize() {
    if (!this.liteEditCell) return;
    const cropSizeInput = document.getElementById('liteEditCropSize');
    if (!cropSizeInput) return;
    this.liteEditCrop.cropSize = parseInt(cropSizeInput.value, 10) || 80;
    this.updateLitePreview();
  }

  handleLiteEditAspectRatio() {
    if (!this.liteEditCell) return;
    const aspectSelect = document.getElementById('liteEditAspectRatio');
    if (!aspectSelect) return;
    this.liteEditCrop.aspectRatio = aspectSelect.value || '1:1';
    this.updateLitePreview();
  }

  getAspectRatioValue(ratio) {
    const ratios = {
      '1:1': 1,
      '4:5': 4/5,
      '9:16': 9/16,
      '16:9': 16/9
    };
    return ratios[ratio] || 1;
  }

  updateLiteEditInputs() {
    const scaleInput = document.getElementById('liteEditScale');
    const cropSizeInput = document.getElementById('liteEditCropSize');
    const aspectSelect = document.getElementById('liteEditAspectRatio');
    if (scaleInput) scaleInput.value = this.liteEditCrop.scale;
    if (cropSizeInput) cropSizeInput.value = this.liteEditCrop.cropSize || 80;
    if (aspectSelect) aspectSelect.value = this.liteEditCrop.aspectRatio || '1:1';
    this.updateLitePreview();
  }

  updateLitePreview() {
    const imageEl = document.getElementById('liteEditImage');
    const cropbox = document.getElementById('liteEditCropbox');
    const canvas = document.getElementById('liteEditCanvas');
    if (!imageEl || !canvas) return;

    // Update image transform - position is based on offset percentages
    const offsetX = this.liteEditCrop.offsetX || 0;
    const offsetY = this.liteEditCrop.offsetY || 0;
    const scale = this.liteEditCrop.scale || 0.3;

    // Use percentage offsets for consistency with grid display
    imageEl.style.transform = `translate(calc(-50% + ${offsetX}%), calc(-50% + ${offsetY}%)) scale(${scale})`;

    // Update crop box size based on aspect ratio and crop size
    if (cropbox) {
      const size = this.liteEditCrop.cropSize || 80;
      const aspectRatio = this.getAspectRatioValue(this.liteEditCrop.aspectRatio || '1:1');

      let boxWidth, boxHeight;
      if (aspectRatio >= 1) {
        // Landscape or square
        boxWidth = size;
        boxHeight = size / aspectRatio;
      } else {
        // Portrait
        boxHeight = size;
        boxWidth = size * aspectRatio;
      }

      const offsetLeft = (100 - boxWidth) / 2;
      const offsetTop = (100 - boxHeight) / 2;

      cropbox.style.top = `${offsetTop}%`;
      cropbox.style.left = `${offsetLeft}%`;
      cropbox.style.width = `${boxWidth}%`;
      cropbox.style.height = `${boxHeight}%`;
    }

    // Update labels
    const scaleLabel = document.getElementById('liteEditScaleValue');
    const cropSizeLabel = document.getElementById('liteEditCropSizeValue');
    if (scaleLabel) scaleLabel.textContent = `${scale.toFixed(2)}x`;
    if (cropSizeLabel) cropSizeLabel.textContent = `${this.liteEditCrop.cropSize || 80}%`;

    // Show snap indicator when snapped to grid
    const snapPoints = [-50, -25, 0, 25, 50];
    const isSnappedX = snapPoints.includes(offsetX);
    const isSnappedY = snapPoints.includes(offsetY);

    if (cropbox) {
      cropbox.classList.toggle('snapped-x', isSnappedX);
      cropbox.classList.toggle('snapped-y', isSnappedY);
      cropbox.classList.toggle('snapped-center', offsetX === 0 && offsetY === 0);
    }
  }

  closeLiteEdit() {
    document.getElementById('liteEditModal').classList.remove('active');
    this.liteEditCell = null;
  }

  resetLiteEdit() {
    if (!this.liteEditCell) return;
    this.liteEditCrop = this.getDefaultCrop();
    this.updateLiteEditInputs();
    this.updateLitePreview();
  }

  async saveLiteEdit() {
    if (!this.currentGrid || !this.liteEditCell) return;
    try {
      const response = await this.api(`/grid/${this.currentGrid._id}/crop`, 'POST', {
        row: this.liteEditCell.row,
        col: this.liteEditCell.col,
        crop: this.liteEditCrop
      });
      this.currentGrid = response.grid;
      this.normalizeGrid(this.currentGrid);
      this.renderGrid();
      this.showNotification('Grid updated', 'success');
      this.closeLiteEdit();
    } catch (error) {
      this.showNotification(error.message || 'Failed to save changes', 'error');
    }
  }

  openAlchemyLab() {
    window.location.href = '/alchemy';
  }

  openAlchemyCell(row, col) {
    if (!this.currentGrid) return;
    const cell = this.currentGrid.cells.find(c => c.position.row === row && c.position.col === col);
    if (!cell || !cell.contentId) {
      this.showNotification('No content to edit.', 'warning');
      return;
    }

    const seedPayload = {
      caption: cell.contentId.caption || '',
      imageUrl: cell.contentId.mediaUrl || cell.contentId.thumbnailUrl || '',
      thumbnailUrl: cell.contentId.thumbnailUrl || '',
      originalImageUrl: cell.contentId.mediaUrl || '',
      originContentId: cell.contentId._id,
      gridId: this.currentGrid._id,
      cellPosition: { row, col }
    };

    localStorage.setItem('alchemy_seed', JSON.stringify(seedPayload));
    window.location.href = '/alchemy';
  }

  async uploadFileToGrid(file, position) {
    if (!this.currentGrid) return;
    if (!file.type.startsWith('image/')) {
      this.showNotification('Only image drops are supported right now.', 'warning');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('title', file.name || 'Dropped Image');
      formData.append('platform', 'instagram');
      formData.append('mediaType', 'image');

      const uploadResponse = await this.apiUpload('/content', formData);
      const contentId = uploadResponse.content?._id;
      if (!contentId) {
        this.showNotification('Upload failed', 'error');
        return;
      }

      const response = await this.api(`/grid/${this.currentGrid._id}/add-content`, 'POST', {
        contentId,
        row: position.row,
        col: position.col
      });

      this.currentGrid = response.grid;
      this.normalizeGrid(this.currentGrid);
      this.renderGrid();
      this.showNotification('Image uploaded and placed on the grid!', 'success');
    } catch (error) {
      console.error('Drop upload error:', error);
      this.showNotification('Failed to upload image to grid', 'error');
    }
  }

  async addRow() {
    if (!this.currentGrid) return;

    try {
      const response = await this.api(`/grid/${this.currentGrid._id}/add-row`, 'POST');
      this.currentGrid = response.grid;
      this.normalizeGrid(this.currentGrid);
      this.renderGrid();
      this.showNotification('Row added!', 'success');
    } catch (error) {
      this.showNotification('Failed to add row', 'error');
    }
  }

  async removeRow() {
    if (!this.currentGrid) return;

    try {
      const response = await this.api(`/grid/${this.currentGrid._id}/remove-row`, 'POST');
      this.currentGrid = response.grid;
      this.normalizeGrid(this.currentGrid);
      this.renderGrid();
      this.showNotification('Row removed!', 'success');
    } catch (error) {
      this.showNotification('Failed to remove row', 'error');
    }
  }

  updateGridColumns(e) {
    const columns = parseInt(e.target.value);
    const container = document.getElementById('instagramGrid');
    container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  }

  async saveGrid() {
    if (!this.currentGrid) return;

    try {
      await this.api(`/grid/${this.currentGrid._id}`, 'PUT', {
        name: document.getElementById('gridName').value,
        platform: document.getElementById('gridPlatform').value,
        columns: parseInt(document.getElementById('gridColumns').value)
      });

      this.showNotification('Grid saved!', 'success');
    } catch (error) {
      this.showNotification('Failed to save grid', 'error');
    }
  }

  selectContentForCell(position) {
    // Show content library and select content to add
    this.switchView('content');
    this.showNotification('Click on content to add it to the grid', 'info');
    this.selectedGridPosition = position;
  }

  async addContentToGrid() {
    const contentId = document.getElementById('contentModal').dataset.contentId;
    if (!contentId || !this.currentGrid) return;

    try {
      // If we have a selected position, use it; otherwise find first empty cell
      let position = this.selectedGridPosition;
      if (!position) {
        const emptyCell = this.currentGrid.cells.find(c => c.isEmpty);
        if (emptyCell) {
          position = emptyCell.position;
        }
      }

      if (!position) {
        this.showNotification('Grid is full! Add more rows.', 'warning');
        return;
      }

      const response = await this.api(`/grid/${this.currentGrid._id}/add-content`, 'POST', {
        contentId,
        row: position.row,
        col: position.col
      });

      this.currentGrid = response.grid;
      this.normalizeGrid(this.currentGrid);
      this.hideContentModal();
      this.switchView('grid');
      this.renderGrid();
      this.showNotification('Content added to grid!', 'success');
      this.selectedGridPosition = null;
    } catch (error) {
      this.showNotification('Failed to add content to grid', 'error');
    }
  }

  async removeFromGrid(row, col) {
    if (!this.currentGrid) return;

    try {
      const response = await this.api(`/grid/${this.currentGrid._id}/remove-content`, 'POST', {
        row,
        col
      });

      this.currentGrid = response.grid;
      this.renderGrid();
      this.showNotification('Content removed from grid!', 'success');
    } catch (error) {
      this.showNotification('Failed to remove content', 'error');
    }
  }

  // Analytics
  async loadAnalytics() {
    try {
      const response = await this.api('/content');
      const content = response.content || [];

      const container = document.getElementById('analyticsContent');
      container.innerHTML = '';

      if (content.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6b7280;">No content to analyze yet.</p>';
        return;
      }

      // Sort by overall score
      const sorted = content.sort((a, b) =>
        (b.aiScores?.overallScore || 0) - (a.aiScores?.overallScore || 0)
      );

      sorted.slice(0, 6).forEach(item => {
        const card = this.createAnalyticsCard(item);
        container.appendChild(card);
      });
    } catch (error) {
      console.error('Analytics load error:', error);
    }
  }

  createAnalyticsCard(content) {
    const div = document.createElement('div');
    div.className = 'content-item';
    div.onclick = () => this.showContentModal(content);

    div.innerHTML = `
      <img src="${content.thumbnailUrl || content.mediaUrl}" alt="${content.title}" class="content-item-image">
      <div class="content-item-info">
        <div class="content-item-title">${content.title}</div>
        <div style="font-size: 0.875rem; margin-top: 0.5rem;">
          <div>Overall: ${content.aiScores?.overallScore || 0}/100</div>
          <div>Virality: ${content.aiScores?.viralityScore || 0}/100</div>
          <div>Engagement: ${content.aiScores?.engagementScore || 0}/100</div>
        </div>
      </div>
    `;

    return div;
  }

  // API Methods
  async api(endpoint, method = 'GET', body = null, requireAuth = true) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (requireAuth && this.token) {
      options.headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(this.apiBase + endpoint, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  async apiUpload(endpoint, formData) {
    const options = {
      method: 'POST',
      headers: {}
    };

    if (this.token) {
      options.headers['Authorization'] = `Bearer ${this.token}`;
    }

    options.body = formData;

    const response = await fetch(this.apiBase + endpoint, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return data;
  }

  // Notifications
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }
}

// Initialize the app
const postPilot = new PostPilot();
