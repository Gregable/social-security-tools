import { sveltekit } from "@sveltejs/kit/vite";

/** @type {import('vite').Plugin} */
const viteHeaderPlugin = {
  name: "add headers",
  configureServer: (server) => {
    server.middlewares.use((req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET");
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      next();
    });
  },
};

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [viteHeaderPlugin, sveltekit()],
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"],
  },
};

export default config;
