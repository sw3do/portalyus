# Environment Variables Setup

## Overview
This project uses environment variables to configure API URLs and other settings. This prevents hardcoded URLs and makes deployment to different environments easier.

## Environment Files

### Development (.env)
Copy `.env.example` to `.env` for local development:
```bash
cp .env.example .env
```

### Production (.env.production)
For production deployment, update `.env.production` with your production URLs:
```bash
PUBLIC_API_BASE_URL=https://your-production-domain.com
PUBLIC_API_URL=https://your-production-domain.com/api
PUBLIC_UPLOADS_URL=https://your-production-domain.com/uploads
PUBLIC_DEV_MODE=false
```

## Available Environment Variables

| Variable | Description | Default |
|----------|-------------|----------|
| `PUBLIC_API_BASE_URL` | Base URL for the API server | `http://localhost:3001` |
| `PUBLIC_API_URL` | Full API endpoint URL | `http://localhost:3001/api` |
| `PUBLIC_UPLOADS_URL` | URL for uploaded files | `http://localhost:3001/uploads` |
| `PUBLIC_DEV_MODE` | Development mode flag | `true` |

## Usage in Code

### In Astro files (.astro)
```typescript
import { getApiUrl, getUploadsUrl } from '../config/env';

// Fetch data
const response = await fetch(getApiUrl('/videos'));

// Get upload URL
const imageUrl = getUploadsUrl('image.jpg');
```

### In React components (.tsx)
```typescript
import { getApiUrl, getUploadsUrl } from '../config/env';

// Use in fetch calls
fetch(getApiUrl('/categories'))

// Use for image sources
<img src={getUploadsUrl(`/thumbnails/${video.thumbnail.startsWith('thumbnails/') ? video.thumbnail.replace('thumbnails/', '') : video.thumbnail}`)} />
```

### In public JavaScript files
Environment variables are injected via `window.ADMIN_CONFIG`:
```javascript
// Access in admin.js
const apiUrl = window.ADMIN_CONFIG?.apiBase || 'http://localhost:3001/api';
const uploadsUrl = window.ADMIN_CONFIG?.uploadsUrl || 'http://localhost:3001/uploads';
```

## Deployment

1. **Development**: Uses `.env` file
2. **Production**: Uses `.env.production` file or environment variables set by hosting provider
3. **Vercel/Netlify**: Set environment variables in dashboard
4. **Docker**: Pass environment variables via `-e` flag or docker-compose

## Security Notes

- All environment variables must start with `PUBLIC_` to be accessible in client-side code
- Never commit `.env` files to version control (already in .gitignore)
- Use `.env.example` to document required variables
- Update production URLs before deploying