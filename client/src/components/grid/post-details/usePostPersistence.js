import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../../../stores/useAppStore';
import { contentApi } from '../../../lib/api';

export function usePostPersistence(post) {
  const updatePost = useAppStore((state) => state.updatePost);
  const postId = post?.id || post?._id || null;

  const [caption, setCaption] = useState(post?.caption || '');
  const [hashtags, setHashtags] = useState(post?.hashtags?.join(' ') || '');

  const captionDraftRef = useRef(caption);
  const hashtagsDraftRef = useRef(hashtags);
  const lastPostIdRef = useRef(postId);

  const parseHashtagsText = useCallback((value) => (
    String(value || '')
      .split(/[\s,#]+/)
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
  ), []);

  const persistPost = useCallback(async (payload, targetId = postId) => {
    if (!targetId) return;
    updatePost(targetId, payload);
    try {
      await contentApi.update(targetId, payload);
    } catch (err) {
      console.error('Failed to persist post update:', err);
    }
  }, [postId, updatePost]);

  useEffect(() => {
    captionDraftRef.current = caption;
  }, [caption]);

  useEffect(() => {
    hashtagsDraftRef.current = hashtags;
  }, [hashtags]);

  // Persist drafts when switching posts
  useEffect(() => {
    const prevId = lastPostIdRef.current;
    if (prevId && prevId !== postId) {
      // Fire-and-forget: persist the old post's drafts
      const prevCaption = captionDraftRef.current;
      const prevHashtags = hashtagsDraftRef.current;
      updatePost(prevId, {
        caption: prevCaption,
        hashtags: parseHashtagsText(prevHashtags),
      });
      contentApi.update(prevId, {
        caption: prevCaption,
        hashtags: parseHashtagsText(prevHashtags),
      }).catch(err => console.error('Failed to persist post update:', err));
    }

    lastPostIdRef.current = postId;
    setCaption(post?.caption || '');
    setHashtags(post?.hashtags?.join(' ') || '');
  }, [postId]);

  const handleCaptionBlur = useCallback(() => {
    persistPost({ caption });
  }, [caption, persistPost]);

  const handleHashtagsBlur = useCallback(() => {
    persistPost({ hashtags: parseHashtagsText(hashtags) });
  }, [hashtags, persistPost, parseHashtagsText]);

  return {
    caption,
    setCaption,
    hashtags,
    setHashtags,
    handleCaptionBlur,
    handleHashtagsBlur,
    persistPost,
    parseHashtagsText,
  };
}
