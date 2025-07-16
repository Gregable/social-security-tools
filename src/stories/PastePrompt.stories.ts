import type { Meta } from '@storybook/svelte';
import { action } from '@storybook/addon-actions';

import PastePrompt from '../lib/components/PastePrompt.svelte';

const meta: Meta<PastePrompt> = {
  component: PastePrompt,
  title: 'Input/PasteFlow/PastePrompt',

  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({ ..._args }) => ({
  Component: PastePrompt,
  on: {
    paste: action('paste'),
  },
});

export const Default = Template.bind({});
Default.args = {};
