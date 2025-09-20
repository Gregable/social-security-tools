import type { Meta, StoryObj } from '@storybook/svelte';
import GuideFooter from '../routes/guides/guide-footer.svelte';

const meta: Meta<GuideFooter> = {
  component: GuideFooter,
  title: 'Components/GuideFooter',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A call-to-action footer component that appears at the end of guide pages to encourage users to try the calculator.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<GuideFooter>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The default guide footer with improved aesthetics and better call-to-action design.',
      },
    },
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'iphone6',
    },
    docs: {
      description: {
        story:
          'How the guide footer appears on mobile devices with responsive design.',
      },
    },
  },
};

export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'ipad',
    },
    docs: {
      description: {
        story: 'How the guide footer appears on tablet devices.',
      },
    },
  },
};
