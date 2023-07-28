import type {Meta} from '@storybook/svelte';

import RecipientName from './RecipientName.demo.svelte';

import {Recipient} from '../lib/recipient';


const meta: Meta<RecipientName> = {
  component: RecipientName,
  title: 'Widgets/RecipientName',

  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({...args}) => ({
  Component: RecipientName,
  props: args,
});

// Single user, no name:
let single = new Recipient();

let alex = new Recipient();
alex.name = 'Alex';
alex.markFirst();

let chris = new Recipient();
chris.name = 'Chris';
chris.markSecond();

export const Default = Template.bind({});
Default.args = {
  r: single
};

export const First = Template.bind({});
First.args = {
  r: alex
};

export const Second = Template.bind({});
Second.args = {
  r: chris
};

let longName = new Recipient();
longName.name = 'Very long name';
longName.markFirst();

export const Long = Template.bind({});
Long.args = {
  r: longName
};

export const NoColor = Template.bind({});
NoColor.args = {
  r: alex,
  noColor: true
};
