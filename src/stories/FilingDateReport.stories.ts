import type {Meta} from '@storybook/svelte';
import FilingDate from '../lib/components/FilingDateReport.svelte';

import {Recipient} from '$lib/recipient';
import {parsePaste} from '$lib/ssa-parse';
import {Birthdate} from '$lib/birthday';

import demo0 from '$lib/pastes/averagepaste.txt?raw';

const meta: Meta<FilingDate> = {
  component: FilingDate,
  title: 'Report/FilingDate/FilingDateReport',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({...args}) => ({
  Component: FilingDate,
  props: args,
});

let r1 = new Recipient();
r1.earningsRecords = parsePaste(demo0);
r1.birthdate = Birthdate.FromYMD(1950, 6, 15);
r1.name = 'Alex';
r1.markFirst();

export const Default = Template.bind({});
Default.args = {
  recipient: r1,
};

let r2 = new Recipient();
r2.earningsRecords = parsePaste(demo0);
r2.birthdate = Birthdate.FromYMD(1950, 6, 1);
r2.name = 'Alex';
r2.markFirst();

export const BirthdayOnFirst = Template.bind({});
BirthdayOnFirst.args = {
  recipient: r2,
};


let r3 = new Recipient();
r3.earningsRecords = parsePaste(demo0);
r3.birthdate = Birthdate.FromYMD(1950, 6, 2);
r3.name = 'Alex';
r3.markFirst();

export const BirthdayOnSecond = Template.bind({});
BirthdayOnSecond.args = {
  recipient: r3,
};
