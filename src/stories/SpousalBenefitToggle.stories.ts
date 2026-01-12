import type { Meta } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import { MonthDate } from '$lib/month-time';
import demo from '$lib/pastes/averagepaste.txt?raw';
import demo_spouse_low from '$lib/pastes/averagepaste-spouse.txt?raw';
import demo_spouse_high from '$lib/pastes/averagepaste-spouse-2.txt?raw';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';
import SpousalBenefitToggleDemo from './SpousalBenefitToggle.demo.svelte';

// Set up test recipients
const recipient = new Recipient();
recipient.name = 'Alex';
recipient.markFirst();
recipient.earningsRecords = parsePaste(demo);
recipient.birthdate = Birthdate.FromYMD(1960, 5, 15);

// Lower earner spouse - eligible for spousal benefits
const spouseLowEarner = new Recipient();
spouseLowEarner.name = 'Chris';
spouseLowEarner.markSecond();
spouseLowEarner.earningsRecords = parsePaste(demo_spouse_low);
spouseLowEarner.birthdate = Birthdate.FromYMD(1962, 3, 10);

// Higher earner spouse - not eligible for spousal benefits
const spouseHighEarner = new Recipient();
spouseHighEarner.name = 'Jordan';
spouseHighEarner.markSecond();
spouseHighEarner.earningsRecords = parsePaste(demo_spouse_high);
spouseHighEarner.birthdate = Birthdate.FromYMD(1958, 8, 20);

// Filing dates (at age 67 - typical full retirement age)
const recipientFilingAt67 = MonthDate.initFromYearsMonths({
  years: 2027,
  months: 5,
});
const spouseLowFilingAt67 = MonthDate.initFromYearsMonths({
  years: 2029,
  months: 3,
});
const spouseHighFilingAt67 = MonthDate.initFromYearsMonths({
  years: 2025,
  months: 8,
});

const meta: Meta<SpousalBenefitToggleDemo> = {
  component: SpousalBenefitToggleDemo,
  title: 'Integrations/SpousalBenefitToggle',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A toggle component for choosing between personal benefit only vs combined personal + spousal benefit for the lower earner. Used by integration tools that only accept a single filing date per person.',
      },
    },
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: SpousalBenefitToggleDemo,
  props: args,
});

// Lower earner spouse (spousal benefit applies)
export const LowerEarnerSpouse = Template.bind({});
LowerEarnerSpouse.args = {
  recipient: recipient,
  spouse: spouseLowEarner,
  toolName: 'FIRECalc',
  includeSpousalBenefit: false,
  recipientFilingDateValue: recipientFilingAt67,
  spouseFilingDateValue: spouseLowFilingAt67,
};
LowerEarnerSpouse.parameters = {
  docs: {
    description: {
      story:
        'When the spouse has lower earnings, they may be eligible for spousal benefits. The user can choose between personal-only or combined benefit calculation.',
    },
  },
};

// Higher earner spouse (no spousal benefit - recipient is lower earner)
export const RecipientIsLowerEarner = Template.bind({});
RecipientIsLowerEarner.args = {
  recipient: recipient,
  spouse: spouseHighEarner,
  toolName: 'Linopt',
  includeSpousalBenefit: false,
  recipientFilingDateValue: recipientFilingAt67,
  spouseFilingDateValue: spouseHighFilingAt67,
};
RecipientIsLowerEarner.parameters = {
  docs: {
    description: {
      story:
        'When the recipient is the lower earner, they may be eligible for spousal benefits from their spouse.',
    },
  },
};

// With spousal benefit pre-selected
export const SpousalSelected = Template.bind({});
SpousalSelected.args = {
  recipient: recipient,
  spouse: spouseLowEarner,
  toolName: 'cFIREsim',
  includeSpousalBenefit: true,
  recipientFilingDateValue: recipientFilingAt67,
  spouseFilingDateValue: spouseLowFilingAt67,
};
SpousalSelected.parameters = {
  docs: {
    description: {
      story:
        'Shows the toggle with "Combined Personal + Spousal Benefit" pre-selected.',
    },
  },
};
