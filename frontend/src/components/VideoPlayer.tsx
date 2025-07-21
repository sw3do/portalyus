import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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

  const [isMobile, setIsMobile] = useState(false);

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [showThumbnail, setShowThumbnail] = useState(false);
  const [thumbnailTime, setThumbnailTime] = useState(0);
  const [thumbnailPosition, setThumbnailPosition] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);


  // Throttle function for performance
  const throttle = useCallback((func: Function, limit: number) => {
    let inThrottle: boolean;
    return function executedFunction(...args: any[]) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }, []);

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

  const handleTimeUpdate = useCallback(throttle(() => {
    if (!videoRef.current || isDragging) return;

    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;

    setState(prev => ({ ...prev, currentTime, duration }));
    onTimeUpdate?.(currentTime, duration);
  }, 100), [isDragging, onTimeUpdate, throttle]);

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

  const handleProgress = useCallback(throttle(() => {
    if (!videoRef.current) return;

    const buffered = videoRef.current.buffered;
    if (buffered.length > 0) {
      const bufferedEnd = buffered.end(buffered.length - 1);
      const duration = videoRef.current.duration;
      const bufferedPercentage = duration ? (bufferedEnd / duration) * 100 : 0;
      setState(prev => ({ ...prev, buffered: bufferedPercentage }));
    }
  }, 200), [throttle]);

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

  const handleMouseMove = useCallback(throttle((e: MouseEvent) => {
    if (!isDragging || !progressRef.current || !videoRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * state.duration;

    videoRef.current.currentTime = newTime;
    setState(prev => ({ ...prev, currentTime: newTime }));
  }, 16), [isDragging, state.duration, throttle]);

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
  }, []);

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

  const handleProgressHover = useCallback(throttle((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !state.duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percentage = hoverX / rect.width;
    const hoverTime = percentage * state.duration;

    setThumbnailTime(hoverTime);
    setThumbnailPosition(hoverX);
    setShowThumbnail(true);
  }, 16), [state.duration, throttle]);

  const handleProgressLeave = useCallback(() => {
    setShowThumbnail(false);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);

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
      window.removeEventListener('resize', checkMobile);
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
    setState(prev => ({ ...prev, showControls: true }));
  }, [state.isPlaying]);

  const progressPercentage = useMemo(() => 
    state.duration ? (state.currentTime / state.duration) * 100 : 0, 
    [state.currentTime, state.duration]
  );
  
  const volumePercentage = useMemo(() => state.volume * 100, [state.volume]);
  const bufferedPercentage = useMemo(() => state.buffered, [state.buffered]);
  
  const controlSizes = useMemo(() => ({
    button: isMobile ? (state.isFullscreen ? 'p-3 md:p-4' : 'p-2.5') : (state.isFullscreen ? 'p-2 sm:p-3 md:p-4 lg:p-5' : 'p-2 sm:p-3 md:p-3.5'),
    icon: isMobile ? (state.isFullscreen ? 'w-6 h-6' : 'w-5 h-5') : (state.isFullscreen ? 'w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-9 lg:h-9' : 'w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7'),
    smallButton: isMobile ? (state.isFullscreen ? 'p-2.5 md:p-3' : 'p-2') : (state.isFullscreen ? 'p-1.5 sm:p-2 md:p-3 lg:p-3.5' : 'p-1.5 sm:p-2 md:p-2.5'),
    smallIcon: isMobile ? (state.isFullscreen ? 'w-5 h-5' : 'w-4 h-4') : (state.isFullscreen ? 'w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7' : 'w-3.5 h-3.5 sm:w-5 sm:h-5 md:w-6 md:h-6')
  }), [isMobile, state.isFullscreen]);

  return (
    <div
      ref={containerRef}
      className={`relative bg-gradient-to-br from-gray-950 via-black to-gray-900 group ${className} focus:outline-none rounded-xl overflow-hidden shadow-2xl border border-white/5 ${isMobile ? 'touch-manipulation' : ''}`}
      onMouseLeave={() => {
        if (!isMobile) {
          setShowVolumeSlider(false);
          setShowSettings(false);
        }
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
        className="w-full h-full object-contain rounded-xl"
        onClick={togglePlay}
        onDoubleClick={!isMobile ? handleDoubleClick : undefined}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        preload={isMobile ? "metadata" : "auto"}
        playsInline
        webkit-playsinline="true"
      />

      {state.hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-950/95 via-black/95 to-gray-900/95 backdrop-blur-md rounded-xl">
          <div className={`relative transition-all duration-500 ${state.isFullscreen ? 'mb-8 md:mb-10' : 'mb-6'}`}>
            <div className={`bg-gradient-to-br from-red-500/30 to-red-600/20 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl border border-red-500/30 ${state.isFullscreen ? 'w-28 h-28 md:w-32 md:h-32' : 'w-24 h-24'}`}>
              <div className="absolute inset-0 bg-red-500/10 rounded-full animate-pulse"></div>
              <ExclamationTriangleIcon className={`text-red-400 transition-all duration-500 relative z-10 ${state.isFullscreen ? 'w-14 h-14 md:w-16 md:h-16' : 'w-12 h-12'}`} />
            </div>
          </div>
          <div className={`text-white font-bold mb-2 transition-all duration-500 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent ${state.isFullscreen ? 'text-2xl md:text-3xl mb-4' : 'text-xl'}`}>
            Video Hatası
          </div>
          <div className={`text-white/80 text-center max-w-md px-4 transition-all duration-500 leading-relaxed ${state.isFullscreen ? 'text-lg md:text-xl mb-10 max-w-lg' : 'text-base mb-8'}`}>
            {state.errorMessage}
          </div>
          <button
            onClick={retryVideo}
            className={`group flex items-center space-x-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-red-500/25 border border-red-500/30 ${state.isFullscreen ? 'px-10 py-5 md:px-12 md:py-6 text-lg md:text-xl' : 'px-8 py-4'}`}
          >
            <ArrowPathIcon className={`${state.isFullscreen ? 'w-7 h-7 md:w-8 md:h-8' : 'w-6 h-6'} group-hover:rotate-180 transition-transform duration-500`} />
            <span className="font-semibold">Tekrar Dene</span>
          </button>
        </div>
      )}

      {(state.isLoading || state.isWaiting) && !state.hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-950/90 via-black/90 to-gray-900/90 backdrop-blur-lg rounded-xl">
          <div className="relative">
            <div className={`border-4 border-red-500/20 rounded-full animate-pulse transition-all duration-500 ${state.isFullscreen ? 'w-24 h-24 md:w-28 md:h-28' : 'w-20 h-20'}`}></div>
            <div className={`absolute inset-0 border-4 border-transparent border-t-red-500 rounded-full animate-spin transition-all duration-500 shadow-lg ${state.isFullscreen ? 'w-24 h-24 md:w-28 md:h-28' : 'w-20 h-20'}`}></div>
            <div className={`absolute border-3 border-transparent border-t-red-400/70 rounded-full animate-spin transition-all duration-500 ${state.isFullscreen ? 'inset-2 w-20 h-20 md:inset-3 md:w-22 md:h-22' : 'inset-1.5 w-17 h-17'}`} style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
            <div className={`absolute border-2 border-transparent border-t-white/40 rounded-full animate-spin transition-all duration-500 ${state.isFullscreen ? 'inset-4 w-16 h-16 md:inset-5 md:w-18 md:h-18' : 'inset-3 w-14 h-14'}`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className={`absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-full animate-pulse`}></div>
            <FilmIcon className={`absolute inset-0 m-auto text-white/90 transition-all duration-500 drop-shadow-lg ${state.isFullscreen ? 'w-10 h-10 md:w-12 md:h-12' : 'w-8 h-8'}`} />
          </div>
          <div className={`mt-6 text-white/90 font-semibold tracking-wide transition-all duration-500 bg-gradient-to-r from-white to-gray-200 bg-clip-text ${state.isFullscreen ? 'text-lg md:text-xl mt-8' : 'text-base'}`}>
            {state.isLoading ? 'Video yükleniyor...' : 'Arabelleğe alınıyor...'}
          </div>
          <div className={`mt-4 flex transition-all duration-500 ${state.isFullscreen ? 'space-x-2 mt-6' : 'space-x-1.5'}`}>
            <div className={`bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-bounce transition-all duration-500 shadow-lg ${state.isFullscreen ? 'w-4 h-4 md:w-5 md:h-5' : 'w-3 h-3'}`} style={{ animationDelay: '0ms' }}></div>
            <div className={`bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-bounce transition-all duration-500 shadow-lg ${state.isFullscreen ? 'w-4 h-4 md:w-5 md:h-5' : 'w-3 h-3'}`} style={{ animationDelay: '200ms' }}></div>
            <div className={`bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-bounce transition-all duration-500 shadow-lg ${state.isFullscreen ? 'w-4 h-4 md:w-5 md:h-5' : 'w-3 h-3'}`} style={{ animationDelay: '400ms' }}></div>
          </div>
        </div>
      )}

      <div
        className={`absolute inset-0 transition-opacity duration-300 ${state.showControls ? 'opacity-100' : 'opacity-0'
          }`}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        {title && (
          <div className={`absolute z-10 transition-all duration-500 ${state.isFullscreen ? 'top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 lg:top-8 lg:left-8 lg:right-8' : 'top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4'}`}>
            <div className={`bg-gradient-to-r from-black/60 via-black/50 to-black/60 backdrop-blur-md rounded-lg sm:rounded-xl border border-white/20 shadow-2xl transition-all duration-500 hover:border-white/30 ${state.isFullscreen ? 'px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 lg:px-10 lg:py-5' : 'px-3 py-2 sm:px-6 sm:py-3'}`}>
              <h3 className={`text-white font-bold truncate transition-all duration-500 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent drop-shadow-lg ${state.isFullscreen ? 'text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl' : 'text-sm sm:text-lg md:text-xl'}`}>{title}</h3>
            </div>
          </div>
        )}

        <div className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${state.isFullscreen ? 'p-2 sm:p-4 md:p-6' : 'p-2 sm:p-3 md:p-4'}`}>
          <div className={`relative transition-all duration-300 ${state.isFullscreen ? 'mb-4 md:mb-6' : 'mb-3 sm:mb-4'} ${isMobile ? 'mb-4' : ''}`}>
            <div
              ref={progressRef}
              className={`w-full bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-full cursor-pointer group/progress backdrop-blur-md relative transition-all duration-300 shadow-lg border border-white/10 ${state.isFullscreen ? 'h-3 md:h-4' : 'h-2.5 sm:h-2'}`}
              onClick={handleProgressClick}
              onMouseDown={handleProgressMouseDown}
              onMouseMove={handleProgressHover}
              onMouseLeave={handleProgressLeave}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/30 via-red-500/40 to-red-400/30 rounded-full animate-pulse"></div>
              
              <div
                className="absolute inset-0 h-full bg-gradient-to-r from-white/20 to-white/10 rounded-full transition-all duration-300 shadow-inner"
                style={{ width: `${bufferedPercentage}%` }}
              />
              
              <div
                className={`h-full bg-gradient-to-r from-red-600 via-red-500 to-red-400 rounded-full relative transition-all duration-300 shadow-xl z-10 ${state.isFullscreen ? 'group-hover/progress:h-4 md:group-hover/progress:h-5' : 'group-hover/progress:h-3 sm:group-hover/progress:h-2.5'}`}
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/50 to-red-600/50 rounded-full animate-pulse"></div>
                <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-br from-white to-gray-200 rounded-full opacity-0 group-hover/progress:opacity-100 transition-all duration-300 shadow-2xl border-3 border-red-400 ${state.isFullscreen ? 'w-6 h-6 md:w-7 md:h-7' : 'w-5 h-5 sm:w-4 sm:h-4'}`} />
              </div>
            </div>

            {showThumbnail && (
              <div
                className={`absolute bottom-full mb-3 bg-gradient-to-br from-black/95 via-gray-900/95 to-black/95 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl pointer-events-none z-20 transition-all duration-300 ${state.isFullscreen ? 'p-4 md:p-5' : 'p-3'}`}
                style={{
                  left: `${Math.max(0, Math.min(thumbnailPosition - (state.isFullscreen ? 60 : 50), (progressRef.current?.offsetWidth || 0) - (state.isFullscreen ? 120 : 100)))}px`
                }}
              >
                <div className={`text-white font-bold font-mono transition-all duration-300 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent ${state.isFullscreen ? 'text-base md:text-lg' : 'text-sm'}`}>
                  {formatTime(thumbnailTime)}
                </div>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-black/95 to-gray-900/95 rotate-45 border-r border-b border-white/20"></div>
              </div>
            )}
          </div>

          <div className={`flex items-center justify-between text-white transition-all duration-300 ${state.isFullscreen ? 'text-lg' : ''}`}>
            <div className={`flex items-center transition-all duration-300 ${state.isFullscreen ? 'space-x-2 sm:space-x-4 md:space-x-6' : 'space-x-1 sm:space-x-2 md:space-x-4'} ${isMobile ? 'px-2' : ''}`}>
              <button
                onClick={togglePlay}
                className={`group hover:bg-gradient-to-br hover:from-white/25 hover:to-white/15 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 bg-gradient-to-br from-black/40 via-black/30 to-black/40 backdrop-blur-md border border-white/20 shadow-xl hover:border-white/40 hover:shadow-2xl ${controlSizes.button}`}
                title={state.isPlaying ? 'Duraklat' : 'Oynat'}
              >
                {state.isPlaying ? (
                  <PauseIcon className={`text-white group-hover:text-red-400 transition-colors duration-300 ${controlSizes.icon}`} />
                ) : (
                  <PlayIcon className={`text-white group-hover:text-red-400 transition-colors duration-300 ${controlSizes.icon}`} />
                )}
              </button>

              <button
                onClick={() => skipTime(-10)}
                className={`group hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm border border-white/10 hover:border-white/30 shadow-lg hover:shadow-xl ${controlSizes.smallButton}`}
                title="10 saniye geri"
              >
                <BackwardIcon className={`text-white/90 group-hover:text-red-400 transition-colors duration-300 ${controlSizes.smallIcon}`} />
              </button>
              
              <button
                onClick={() => skipTime(10)}
                className={`group hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm border border-white/10 hover:border-white/30 shadow-lg hover:shadow-xl ${controlSizes.smallButton}`}
                title="10 saniye ileri"
              >
                <ForwardIcon className={`text-white/90 group-hover:text-red-400 transition-colors duration-300 ${controlSizes.smallIcon}`} />
              </button>

              <div className="relative">
                <button
                   onClick={toggleMute}
                   onMouseEnter={() => !isMobile && setShowVolumeSlider(true)}
                   onTouchStart={() => isMobile && setShowVolumeSlider(!showVolumeSlider)}
                   className={`group hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm border border-white/10 hover:border-white/30 shadow-lg hover:shadow-xl ${controlSizes.smallButton}`}
                   title={state.isMuted ? 'Sesi aç' : 'Sessiz'}
                 >
                   {state.isMuted || state.volume === 0 ? (
                     <SpeakerXMarkIcon className={`text-white/90 group-hover:text-red-400 transition-colors duration-300 ${controlSizes.smallIcon}`} />
                   ) : (
                     <SpeakerWaveIcon className={`text-white/90 group-hover:text-red-400 transition-colors duration-300 ${controlSizes.smallIcon}`} />
                   )}
                 </button>

                {showVolumeSlider && (
                  <div
                    className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-gradient-to-br from-black/90 via-black/80 to-black/90 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl transition-all duration-200 ${state.isFullscreen ? 'p-4 md:p-5' : 'p-3'}`}
                    onMouseLeave={() => !isMobile && setShowVolumeSlider(false)}
                    onTouchEnd={() => isMobile && setTimeout(() => setShowVolumeSlider(false), 2000)}
                  >
                    <div className="relative h-full flex flex-col items-center">
                      <div
                        ref={volumeRef}
                        className={`bg-gradient-to-t from-gray-600/50 to-gray-500/50 rounded-full cursor-pointer relative transition-all duration-200 shadow-inner ${state.isFullscreen ? 'w-3 h-24 md:w-3.5 md:h-28' : 'w-2.5 h-20'}`}
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
                          className="absolute bottom-0 w-full bg-gradient-to-t from-orange-500 via-red-500 to-red-400 rounded-full transition-all duration-200 shadow-lg"
                          style={{ height: `${volumePercentage}%` }}
                        />
                        <div
                          className={`absolute bg-gradient-to-br from-white to-gray-200 rounded-full transform -translate-x-1/2 left-1/2 shadow-xl border-2 border-red-400 transition-all duration-200 ${state.isFullscreen ? 'w-5 h-5 md:w-6 md:h-6' : 'w-4 h-4'}`}
                          style={{ bottom: `${volumePercentage}%`, transform: 'translate(-50%, 50%)' }}
                        />
                      </div>
                      <div className={`mt-2 text-white/80 font-mono font-bold transition-all duration-200 ${state.isFullscreen ? 'text-sm md:text-base' : 'text-xs'}`}>
                        {Math.round(state.volume * 100)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <span className={`font-mono font-semibold bg-gradient-to-br from-black/50 via-black/40 to-black/50 backdrop-blur-md rounded-lg sm:rounded-xl border border-white/20 shadow-lg transition-all duration-300 text-white/90 ${state.isFullscreen ? 'text-xs sm:text-sm md:text-base lg:text-lg px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2' : 'text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5'} ${isMobile ? 'text-xs px-2 py-1' : ''}`}>
                <span className={`text-red-400 ${isMobile ? 'text-xs' : ''}`}>{formatTime(state.currentTime)}</span>
                <span className={`text-white/60 mx-0.5 sm:mx-1 ${isMobile ? 'text-xs' : ''}`}>/</span>
                <span className={`text-white/80 ${isMobile ? 'text-xs' : ''}`}>{formatTime(state.duration)}</span>
              </span>
            </div>

            <div className={`flex items-center transition-all duration-300 ${state.isFullscreen ? 'space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4' : 'space-x-0.5 sm:space-x-1 md:space-x-2'}`}>
              {document.pictureInPictureEnabled && !isMobile && (
                <button
                  onClick={togglePictureInPicture}
                  className={`group hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm border border-white/10 hover:border-white/30 shadow-lg hover:shadow-xl ${controlSizes.smallButton} ${state.isFullscreen ? 'block' : 'hidden sm:block'}`}
                  title="Picture-in-Picture"
                >
                  {state.isPictureInPicture ? (
                    <RectangleStackIcon className={`text-white/90 group-hover:text-red-400 transition-colors duration-300 ${controlSizes.smallIcon}`} />
                  ) : (
                    <RectangleGroupIcon className={`text-white/90 group-hover:text-red-400 transition-colors duration-300 ${controlSizes.smallIcon}`} />
                  )}
                </button>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`group hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm border border-white/10 hover:border-white/30 shadow-lg hover:shadow-xl ${showSettings ? 'bg-gradient-to-br from-red-500/30 to-orange-500/30 border-red-400/50' : ''} ${controlSizes.smallButton}`}
                  title="Ayarlar"
                >
                  <Cog6ToothIcon className={`text-white/90 group-hover:text-red-400 transition-colors duration-300 ${showSettings ? 'text-red-400 rotate-90' : ''} ${controlSizes.smallIcon}`} />
                </button>

                {showSettings && (
                  <div className={`absolute bottom-full mb-3 bg-gradient-to-br from-black/90 via-black/80 to-black/90 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl transition-all duration-300 z-50 ${state.isFullscreen ? 'p-5 md:p-6 w-56 md:w-60' : 'p-4 w-48 sm:w-52'} ${isMobile ? 'w-72 -right-4' : '-right-2 sm:right-0'}`} style={{ maxWidth: '90vw' }}>
                    <div className={`${state.isFullscreen ? 'text-base md:text-lg' : 'text-sm'} ${isMobile ? 'text-base' : ''}`}>
                      <div className={`text-transparent bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text font-bold text-center border-b border-white/20 pb-3 transition-all duration-300 ${state.isFullscreen ? 'mb-5 text-xl md:text-2xl' : 'mb-4 text-lg'} ${isMobile ? 'text-lg mb-4' : ''}`}>Oynatma Hızı</div>
                      {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                        <button
                          key={rate}
                          onClick={() => changePlaybackRate(rate)}
                          className={`block w-full text-left rounded-xl hover:scale-105 transition-all duration-300 mb-2 font-medium ${
                            state.playbackRate === rate 
                              ? 'text-white bg-gradient-to-r from-red-500/30 to-orange-500/30 border border-red-400/50 shadow-lg' 
                              : 'text-white/80 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 hover:text-white hover:border hover:border-white/20'
                            } ${state.isFullscreen ? 'px-5 py-3.5 md:px-6 md:py-4' : 'px-4 py-3'} ${isMobile ? 'px-5 py-4' : ''}`}
                        >
                          <span className={state.playbackRate === rate ? 'text-red-400' : ''}>
                            {rate === 1 ? 'Normal' : `${rate}x`}
                          </span>
                          {rate === 1 && <span className="text-white/60 ml-2">(Varsayılan)</span>}
                        </button>
                      ))}

                      <div className={`border-t border-white/20 transition-all duration-300 ${state.isFullscreen ? 'mt-6 pt-5' : 'mt-5 pt-4'}`}>
                        <div className={`text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text font-bold text-center mb-3 transition-all duration-300 ${state.isFullscreen ? 'text-lg md:text-xl mb-4' : 'text-base'} ${isMobile ? 'text-base mb-3' : ''}`}>Klavye Kısayolları</div>
                        <div className={`text-gray-300 space-y-2 transition-all duration-300 ${state.isFullscreen ? 'text-sm md:text-base space-y-2.5' : 'text-xs'} ${isMobile ? 'text-sm space-y-2.5' : ''}`}>
                          <div className="flex justify-between items-center">
                            <span>Space:</span>
                            <span className="text-white/80 font-medium">Oynat/Duraklat</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>←/→:</span>
                            <span className="text-white/80 font-medium">10s Geri/İleri</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>↑/↓:</span>
                            <span className="text-white/80 font-medium">Ses Seviyesi</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>M:</span>
                            <span className="text-white/80 font-medium">Sessiz</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>F:</span>
                            <span className="text-white/80 font-medium">Tam Ekran</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>P:</span>
                            <span className="text-white/80 font-medium">Picture-in-Picture</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={toggleFullscreen}
                className={`group hover:bg-gradient-to-br hover:from-white/20 hover:to-white/10 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm border border-white/10 hover:border-white/30 shadow-lg hover:shadow-xl ${controlSizes.smallButton}`}
                title={state.isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
              >
                {state.isFullscreen ? (
                  <ArrowsPointingInIcon className={`text-white/90 group-hover:text-red-400 transition-colors duration-300 ${controlSizes.smallIcon}`} />
                ) : (
                  <ArrowsPointingOutIcon className={`text-white/90 group-hover:text-red-400 transition-colors duration-300 ${controlSizes.smallIcon}`} />
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