import { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useNavigate } from 'react-router-dom';
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
  const [caption, setCaption] = useState(post?.caption || '');
  const [hashtags, setHashtags] = useState(post?.hashtags?.join(' ') || '');
  const [activeTab, setActiveTab] = useState('details');
  const [engagement] = useState(getRandomEngagement);

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

  const handleCaptionChange = (value) => {
    setCaption(value);
    updatePost(post.id, { caption: value });
  };

  const handleHashtagsChange = (value) => {
    setHashtags(value);
    const tags = value
      .split(/[\s,#]+/)
      .filter((tag) => tag.length > 0)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));
    updatePost(post.id, { hashtags: tags });
  };

  // Instagram Preview Component
  const InstagramPreview = () => (
    <div className="bg-black rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          <div>
            <p className="text-white text-sm font-semibold">your_username</p>
            <p className="text-gray-400 text-xs">Sponsored</p>
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
          <span className="font-semibold">your_username</span>{' '}
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white" />
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
        <p className="text-white font-semibold text-sm mb-1">@your_username</p>
        <p className="text-white text-sm mb-2 line-clamp-2">
          {caption || 'Your caption will appear here...'} {hashtags || '#fyp #viral #trending'}
        </p>
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-white" />
          <p className="text-white text-xs">Original Sound - your_username</p>
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <span className="text-white font-bold text-sm">Your Name</span>
              <span className="text-gray-500 text-sm">@your_username</span>
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
            placeholder="Write a caption..."
            className="input min-h-[100px] resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-dark-500">
              {caption.length}/2200 characters
            </span>
            <button className="text-xs text-accent-purple hover:text-accent-purple/80 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Generate with AI
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
            placeholder="#fashion #style #ootd"
            className="input min-h-[60px] resize-none text-accent-blue"
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-dark-500">
              {post.hashtags?.length || 0}/30 hashtags
            </span>
            <button className="text-xs text-accent-purple hover:text-accent-purple/80 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Suggest hashtags
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

          <button className="w-full btn-secondary justify-start">
            <Calendar className="w-4 h-4" />
            Schedule Post
          </button>

          <button className="w-full btn-secondary justify-start">
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
        <button className="flex-1 btn-secondary">
          <Calendar className="w-4 h-4" />
          Schedule
        </button>
        <button className="flex-1 btn-primary">
          <Send className="w-4 h-4" />
          Post Now
        </button>
      </div>
    </div>
  );
}

export default PostDetails;
