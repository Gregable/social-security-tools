import type { Meta } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import { MonthDate } from '$lib/month-time';
import demo from '$lib/pastes/averagepaste.txt?raw';
import demo_spouse_low from '$lib/pastes/averagepaste-spouse.txt?raw';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';
import ReportEndDemo from './ReportEnd.demo.svelte';

// Set up test recipients
const recipient = new Recipient();
recipient.name = 'Alex';
recipient.markFirst();
recipient.earningsRecords = parsePaste(demo);
recipient.birthdate = Birthdate.FromYMD(1960, 5, 15);

// Lower earner spouse - eligible for spousal benefits
const spouse = new Recipient();
spouse.name = 'Chris';
spouse.markSecond();
spouse.earningsRecords = parsePaste(demo_spouse_low);
spouse.birthdate = Birthdate.FromYMD(1962, 3, 10);

// Filing dates at age 67 (typical full retirement age)
const recipientFilingAt67 = MonthDate.initFromYearsMonths({
  years: 2027,
  months: 5,
});
const spouseFilingAt67 = MonthDate.initFromYearsMonths({
  years: 2029,
  months: 3,
});

// Early filing - both must be at least 62 (Chris turns 62 in March 2024)
const recipientFilingEarly = MonthDate.initFromYearsMonths({
  years: 2024,
  months: 3,
});

// Delayed filing at 70
const recipientFilingAt70 = MonthDate.initFromYearsMonths({
  years: 2030,
  months: 5,
});

const meta: Meta<ReportEndDemo> = {
  component: ReportEndDemo,
  title: 'Integrations/AllReportEnd',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Consolidated view of all ReportEnd components used across different financial tool integrations. Each integration shows how to enter Social Security data into that specific tool.',
      },
    },
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: ReportEndDemo,
  props: args,
});

// Married couple with typical retirement ages
export const MarriedCouple = Template.bind({});
MarriedCouple.args = {
  recipientData: recipient,
  spouseData: spouse,
  recipientFilingDateValue: recipientFilingAt67,
  spouseFilingDateValue: spouseFilingAt67,
};
MarriedCouple.parameters = {
  docs: {
    description: {
      story:
        'Married couple scenario with both filing at full retirement age (67). Shows spousal benefit calculations where applicable.',
    },
  },
};

// Early filing scenario - both file early (March 2024)
export const EarlyFiling = Template.bind({});
EarlyFiling.args = {
  recipientData: recipient,
  spouseData: spouse,
  recipientFilingDateValue: recipientFilingEarly,
  spouseFilingDateValue: recipientFilingEarly,
};
EarlyFiling.parameters = {
  docs: {
    description: {
      story:
        'Scenario where both spouses file early at 62. Demonstrates reduced benefit calculations.',
    },
  },
};

// Delayed filing scenario
export const DelayedFiling = Template.bind({});
DelayedFiling.args = {
  recipientData: recipient,
  spouseData: spouse,
  recipientFilingDateValue: recipientFilingAt70,
  spouseFilingDateValue: spouseFilingAt67,
};
DelayedFiling.parameters = {
  docs: {
    description: {
      story:
        'Scenario where one spouse delays until 70 to maximize benefits while the other files at 67. Shows increased benefit from delayed credits.',
    },
  },
};
