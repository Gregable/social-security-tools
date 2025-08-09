import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').Plugin} */
const viteHeaderPlugin = {
  name: 'add headers',
  configureServer: (server) => {
    server.middlewares.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      next();
    });
  },
};

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [viteHeaderPlugin, sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    // Disable the fuzz test except for manual runs:
    // To run the fuzz test manually, use:
    //   npm test src/test/strategy/fuzz.test.ts
    exclude: ['src/test/strategy/fuzz.test.ts'],
  },
  build: {
    sourcemap: true,
    target: 'es2022',
  },
};

export default config;
