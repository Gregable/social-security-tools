import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * Fails the build if any route is not prerendered. adapter-static's own
 * `strict` check is skipped once `fallback` is set, and without this a dynamic
 * route would build cleanly, then be served as 404.html with a 404 status.
 *
 * @param {import('@sveltejs/kit').Adapter} wrapped
 * @returns {import('@sveltejs/kit').Adapter}
 */
function requireFullPrerender(wrapped) {
  return {
    ...wrapped,
    async adapt(builder) {
      const dynamic = builder.routes.filter(
        (route) => route.prerender !== true
      );
      if (dynamic.length > 0) {
        const ids = dynamic.map((route) => route.id).join(', ');
        throw new Error(
          `Every route must be prerendered, but these are not: ${ids}`
        );
      }
      return wrapped.adapt(builder);
    },
  };
}

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess({
    script: true,
  }),

  kit: {
    adapter: requireFullPrerender(
      adapter({
        pages: 'build',
        assets: 'build',
        // Keep this: without a top-level 404.html, Cloudflare Pages runs the
        // site as a single-page app and answers every unknown path, missing
        // /_app/ scripts included, with index.html and a 200, which breaks
        // script loads after a deploy. SvelteKit writes this fallback with
        // absolute asset paths, so it loads at any URL depth; the client
        // router then renders src/routes/+error.svelte.
        fallback: '404.html',
        precompress: false,
      })
    ),
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
