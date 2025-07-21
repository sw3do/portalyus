import React, { memo, useMemo } from 'react';
import { PlayIcon, EyeIcon } from '@heroicons/react/24/solid';
import { getUploadsUrl } from '../config/env';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    description?: string;
    slug: string;
    thumbnail?: string;
    duration?: number;
    view_count?: number;
    created_at: string;
    channel_name: string;
    channel_slug: string;
    channel_profile_image?: string;
    category_name: string;
    category_slug: string;
  };
  size?: 'small' | 'medium' | 'large';
}

const VideoCard: React.FC<VideoCardProps> = memo(({ video, size = 'medium' }) => {
  const formattedDuration = useMemo(() => {
    if (!video.duration) return '';
    const minutes = Math.floor(video.duration / 60);
    const remainingSeconds = video.duration % 60;
    return `${minutes}:${Math.floor(remainingSeconds).toString().padStart(2, '0')}`;
  }, [video.duration]);

  const formattedViewCount = useMemo(() => {
    const count = video.view_count;
    if (!count && count !== 0) return '0';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }, [video.view_count]);

  const formattedDate = useMemo(() => {
    const date = new Date(video.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 gün önce';
    if (diffDays < 7) return `${diffDays} gün önce`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} ay önce`;
    return `${Math.floor(diffDays / 365)} yıl önce`;
  }, [video.created_at]);

  const thumbnailUrl = useMemo(() => {
    return video.thumbnail ? getUploadsUrl(`/${video.thumbnail}`) : null;
  }, [video.thumbnail]);

  const channelImageUrl = useMemo(() => {
    return video.channel_profile_image ? getUploadsUrl(`/${video.channel_profile_image}`) : null;
  }, [video.channel_profile_image]);

  const sizeClasses = {
    small: 'w-full max-w-sm',
    medium: 'w-full max-w-md',
    large: 'w-full max-w-lg'
  };

  return (
    <div className={`${sizeClasses[size]} group bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-gray-700 hover:border-blue-500/50`}>
      <div className="relative overflow-hidden">
        <a href={`/video/${video.slug}`}>
          <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 relative overflow-hidden rounded-t-xl">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-purple-600/20">
                <PlayIcon className="w-16 h-16 text-gray-400" />
              </div>
            )}
            
            {/* Play overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                <PlayIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            
            {/* Duration */}
            {formattedDuration && (
              <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium">
                {formattedDuration}
              </div>
            )}
          </div>
        </a>
      </div>
      
      <div className="p-5">
        <a href={`/video/${video.slug}`} className="block">
          <h3 className="text-white font-semibold text-lg mb-3 line-clamp-2 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400 transition-all duration-300 leading-tight">
            {video.title}
          </h3>
        </a>
        
        <div className="flex items-center space-x-3 mb-3">
          <a href={`/kanal/${video.channel_slug}`} className="flex items-center space-x-2 hover:text-blue-400 transition-colors group/channel">
            {channelImageUrl ? (
              <img
                src={channelImageUrl}
                alt={video.channel_name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-600 group-hover/channel:ring-blue-400 transition-all duration-300"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center ring-2 ring-gray-600 group-hover/channel:ring-blue-400 transition-all duration-300">
                <span className="text-sm text-white font-bold">{video.channel_name.charAt(0)}</span>
              </div>
            )}
            <span className="text-gray-300 text-sm font-medium group-hover/channel:text-blue-400 transition-colors">{video.channel_name}</span>
          </a>
        </div>
        
        <div className="flex items-center justify-between text-gray-400 text-sm mb-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <EyeIcon className="w-4 h-4 text-blue-400" />
              <span>{formattedViewCount} görüntüleme</span>
            </div>
            <span className="text-gray-500">•</span>
            <span>{formattedDate}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <a 
            href={`/kategori/${video.category_slug}`}
            className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs px-3 py-1.5 rounded-full transition-all duration-300 transform hover:scale-105 font-medium"
          >
            {video.category_name}
          </a>
        </div>
        
        {video.description && (
          <p className="text-gray-400 text-sm mt-3 line-clamp-2 leading-relaxed">
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
});

VideoCard.displayName = 'VideoCard';

export default VideoCard;