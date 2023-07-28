import type {Meta} from '@storybook/svelte';
import EligibilityReport from '../components/EligibilityReport.svelte';

import {Recipient} from '../lib/recipient';
import {parsePaste} from '../lib/ssa-parse';
import {Birthdate} from '../lib/birthday';
import {Money} from '../lib/money';
import {EarningRecord} from '../lib/earning-record';

import demo0 from '../assets/averagepaste.txt?raw';
import demo1 from '../assets/millionpaste.txt?raw';

// Sufficient earnigns for eligibility
let recipient0 = new Recipient();
recipient0.earningsRecords = parsePaste(demo0);
recipient0.birthdate = new Birthdate(new Date('1950-07-01'));
recipient0.name = 'Alex';
recipient0.markFirst();

// Insuficient earnings for eligibility
let recipient1 = new Recipient();
recipient1.earningsRecords = parsePaste(demo1);
recipient1.birthdate = new Birthdate(new Date('1950-07-01'));
const futureEarnings1 = [
  new EarningRecord({
    year: 2022,
    taxedEarnings: Money.from(100000),
    taxedMedicareEarnings: Money.from(0)
  }),
  new EarningRecord({
    year: 2023,
    taxedEarnings: Money.from(100000),
    taxedMedicareEarnings: Money.from(0)
  }),
]
recipient1.futureEarningsRecords = futureEarnings1;
recipient1.name = 'Alex';
recipient1.markFirst();

// Sufficient earnings for eligibility with future earnings
let recipient2 = new Recipient();
recipient2.earningsRecords = parsePaste(demo1);
recipient2.birthdate = new Birthdate(new Date('1950-07-01'));
const futureEarnings2 = [
  new EarningRecord({
    year: 2019,
    taxedEarnings: Money.from(100000),
    taxedMedicareEarnings: Money.from(0)
  }),
  new EarningRecord({
    year: 2020,
    taxedEarnings: Money.from(100000),
    taxedMedicareEarnings: Money.from(0)
  }),
  new EarningRecord({
    year: 2021,
    taxedEarnings: Money.from(100000),
    taxedMedicareEarnings: Money.from(0)
  }),
  new EarningRecord({
    year: 2024,
    taxedEarnings: Money.from(100000),
    taxedMedicareEarnings: Money.from(0)
  }),
  new EarningRecord({
    year: 2023,
    taxedEarnings: Money.from(100000),
    taxedMedicareEarnings: Money.from(0)
  }),
]
recipient2.futureEarningsRecords = futureEarnings2;
recipient2.name = 'Alex';
recipient2.markFirst();

const meta: Meta<EligibilityReport> = {
  component: EligibilityReport,
  title: 'Report/Earnings/EligibilityReport',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({...args}) => ({
  Component: EligibilityReport,
  props: args,
});

// Default is someone with sufficient earned credits.
export const Default = Template.bind({});
Default.args = {
  recipient: recipient0,
};

// Someone with sufficient credits only in the future.
export const SufficientFutureCredits = Template.bind({});
SufficientFutureCredits.args = {
  recipient: recipient2,
};

// Someone with insufficient credits, even with future earnings.
export const InsufficientCredits = Template.bind({});
InsufficientCredits.args = {
  recipient: recipient1,
};
