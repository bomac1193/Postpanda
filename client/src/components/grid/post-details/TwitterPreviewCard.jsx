import React from 'react';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Eye,
} from 'lucide-react';
import { FAKE_COMMENTS, formatNumber } from './constants';

const TwitterPreviewCard = React.memo(function TwitterPreviewCard({
  croppedSrc,
  cropStyles,
  caption,
  displayName,
  username,
  userAvatar,
  engagement,
}) {
  return (
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
            {croppedSrc && (
              <div
                className="mt-3 rounded-2xl border border-gray-800 bg-gray-900 w-full overflow-hidden"
                style={{ aspectRatio: '16/9', ...cropStyles.containerStyle }}
              >
                <img
                  src={croppedSrc}
                  alt=""
                  className="select-none"
                  style={cropStyles.imageStyle}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                />
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
});

export default TwitterPreviewCard;
