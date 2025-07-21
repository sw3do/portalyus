import React, { memo, useMemo } from 'react';
import { PlayIcon } from '@heroicons/react/24/solid';
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
    if (!video.thumbnail) return null;
    const path = video.thumbnail.startsWith('thumbnails/') ? video.thumbnail : `thumbnails/${video.thumbnail}`;
    return getUploadsUrl(`/${path}`);
  }, [video.thumbnail]);

  const channelImageUrl = useMemo(() => {
    return video.channel_profile_image ? getUploadsUrl(`/channels/${video.channel_profile_image}`) : null;
  }, [video.channel_profile_image]);

  const cardClasses = useMemo(() => {
    const baseClasses = "group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-lg sm:rounded-xl overflow-hidden border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20";
    
    switch (size) {
      case 'small':
        return `${baseClasses} w-full max-w-xs sm:max-w-sm`;
      case 'large':
        return `${baseClasses} w-full max-w-sm sm:max-w-md lg:max-w-lg`;
      default:
        return `${baseClasses} w-full max-w-xs sm:max-w-sm`;
    }
  }, [size]);

  return (
    <div className={`${cardClasses} cursor-pointer`}>
      <div className="relative overflow-hidden rounded-lg sm:rounded-xl mb-2 sm:mb-3">
        <a href={`/video/${video.slug}`}>
          <div className="aspect-video bg-gray-900 relative overflow-hidden rounded-lg sm:rounded-xl">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <PlayIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500" />
              </div>
            )}
            
            {formattedDuration && (
              <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded font-medium">
                {formattedDuration}
              </div>
            )}
          </div>
        </a>
      </div>
      
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <a href={`/kanal/${video.channel_slug}`} className="block">
            {channelImageUrl ? (
              <img
                src={channelImageUrl}
                alt={video.channel_name}
                className="w-9 h-9 rounded-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-sm text-white font-bold">{video.channel_name.charAt(0)}</span>
              </div>
            )}
          </a>
        </div>
        
        <div className="flex-1 min-w-0">
          <a href={`/video/${video.slug}`} className="block">
            <h3 className="text-white font-medium text-sm sm:text-base leading-tight line-clamp-2 mb-1 group-hover:text-gray-200 transition-colors">
              {video.title}
            </h3>
          </a>
          
          <div className="text-gray-400 text-xs sm:text-sm space-y-1">
            <a href={`/kanal/${video.channel_slug}`} className="block hover:text-gray-300 transition-colors truncate">
              {video.channel_name}
            </a>
            <div className="flex items-center space-x-1">
              <span>{formattedDate}</span>
            </div>
          </div>
          
          <div className="mt-1 sm:mt-2">
            <a 
              href={`/kategori/${video.category_slug}`}
              className="inline-block bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded transition-colors"
            >
              {video.category_name}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});

VideoCard.displayName = 'VideoCard';

export default VideoCard;