export const config = {
  api: {
    baseUrl: import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:3001',
    url: import.meta.env.PUBLIC_API_URL || 'http://localhost:3001/api',
    uploadsUrl: import.meta.env.PUBLIC_UPLOADS_URL || 'http://localhost:3001/uploads'
  },
  isDev: import.meta.env.PUBLIC_DEV_MODE === 'true' || import.meta.env.DEV
};

export const getApiUrl = (endpoint: string = '') => {
  return `${config.api.url}${endpoint}`;
};

export const getUploadsUrl = (path: string = '') => {
  return `${config.api.uploadsUrl}${path.startsWith('/') ? path : `/${path}`}`;
};