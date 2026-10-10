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

// Copy instructions are chosen by the primary pointer in CSS, and Chromatic's
// browsers have a mouse, so force each variant to snapshot both.
export const TouchInstructions = Template.bind({});
TouchInstructions.args = {
  copyInstructions: 'touch',
};

export const KeyboardInstructions = Template.bind({});
KeyboardInstructions.args = {
  copyInstructions: 'keyboard',
};
