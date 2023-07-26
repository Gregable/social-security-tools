import type {Meta} from '@storybook/svelte';
import FilingDate from '../components/FilingDateReport.svelte';

import {Recipient} from '../lib/recipient';
import {parsePaste} from '../lib/ssa-parse';
import {Birthdate} from '../lib/birthday';

import demo0 from '../assets/averagepaste.txt?raw';

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

function AdjustedBirthdate(dateStr: string): Birthdate {
  // Add timezone offset to get the correct date.
  let d = new Date(dateStr);
  return new Birthdate(
      new Date(d.getTime() + Math.abs(d.getTimezoneOffset() * 60 * 1000)));
}

let r1 = new Recipient();
r1.earningsRecords = parsePaste(demo0);
r1.birthdate = AdjustedBirthdate('1950-07-15');

export const Default = Template.bind({});
Default.args = {
  recipient: r1,
};

let r2 = new Recipient();
r2.earningsRecords = parsePaste(demo0);
r2.birthdate = AdjustedBirthdate('1950-07-01');

export const BirthdayOnFirst = Template.bind({});
BirthdayOnFirst.args = {
  recipient: r2,
};


let r3 = new Recipient();
r3.earningsRecords = parsePaste(demo0);
r3.birthdate = AdjustedBirthdate('1950-07-02');

export const BirthdayOnSecond = Template.bind({});
BirthdayOnSecond.args = {
  recipient: r3,
};
