import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess({
    script: true,
  }),

  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: false,
      strict: true,
    }),
    prerender: {
      handleHttpError: 'warn',
      handleMissingId: ({ id, path }) => {
        // Ignore hash fragments that are URL parameters (contain =)
        if (id.includes('=')) {
          return;
        }
        // Otherwise, throw the error
        throw new Error(`Missing ID: ${id} on page ${path}`);
      },
    },
  },
};
