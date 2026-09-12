import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/svelte';
import { Birthdate } from '../lib/birthday';
import { Money } from '../lib/money';
import { MonthDate } from '../lib/month-time';
import { Recipient } from '../lib/recipient';
import FiledMonthInput from '../routes/strategy/components/FiledMonthInput.svelte';

const meta: Meta<FiledMonthInput> = {
  title: 'Strategy/FiledMonthInput',
  component: FiledMonthInput,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

const Template = ({ ...args }) => ({
  Component: FiledMonthInput,
  props: args,
});

// Born 15 June 1960: earliest filing month is July 2022. The current date is
// fixed so the story does not drift as real time passes.
const birthdate = Birthdate.FromYMD(1960, 5, 15);
const recipient = new Recipient();
recipient.birthdate = birthdate;
recipient.name = 'Alex';
recipient.setPia(Money.from(2000));
const currentDate = MonthDate.initFromYearsMonths({ years: 2026, months: 8 });

const baseArgs = {
  recipient,
  birthdate,
  currentDate,
  inputId: 'filed-story',
  yearRange: { min: 1900, max: 2100 },
  onchange: action('onchange'),
  onvaliditychange: action('onvaliditychange'),
};

// Unticked: the checkbox alone, with no month inputs shown.
export const Unticked = Template.bind({});
Unticked.args = {
  ...baseArgs,
  value: null,
};
Unticked.parameters = {
  docs: {
    description: {
      story:
        'The control as first shown for an eligible person who has not been marked as already receiving benefits.',
    },
  },
};

// Ticked with a valid month: seeded from a bound value, as on restore.
export const Ticked = Template.bind({});
Ticked.args = {
  ...baseArgs,
  value: MonthDate.initFromYearsMonths({ years: 2024, months: 8 }),
};
Ticked.parameters = {
  docs: {
    description: {
      story:
        'Seeded with September 2024, a valid start month, so the box is ticked and the month and year are filled in.',
    },
  },
};

// Invalid: a month before the person could have filed shows the inline error.
export const Invalid = Template.bind({});
Invalid.args = {
  ...baseArgs,
  value: MonthDate.initFromYearsMonths({ years: 2021, months: 0 }),
};
Invalid.parameters = {
  docs: {
    description: {
      story:
        'Seeded with January 2021, before the first month this person could file (July 2022), so the inline error is shown and the published value is null.',
    },
  },
};
