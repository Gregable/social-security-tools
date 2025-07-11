import type { Meta } from '@storybook/svelte';
import { action } from '@storybook/addon-actions';

import PasteFlow from '../lib/components/PasteFlow.svelte';

const meta: Meta<PasteFlow> = {
  component: PasteFlow,
  title: 'Input/PasteFlow',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: PasteFlow,
  props: args,
  on: {
    done: action('done'),
  },
});

export const Default = Template.bind({});
Default.args = {};
