import type {Meta} from '@storybook/svelte';
import {action} from '@storybook/addon-actions';

import PasteFlow from '../components/PasteFlow.svelte';
import {EarningRecord} from '../lib/earning-record';

const meta: Meta<PasteFlow> = {
  component: PasteFlow,
  title: 'Paste Fow',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({...args}) => ({
  Component: PasteFlow,
  props: args,
  on: {
    done: action('done'),
  },
});

export const Default = Template.bind({});
Default.args = {};
