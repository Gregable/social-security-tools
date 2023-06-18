import type {Meta, StoryObj} from '@storybook/svelte';

import PastePrompt from '../components/PastePrompt.svelte';

const meta = {
  title: 'Paste Prompt',
  component: PastePrompt,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<PastePrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
