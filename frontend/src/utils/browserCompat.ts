export interface BrowserInfo {
  isIOS: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isEdge: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  supportsHLS: boolean;
  supportsPiP: boolean;
  supportsFullscreen: boolean;
  supportsWebGL: boolean;
  supportsServiceWorker: boolean;
  version: string;
  osVersion: string;
}

export const detectBrowser = (): BrowserInfo => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
  const isFirefox = /Firefox/.test(userAgent);
  const isEdge = /Edg/.test(userAgent);
  const isMobile = /Mobi|Android/i.test(userAgent) || isIOS;
  
  const video = document.createElement('video');
  const supportsHLS = video.canPlayType('application/vnd.apple.mpegurl') !== '' ||
                     video.canPlayType('application/x-mpegURL') !== '';
  
  const supportsPiP = 'pictureInPictureEnabled' in document &&
                     document.pictureInPictureEnabled;
  
  const supportsFullscreen = 'requestFullscreen' in document.documentElement ||
                            'webkitRequestFullscreen' in document.documentElement ||
                            'mozRequestFullScreen' in document.documentElement ||
                            'msRequestFullscreen' in document.documentElement;
  
  const supportsWebGL = (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  })();
  
  const supportsServiceWorker = 'serviceWorker' in navigator;
  
  let version = '';
  let osVersion = '';
  
  if (isIOS) {
    const match = userAgent.match(/OS (\d+)_(\d+)/);
    if (match) {
      version = `${match[1]}.${match[2]}`;
      osVersion = version;
    }
  } else if (isAndroid) {
    const match = userAgent.match(/Android ([\d.]+)/);
    if (match) osVersion = match[1];
  }
  
  if (isSafari && !isIOS) {
    const match = userAgent.match(/Version\/(\d+\.\d+)/);
    if (match) version = match[1];
  } else if (isChrome) {
    const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
    if (match) version = match[1];
  } else if (isFirefox) {
    const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
    if (match) version = match[1];
  } else if (isEdge) {
    const match = userAgent.match(/Edg\/(\d+\.\d+)/);
    if (match) version = match[1];
  }
  
  return {
    isIOS,
    isSafari,
    isChrome,
    isFirefox,
    isEdge,
    isAndroid,
    isMobile,
    supportsHLS,
    supportsPiP,
    supportsFullscreen,
    supportsWebGL,
    supportsServiceWorker,
    version,
    osVersion
  };
};

export const addFullscreenPolyfill = () => {
  const doc = document as any;
  const docEl = document.documentElement as any;
  
  if (!doc.requestFullscreen) {
    doc.requestFullscreen = doc.webkitRequestFullscreen ||
                           doc.mozRequestFullScreen ||
                           doc.msRequestFullscreen;
  }
  
  if (!doc.exitFullscreen) {
    doc.exitFullscreen = doc.webkitExitFullscreen ||
                        doc.mozCancelFullScreen ||
                        doc.msExitFullscreen;
  }
  
  if (!doc.fullscreenElement && !Object.getOwnPropertyDescriptor(doc, 'fullscreenElement')) {
    Object.defineProperty(doc, 'fullscreenElement', {
      get: () => doc.webkitFullscreenElement ||
                doc.mozFullScreenElement ||
                doc.msFullscreenElement,
      configurable: true
    });
  }
};

export const addPictureInPicturePolyfill = () => {
  if (!('pictureInPictureEnabled' in document)) {
    Object.defineProperty(document, 'pictureInPictureEnabled', {
      value: false,
      writable: false
    });
  }
};

export const getOptimalVideoSettings = (browserInfo: BrowserInfo) => {
  const settings = {
    preload: 'auto' as 'auto' | 'metadata' | 'none',
    autoplay: true,
    muted: false,
    playsInline: true,
    controls: false,
    crossOrigin: 'anonymous' as 'anonymous' | 'use-credentials' | '',
    disablePictureInPicture: false
  };
  
  if (browserInfo.isIOS) {
    settings.preload = 'none';
    settings.autoplay = false;
    settings.muted = true;
    settings.playsInline = true;
  } else if (browserInfo.isMobile) {
    settings.preload = 'metadata';
    settings.autoplay = false;
  }
  
  if (!browserInfo.supportsPiP) {
    settings.disablePictureInPicture = true;
  }
  
  return settings;
};

export const getSupportedVideoFormats = (browserInfo: BrowserInfo): string[] => {
  const video = document.createElement('video');
  const formats: string[] = [];
  
  const testFormats = [
    { format: 'mp4', mime: 'video/mp4; codecs="avc1.42E01E"' },
    { format: 'webm', mime: 'video/webm; codecs="vp8, vorbis"' },
    { format: 'webm', mime: 'video/webm; codecs="vp9"' },
    { format: 'ogg', mime: 'video/ogg; codecs="theora"' },
    { format: 'hls', mime: 'application/vnd.apple.mpegurl' },
    { format: 'hls', mime: 'application/x-mpegURL' }
  ];
  
  testFormats.forEach(({ format, mime }) => {
    if (video.canPlayType(mime) !== '') {
      if (!formats.includes(format)) {
        formats.push(format);
      }
    }
  });
  
  return formats;
};

export const initializeBrowserCompatibility = () => {
  addFullscreenPolyfill();
  addPictureInPicturePolyfill();
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        console.log('Service Worker registration failed');
      });
    });
  }
  
  const browserInfo = detectBrowser();
  
  if (browserInfo.isIOS) {
    document.addEventListener('touchstart', () => {}, { passive: true });
    
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }
  }
  
  if (browserInfo.isAndroid) {
    document.addEventListener('touchstart', () => {}, { passive: true });
  }
  
  return browserInfo;
};

export const createVideoErrorMessage = (error: MediaError, browserInfo: BrowserInfo): string => {
  let message = 'Video yüklenirken bir hata oluştu';
  
  switch (error.code) {
    case error.MEDIA_ERR_ABORTED:
      message = 'Video yükleme iptal edildi';
      break;
    case error.MEDIA_ERR_NETWORK:
      message = 'Ağ hatası nedeniyle video yüklenemedi';
      break;
    case error.MEDIA_ERR_DECODE:
      if (browserInfo.isIOS) {
        message = 'Video dosyası iOS Safari tarafından çözümlenemedi. Farklı format deneyin.';
      } else {
        message = 'Video dosyası bozuk veya desteklenmiyor';
      }
      break;
    case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
      if (browserInfo.isIOS) {
        message = 'Video formatı iOS Safari tarafından desteklenmiyor. MP4 formatını deneyin.';
      } else if (browserInfo.isSafari) {
        message = 'Video formatı Safari tarafından desteklenmiyor. Farklı format deneyin.';
      } else if (browserInfo.isFirefox) {
        message = 'Video formatı Firefox tarafından desteklenmiyor. MP4 veya WebM deneyin.';
      } else {
        message = 'Video formatı bu tarayıcı tarafından desteklenmiyor';
      }
      break;
  }
  
  return message;
};

export const optimizeVideoPerformance = (videoElement: HTMLVideoElement, browserInfo: BrowserInfo) => {
  if (browserInfo.isIOS) {
    videoElement.style.webkitTransform = 'translateZ(0)';
    videoElement.style.transform = 'translateZ(0)';
    videoElement.setAttribute('webkit-playsinline', 'true');
    videoElement.setAttribute('playsinline', 'true');
  }
  
  if (browserInfo.isAndroid) {
    videoElement.style.willChange = 'transform';
  }
  
  if (browserInfo.isChrome) {
    videoElement.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
  }
  
  if (!browserInfo.supportsPiP) {
    videoElement.setAttribute('disablePictureInPicture', 'true');
  }
};