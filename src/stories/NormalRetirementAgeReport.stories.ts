import type {Meta} from '@storybook/svelte';
import NormalRetirementAgeReport from '../lib/components/NormalRetirementAgeReport.svelte';


import {Recipient} from '$lib/recipient';
import {parsePaste} from '$lib/ssa-parse';
import {Birthdate} from '$lib/birthday';

import demo0 from '$lib/pastes/averagepaste.txt?raw';

const meta: Meta<NormalRetirementAgeReport> = {
  component: NormalRetirementAgeReport,
  title: 'Report/PIA/NormalRetirementAgeReport',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({...args}) => ({
  Component: NormalRetirementAgeReport,
  props: args,
});

let r1 = new Recipient();
r1.earningsRecords = parsePaste(demo0);
let d = new Date('1950-07-01');
r1.birthdate = new Birthdate(
    new Date(d.getTime() + Math.abs(d.getTimezoneOffset() * 60 * 1000)));
r1.name = 'Alex';
r1.markFirst();
export const Default = Template.bind({});
Default.args = {
  recipient: r1,
};
