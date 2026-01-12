import type { Preview } from "@storybook/svelte";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    viewport: {
      viewports: {
        small: {
          name: "Small (< 675px)",
          styles: { width: "640px", height: "900px" },
        },
        medium: {
          name: "Medium (675-1024px)",
          styles: { width: "900px", height: "900px" },
        },
        large: {
          name: "Large (> 1024px)",
          styles: { width: "1280px", height: "900px" },
        },
      },
    },
  },
};

export default preview;
