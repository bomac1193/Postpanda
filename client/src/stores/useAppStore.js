import { useState, useCallback, useMemo, useEffect } from 'react';
import { youtubeApi, rolloutApi } from '../lib/api';

const STORAGE_KEY = 'postpilot-state';

const initialState = {
  posts: [],
  selectedId: null,
  scheduledContent: [],
  draggedContent: null,
  theme: 'light',
  currentWorkspace: null,
  // YouTube Collections - now from API
  youtubeCollections: [],
  currentCollectionId: null,
  youtubeCollectionsLoading: false,
  youtubeCollectionsError: null,
  // YouTube Videos - now from API
  youtubeVideos: [],
  youtubeVideosLoading: false,
  youtubeVideosError: null,
  // Rollouts - now from API
  rollouts: [],
  currentRolloutId: null,
  rolloutsLoading: false,
  rolloutsError: null,
  // Initialization flag
  initialized: false,
};

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only load non-API data from localStorage
      return {
        ...initialState,
        posts: parsed.posts || [],
        theme: parsed.theme || 'light',
        currentWorkspace: parsed.currentWorkspace || null,
        // Keep IDs from localStorage for initial selection, but data will come from API
        currentCollectionId: parsed.currentCollectionId || null,
        currentRolloutId: parsed.currentRolloutId || null,
      };
    }
  } catch (error) {
    console.warn('Failed to load state:', error);
  }
  return initialState;
}

function saveState(state) {
  try {
    // Only save non-API data to localStorage
    const toSave = {
      posts: state.posts,
      theme: state.theme,
      currentWorkspace: state.currentWorkspace,
      // Save current IDs so we can restore selection on reload
      currentCollectionId: state.currentCollectionId,
      currentRolloutId: state.currentRolloutId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.warn('Failed to save state:', error);
  }
}

export function useAppStore() {
  const [state, setState] = useState(loadState);

  const updateState = useCallback((updates) => {
    setState(prev => {
      const newState = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      saveState(newState);
      return newState;
    });
  }, []);

  // Initialize data from API
  const initializeFromApi = useCallback(async () => {
    if (state.initialized) return;

    try {
      // Load YouTube collections
      updateState({ youtubeCollectionsLoading: true, rolloutsLoading: true });

      const [collectionsResponse, rolloutsResponse] = await Promise.all([
        youtubeApi.getCollections().catch(err => {
          console.warn('Failed to fetch YouTube collections:', err);
          return { collections: [] };
        }),
        rolloutApi.getAll().catch(err => {
          console.warn('Failed to fetch rollouts:', err);
          return { rollouts: [] };
        }),
      ]);

      updateState(prev => ({
        ...prev,
        youtubeCollections: collectionsResponse.collections || [],
        youtubeCollectionsLoading: false,
        youtubeCollectionsError: null,
        rollouts: rolloutsResponse.rollouts || [],
        rolloutsLoading: false,
        rolloutsError: null,
        initialized: true,
      }));
    } catch (error) {
      console.error('Failed to initialize from API:', error);
      updateState({
        youtubeCollectionsLoading: false,
        youtubeCollectionsError: error.message,
        rolloutsLoading: false,
        rolloutsError: error.message,
        initialized: true,
      });
    }
  }, [state.initialized, updateState]);

  // Initialize on mount
  useEffect(() => {
    initializeFromApi();
  }, [initializeFromApi]);

  // Post actions (unchanged - localStorage based)
  const addPost = useCallback((post) => {
    updateState(prev => ({
      ...prev,
      posts: [post, ...prev.posts],
      selectedId: post.id,
    }));
  }, [updateState]);

  const updatePost = useCallback((id, updates) => {
    updateState(prev => ({
      ...prev,
      posts: prev.posts.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  }, [updateState]);

  const deletePost = useCallback((id) => {
    updateState(prev => ({
      ...prev,
      posts: prev.posts.filter(p => p.id !== id),
      selectedId: prev.selectedId === id ? null : prev.selectedId,
    }));
  }, [updateState]);

  const selectPost = useCallback((id) => {
    updateState({ selectedId: id });
  }, [updateState]);

  const reorderPosts = useCallback((sourceId, targetId) => {
    if (sourceId === targetId) return;
    updateState(prev => {
      const sourceIndex = prev.posts.findIndex(p => p.id === sourceId);
      const targetIndex = prev.posts.findIndex(p => p.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const updated = [...prev.posts];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return { ...prev, posts: updated };
    });
  }, [updateState]);

  // Drag state
  const setDraggedContent = useCallback((content) => {
    updateState({ draggedContent: content });
  }, [updateState]);

  // Schedule actions
  const addScheduledContent = useCallback((item) => {
    updateState(prev => ({
      ...prev,
      scheduledContent: [...prev.scheduledContent, item],
    }));
  }, [updateState]);

  const removeScheduledContent = useCallback((itemId) => {
    updateState(prev => ({
      ...prev,
      scheduledContent: prev.scheduledContent.filter(s => s.id !== itemId),
    }));
  }, [updateState]);

  const updateScheduledContent = useCallback((itemId, updates) => {
    updateState(prev => ({
      ...prev,
      scheduledContent: prev.scheduledContent.map(s =>
        s.id === itemId ? { ...s, ...updates } : s
      ),
    }));
  }, [updateState]);

  // Theme actions
  const setTheme = useCallback((theme) => {
    updateState({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  }, [updateState]);

  const toggleTheme = useCallback(() => {
    updateState(prev => {
      const newTheme = prev.theme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      return { ...prev, theme: newTheme };
    });
  }, [updateState]);

  // Workspace actions
  const setCurrentWorkspace = useCallback((workspace) => {
    updateState({ currentWorkspace: workspace });
  }, [updateState]);

  // YouTube Collection actions - now with API calls
  const fetchYoutubeCollections = useCallback(async () => {
    try {
      updateState({ youtubeCollectionsLoading: true });
      const response = await youtubeApi.getCollections();
      updateState({
        youtubeCollections: response.collections || [],
        youtubeCollectionsLoading: false,
        youtubeCollectionsError: null,
      });
      return response.collections;
    } catch (error) {
      updateState({
        youtubeCollectionsLoading: false,
        youtubeCollectionsError: error.message,
      });
      throw error;
    }
  }, [updateState]);

  const addYoutubeCollection = useCallback(async (collection) => {
    try {
      const response = await youtubeApi.createCollection(collection);
      const newCollection = response.collection;

      // Update local state with server response
      updateState(prev => ({
        ...prev,
        youtubeCollections: [newCollection, ...prev.youtubeCollections],
        currentCollectionId: newCollection._id,
      }));

      return newCollection;
    } catch (error) {
      console.error('Failed to create YouTube collection:', error);
      throw error;
    }
  }, [updateState]);

  const updateYoutubeCollection = useCallback(async (id, updates) => {
    try {
      const response = await youtubeApi.updateCollection(id, updates);
      const updatedCollection = response.collection;

      // Update local state
      updateState(prev => ({
        ...prev,
        youtubeCollections: prev.youtubeCollections.map(c =>
          c._id === id ? updatedCollection : c
        ),
      }));

      return updatedCollection;
    } catch (error) {
      console.error('Failed to update YouTube collection:', error);
      throw error;
    }
  }, [updateState]);

  const deleteYoutubeCollection = useCallback(async (id) => {
    try {
      await youtubeApi.deleteCollection(id);

      // Update local state
      updateState(prev => ({
        ...prev,
        youtubeCollections: prev.youtubeCollections.filter(c => c._id !== id),
        currentCollectionId: prev.currentCollectionId === id ? null : prev.currentCollectionId,
      }));
    } catch (error) {
      console.error('Failed to delete YouTube collection:', error);
      throw error;
    }
  }, [updateState]);

  const setCurrentCollection = useCallback((id) => {
    updateState({ currentCollectionId: id });
  }, [updateState]);

  // Collection tag actions
  const updateYoutubeCollectionTags = useCallback(async (collectionId, tags) => {
    return updateYoutubeCollection(collectionId, { tags });
  }, [updateYoutubeCollection]);

  const addTagToCollection = useCallback(async (collectionId, tag) => {
    const collection = state.youtubeCollections.find(c => c._id === collectionId);
    if (!collection) return;

    const currentTags = collection.tags || [];
    if (!currentTags.includes(tag)) {
      return updateYoutubeCollection(collectionId, { tags: [...currentTags, tag] });
    }
  }, [state.youtubeCollections, updateYoutubeCollection]);

  const removeTagFromCollection = useCallback(async (collectionId, tag) => {
    const collection = state.youtubeCollections.find(c => c._id === collectionId);
    if (!collection) return;

    const currentTags = collection.tags || [];
    return updateYoutubeCollection(collectionId, { tags: currentTags.filter(t => t !== tag) });
  }, [state.youtubeCollections, updateYoutubeCollection]);

  // YouTube Video actions
  const fetchYoutubeVideos = useCallback(async (collectionId) => {
    try {
      updateState({ youtubeVideosLoading: true });
      const response = await youtubeApi.getVideos(collectionId);
      updateState({
        youtubeVideos: response.videos || [],
        youtubeVideosLoading: false,
        youtubeVideosError: null,
      });
      return response.videos;
    } catch (error) {
      updateState({
        youtubeVideosLoading: false,
        youtubeVideosError: error.message,
      });
      throw error;
    }
  }, [updateState]);

  const addYoutubeVideo = useCallback(async (video) => {
    try {
      const response = await youtubeApi.createVideo(video);
      const newVideo = response.video;

      updateState(prev => ({
        ...prev,
        youtubeVideos: [...prev.youtubeVideos, newVideo],
      }));

      return newVideo;
    } catch (error) {
      console.error('Failed to create YouTube video:', error);
      throw error;
    }
  }, [updateState]);

  const updateYoutubeVideo = useCallback(async (id, updates) => {
    try {
      const response = await youtubeApi.updateVideo(id, updates);
      const updatedVideo = response.video;

      updateState(prev => ({
        ...prev,
        youtubeVideos: prev.youtubeVideos.map(v =>
          v._id === id ? updatedVideo : v
        ),
      }));

      return updatedVideo;
    } catch (error) {
      console.error('Failed to update YouTube video:', error);
      throw error;
    }
  }, [updateState]);

  const deleteYoutubeVideo = useCallback(async (id) => {
    try {
      await youtubeApi.deleteVideo(id);

      updateState(prev => ({
        ...prev,
        youtubeVideos: prev.youtubeVideos.filter(v => v._id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete YouTube video:', error);
      throw error;
    }
  }, [updateState]);

  const reorderYoutubeVideos = useCallback(async (collectionId, videoIds) => {
    try {
      const response = await youtubeApi.reorderVideos(collectionId, videoIds);

      updateState(prev => ({
        ...prev,
        youtubeVideos: response.videos,
      }));

      return response.videos;
    } catch (error) {
      console.error('Failed to reorder YouTube videos:', error);
      throw error;
    }
  }, [updateState]);

  // Rollout actions - now with API calls
  const fetchRollouts = useCallback(async () => {
    try {
      updateState({ rolloutsLoading: true });
      const response = await rolloutApi.getAll();
      updateState({
        rollouts: response.rollouts || [],
        rolloutsLoading: false,
        rolloutsError: null,
      });
      return response.rollouts;
    } catch (error) {
      updateState({
        rolloutsLoading: false,
        rolloutsError: error.message,
      });
      throw error;
    }
  }, [updateState]);

  const addRollout = useCallback(async (rollout) => {
    try {
      const response = await rolloutApi.create(rollout);
      const newRollout = response.rollout;

      updateState(prev => ({
        ...prev,
        rollouts: [newRollout, ...prev.rollouts],
        currentRolloutId: newRollout._id,
      }));

      return newRollout;
    } catch (error) {
      console.error('Failed to create rollout:', error);
      throw error;
    }
  }, [updateState]);

  const updateRollout = useCallback(async (id, updates) => {
    try {
      const response = await rolloutApi.update(id, updates);
      const updatedRollout = response.rollout;

      updateState(prev => ({
        ...prev,
        rollouts: prev.rollouts.map(r =>
          r._id === id ? updatedRollout : r
        ),
      }));

      return updatedRollout;
    } catch (error) {
      console.error('Failed to update rollout:', error);
      throw error;
    }
  }, [updateState]);

  const deleteRollout = useCallback(async (id) => {
    try {
      await rolloutApi.delete(id);

      updateState(prev => ({
        ...prev,
        rollouts: prev.rollouts.filter(r => r._id !== id),
        currentRolloutId: prev.currentRolloutId === id ? null : prev.currentRolloutId,
      }));
    } catch (error) {
      console.error('Failed to delete rollout:', error);
      throw error;
    }
  }, [updateState]);

  const setCurrentRollout = useCallback((id) => {
    updateState({ currentRolloutId: id });
  }, [updateState]);

  // Rollout section actions
  const addRolloutSection = useCallback(async (rolloutId, section) => {
    try {
      const response = await rolloutApi.addSection(rolloutId, section);
      const updatedRollout = response.rollout;

      updateState(prev => ({
        ...prev,
        rollouts: prev.rollouts.map(r =>
          r._id === rolloutId ? updatedRollout : r
        ),
      }));

      return updatedRollout;
    } catch (error) {
      console.error('Failed to add section:', error);
      throw error;
    }
  }, [updateState]);

  const updateRolloutSection = useCallback(async (rolloutId, sectionId, updates) => {
    try {
      const response = await rolloutApi.updateSection(rolloutId, sectionId, updates);
      const updatedRollout = response.rollout;

      updateState(prev => ({
        ...prev,
        rollouts: prev.rollouts.map(r =>
          r._id === rolloutId ? updatedRollout : r
        ),
      }));

      return updatedRollout;
    } catch (error) {
      console.error('Failed to update section:', error);
      throw error;
    }
  }, [updateState]);

  const deleteRolloutSection = useCallback(async (rolloutId, sectionId) => {
    try {
      const response = await rolloutApi.deleteSection(rolloutId, sectionId);
      const updatedRollout = response.rollout;

      updateState(prev => ({
        ...prev,
        rollouts: prev.rollouts.map(r =>
          r._id === rolloutId ? updatedRollout : r
        ),
      }));

      return updatedRollout;
    } catch (error) {
      console.error('Failed to delete section:', error);
      throw error;
    }
  }, [updateState]);

  const reorderRolloutSections = useCallback(async (rolloutId, sourceIndex, targetIndex) => {
    if (sourceIndex === targetIndex) return;

    const rollout = state.rollouts.find(r => r._id === rolloutId);
    if (!rollout) return;

    const sections = [...rollout.sections];
    const [moved] = sections.splice(sourceIndex, 1);
    sections.splice(targetIndex, 0, moved);

    const sectionIds = sections.map(s => s.id);

    try {
      const response = await rolloutApi.reorderSections(rolloutId, sectionIds);
      const updatedRollout = response.rollout;

      updateState(prev => ({
        ...prev,
        rollouts: prev.rollouts.map(r =>
          r._id === rolloutId ? updatedRollout : r
        ),
      }));

      return updatedRollout;
    } catch (error) {
      console.error('Failed to reorder sections:', error);
      throw error;
    }
  }, [state.rollouts, updateState]);

  // Collection in section actions
  const addCollectionToSection = useCallback(async (rolloutId, sectionId, collectionId) => {
    try {
      const response = await rolloutApi.addCollectionToSection(rolloutId, sectionId, collectionId);
      const updatedRollout = response.rollout;

      updateState(prev => ({
        ...prev,
        rollouts: prev.rollouts.map(r =>
          r._id === rolloutId ? updatedRollout : r
        ),
      }));

      return updatedRollout;
    } catch (error) {
      console.error('Failed to add collection to section:', error);
      throw error;
    }
  }, [updateState]);

  const removeCollectionFromSection = useCallback(async (rolloutId, sectionId, collectionId) => {
    try {
      const response = await rolloutApi.removeCollectionFromSection(rolloutId, sectionId, collectionId);
      const updatedRollout = response.rollout;

      updateState(prev => ({
        ...prev,
        rollouts: prev.rollouts.map(r =>
          r._id === rolloutId ? updatedRollout : r
        ),
      }));

      return updatedRollout;
    } catch (error) {
      console.error('Failed to remove collection from section:', error);
      throw error;
    }
  }, [updateState]);

  // Derived state
  const selectedPost = useMemo(() =>
    state.posts.find(p => p.id === state.selectedId) || null,
    [state.posts, state.selectedId]
  );

  const currentRollout = useMemo(() =>
    state.rollouts.find(r => r._id === state.currentRolloutId) || null,
    [state.rollouts, state.currentRolloutId]
  );

  const currentCollection = useMemo(() =>
    state.youtubeCollections.find(c => c._id === state.currentCollectionId) || null,
    [state.youtubeCollections, state.currentCollectionId]
  );

  return {
    // State
    ...state,
    selectedPost,
    currentRollout,
    currentCollection,

    // Initialization
    initializeFromApi,

    // Post Actions
    addPost,
    updatePost,
    deletePost,
    selectPost,
    reorderPosts,
    setDraggedContent,

    // Schedule Actions
    addScheduledContent,
    removeScheduledContent,
    updateScheduledContent,

    // Theme Actions
    setTheme,
    toggleTheme,

    // Workspace Actions
    setCurrentWorkspace,

    // YouTube Collection Actions
    fetchYoutubeCollections,
    addYoutubeCollection,
    updateYoutubeCollection,
    deleteYoutubeCollection,
    setCurrentCollection,
    updateYoutubeCollectionTags,
    addTagToCollection,
    removeTagFromCollection,

    // YouTube Video Actions
    fetchYoutubeVideos,
    addYoutubeVideo,
    updateYoutubeVideo,
    deleteYoutubeVideo,
    reorderYoutubeVideos,

    // Rollout Actions
    fetchRollouts,
    addRollout,
    updateRollout,
    deleteRollout,
    setCurrentRollout,

    // Section Actions
    addRolloutSection,
    updateRolloutSection,
    deleteRolloutSection,
    reorderRolloutSections,

    // Collection in Section Actions
    addCollectionToSection,
    removeCollectionFromSection,

    updateState,
  };
}

export default useAppStore;
