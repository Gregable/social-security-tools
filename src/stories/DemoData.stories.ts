import type { Meta } from '@storybook/svelte';
import { action } from '@storybook/addon-actions';

import DemoData from '../lib/components/DemoData.svelte';

const meta: Meta<DemoData> = {
  component: DemoData,
  title: 'Input/PasteFlow/DemoData',

  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: DemoData,
  on: {
    demo: action('demo'),
  },
});

export const Default = Template.bind({});
Default.args = {};
