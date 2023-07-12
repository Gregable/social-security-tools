import type {Meta} from '@storybook/svelte';
import BendpointChart from '../components/BendpointChart.svelte';

import {Recipient} from '../lib/recipient';
import {parsePaste} from '../lib/ssa-parse';
import {Birthdate} from '../lib/birthday';

import demo0 from '../assets/averagepaste.txt?raw';

let recipient = new Recipient();
recipient.earningsRecords = parsePaste(demo0);
recipient.birthdate = new Birthdate(new Date('1950-07-01'));

const meta: Meta<BendpointChart> = {
  component: BendpointChart,
  title: 'Report/PIA/BendpointChart',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({...args}) => ({
  Component: BendpointChart,
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  recipient: recipient
};
