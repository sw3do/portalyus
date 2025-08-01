// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://portalyus.com',
  integrations: [react(), tailwind()],
  output: 'server',
  adapter: vercel({}),
  server: {
    port: 3000,
  },
  build: {
    assets: 'assets'
  }
});