import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  Cog6ToothIcon,
  BackwardIcon,
  ForwardIcon,
  FilmIcon,
  RectangleStackIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid';
import {
  RectangleGroupIcon
} from '@heroicons/react/24/outline';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
}

interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  showControls: boolean;
  isLoading: boolean;
  playbackRate: number;
  quality: string;
  buffered: number;
  isPictureInPicture: boolean;
  hasError: boolean;
  errorMessage: string;
  isWaiting: boolean;
  canPlay: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  title,
  autoPlay = false,
  muted = false,
  loop = false,
  className = '',
  onTimeUpdate,
  onEnded,
  onPlay,
  onPause
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<VideoState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: muted,
    isFullscreen: false,
    showControls: true,
    isLoading: false,
    playbackRate: 1,
    quality: 'auto',
    buffered: 0,
    isPictureInPicture: false,
    hasError: false,
    errorMessage: '',
    isWaiting: false,
    canPlay: false
  });

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [showThumbnail, setShowThumbnail] = useState(false);
  const [thumbnailTime, setThumbnailTime] = useState(0);
  const [thumbnailPosition, setThumbnailPosition] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  const formatTime = useCallback((time: number): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    
    if (state.isPlaying) {
      videoRef.current.pause();
      onPause?.();
    } else {
      videoRef.current.play();
      onPlay?.();
    }
  }, [state.isPlaying, onPlay, onPause]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || isDragging) return;
    
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    
    setState(prev => ({ ...prev, currentTime, duration }));
    onTimeUpdate?.(currentTime, duration);
  }, [isDragging, onTimeUpdate]);

  const handleLoadStart = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true, hasError: false }));
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return;
    
    setState(prev => ({
      ...prev,
      duration: videoRef.current!.duration,
      hasError: false
    }));
  }, []);

  const handleCanPlay = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: false, canPlay: true, isWaiting: false }));
  }, []);

  const handleLoadedData = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: false, canPlay: true }));
  }, []);

  const handleWaiting = useCallback(() => {
    setState(prev => ({ ...prev, isWaiting: true }));
  }, []);

  const handleError = useCallback(() => {
    if (!videoRef.current) return;
    const error = videoRef.current.error;
    let errorMessage = 'Video yüklenirken bir hata oluştu';
    
    if (error) {
      switch (error.code) {
        case error.MEDIA_ERR_ABORTED:
          errorMessage = 'Video yükleme iptal edildi';
          break;
        case error.MEDIA_ERR_NETWORK:
          errorMessage = 'Ağ hatası nedeniyle video yüklenemedi';
          break;
        case error.MEDIA_ERR_DECODE:
          errorMessage = 'Video dosyası bozuk veya desteklenmiyor';
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Video formatı desteklenmiyor';
          break;
      }
    }
    
    setState(prev => ({
      ...prev,
      hasError: true,
      errorMessage,
      isLoading: false,
      isWaiting: false
    }));
  }, []);

  const handleProgress = useCallback(() => {
    if (!videoRef.current) return;
    
    const buffered = videoRef.current.buffered;
    if (buffered.length > 0) {
      const bufferedEnd = buffered.end(buffered.length - 1);
      const duration = videoRef.current.duration;
      setState(prev => ({ ...prev, buffered: duration ? (bufferedEnd / duration) * 100 : 0 }));
    }
  }, []);

  const handlePlay = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const handlePause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const handleEnded = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
    onEnded?.();
  }, [onEnded]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * state.duration;
    
    videoRef.current.currentTime = newTime;
    setState(prev => ({ ...prev, currentTime: newTime }));
  }, [state.duration]);

  const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);
  }, [handleProgressClick]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !progressRef.current || !videoRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * state.duration;
    
    videoRef.current.currentTime = newTime;
    setState(prev => ({ ...prev, currentTime: newTime }));
  }, [isDragging, state.duration]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    
    const newMuted = !state.isMuted;
    videoRef.current.muted = newMuted;
    setState(prev => ({ ...prev, isMuted: newMuted }));
  }, [state.isMuted]);

  const handleVolumeChange = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !volumeRef.current) return;
    
    const rect = volumeRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const percentage = Math.max(0, Math.min(1, 1 - (clickY / rect.height)));
    
    videoRef.current.volume = percentage;
    setState(prev => ({ ...prev, volume: percentage, isMuted: percentage === 0 }));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!state.isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [state.isFullscreen]);

  const skipTime = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    
    const newTime = Math.max(0, Math.min(state.duration, state.currentTime + seconds));
    videoRef.current.currentTime = newTime;
    setState(prev => ({ ...prev, currentTime: newTime }));
  }, [state.currentTime, state.duration]);

  const changePlaybackRate = useCallback((rate: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.playbackRate = rate;
    setState(prev => ({ ...prev, playbackRate: rate }));
    setShowSettings(false);
  }, []);

  const togglePictureInPicture = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      if (state.isPictureInPicture) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('Picture-in-Picture hatası:', error);
    }
  }, [state.isPictureInPicture]);

  const handlePictureInPictureChange = useCallback(() => {
    setState(prev => ({ ...prev, isPictureInPicture: !!document.pictureInPictureElement }));
  }, []);

  const retryVideo = useCallback(() => {
    if (!videoRef.current) return;
    
    setState(prev => ({
      ...prev,
      hasError: false,
      errorMessage: '',
      isLoading: false,
      canPlay: false,
      isWaiting: false
    }));
    
    videoRef.current.load();
  }, []);

  const handleDoubleClick = useCallback(() => {
    toggleFullscreen();
  }, [toggleFullscreen]);

  const handleTouchStart = useCallback(() => {
    const currentTime = Date.now();
    const tapLength = currentTime - lastTapTime;
    
    if (tapLength < 500 && tapLength > 0) {
      toggleFullscreen();
    }
    
    setLastTapTime(currentTime);
  }, [lastTapTime, toggleFullscreen]);

  const showControlsTemporarily = useCallback(() => {
    setState(prev => ({ ...prev, showControls: true }));
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (state.isPlaying) {
        setState(prev => ({ ...prev, showControls: false }));
      }
    }, 3000);
  }, [state.isPlaying]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!videoRef.current) return;
    
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        skipTime(-10);
        break;
      case 'ArrowRight':
        e.preventDefault();
        skipTime(10);
        break;
      case 'ArrowUp':
        e.preventDefault();
        const newVolumeUp = Math.min(1, state.volume + 0.1);
        videoRef.current.volume = newVolumeUp;
        setState(prev => ({ ...prev, volume: newVolumeUp, isMuted: false }));
        break;
      case 'ArrowDown':
        e.preventDefault();
        const newVolumeDown = Math.max(0, state.volume - 0.1);
        videoRef.current.volume = newVolumeDown;
        setState(prev => ({ ...prev, volume: newVolumeDown, isMuted: newVolumeDown === 0 }));
        break;
      case 'KeyM':
        e.preventDefault();
        toggleMute();
        break;
      case 'KeyF':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'KeyP':
        e.preventDefault();
        if (document.pictureInPictureEnabled) {
          togglePictureInPicture();
        }
        break;
    }
    showControlsTemporarily();
  }, [togglePlay, skipTime, state.volume, toggleMute, toggleFullscreen, togglePictureInPicture, showControlsTemporarily]);

  const handleProgressHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !state.duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percentage = hoverX / rect.width;
    const hoverTime = percentage * state.duration;
    
    setThumbnailTime(hoverTime);
    setThumbnailPosition(hoverX);
    setShowThumbnail(true);
  }, [state.duration]);

  const handleProgressLeave = useCallback(() => {
    setShowThumbnail(false);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setState(prev => ({ ...prev, isFullscreen: !!document.fullscreenElement }));
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('enterpictureinpicture', handlePictureInPictureChange);
    document.addEventListener('leavepictureinpicture', handlePictureInPictureChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('enterpictureinpicture', handlePictureInPictureChange);
      document.removeEventListener('leavepictureinpicture', handlePictureInPictureChange);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [handleMouseMove, handleMouseUp, handleKeyDown, handlePictureInPictureChange]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('error', handleError);
    video.addEventListener('progress', handleProgress);
    
    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('error', handleError);
      video.removeEventListener('progress', handleProgress);
    };
  }, [handleLoadStart, handleTimeUpdate, handleLoadedMetadata, handleLoadedData, handlePlay, handlePause, handleEnded, handleCanPlay, handleWaiting, handleError, handleProgress]);

  useEffect(() => {
    if (state.isPlaying) {
      showControlsTemporarily();
    } else {
      setState(prev => ({ ...prev, showControls: true }));
    }
  }, [state.isPlaying, showControlsTemporarily]);

  const progressPercentage = state.duration ? (state.currentTime / state.duration) * 100 : 0;
  const volumePercentage = state.volume * 100;
  const bufferedPercentage = state.buffered;

  return (
    <div
      ref={containerRef}
      className={`relative bg-black group ${className} focus:outline-none`}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => {
        setShowVolumeSlider(false);
        setShowSettings(false);
      }}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={state.isMuted}
        loop={loop}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        preload="auto"
      />
      
      {state.hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className={`relative transition-all duration-300 ${state.isFullscreen ? 'mb-8 md:mb-10' : 'mb-6'}`}>
            <div className={`bg-red-500/20 rounded-full flex items-center justify-center transition-all duration-300 ${state.isFullscreen ? 'w-24 h-24 md:w-28 md:h-28' : 'w-20 h-20'}`}>
              <ExclamationTriangleIcon className={`text-red-400 transition-all duration-300 ${state.isFullscreen ? 'w-12 h-12 md:w-14 md:h-14' : 'w-10 h-10'}`} />
            </div>
          </div>
          <div className={`text-white font-semibold mb-2 transition-all duration-300 ${state.isFullscreen ? 'text-xl md:text-2xl mb-3' : 'text-lg'}`}>
            Video Hatası
          </div>
          <div className={`text-white/70 text-center max-w-md px-4 transition-all duration-300 ${state.isFullscreen ? 'text-base md:text-lg mb-8 max-w-lg' : 'text-sm mb-6'}`}>
            {state.errorMessage}
          </div>
          <button
            onClick={retryVideo}
            className={`flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${state.isFullscreen ? 'px-8 py-4 md:px-10 md:py-5 text-base md:text-lg space-x-3' : 'px-6 py-3'}`}
          >
            <ArrowPathIcon className={`${state.isFullscreen ? 'w-6 h-6 md:w-7 md:h-7' : 'w-5 h-5'}`} />
            <span>Tekrar Dene</span>
          </button>
        </div>
      )}

      {(state.isLoading || state.isWaiting) && !state.hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900/80 via-black/80 to-gray-900/80 backdrop-blur-sm">
          <div className="relative">
            <div className={`border-4 border-red-500/30 rounded-full animate-pulse transition-all duration-300 ${state.isFullscreen ? 'w-20 h-20 md:w-24 md:h-24' : 'w-16 h-16'}`}></div>
            <div className={`absolute inset-0 border-4 border-transparent border-t-red-500 rounded-full animate-spin transition-all duration-300 ${state.isFullscreen ? 'w-20 h-20 md:w-24 md:h-24' : 'w-16 h-16'}`}></div>
            <div className={`absolute border-2 border-transparent border-t-white/50 rounded-full animate-spin transition-all duration-300 ${state.isFullscreen ? 'inset-3 w-14 h-14 md:inset-4 md:w-16 md:h-16' : 'inset-2 w-12 h-12'}`} style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            <FilmIcon className={`absolute inset-0 m-auto text-white/80 transition-all duration-300 ${state.isFullscreen ? 'w-8 h-8 md:w-10 md:h-10' : 'w-6 h-6'}`} />
          </div>
          <div className={`mt-4 text-white/80 font-medium tracking-wide transition-all duration-300 ${state.isFullscreen ? 'text-base md:text-lg mt-6' : 'text-sm'}`}>
            {state.isLoading ? 'Video yükleniyor...' : 'Arabelleğe alınıyor...'}
          </div>
          <div className={`mt-2 flex transition-all duration-300 ${state.isFullscreen ? 'space-x-1.5 mt-4' : 'space-x-1'}`}>
            <div className={`bg-red-500 rounded-full animate-bounce transition-all duration-300 ${state.isFullscreen ? 'w-3 h-3 md:w-3.5 md:h-3.5' : 'w-2 h-2'}`} style={{animationDelay: '0ms'}}></div>
            <div className={`bg-red-500 rounded-full animate-bounce transition-all duration-300 ${state.isFullscreen ? 'w-3 h-3 md:w-3.5 md:h-3.5' : 'w-2 h-2'}`} style={{animationDelay: '150ms'}}></div>
            <div className={`bg-red-500 rounded-full animate-bounce transition-all duration-300 ${state.isFullscreen ? 'w-3 h-3 md:w-3.5 md:h-3.5' : 'w-2 h-2'}`} style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      )}
      
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          state.showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        
        {title && (
          <div className={`absolute z-10 transition-all duration-300 ${state.isFullscreen ? 'top-6 left-6 right-6 md:top-8 md:left-8 md:right-8' : 'top-4 left-4 right-4'}`}>
            <div className={`bg-black/40 backdrop-blur-sm rounded-lg border border-white/10 transition-all duration-300 ${state.isFullscreen ? 'px-6 py-3 md:px-8 md:py-4' : 'px-4 py-2'}`}>
              <h3 className={`text-white font-semibold truncate transition-all duration-300 ${state.isFullscreen ? 'text-lg md:text-xl lg:text-2xl' : 'text-base sm:text-lg'}`}>{title}</h3>
            </div>
          </div>
        )}
        
        <div className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${state.isFullscreen ? 'p-4 md:p-6' : 'p-3 sm:p-4'}`}>
          <div className={`relative transition-all duration-300 ${state.isFullscreen ? 'mb-4 md:mb-6' : 'mb-3 sm:mb-4'}`}>
            <div
              ref={progressRef}
              className={`w-full bg-white/20 rounded-full cursor-pointer group/progress backdrop-blur-sm relative transition-all duration-200 ${state.isFullscreen ? 'h-2 md:h-2.5' : 'h-2 sm:h-1.5'}`}
              onClick={handleProgressClick}
              onMouseDown={handleProgressMouseDown}
              onMouseMove={handleProgressHover}
              onMouseLeave={handleProgressLeave}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-400 rounded-full opacity-20"></div>
              
              <div
                className="absolute inset-0 h-full bg-white/10 rounded-full transition-all duration-200"
                style={{ width: `${bufferedPercentage}%` }}
              />
              
              <div
                className={`h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full relative transition-all duration-200 shadow-lg z-10 ${state.isFullscreen ? 'group-hover/progress:h-3 md:group-hover/progress:h-3.5' : 'group-hover/progress:h-2.5 sm:group-hover/progress:h-2'}`}
                style={{ width: `${progressPercentage}%` }}
              >
                <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-all duration-200 shadow-lg border-2 border-red-500 ${state.isFullscreen ? 'w-5 h-5 md:w-6 md:h-6' : 'w-4 h-4 sm:w-3.5 sm:h-3.5'}`} />
              </div>
            </div>
            
            {showThumbnail && (
              <div
                className={`absolute bottom-full mb-2 bg-black/90 backdrop-blur-sm rounded-lg border border-white/10 shadow-xl pointer-events-none z-20 transition-all duration-200 ${state.isFullscreen ? 'p-3 md:p-4' : 'p-2'}`}
                style={{
                  left: `${Math.max(0, Math.min(thumbnailPosition - (state.isFullscreen ? 60 : 50), (progressRef.current?.offsetWidth || 0) - (state.isFullscreen ? 120 : 100)))}px`
                }}
              >
                <div className={`text-white font-mono transition-all duration-200 ${state.isFullscreen ? 'text-sm md:text-base' : 'text-xs'}`}>
                  {formatTime(thumbnailTime)}
                </div>
              </div>
            )}
          </div>
          
          <div className={`flex items-center justify-between text-white transition-all duration-300 ${state.isFullscreen ? 'text-lg' : ''}`}>
            <div className={`flex items-center transition-all duration-300 ${state.isFullscreen ? 'space-x-4 md:space-x-6' : 'space-x-2 sm:space-x-4'}`}>
              <button
                onClick={togglePlay}
                className={`hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 bg-black/20 backdrop-blur-sm border border-white/10 ${state.isFullscreen ? 'p-3 md:p-4' : 'p-2 sm:p-2.5'}`}
                title={state.isPlaying ? 'Duraklat' : 'Oynat'}
              >
                {state.isPlaying ? (
                  <PauseIcon className={`${state.isFullscreen ? 'w-6 h-6 md:w-8 md:h-8' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
                ) : (
                  <PlayIcon className={`${state.isFullscreen ? 'w-6 h-6 md:w-8 md:h-8' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
                )}
              </button>
              
              <button
                onClick={() => skipTime(-10)}
                className={`hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${state.isFullscreen ? 'p-2.5 md:p-3' : 'p-1.5 sm:p-2'}`}
                title="10 saniye geri"
              >
                <BackwardIcon className={`${state.isFullscreen ? 'w-5 h-5 md:w-6 md:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
              </button>
              
              <button
                onClick={() => skipTime(10)}
                className={`hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${state.isFullscreen ? 'p-2.5 md:p-3' : 'p-1.5 sm:p-2'}`}
                title="10 saniye ileri"
              >
                <ForwardIcon className={`${state.isFullscreen ? 'w-5 h-5 md:w-6 md:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
              </button>
              
              <div className="relative">
                 <button
                   onClick={toggleMute}
                   onMouseEnter={() => !('ontouchstart' in window) && setShowVolumeSlider(true)}
                   onTouchStart={() => setShowVolumeSlider(!showVolumeSlider)}
                   className={`hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${state.isFullscreen ? 'p-2.5 md:p-3' : 'p-1.5 sm:p-2'}`}
                   title={state.isMuted ? 'Sesi aç' : 'Sessiz'}
                 >
                   {state.isMuted || state.volume === 0 ? (
                     <SpeakerXMarkIcon className={`${state.isFullscreen ? 'w-5 h-5 md:w-6 md:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
                   ) : (
                     <SpeakerWaveIcon className={`${state.isFullscreen ? 'w-5 h-5 md:w-6 md:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
                   )}
                 </button>
                
                {showVolumeSlider && (
                  <div
                    className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/90 backdrop-blur-sm rounded-lg border border-white/10 shadow-xl transition-all duration-200 ${state.isFullscreen ? 'p-4 md:p-5' : 'p-3'}`}
                    onMouseLeave={() => !('ontouchstart' in window) && setShowVolumeSlider(false)}
                    onTouchEnd={() => setTimeout(() => setShowVolumeSlider(false), 2000)}
                  >
                    <div
                      ref={volumeRef}
                      className={`bg-white/20 rounded-full cursor-pointer relative transition-all duration-200 ${state.isFullscreen ? 'w-2 h-24 md:w-2.5 md:h-28' : 'w-1.5 h-20'}`}
                      onClick={handleVolumeChange}
                      onTouchMove={(e) => {
                        e.preventDefault();
                        const touch = e.touches[0];
                        const rect = volumeRef.current?.getBoundingClientRect();
                        if (rect) {
                          const clickY = touch.clientY - rect.top;
                          const percentage = Math.max(0, Math.min(1, 1 - (clickY / rect.height)));
                          if (videoRef.current) {
                            videoRef.current.volume = percentage;
                            setState(prev => ({ ...prev, volume: percentage, isMuted: percentage === 0 }));
                          }
                        }
                      }}
                    >
                      <div
                        className="absolute bottom-0 w-full bg-gradient-to-t from-red-600 to-red-400 rounded-full transition-all duration-200"
                        style={{ height: `${volumePercentage}%` }}
                      />
                      <div
                        className={`absolute bg-white rounded-full transform -translate-x-1/2 left-1/2 shadow-lg border border-red-500 transition-all duration-200 ${state.isFullscreen ? 'w-4 h-4 md:w-5 md:h-5' : 'w-3 h-3'}`}
                        style={{ bottom: `${volumePercentage}%`, transform: 'translate(-50%, 50%)' }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <span className={`font-mono bg-black/20 backdrop-blur-sm px-2 py-1 rounded border border-white/10 transition-all duration-200 ${state.isFullscreen ? 'text-sm md:text-base px-3 py-1.5' : 'text-xs sm:text-sm'}`}>
                {formatTime(state.currentTime)} / {formatTime(state.duration)}
              </span>
            </div>
            
            <div className={`flex items-center transition-all duration-300 ${state.isFullscreen ? 'space-x-3 md:space-x-4' : 'space-x-1 sm:space-x-2'}`}>
              {document.pictureInPictureEnabled && (
                <button
                  onClick={togglePictureInPicture}
                  className={`hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${state.isFullscreen ? 'p-2.5 md:p-3 block' : 'p-1.5 sm:p-2 hidden sm:block'}`}
                  title="Picture-in-Picture"
                >
                  {state.isPictureInPicture ? (
                    <RectangleStackIcon className={`${state.isFullscreen ? 'w-5 h-5 md:w-6 md:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
                  ) : (
                    <RectangleGroupIcon className={`${state.isFullscreen ? 'w-5 h-5 md:w-6 md:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
                  )}
                </button>
              )}
              
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${state.isFullscreen ? 'p-2.5 md:p-3' : 'p-1.5 sm:p-2'}`}
                  title="Ayarlar"
                >
                  <Cog6ToothIcon className={`${state.isFullscreen ? 'w-5 h-5 md:w-6 md:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
                </button>
                
                {showSettings && (
                  <div className={`absolute bottom-full mb-2 bg-black/95 backdrop-blur-sm rounded-xl border border-white/10 shadow-2xl transition-all duration-200 z-50 ${state.isFullscreen ? 'p-4 md:p-5 w-52 md:w-56' : 'p-3 w-44 sm:w-48'} -right-2 sm:right-0`} style={{maxWidth: '90vw'}}>
                    <div className={`${state.isFullscreen ? 'text-base md:text-lg' : 'text-sm'}`}>
                      <div className={`text-gray-300 font-medium border-b border-white/10 pb-2 transition-all duration-200 ${state.isFullscreen ? 'mb-4 text-lg md:text-xl' : 'mb-3'}`}>Oynatma Hızı</div>
                      {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                        <button
                          key={rate}
                          onClick={() => changePlaybackRate(rate)}
                          className={`block w-full text-left rounded-lg hover:bg-white/10 transition-all duration-200 mb-1 ${
                            state.playbackRate === rate ? 'text-red-400 bg-red-500/20 border border-red-500/30' : 'text-white'
                          } ${state.isFullscreen ? 'px-4 py-3 md:px-5 md:py-3.5' : 'px-3 py-2'}`}
                        >
                          {rate === 1 ? 'Normal' : `${rate}x`}
                        </button>
                      ))}
                      
                      <div className={`border-t border-white/10 transition-all duration-200 ${state.isFullscreen ? 'mt-5 pt-4' : 'mt-4 pt-3'}`}>
                        <div className={`text-gray-300 font-medium mb-2 transition-all duration-200 ${state.isFullscreen ? 'text-base md:text-lg mb-3' : ''}`}>Klavye Kısayolları</div>
                        <div className={`text-gray-400 space-y-1 transition-all duration-200 ${state.isFullscreen ? 'text-sm md:text-base space-y-1.5' : 'text-xs'}`}>
                          <div>Space: Oynat/Duraklat</div>
                          <div>←/→: 10s Geri/İleri</div>
                          <div>↑/↓: Ses Seviyesi</div>
                          <div>M: Sessiz</div>
                          <div>F: Tam Ekran</div>
                          <div>P: Picture-in-Picture</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={toggleFullscreen}
                className={`hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${state.isFullscreen ? 'p-2.5 md:p-3' : 'p-1.5 sm:p-2'}`}
                title="Tam Ekran"
              >
                {state.isFullscreen ? (
                  <ArrowsPointingInIcon className={`${state.isFullscreen ? 'w-5 h-5 md:w-6 md:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
                ) : (
                  <ArrowsPointingOutIcon className={`${state.isFullscreen ? 'w-5 h-5 md:w-6 md:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;