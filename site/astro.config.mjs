import { defineConfig } from 'astro/config';

// SITE_URL is set by the GitHub Action (https://<owner>.github.io). For a custom domain: set site to it and base to '/'.
export default defineConfig({
  site: process.env.SITE_URL ?? 'http://localhost:4321',
  base: '/business-daily-podcasts',
  trailingSlash: 'always',
});
