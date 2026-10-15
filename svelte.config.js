import adapter from '@sveltejs/adapter-static';
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
      // Cloudflare Pages serves 404.html, with a 404 status, for any path
      // that matches no file. Without it, Pages treats the site as a
      // single-page app and answers every unknown path, including missing
      // /_app/ scripts, with index.html and a 200 status. Browsers then cache
      // that HTML in place of the script, which breaks the site after a
      // deploy. SvelteKit builds this fallback with absolute asset paths, so
      // it works at any URL depth, and renders src/routes/+error.svelte.
      fallback: '404.html',
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
