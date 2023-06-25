import type {Meta} from '@storybook/svelte';
import {action} from '@storybook/addon-actions';

import PastePrompt from '../components/PastePrompt.svelte';
import {EarningRecord} from '../lib/earning-record';

const meta: Meta<PastePrompt> = {
  component: PastePrompt,
  title: 'Paste Prompt',

  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({...args}) => ({
  Component: PastePrompt,
  on: {
    demo: action('demo'),
    paste: action('paste'),
  },
});

export const Default: Story<PastePrompt> = Template.bind({});
Default.args = {};