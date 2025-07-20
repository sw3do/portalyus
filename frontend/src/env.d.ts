/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_API_BASE_URL: string;
  readonly PUBLIC_API_URL: string;
  readonly PUBLIC_UPLOADS_URL: string;
  readonly PUBLIC_DEV_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  ADMIN_CONFIG?: {
    apiBase: string;
    uploadsUrl: string;
  };
}