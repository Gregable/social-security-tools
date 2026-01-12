import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/svelte';

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

const Template = ({ ...args }) => ({
  Component: PastePrompt,
  props: args,
  on: {
    paste: action('paste'),
  },
});

export const Default = Template.bind({});
Default.args = {};

export const SpouseMode = Template.bind({});
SpouseMode.args = {
  isSpouse: true,
};
