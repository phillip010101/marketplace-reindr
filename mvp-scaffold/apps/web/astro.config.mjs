import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://apps.reindr.org',
  output: 'server',
  vite: {
    server: {
      allowedHosts: ['apps.reindr.org']
    }
  },
  adapter: node({
    mode: 'standalone'
  })
});
