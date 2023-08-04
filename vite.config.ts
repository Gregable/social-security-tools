/// <reference types="vitest" />
import {svelte} from '@sveltejs/vite-plugin-svelte'
import {defineConfig} from 'vite'

export default defineConfig({
  plugins: [svelte({hot: !process.env.VITEST})],
  test: {globals: true, environment: 'happy-dom'},
  base: './',
  assetsInclude: ['static/**'],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        calculator: './calculator.html',
        about: './about.html',
        contact: './contact.html',
        contributors: './contributors.html',
        guides: './guides.html',
      }
    }
  }
});
