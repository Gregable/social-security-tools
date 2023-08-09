import type {Meta} from '@storybook/svelte';
import FutureEarningsSliders from '../lib/components/FutureEarningsSliders.svelte';
import {Recipient} from '$lib/recipient';

const meta: Meta<FutureEarningsSliders> = {
  component: FutureEarningsSliders,
  title: 'Report/Earnings/FutureEarningsSliders',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

let recipient = new Recipient();
recipient.name = 'Alex';
recipient.markFirst();

const Template = ({...args}) => ({
  Component: FutureEarningsSliders,
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  recipient: recipient
};
