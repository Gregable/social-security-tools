import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/svelte';

import * as constants from '$lib/constants';

import ZeroEarningsConfirm from '../lib/components/ZeroEarningsConfirm.svelte';

const meta: Meta<ZeroEarningsConfirm> = {
  component: ZeroEarningsConfirm,
  title: 'Input/PasteFlow/ZeroEarningsConfirm',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    year: {
      control: 'number',
      description: 'The year with $0 earnings that needs confirmation.',
    },
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: ZeroEarningsConfirm,
  props: args,
  on: {
    confirm: action('confirm'),
  },
});

// Default story showing prior year confirmation
export const Default = Template.bind({});
Default.args = {
  year: constants.CURRENT_YEAR - 1,
};

// Story showing a specific year (2025)
export const Year2025 = Template.bind({});
Year2025.args = {
  year: 2025,
};
