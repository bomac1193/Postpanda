import { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useNavigate } from 'react-router-dom';
import { aiApi, postingApi } from '../../lib/api';
import {
  Image,
  Type,
  Hash,
  Clock,
  Sparkles,
  Send,
  Calendar,
  Edit3,
  Wand2,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  Music,
  Play,
  Eye,
  X,
  Loader2,
  Check,
} from 'lucide-react';

// Platform tabs
const PLATFORMS = [
  { id: 'details', name: 'Details' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'twitter', name: 'X/Twitter' },
];

// Fake comments for preview
const FAKE_COMMENTS = {
  instagram: [
    { user: 'sarah.designs', text: 'Love this! 😍🔥', verified: false },
    { user: 'mike_photo', text: 'Amazing content as always', verified: false },
    { user: 'lifestyle.mag', text: 'This is incredible! Can we feature this?', verified: true },
  ],
  tiktok: [
    { user: 'user8273', text: 'This is so satisfying to watch', likes: '2.4K' },
    { user: 'creativequeen', text: 'Tutorial please! 🙏', likes: '892' },
    { user: 'viralking', text: 'POV: you found the best content', likes: '1.1K' },
  ],
  twitter: [
    { user: 'techbro', text: 'This is the content I signed up for', likes: '142', retweets: '23' },
    { user: 'designlover', text: 'Bookmarked! 🔖', likes: '89', retweets: '12' },
  ],
};

// Random engagement generator
const getRandomEngagement = () => ({
  likes: Math.floor(Math.random() * 50000) + 1000,
  comments: Math.floor(Math.random() * 500) + 50,
  shares: Math.floor(Math.random() * 200) + 20,
  views: Math.floor(Math.random() * 500000) + 10000,
});

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

function PostDetails({ post }) {
  const navigate = useNavigate();
  const updatePost = useAppStore((state) => state.updatePost);
  const user = useAppStore((state) => state.user);
  const [caption, setCaption] = useState(post?.caption || '');
  const [hashtags, setHashtags] = useState(post?.hashtags?.join(' ') || '');
  const [activeTab, setActiveTab] = useState('details');
  const [engagement] = useState(getRandomEngagement);

  // User display info for previews
  const displayName = user?.name || 'Your Name';
  const username = user?.name?.toLowerCase().replace(/\s+/g, '_') || 'your_username';
  const userAvatar = user?.avatar;

  // Modal and loading states
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [generatingHashtags, setGeneratingHashtags] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showBestTimeModal, setShowBestTimeModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('12:00');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram']);
  const [scheduling, setScheduling] = useState(false);
  const [posting, setPosting] = useState(false);
  const [bestTimes, setBestTimes] = useState(null);
  const [loadingBestTimes, setLoadingBestTimes] = useState(false);

  if (!post) {
    return (
      <div className="h-full bg-dark-800 rounded-2xl border border-dark-700 p-6 flex flex-col items-center justify-center text-center">
        <Image className="w-12 h-12 text-dark-500 mb-4" />
        <p className="text-dark-300 mb-2">No post selected</p>
        <p className="text-sm text-dark-500">
          Click on a grid item to view and edit its details
        </p>
      </div>
    );
  }

  // Update local state immediately for responsive typing
  const handleCaptionChange = (value) => {
    setCaption(value);
  };

  // Save to store only on blur to prevent re-render issues
  const handleCaptionBlur = () => {
    updatePost(post.id, { caption });
  };

  const handleHashtagsChange = (value) => {
    setHashtags(value);
  };

  // Save hashtags to store on blur
  const handleHashtagsBlur = () => {
    const tags = hashtags
      .split(/[\s,#]+/)
      .filter((tag) => tag.length > 0)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));
    updatePost(post.id, { hashtags: tags });
  };

  // Generate caption with AI
  const handleGenerateCaption = async () => {
    setGeneratingCaption(true);
    try {
      const captions = await aiApi.generateCaption(caption || 'social media post', 'casual');
      if (captions && captions.length > 0) {
        const newCaption = captions[0];
        setCaption(newCaption);
        updatePost(post.id, { caption: newCaption });
      }
    } catch (error) {
      console.error('Failed to generate caption:', error);
      // Fallback: generate a simple caption locally
      const fallbackCaptions = [
        "✨ New post alert! Double tap if you love this! 💕",
        "Living my best life 🌟 What do you think?",
        "Good vibes only ✌️ Drop a comment below!",
        "Sharing a moment with you all 📸 #blessed",
      ];
      const newCaption = fallbackCaptions[Math.floor(Math.random() * fallbackCaptions.length)];
      setCaption(newCaption);
      updatePost(post.id, { caption: newCaption });
    } finally {
      setGeneratingCaption(false);
    }
  };

  // Suggest hashtags with AI
  const handleSuggestHashtags = async () => {
    setGeneratingHashtags(true);
    try {
      const suggestedTags = await aiApi.generateHashtags(post.id || post._id, 10);
      if (suggestedTags && suggestedTags.length > 0) {
        const newHashtags = suggestedTags.join(' ');
        setHashtags(newHashtags);
        updatePost(post.id, { hashtags: suggestedTags });
      }
    } catch (error) {
      console.error('Failed to suggest hashtags:', error);
      // Fallback: generate common hashtags
      const fallbackTags = ['#instagood', '#photooftheday', '#love', '#beautiful', '#happy', '#picoftheday', '#instadaily', '#amazing', '#style', '#lifestyle'];
      const selectedTags = fallbackTags.slice(0, 5 + Math.floor(Math.random() * 5));
      const newHashtags = selectedTags.join(' ');
      setHashtags(newHashtags);
      updatePost(post.id, { hashtags: selectedTags });
    } finally {
      setGeneratingHashtags(false);
    }
  };

  // Open schedule modal
  const handleOpenScheduleModal = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split('T')[0]);
    setScheduleTime('12:00');
    setSelectedPlatforms(['instagram']);
    setShowScheduleModal(true);
  };

  // Schedule post
  const handleSchedulePost = async () => {
    if (!scheduleDate || !scheduleTime) return;
    setScheduling(true);
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
      await postingApi.schedulePost(post.id || post._id, selectedPlatforms, scheduledAt.toISOString(), { caption, hashtags: hashtags.split(/[\s,#]+/).filter(t => t) });
      setShowScheduleModal(false);
      alert('Post scheduled successfully!');
    } catch (error) {
      console.error('Failed to schedule post:', error);
      alert('Failed to schedule post. Please try again.');
    } finally {
      setScheduling(false);
    }
  };

  // Post now
  const handlePostNow = async () => {
    setPosting(true);
    try {
      await postingApi.postNow(post.id || post._id, selectedPlatforms, { caption, hashtags: hashtags.split(/[\s,#]+/).filter(t => t) });
      alert('Post published successfully!');
    } catch (error) {
      console.error('Failed to post:', error);
      alert('Failed to publish post. Please check your platform connections.');
    } finally {
      setPosting(false);
    }
  };

  // Get best time to post
  const handleGetBestTime = async () => {
    setShowBestTimeModal(true);
    setLoadingBestTimes(true);
    try {
      const data = await aiApi.getOptimalTiming('instagram', 'image');
      setBestTimes(data);
    } catch (error) {
      console.error('Failed to get best times:', error);
      // Fallback best times
      setBestTimes({
        bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
        bestHours: ['9:00 AM', '12:00 PM', '7:00 PM'],
        recommendation: 'Based on general engagement patterns, posting on weekday mornings or evenings tends to perform best.',
      });
    } finally {
      setLoadingBestTimes(false);
    }
  };

  const togglePlatform = (platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  // Instagram Preview Component
  const InstagramPreview = () => (
    <div className="bg-black rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 overflow-hidden">
            {userAvatar ? (
              <img src={userAvatar} alt="" className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{username}</p>
            <p className="text-gray-400 text-xs">Original</p>
          </div>
        </div>
        <MoreHorizontal className="w-5 h-5 text-white" />
      </div>

      {/* Image */}
      <div className="aspect-square bg-gray-900">
        {post.image ? (
          <img src={post.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: post.color || '#1f1f1f' }}>
            <Image className="w-12 h-12 text-gray-600" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Heart className="w-6 h-6 text-white cursor-pointer hover:text-red-500 transition-colors" fill="none" />
            <MessageCircle className="w-6 h-6 text-white cursor-pointer" />
            <Share2 className="w-6 h-6 text-white cursor-pointer" />
          </div>
          <Bookmark className="w-6 h-6 text-white cursor-pointer" />
        </div>

        {/* Likes */}
        <p className="text-white text-sm font-semibold mb-1">
          {formatNumber(engagement.likes)} likes
        </p>

        {/* Caption */}
        <p className="text-white text-sm">
          <span className="font-semibold">{username}</span>{' '}
          <span className="text-gray-300">{caption || 'Your caption will appear here...'}</span>
        </p>

        {/* Comments */}
        <p className="text-gray-400 text-sm mt-2 cursor-pointer">
          View all {engagement.comments} comments
        </p>

        <div className="mt-2 space-y-1">
          {FAKE_COMMENTS.instagram.map((comment, i) => (
            <p key={i} className="text-sm">
              <span className="text-white font-semibold">{comment.user}</span>{' '}
              <span className="text-gray-300">{comment.text}</span>
            </p>
          ))}
        </div>

        <p className="text-gray-500 text-xs mt-2 uppercase">2 hours ago</p>
      </div>
    </div>
  );

  // TikTok Preview Component
  const TikTokPreview = () => (
    <div className="bg-black rounded-xl overflow-hidden relative" style={{ aspectRatio: '9/16', maxHeight: '500px' }}>
      {/* Background Image/Video */}
      <div className="absolute inset-0">
        {post.image ? (
          <img src={post.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: post.color || '#1f1f1f' }}>
            <Play className="w-16 h-16 text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* Right Actions */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white overflow-hidden">
            {userAvatar ? (
              <img src={userAvatar} alt="" className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div className="w-5 h-5 rounded-full bg-red-500 -mt-2 flex items-center justify-center">
            <span className="text-white text-xs">+</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <Heart className="w-8 h-8 text-white" fill="white" />
          <span className="text-white text-xs mt-1">{formatNumber(engagement.likes)}</span>
        </div>

        <div className="flex flex-col items-center">
          <MessageCircle className="w-8 h-8 text-white" />
          <span className="text-white text-xs mt-1">{formatNumber(engagement.comments)}</span>
        </div>

        <div className="flex flex-col items-center">
          <Bookmark className="w-8 h-8 text-white" />
          <span className="text-white text-xs mt-1">{formatNumber(engagement.shares)}</span>
        </div>

        <div className="flex flex-col items-center">
          <Share2 className="w-8 h-8 text-white" />
          <span className="text-white text-xs mt-1">Share</span>
        </div>

        <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-600 overflow-hidden animate-spin" style={{ animationDuration: '3s' }}>
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
        </div>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-4 left-3 right-16">
        <p className="text-white font-semibold text-sm mb-1">@{username}</p>
        <p className="text-white text-sm mb-2 line-clamp-2">
          {caption || 'Your caption will appear here...'} {hashtags || '#fyp #viral #trending'}
        </p>
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-white" />
          <p className="text-white text-xs">Original Sound - {username}</p>
        </div>
      </div>

      {/* View count */}
      <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/50 px-2 py-1 rounded">
        <Eye className="w-4 h-4 text-white" />
        <span className="text-white text-xs">{formatNumber(engagement.views)}</span>
      </div>

      {/* Comments Overlay */}
      <div className="absolute bottom-32 left-3 right-16 space-y-2">
        {FAKE_COMMENTS.tiktok.slice(0, 2).map((comment, i) => (
          <div key={i} className="bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1">
            <p className="text-white text-xs">
              <span className="font-semibold">{comment.user}</span> {comment.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  // Twitter/X Preview Component
  const TwitterPreview = () => (
    <div className="bg-black rounded-xl overflow-hidden border border-gray-800">
      {/* Header */}
      <div className="p-3">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 overflow-hidden">
            {userAvatar ? (
              <img src={userAvatar} alt="" className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="text-white font-bold text-sm">{displayName}</span>
              <span className="text-gray-500 text-sm">@{username}</span>
              <span className="text-gray-500 text-sm">· 2h</span>
            </div>

            {/* Tweet Text */}
            <p className="text-white text-sm mt-1">
              {caption || 'Your tweet will appear here...'}
            </p>

            {/* Image */}
            {post.image && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-gray-800">
                <img src={post.image} alt="" className="w-full object-cover" style={{ maxHeight: '300px' }} />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between mt-3 max-w-md">
              <div className="flex items-center gap-1 text-gray-500 hover:text-blue-400 cursor-pointer">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{engagement.comments}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500 hover:text-green-400 cursor-pointer">
                <Share2 className="w-4 h-4" />
                <span className="text-xs">{engagement.shares}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500 hover:text-red-400 cursor-pointer">
                <Heart className="w-4 h-4" />
                <span className="text-xs">{formatNumber(engagement.likes)}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500 hover:text-blue-400 cursor-pointer">
                <Eye className="w-4 h-4" />
                <span className="text-xs">{formatNumber(engagement.views)}</span>
              </div>
              <Bookmark className="w-4 h-4 text-gray-500 hover:text-blue-400 cursor-pointer" />
            </div>
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="border-t border-gray-800">
        {FAKE_COMMENTS.twitter.map((comment, i) => (
          <div key={i} className="p-3 border-b border-gray-800 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-white font-bold text-sm">{comment.user}</span>
                <span className="text-gray-500 text-xs">· 1h</span>
              </div>
              <p className="text-gray-300 text-sm">{comment.text}</p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-gray-500 text-xs">{comment.likes} likes</span>
                <span className="text-gray-500 text-xs">{comment.retweets} reposts</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Details Tab Content
  const DetailsContent = () => (
    <>
      {/* Preview Image */}
      <div className="aspect-square bg-dark-700 relative flex-shrink-0">
        {post.image ? (
          <img
            src={post.image}
            alt={post.caption || 'Post preview'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: post.color || '#3f3f46' }}
          >
            <Image className="w-16 h-16 text-white/30" />
          </div>
        )}

        {/* Edit Overlay */}
        <button
          onClick={() => navigate('/editor', { state: { postId: post.id } })}
          className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 hover:opacity-100"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Edit3 className="w-4 h-4 text-white" />
            <span className="text-white font-medium">Edit Image</span>
          </div>
        </button>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Caption */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-dark-200 mb-2">
            <Type className="w-4 h-4" />
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => handleCaptionChange(e.target.value)}
            onBlur={handleCaptionBlur}
            placeholder="Write a caption..."
            className="input min-h-[100px] resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-dark-500">
              {caption.length}/2200 characters
            </span>
            <button
              onClick={handleGenerateCaption}
              disabled={generatingCaption}
              className="text-xs text-accent-purple hover:text-accent-purple/80 flex items-center gap-1 disabled:opacity-50"
            >
              {generatingCaption ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Generate with AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hashtags */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-dark-200 mb-2">
            <Hash className="w-4 h-4" />
            Hashtags
          </label>
          <textarea
            value={hashtags}
            onChange={(e) => handleHashtagsChange(e.target.value)}
            onBlur={handleHashtagsBlur}
            placeholder="#fashion #style #ootd"
            className="input min-h-[60px] resize-none text-accent-blue"
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-dark-500">
              {post.hashtags?.length || 0}/30 hashtags
            </span>
            <button
              onClick={handleSuggestHashtags}
              disabled={generatingHashtags}
              className="text-xs text-accent-purple hover:text-accent-purple/80 flex items-center gap-1 disabled:opacity-50"
            >
              {generatingHashtags ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Suggesting...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Suggest hashtags
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 space-y-2">
          <button
            onClick={() => navigate('/editor', { state: { postId: post.id } })}
            className="w-full btn-secondary justify-start"
          >
            <Wand2 className="w-4 h-4" />
            Open in Editor
          </button>

          <button onClick={handleOpenScheduleModal} className="w-full btn-secondary justify-start">
            <Calendar className="w-4 h-4" />
            Schedule Post
          </button>

          <button onClick={handleGetBestTime} className="w-full btn-secondary justify-start">
            <Clock className="w-4 h-4" />
            Best Time to Post
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="h-full bg-dark-800 rounded-2xl border border-dark-700 flex flex-col overflow-hidden">
      {/* Platform Tabs */}
      <div className="flex border-b border-dark-700 flex-shrink-0">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.id}
            onClick={() => setActiveTab(platform.id)}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === platform.id
                ? 'text-accent-purple border-b-2 border-accent-purple bg-accent-purple/5'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            {platform.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        {activeTab === 'details' && <DetailsContent />}
        {activeTab === 'instagram' && (
          <div className="p-4">
            <p className="text-xs text-dark-400 mb-3 text-center">Preview how your post will look on Instagram</p>
            <InstagramPreview />
          </div>
        )}
        {activeTab === 'tiktok' && (
          <div className="p-4 flex justify-center">
            <div className="w-full max-w-[280px]">
              <p className="text-xs text-dark-400 mb-3 text-center">Preview how your post will look on TikTok</p>
              <TikTokPreview />
            </div>
          </div>
        )}
        {activeTab === 'twitter' && (
          <div className="p-4">
            <p className="text-xs text-dark-400 mb-3 text-center">Preview how your post will look on X/Twitter</p>
            <TwitterPreview />
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-dark-700 flex gap-2 flex-shrink-0">
        <button onClick={handleOpenScheduleModal} className="flex-1 btn-secondary">
          <Calendar className="w-4 h-4" />
          Schedule
        </button>
        <button
          onClick={handlePostNow}
          disabled={posting}
          className="flex-1 btn-primary disabled:opacity-50"
        >
          {posting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Posting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Post Now
            </>
          )}
        </button>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-2xl border border-dark-700 w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <h3 className="text-lg font-semibold text-dark-100">Schedule Post</h3>
              <button onClick={() => setShowScheduleModal(false)} className="btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="input w-full"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {['instagram', 'tiktok', 'twitter', 'facebook'].map((platform) => (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                        selectedPlatforms.includes(platform)
                          ? 'bg-accent-purple text-white'
                          : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-dark-700 flex gap-2">
              <button onClick={() => setShowScheduleModal(false)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSchedulePost}
                disabled={!scheduleDate || !scheduleTime || scheduling}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {scheduling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Best Time Modal */}
      {showBestTimeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-2xl border border-dark-700 w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <h3 className="text-lg font-semibold text-dark-100">Best Time to Post</h3>
              <button onClick={() => setShowBestTimeModal(false)} className="btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {loadingBestTimes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-accent-purple" />
                </div>
              ) : bestTimes ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-dark-200 mb-2">Best Days</h4>
                    <div className="flex flex-wrap gap-2">
                      {bestTimes.bestDays?.map((day) => (
                        <span key={day} className="px-3 py-1 bg-accent-purple/20 text-accent-purple rounded-lg text-sm">
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-dark-200 mb-2">Best Times</h4>
                    <div className="flex flex-wrap gap-2">
                      {bestTimes.bestHours?.map((time) => (
                        <span key={time} className="px-3 py-1 bg-accent-blue/20 text-accent-blue rounded-lg text-sm">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>

                  {bestTimes.recommendation && (
                    <div className="p-3 bg-dark-700 rounded-lg">
                      <p className="text-sm text-dark-300">{bestTimes.recommendation}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-dark-400 py-4">Unable to load best times</p>
              )}
            </div>

            <div className="p-4 border-t border-dark-700">
              <button onClick={() => setShowBestTimeModal(false)} className="w-full btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostDetails;
