import type { Meta } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import demo from '$lib/pastes/averagepaste.txt?raw';
import demo_spouse_low from '$lib/pastes/averagepaste-spouse.txt?raw';
import demo_spouse_high from '$lib/pastes/averagepaste-spouse-2.txt?raw';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';
import SpousalBenefitDemo from './SpousalBenefit.demo.svelte';

// Higher earner recipient
const recipientHigher = new Recipient();
recipientHigher.name = 'Alex';
recipientHigher.markFirst();
recipientHigher.earningsRecords = parsePaste(demo);
recipientHigher.birthdate = Birthdate.FromYMD(1960, 5, 15);

// Lower earner spouse - eligible for spousal benefits
const spouseLower = new Recipient();
spouseLower.name = 'Chris';
spouseLower.markSecond();
spouseLower.earningsRecords = parsePaste(demo_spouse_low);
spouseLower.birthdate = Birthdate.FromYMD(1962, 3, 10);

// Higher earner spouse
const spouseHigher = new Recipient();
spouseHigher.name = 'Jordan';
spouseHigher.markSecond();
spouseHigher.earningsRecords = parsePaste(demo_spouse_high);
spouseHigher.birthdate = Birthdate.FromYMD(1958, 8, 20);

// Lower earner recipient
const recipientLower = new Recipient();
recipientLower.name = 'Taylor';
recipientLower.markFirst();
recipientLower.earningsRecords = parsePaste(demo_spouse_low);
recipientLower.birthdate = Birthdate.FromYMD(1963, 7, 22);

const meta: Meta<SpousalBenefitDemo> = {
  component: SpousalBenefitDemo,
  title: 'Benefits/SpousalBenefit',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays spousal benefit information for a recipient, including eligibility explanation, benefit amounts, and detailed filing date guidance.',
      },
    },
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: SpousalBenefitDemo,
  props: args,
});

// Recipient is higher earner - no spousal benefit for them
export const HigherEarner = Template.bind({});
HigherEarner.args = {
  recipientData: recipientHigher,
  spouseData: spouseLower,
};
HigherEarner.parameters = {
  docs: {
    description: {
      story:
        'When the recipient (Alex) has higher earnings than the spouse (Chris), the recipient is not eligible for spousal benefits.',
    },
  },
};

// Recipient is lower earner - eligible for spousal benefit
export const LowerEarnerEligible = Template.bind({});
LowerEarnerEligible.args = {
  recipientData: recipientLower,
  spouseData: spouseHigher,
};
LowerEarnerEligible.parameters = {
  docs: {
    description: {
      story:
        'When the recipient (Taylor) has lower earnings than the spouse (Jordan), they may be eligible for a spousal benefit. Shows the calculation and filing date details.',
    },
  },
};

// Spouse perspective - lower earner spouse view
export const SpousePerspective = Template.bind({});
SpousePerspective.args = {
  recipientData: spouseLower,
  spouseData: recipientHigher,
};
SpousePerspective.parameters = {
  docs: {
    description: {
      story:
        'Viewing from the lower-earning spouse (Chris) perspective shows them eligible for spousal benefits from the higher earner (Alex).',
    },
  },
};
