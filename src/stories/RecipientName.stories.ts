import type { Meta } from '@storybook/svelte';
import { Recipient } from '$lib/recipient';
import RecipientName from './RecipientName.demo.svelte';

const meta: Meta<RecipientName> = {
  component: RecipientName,
  title: 'Widgets/RecipientName',

  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: RecipientName,
  props: args,
});

// Single user, no name:
const single = new Recipient();

const alex = new Recipient();
alex.name = 'Alex';
alex.markFirst();

const chris = new Recipient();
chris.name = 'Chris';
chris.markSecond();

export const Default = Template.bind({});
Default.args = {
  r: single,
};

export const First = Template.bind({});
First.args = {
  r: alex,
};

export const Second = Template.bind({});
Second.args = {
  r: chris,
};

const longName = new Recipient();
longName.name = 'Very long name';
longName.markFirst();

export const Long = Template.bind({});
Long.args = {
  r: longName,
};

export const NoColor = Template.bind({});
NoColor.args = {
  r: alex,
  noColor: true,
};
