// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Set SITE_URL to the final domain before launch (used for canonical URLs,
// social cards and the sitemap).
const site = process.env.SITE_URL ?? 'https://zidaneyan.vercel.app';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [react(), sitemap()],
});
