import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/svelte';
import StrategyIntro from '../routes/strategy/components/StrategyIntro.svelte';

const meta: Meta<StrategyIntro> = {
  title: 'Strategy/StrategyIntro',
  component: StrategyIntro,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The explanation under the mode picker on the strategy page, shown until a mode is picked. Its band runs the width of the window.',
      },
    },
    chromatic: {
      modes: {
        // Three result columns and two method columns.
        desktop: { viewport: 1280 },
        // The narrowest width that still has columns.
        narrow: { viewport: 900 },
        // One column.
        phone: { viewport: 390 },
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The pictures load lazily on the page, where they start below the fold.
 * A snapshot covers the whole story at once, so load them all first: the
 * result then does not depend on which pictures the browser had reached.
 */
async function loadPictures(canvasElement: HTMLElement): Promise<void> {
  const pictures = [...canvasElement.querySelectorAll('img')];
  for (const picture of pictures) {
    picture.loading = 'eager';
  }
  await Promise.all(pictures.map((picture) => picture.decode()));
}

export const Default: Story = {
  args: { onselect: action('onselect') },
  play: ({ canvasElement }) => loadPictures(canvasElement),
};
