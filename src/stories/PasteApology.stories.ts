import type {Meta} from '@storybook/svelte';
import {action} from '@storybook/addon-actions';

import PasteApology from '../components/PasteApology.svelte';
import {EarningRecord} from '../lib/earning-record';

const meta: Meta<PasteApology> = {
  component: PasteApology,
  title: 'Paste Apology',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({...args}) => ({
  Component: PasteApology,
  props: args,
  on: {
    reset: action('reset'),
  },
});

export const Default = Template.bind({});
Default.args = {};
